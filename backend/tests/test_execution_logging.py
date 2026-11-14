import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from piston import router as runner

SID = '00000000-0000-0000-0000-000000000001'
BODY = {'slug': 'two-sum', 'language': 'python', 'code': 'class Solution: pass', 'session_id': SID}

class ExecutionLoggingTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(runner.router)
        self.client = TestClient(app)
        self.db = MagicMock()
        self.q = self.db.table.return_value
        for name in ('insert', 'update', 'eq'):
            getattr(self.q, name).return_value = self.q
        self.q.execute.return_value = SimpleNamespace(data=[{'id': 'execution-id'}])
        self.session = {'status': 'in_progress', 'language': 'python3', 'problem_slug': 'two-sum'}
        self.result = runner.TestsResponse(status='Wrong Answer', passed=0, total=1,
            cases=[{'case': 1, 'input': 'nums=[1,2]', 'expected': '[0,1]', 'output': '[]', 'passed': False}],
            stdout='printed', error=None, stderr='', exit_code=0)
        self.execute = AsyncMock(return_value=self.result)
        for mock in (patch.object(runner, 'supabase', self.db),
                     patch.object(runner, 'get_current_user', AsyncMock(return_value={'sub': 'owner'})),
                     patch.object(runner, 'get_owned_session', return_value=self.session),
                     patch.object(runner, 'run_tests', self.execute)):
            mock.start()
            self.addCleanup(mock.stop)

    def test_three_runs_including_failure_create_three_rows(self):
        self.execute.side_effect = [self.result.model_copy(update={'status':'Accepted', 'passed':1}), self.result, self.result]
        for _ in range(3): self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 200)
        self.assertEqual(self.q.insert.call_count, 3)
        self.assertEqual(self.q.update.call_count, 3)
        row = self.q.insert.call_args.args[0]
        self.assertEqual((row['code'], row['language'], row['session_id']), (BODY['code'], 'python3', SID))
        final = self.q.update.call_args.args[0]
        self.assertEqual(final['status'], 'Wrong Answer')
        self.assertEqual(final['exit_code'], 0)  # Wrong answer can still exit normally.
        self.assertEqual(final['test_results'][0]['output'], '[]')

    def test_runtime_error_preserves_actual_exit_code_and_stderr(self):
        self.execute.return_value = self.result.model_copy(update={'status':'Runtime Error', 'stderr':'traceback', 'exit_code':1, 'error':'IndexError'})
        self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 200)
        row = self.q.update.call_args.args[0]
        self.assertEqual((row['exit_code'],row['stderr']), (1,'traceback'))

    def test_execution_service_failure_is_logged_and_still_returns_error(self):
        self.execute.side_effect = HTTPException(502, 'Piston unavailable')
        self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 502)
        row = self.q.update.call_args.args[0]
        self.assertEqual(row['status'],'Execution Error')
        self.assertEqual(row['stderr'],'Piston unavailable')
        self.assertIsNone(row['exit_code'])
        self.assertIsNone(row['total_count'])

    def test_failure_to_create_record_prevents_unlogged_execution(self):
        self.q.execute.side_effect = RuntimeError('missing migration')
        self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 503)
        self.execute.assert_not_awaited()

    def test_failure_to_save_results_does_not_claim_success(self):
        self.q.execute.side_effect = [SimpleNamespace(data=[{'id':'execution-id'}]), RuntimeError('offline')]
        self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 503)

    def test_mismatched_problem_or_language_cannot_execute(self):
        for body in ({**BODY,'slug':'other'}, {**BODY,'language':'java'}):
            self.assertEqual(self.client.post('/run/tests', json=body).status_code, 400)
        self.execute.assert_not_awaited()
        self.q.insert.assert_not_called()

    def test_completed_session_cannot_execute(self):
        self.session['status']='completed'
        self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 400)
        self.execute.assert_not_awaited()

    def test_other_users_session_cannot_execute(self):
        with patch.object(runner,'get_owned_session',side_effect=HTTPException(404)):
            self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 404)
        self.execute.assert_not_awaited()

    def test_session_run_requires_authentication(self):
        with patch.object(runner,'get_current_user',AsyncMock(side_effect=HTTPException(401))):
            self.assertEqual(self.client.post('/run/tests', json=BODY).status_code, 401)
        self.execute.assert_not_awaited()

    def test_standalone_run_is_backwards_compatible(self):
        self.assertEqual(self.client.post('/run/tests', json={k:v for k,v in BODY.items() if k!='session_id'}).status_code,200)
        self.q.insert.assert_not_called()

    def test_invalid_session_uuid_never_executes(self):
        self.assertEqual(self.client.post('/run/tests',json={**BODY,'session_id':'invalid'}).status_code,422)
        self.execute.assert_not_awaited()

    def test_app_registers_only_one_test_runner(self):
        from main import app
        self.assertEqual(len([r for r in app.routes if getattr(r,'path',None)=='/run/tests' and 'POST' in getattr(r,'methods',set())]),1)


class PistonEvidenceTests(unittest.IsolatedAsyncioTestCase):
    async def run_process(self, output, stderr, exit_code):
        from piston import service
        problem = {'starter_code': {'python3': 'class Solution:\n    def add(self, left, right):\n        '},
                   'example_testcases': '2\n3\n', 'description_html': '<pre>Output: 5</pre>'}
        with patch.object(service, 'execute_on_piston', AsyncMock(return_value=(output, stderr, exit_code))):
            return await service.run_problem_tests(problem=problem, language='python', source='code', piston_url='http://unused', versions={'python':'*'})

    async def test_runner_exposes_real_process_exit_and_stderr(self):
        result = await self.run_process('', 'SyntaxError: invalid syntax', 1)
        self.assertEqual(result.exit_code, 1)
        self.assertEqual(result.stderr, 'SyntaxError: invalid syntax')

    async def test_wrong_answer_does_not_invent_nonzero_exit_code(self):
        result = await self.run_process('__CLARIO_RESULTS__[{"ok":true,"output":0}]', '', 0)
        self.assertEqual((result.status, result.exit_code), ('Wrong Answer', 0))
