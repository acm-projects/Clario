"""Signed post-call ingestion: durable receipt -> final turns -> metrics -> feedback."""
import asyncio
import logging
import math
import time
from datetime import datetime, timezone
from uuid import NAMESPACE_URL, uuid5

from elevenlabs import ElevenLabs
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from config import settings
from db import supabase
from metrics import calculate_communication_metrics
from routers.feedback import generate_feedback_for_session

router = APIRouter(prefix='/api/webhooks', tags=['webhooks'])
logger = logging.getLogger(__name__)
verifier = ElevenLabs(api_key=settings.elevenlabs_api_key or 'signature-verification-only')
RETRY_STATUSES = ['pending', 'failed', 'waiting_for_session', 'waiting_for_end', 'metrics_failed']


def clean_payload(data: dict) -> dict:
    """Keep evidence; deliberately exclude initiation variables and header secrets."""
    metadata = data.get('metadata') or {}
    return {
        'conversation_id': data['conversation_id'], 'agent_id': data.get('agent_id'),
        'transcript': [{key: turn[key] for key in ('role', 'message', 'time_in_call_secs', 'conversation_turn_metrics') if key in turn}
                       for turn in data['transcript']],
        'analysis': data.get('analysis'),
        'metadata': {key: metadata[key] for key in ('start_time_unix_secs', 'call_duration_secs') if key in metadata},
    }


def final_turns(session_id: str, data: dict) -> list[dict]:
    turns = []
    start = (data.get('metadata') or {}).get('start_time_unix_secs')
    for turn in data['transcript']:
        speaker, message = turn.get('role'), turn.get('message')
        if speaker not in ('user', 'agent') or not isinstance(message, str) or not message.strip():
            continue
        sequence = len(turns)
        offset = turn.get('time_in_call_secs')
        started_at = None
        if all(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0 for value in (start, offset)):
            try:
                started_at = datetime.fromtimestamp(start + offset, timezone.utc).isoformat()
            except (ValueError, OverflowError, OSError):
                pass
        turns.append({'id': str(uuid5(NAMESPACE_URL, f'clario:final-turn:{session_id}:{sequence}')),
                      'speaker': speaker, 'text': message, 'sequence_number': sequence, 'started_at': started_at})
    return turns


def store_final_evidence(session: dict, data: dict) -> dict:
    sid = session['id']
    supabase.rpc('reconcile_final_transcript', {'p_session_id': sid, 'p_turns': final_turns(sid, data)}).execute()
    supabase.table('session_events').upsert({
        'id': str(uuid5(NAMESPACE_URL, 'clario:post-call-analysis:' + data['conversation_id'])),
        'session_id': sid, 'event_type': 'post_call_analysis',
        'metadata': {'conversation_id': data['conversation_id'], 'analysis': data.get('analysis')},
    }, on_conflict='id').execute()
    return session


def claim_job(conversation_id: str) -> dict | None:
    # Atomic status transition prevents simultaneous deliveries from processing twice.
    rows = (supabase.table('post_call_jobs').update({'status': 'processing', 'updated_at': datetime.now(timezone.utc).isoformat()})
            .eq('conversation_id', conversation_id).in_('status', RETRY_STATUSES).execute().data)
    return rows[0] if rows else None


def update_job(conversation_id: str, **fields):
    supabase.table('post_call_jobs').update({**fields, 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('conversation_id', conversation_id).execute()


async def process_post_call(conversation_id: str):
    try:
        job = await run_in_threadpool(claim_job, conversation_id)
        if not job:
            return
        await run_in_threadpool(update_job, conversation_id, attempts=job['attempts'] + 1)
        sessions = await run_in_threadpool(lambda: supabase.table('interview_sessions').select('*').eq('conversation_id', conversation_id).limit(1).execute().data)
        if not sessions:
            await run_in_threadpool(update_job, conversation_id, status='waiting_for_session', last_error='Session is not linked yet')
            return
        session = sessions[0]
        await run_in_threadpool(update_job, conversation_id, session_id=session['id'])
        session = await run_in_threadpool(store_final_evidence, session, job['payload'])
        metrics = None
        metrics_failed = False
        try:
            metrics = calculate_communication_metrics(job['payload']['transcript'])
            await run_in_threadpool(lambda: supabase.table('communication_metrics').upsert(
                {'session_id': session['id'], **metrics}, on_conflict='session_id').execute())
        except Exception:
            logger.exception('Post-call communication metrics failed; continuing to feedback')
            metrics_failed, metrics = True, None
        current = await run_in_threadpool(lambda: supabase.table('interview_sessions').select('*').eq('id', session['id']).limit(1).execute().data)
        session = current[0]
        if session['status'] != 'completed':
            # The browser must save final code before completion. Do not race it by
            # marking the session completed simply because the voice call ended.
            await run_in_threadpool(update_job, conversation_id, status='waiting_for_end', metrics_failed=metrics_failed)
            current = await run_in_threadpool(lambda: supabase.table('interview_sessions').select('*').eq('id', session['id']).limit(1).execute().data)
            if current[0]['status'] == 'completed':
                await process_post_call(conversation_id)
            return
        # Same service as POST /api/sessions/{id}/feedback, without forging a user JWT
        # or making an HTTP request back into this server.
        await generate_feedback_for_session(session, refresh=True, final_metrics=metrics, final_transcript=True)
        await run_in_threadpool(update_job, conversation_id, status='metrics_failed' if metrics_failed else 'completed',
                                metrics_failed=metrics_failed, last_error='Metrics unavailable' if metrics_failed else None)
    except Exception:
        logger.exception('Post-call processing failed; durable job retained for retry')
        try:
            await run_in_threadpool(update_job, conversation_id, status='failed', last_error='Post-call processing failed; inspect server logs')
        except Exception:
            logger.exception('Could not update post-call job status')


@router.post('/elevenlabs')
async def receive_elevenlabs(request: Request, background_tasks: BackgroundTasks):
    if not settings.elevenlabs_webhook_secret:
        raise HTTPException(503, 'ElevenLabs webhook secret is not configured')
    raw = await request.body()
    signature = request.headers.get('ElevenLabs-Signature', '')
    try:
        # SDK verifies raw-body HMAC and timestamp before returning parsed data.
        event = verifier.webhooks.construct_event(rawBody=raw.decode('utf-8'), sig_header=signature,
                                                 secret=settings.elevenlabs_webhook_secret)
        timestamp = int(next(part[2:] for part in signature.split(',') if part.startswith('t=')))
        if timestamp > time.time() + 300:
            raise ValueError('Signature timestamp is in the future')
    except Exception:
        raise HTTPException(401, 'Invalid ElevenLabs signature')
    if event.get('type') != 'post_call_transcription':
        return {'received': True, 'ignored': True}
    data = event.get('data')
    if (not isinstance(data, dict) or not isinstance(data.get('conversation_id'), str)
            or not isinstance(data.get('transcript'), list)
            or any(not isinstance(turn, dict) for turn in data['transcript'])):
        raise HTTPException(422, 'Malformed post-call transcript')
    if settings.elevenlabs_agent_id and data.get('agent_id') != settings.elevenlabs_agent_id:
        return {'received': True, 'ignored': True}
    payload = clean_payload(data)
    try:
        # Acknowledge only after receipt is durable. Duplicate deliveries keep the
        # original evidence and claim_job prevents concurrent processing.
        await run_in_threadpool(lambda: supabase.table('post_call_jobs').upsert({
            'conversation_id': data['conversation_id'], 'payload': payload,
        }, on_conflict='conversation_id', ignore_duplicates=True).execute())
    except Exception:
        logger.exception('Could not persist ElevenLabs webhook receipt')
        raise HTTPException(503, 'Webhook storage unavailable')
    background_tasks.add_task(process_post_call, data['conversation_id'])
    return {'received': True}
