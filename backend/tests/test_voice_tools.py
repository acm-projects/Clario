import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from voice import tools

SID = '00000000-0000-0000-0000-000000000001'


class VoiceToolTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(tools.router)
        self.client = TestClient(app)
        self.db = MagicMock()
        self.session = self.query([{'id': SID, 'status': 'in_progress', 'language': 'python3', 'conversation_id': 'conv_1'}])
        self.snapshot = self.query([{'id': 'snapshot', 'code': 'latest code', 'language': 'python3', 'created_at': '2026-11-02T12:00:00Z'}])
        self.db.table.side_effect = lambda name: self.session if name == 'interview_sessions' else self.snapshot
        for mock in (patch.object(tools, 'supabase', self.db), patch.object(tools, 'settings', SimpleNamespace(elevenlabs_tool_secret='test-secret'))):
            mock.start()
            self.addCleanup(mock.stop)
        self.headers = {'X-ElevenLabs-Tool-Secret': 'test-secret', 'X-Conversation-Id': 'conv_1'}

    def query(self, rows):
        query = MagicMock()
        for name in ('select', 'eq', 'order', 'limit'):
            getattr(query, name).return_value = query
        query.execute.return_value = SimpleNamespace(data=rows)
        return query

    def get(self, headers=None, sid=SID):
        return self.client.get(f'/api/voice-tools/sessions/{sid}/code', headers=headers if headers is not None else self.headers)

    def test_missing_or_wrong_secret_never_reads_database(self):
        for headers in ({}, {**self.headers, 'X-ElevenLabs-Tool-Secret': 'wrong'}):
            self.assertEqual(self.get(headers).status_code, 401)
        self.db.table.assert_not_called()

    def test_unconfigured_secret_fails_closed(self):
        with patch.object(tools, 'settings', SimpleNamespace(elevenlabs_tool_secret='')):
            self.assertEqual(self.get().status_code, 503)
        self.db.table.assert_not_called()

    def test_requires_conversation_identity(self):
        self.assertEqual(self.get({'X-ElevenLabs-Tool-Secret': 'test-secret'}).status_code, 401)
        self.db.table.assert_not_called()

    def test_session_and_conversation_must_match(self):
        self.session.execute.return_value.data = []
        self.assertEqual(self.get().status_code, 404)
        self.session.eq.assert_any_call('id', SID)
        self.session.eq.assert_any_call('conversation_id', 'conv_1')
        self.snapshot.execute.assert_not_called()

    def test_returns_newest_scoped_snapshot_without_caching(self):
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['code'], 'latest code')
        self.assertTrue(response.json()['available'])
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.snapshot.eq.assert_called_once_with('session_id', SID)
        self.snapshot.order.assert_any_call('created_at', desc=True)
        self.snapshot.limit.assert_called_once_with(1)

    def test_no_snapshot_is_explicitly_unavailable(self):
        self.snapshot.execute.return_value.data = []
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['available'])
        self.assertIsNone(response.json()['code'])

    def test_empty_code_is_available_not_missing(self):
        self.snapshot.execute.return_value.data[0]['code'] = ''
        response = self.get()
        self.assertTrue(response.json()['available'])
        self.assertEqual(response.json()['code'], '')

    def test_completed_session_does_not_expose_code(self):
        self.session.execute.return_value.data[0]['status'] = 'completed'
        self.assertEqual(self.get().status_code, 400)
        self.snapshot.execute.assert_not_called()

    def test_invalid_session_id_is_rejected(self):
        self.assertEqual(self.get(sid='not-a-uuid').status_code, 422)
        self.db.table.assert_not_called()
