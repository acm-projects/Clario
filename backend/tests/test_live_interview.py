import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID
from fastapi import HTTPException
from routers import sessions

SID = UUID('00000000-0000-0000-0000-000000000001')
USER = {'sub': 'candidate'}

class LiveInterviewTests(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.q = self.db.table.return_value
        for name in ('select', 'eq', 'limit', 'update', 'insert', 'is_'):
            getattr(self.q, name).return_value = self.q
        self.q.execute.return_value = SimpleNamespace(data=[{'id': str(SID)}])
        self.session = {'id': str(SID), 'status': 'in_progress', 'conversation_id': None}
        for mock in (patch.object(sessions, 'get_owned_session', return_value=self.session), patch.object(sessions, 'supabase', self.db)):
            mock.start()
            self.addCleanup(mock.stop)

    def link(self):
        return sessions.link_conversation(SID, sessions.ConversationLink(conversation_id='conv_1'), USER)

    def test_link_checks_owner_and_unlinked_status(self):
        self.link()
        self.q.update.assert_called_once_with({'conversation_id': 'conv_1'})
        self.q.eq.assert_any_call('user_id', 'candidate')
        self.q.is_.assert_called_once_with('conversation_id', 'null')

    def test_repeated_link_is_idempotent(self):
        self.session['conversation_id'] = 'conv_1'
        self.link()
        self.q.update.assert_not_called()

    def test_cannot_replace_conversation(self):
        self.session['conversation_id'] = 'conv_other'
        with self.assertRaises(HTTPException) as error:
            self.link()
        self.assertEqual(error.exception.status_code, 409)
        self.q.update.assert_not_called()

    def test_completed_session_cannot_link(self):
        self.session['status'] = 'completed'
        with self.assertRaises(HTTPException): self.link()
        self.q.update.assert_not_called()

    def turn(self):
        return sessions.TranscriptCreate(speaker='user', text='What are the constraints?', received_at=datetime.now(timezone.utc), sequence_number=0)

    def test_transcript_requires_link(self):
        with self.assertRaises(HTTPException): sessions.save_transcript(SID, self.turn(), USER)
        self.q.insert.assert_not_called()

    def test_receipt_time_is_not_speech_timing(self):
        self.session['conversation_id'] = 'conv_1'
        turn = self.turn()
        sessions.save_transcript(SID, turn, USER)
        row = self.db.rpc.call_args.args[1]['p_turn']
        self.assertEqual(row['session_id'], str(SID))
        self.assertEqual(row['created_at'], turn.received_at.isoformat())
        self.assertNotIn('started_at', row)
        self.assertNotIn('ended_at', row)

    def test_ownership_failure_prevents_write(self):
        with patch.object(sessions, 'get_owned_session', side_effect=HTTPException(404)):
            with self.assertRaises(HTTPException): self.link()
        self.q.update.assert_not_called()
