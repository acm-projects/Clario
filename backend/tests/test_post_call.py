import copy
import hashlib
import hmac
import json
import time
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from voice import webhooks

SID = '00000000-0000-0000-0000-000000000001'
PAYLOAD = {'type':'post_call_transcription','data':{
    'agent_id':'agent_test','conversation_id':'conv_test',
    'transcript':[{'role':'agent','message':'Um, explain your plan.','time_in_call_secs':0},
                  {'role':'user','message':'Um um UM, I will use a map.','time_in_call_secs':4},
                  {'role':'user','message':'What if there are duplicates','time_in_call_secs':8},
                  {'role':'user','message':'An empty list is allowed?','time_in_call_secs':10}],
    'analysis':{'transcript_summary':'Sample'}, 'metadata':{'start_time_unix_secs':1700000000},
    'conversation_initiation_client_data':{'dynamic_variables':{'secret__token':'do-not-store'}},
}}

class FakeDB:
    def __init__(self):
        self.rows = {'post_call_jobs':[], 'interview_sessions':[{'id':SID,'conversation_id':'conv_test','status':'completed','ended_at':'2026-11-02T12:00:00Z'}],
                     'transcript_events':[], 'session_events':[], 'communication_metrics':[]}
        self.operations=[]
        self.fail_metrics=False
        self.fail_receipt=False
        self.fail_transcript=False
    def table(self,name): return Query(self,name)
    def rpc(self,name,params):
        db=self
        class RPC:
            def execute(self):
                db.operations.append('transcript')
                if db.fail_transcript: raise RuntimeError('transcript error')
                db.rows['transcript_events'] = copy.deepcopy(params['p_turns'])
                return SimpleNamespace(data=None)
        return RPC()

class Query:
    def __init__(self,db,name):
        self.db,self.name=db,name
        self.filters=[];self.action='select';self.data=None;self.ignore=False;self.conflict=None
    def select(self,*args): return self
    def limit(self,*args): return self
    def eq(self,key,value): self.filters.append(lambda row:row.get(key)==value);return self
    def in_(self,key,values): self.filters.append(lambda row:row.get(key) in values);return self
    def update(self,data): self.action='update';self.data=data;return self
    def upsert(self,data,on_conflict,ignore_duplicates=False):
        self.action='upsert';self.data=data;self.conflict=on_conflict;self.ignore=ignore_duplicates;return self
    def execute(self):
        rows=self.db.rows[self.name]
        selected=[row for row in rows if all(f(row) for f in self.filters)]
        if self.action=='update':
            for row in selected:row.update(self.data)
        elif self.action=='upsert':
            if self.name=='post_call_jobs' and self.db.fail_receipt:raise RuntimeError('storage offline')
            if self.name=='communication_metrics':
                self.db.operations.append('metrics')
                if self.db.fail_metrics:raise RuntimeError('metrics offline')
            match=next((row for row in rows if row.get(self.conflict)==self.data.get(self.conflict)),None)
            if match is None:
                match=copy.deepcopy(self.data)
                if self.name=='post_call_jobs':match.update(status='pending',attempts=0,metrics_failed=False)
                rows.append(match)
            elif not self.ignore:match.update(copy.deepcopy(self.data))
            selected=[match]
        return SimpleNamespace(data=copy.deepcopy(selected))

class PostCallTests(unittest.TestCase):
    def setUp(self):
        self.db=FakeDB()
        app=FastAPI();app.include_router(webhooks.router)
        self.client=TestClient(app)
        async def generate(*args,**kwargs):self.db.operations.append('feedback');return {'id':'report'}
        self.generate=AsyncMock(side_effect=generate)
        for mock in (patch.object(webhooks,'supabase',self.db),patch.object(webhooks,'generate_feedback_for_session',self.generate),
                     patch.object(webhooks,'settings',SimpleNamespace(elevenlabs_webhook_secret='test-secret',elevenlabs_agent_id='agent_test'))):
            mock.start();self.addCleanup(mock.stop)
    def deliver(self,payload=None,signature=None,timestamp=None):
        raw=json.dumps(payload or PAYLOAD,separators=(',',':'))
        timestamp=timestamp or int(time.time())
        digest=hmac.new(b'test-secret',f'{timestamp}.{raw}'.encode(),hashlib.sha256).hexdigest()
        return self.client.post('/api/webhooks/elevenlabs',content=raw,headers={'ElevenLabs-Signature':signature if signature is not None else f't={timestamp},v0={digest}'})
    def test_transcript_then_metrics_then_feedback(self):
        self.assertEqual(self.deliver().status_code,200)
        self.assertEqual(self.db.operations,['transcript','metrics','feedback'])
        row=self.db.rows['communication_metrics'][0]
        self.assertEqual((row['filler_word_count'],row['questions_asked']),(3,2))
        self.assertIsNone(row['average_response_time_seconds']);self.assertIsNone(row['words_per_minute'])
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'completed')
        self.assertEqual(self.generate.call_args.kwargs['final_metrics']['filler_word_count'],3)
    def test_retries_do_not_duplicate_metrics_transcript_analysis_or_feedback(self):
        self.deliver();self.deliver()
        self.assertEqual(len(self.db.rows['communication_metrics']),1)
        self.assertEqual(len(self.db.rows['transcript_events']),4)
        self.assertEqual(len(self.db.rows['session_events']),1)
        self.assertEqual(self.generate.await_count,1)
    def test_invalid_missing_expired_and_future_signatures_are_rejected(self):
        for signature in ('','t=1,v0=bad'):
            self.assertEqual(self.deliver(signature=signature).status_code,401)
        self.assertEqual(self.deliver(timestamp=int(time.time())-1900).status_code,401)
        self.assertEqual(self.deliver(timestamp=int(time.time())+3600).status_code,401)
        self.assertEqual(self.db.rows['post_call_jobs'],[])
    def test_metrics_failure_does_not_block_feedback(self):
        self.db.fail_metrics=True
        self.assertEqual(self.deliver().status_code,200)
        self.generate.assert_awaited_once()
        self.assertIsNone(self.generate.call_args.kwargs['final_metrics'])
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'metrics_failed')
        self.db.fail_metrics=False
        self.deliver()
        self.assertEqual(len(self.db.rows['communication_metrics']),1)
    def test_transcript_failure_prevents_metrics_and_feedback_but_is_durable(self):
        self.db.fail_transcript=True
        self.assertEqual(self.deliver().status_code,200)
        self.assertEqual(self.db.operations,['transcript'])
        self.generate.assert_not_awaited()
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'failed')
    def test_feedback_failure_can_retry_without_duplicate_metrics(self):
        self.generate.side_effect=RuntimeError('provider down')
        self.deliver()
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'failed')
        self.generate.side_effect=None;self.generate.return_value={'id':'report'}
        self.deliver()
        self.assertEqual(len(self.db.rows['communication_metrics']),1)
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'completed')
    def test_secret_initiation_variables_are_never_persisted(self):
        self.deliver()
        self.assertNotIn('do-not-store',json.dumps(self.db.rows))
    def test_unlinked_session_is_retained_for_retry(self):
        self.db.rows['interview_sessions']=[]
        self.assertEqual(self.deliver().status_code,200)
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'waiting_for_session')
        self.generate.assert_not_awaited()
    def test_storage_failure_returns_retryable_error_not_false_acknowledgement(self):
        self.db.fail_receipt=True
        self.assertEqual(self.deliver().status_code,503)
        self.generate.assert_not_awaited()
    def test_unknown_events_and_other_agents_are_ignored(self):
        event=copy.deepcopy(PAYLOAD);event['type']='post_call_audio'
        self.assertEqual(self.deliver(event).status_code,200)
        event=copy.deepcopy(PAYLOAD);event['data']['agent_id']='other'
        self.assertEqual(self.deliver(event).status_code,200)
        self.assertEqual(self.db.rows['post_call_jobs'],[])
    def test_turn_starts_are_preserved_without_inventing_end_times(self):
        turns=webhooks.final_turns(SID,PAYLOAD['data'])
        self.assertTrue(turns[0]['started_at'])
        self.assertNotIn('ended_at',turns[0])
    def test_repeated_identical_utterances_remain_distinct_turns(self):
        event=copy.deepcopy(PAYLOAD)
        event['data']['transcript']=[{'role':'user','message':'um'},{'role':'user','message':'um'}]
        self.deliver(event)
        turns=self.db.rows['transcript_events']
        self.assertEqual(len(turns),2);self.assertNotEqual(turns[0]['id'],turns[1]['id'])

    def test_webhook_never_completes_session_before_final_code_can_be_saved(self):
        session=self.db.rows['interview_sessions'][0]
        session['status']='in_progress';session['ended_at']=None
        self.assertEqual(self.deliver().status_code,200)
        self.assertEqual(session['status'],'in_progress')
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'waiting_for_end')
        self.assertEqual(len(self.db.rows['communication_metrics']),1)
        self.generate.assert_not_awaited()
        session['status']='completed';session['ended_at']='2026-11-02T12:01:00Z'
        self.deliver()
        self.generate.assert_awaited_once()
        self.assertEqual(self.db.rows['post_call_jobs'][0]['status'],'completed')

    def test_required_feedback_alias_is_registered(self):
        from main import app
        self.assertIn('/api/sessions/{session_id}/feedback',app.openapi()['paths'])
