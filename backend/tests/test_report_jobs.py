import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from auth import get_current_user
from routers import feedback
from voice import webhooks

SID='00000000-0000-0000-0000-000000000001'
SESSION={'id':SID,'status':'completed','ended_at':'2026-11-02T12:00:00Z','conversation_id':'conv_test'}

class ReportJobTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_current_user]=lambda:{'sub':'owner'}
        self.addCleanup(app.dependency_overrides.clear)
        self.client=TestClient(app)
        for mock in (patch.object(feedback,'get_owned_session',return_value=SESSION),
                     patch.object(feedback,'get_stored_problem',return_value=None),
                     patch.object(feedback,'get_saved_report',return_value=None)):
            mock.start();self.addCleanup(mock.stop)

    def test_read_exposes_failure_so_frontend_can_stop_loading(self):
        with patch.object(feedback,'get_processing_status',return_value={'status':'failed','error':'Gemini high demand'}):
            response=self.client.get('/api/feedback/'+SID)
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['processing']['error'],'Gemini high demand')

    def test_processing_call_does_not_start_a_second_gemini_request(self):
        with patch.object(feedback,'get_processing_status',return_value={'status':'processing'}),patch.object(feedback,'generate_feedback_for_session',AsyncMock()) as generate,patch.object(webhooks,'process_post_call',AsyncMock()) as process:
            response=self.client.post('/api/feedback/'+SID)
        self.assertEqual(response.status_code,202)
        generate.assert_not_awaited();process.assert_not_awaited()

    def test_wait_for_transcript_before_feedback(self):
        recent={**SESSION,'ended_at':datetime.now(timezone.utc).isoformat()}
        with patch.object(feedback,'get_owned_session',return_value=recent),patch.object(feedback,'get_processing_status',return_value={'status':'waiting_for_transcript'}),patch.object(feedback,'generate_feedback_for_session',AsyncMock()) as generate:
            response=self.client.post('/api/feedback/'+SID)
        self.assertEqual(response.status_code,202)
        self.assertEqual(response.json()['status'],'waiting_for_transcript')
        generate.assert_not_awaited()

    def test_missing_webhook_falls_back_to_live_transcript_after_grace_period(self):
        with patch.object(feedback,'get_processing_status',return_value={'status':'waiting_for_transcript'}),patch.object(feedback,'generate_feedback_for_session',AsyncMock(return_value={'id':'live'})) as generate,patch.object(webhooks,'process_post_call',AsyncMock()) as process:
            response=self.client.post('/api/feedback/'+SID)
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['id'],'live')
        self.assertTrue(generate.call_args.kwargs['live_fallback'])
        process.assert_not_awaited()

    def test_saved_fallback_report_is_returned_without_regenerating(self):
        with patch.object(feedback,'get_saved_report',return_value={'id':'saved'}),patch.object(feedback,'get_processing_status',return_value={'status':'waiting_for_transcript'}),patch.object(feedback,'generate_feedback_for_session',AsyncMock()) as generate:
            response=self.client.post('/api/feedback/'+SID)
        self.assertEqual(response.json()['id'],'saved')
        generate.assert_not_awaited()

    def test_stalled_and_waiting_jobs_are_requeued(self):
        for status in ('stalled','pending','waiting_for_end','waiting_for_session'):
            with patch.object(feedback,'get_processing_status',return_value={'status':status}),patch.object(feedback,'generate_feedback_for_session',AsyncMock()) as generate,patch.object(webhooks,'process_post_call',AsyncMock()) as process:
                response=self.client.post('/api/feedback/'+SID)
            self.assertEqual(response.status_code,202,status)
            generate.assert_not_awaited();process.assert_awaited_once_with('conv_test')

    def test_processing_older_than_any_healthy_run_is_reported_as_stalled(self):
        old=(datetime.now(timezone.utc)-timedelta(seconds=feedback.STALE_PROCESSING_SECONDS+5)).isoformat()
        fresh=datetime.now(timezone.utc).isoformat()
        for updated,expected in ((old,'stalled'),(fresh,'processing')):
            query=MagicMock()
            for method in ('select','eq','limit'):getattr(query,method).return_value=query
            query.execute.return_value=SimpleNamespace(data=[{'status':'processing','last_error':None,'updated_at':updated}])
            with patch.object(feedback.supabase,'table',return_value=query):
                self.assertEqual(feedback.get_processing_status(SESSION)['status'],expected)

    def test_failed_job_retry_queues_existing_job_instead_of_direct_generation(self):
        query=MagicMock();query.update.return_value=query;query.eq.return_value=query
        with patch.object(feedback,'get_processing_status',return_value={'status':'failed'}),patch.object(feedback.supabase,'table',return_value=query),patch.object(feedback,'generate_feedback_for_session',AsyncMock()) as generate,patch.object(webhooks,'process_post_call',AsyncMock()) as process:
            response=self.client.post('/api/feedback/'+SID)
        self.assertEqual(response.status_code,202)
        generate.assert_not_awaited();process.assert_awaited_once_with('conv_test')
        query.update.assert_called_once_with({'status':'pending','last_error':None})
