"""Exercise actual Piston unit-test diagnostics and every Python challenge."""
import asyncio
import json
import os
from pathlib import Path
from unittest.mock import Mock

import pytest
from interview_evidence import InterviewEvidence, persist_evidence
from services import repo_challenge_service as service

FIXTURES = Path(__file__).parent / 'fixtures'
SOLUTIONS = {**json.loads((FIXTURES / 'repo_solutions.json').read_text()), **json.loads((FIXTURES / 'repo_additional_solutions.json').read_text())}
SOLUTIONS['webhook-worker-01'] = {'processor.py': (FIXTURES / 'worker_solution.py').read_text()}

def starter(identifier, language='python'):
    return {file['path']: file['content'] for file in service.detail(identifier, language)['files'] if not file['readOnly']}

def test_completed_run_evidence_is_saved_with_stable_ids():
    database = Mock()
    evidence = InterviewEvidence(run_events=[{'run_id':'run-1','language':'python','phase':'completed','result':'{"passed":2,"failed":6}'}])
    persist_evidence(database, 'session-1', evidence)
    row = database.table.return_value.upsert.call_args.args[0][0]
    assert row['event_type'] == 'code_run'
    assert row['metadata']['phase'] == 'completed'
    persist_evidence(database, 'session-1', evidence)
    assert database.table.return_value.upsert.call_args.args[0][0]['id'] == row['id']

def test_unexecuted_tests_are_not_counted_as_failed(monkeypatch):
    async def execute(*args, **kwargs):
        return '', '', 124
    monkeypatch.setattr(service, 'execute_files_on_piston', execute)
    result = asyncio.run(service.evaluate('login-debug-01', starter('login-debug-01')))
    assert result['failed'] == result['passed'] == 0
    assert result['not_run'] == result['total']
    assert result['error']

def test_compiler_diagnostics_include_candidate_locations_only():
    message = '_clario_tests.hpp:12: error: private test\n/tmp/job/solution.hpp:4:12: error: missing semicolon\n  hidden assertion source'
    assert service.candidate_diagnostic(message, ['solution.hpp']) == 'solution.hpp:4:12: error: missing semicolon'

@pytest.mark.skipif(os.getenv('PISTON_REPO_TESTS') != '1', reason='Requires real Piston')
@pytest.mark.parametrize('identifier', sorted(SOLUTIONS))
def test_python_starter_and_repair_in_piston(identifier):
    files = starter(identifier)
    broken = asyncio.run(service.evaluate(identifier, files, 'python'))
    assert not broken['error'], broken
    assert broken['failed'] > 0 and not broken['success'], broken
    assert all(row.get('message') for row in broken['tests'] if not row['passed'])
    files.update(SOLUTIONS[identifier])
    repaired = asyncio.run(service.evaluate(identifier, files, 'python'))
    assert repaired['success'], repaired

@pytest.mark.skipif(os.getenv('PISTON_REPO_TESTS') != '1', reason='Requires real Piston')
def test_real_syntax_and_runtime_errors_have_useful_diagnostics():
    files = starter('login-debug-01')
    files['auth.py'] = 'def broken('
    result = asyncio.run(service.evaluate('login-debug-01', files, 'python'))
    assert result['not_run'] == result['total'] and result['failed'] == 0
    assert 'auth.py:1' in result['error'] and 'SyntaxError' in result['error']
    assert '_clario_tests' not in result['error']
    files['auth.py'] = 'def authenticate(*args):\n    raise ValueError("diagnostic example")'
    result = asyncio.run(service.evaluate('login-debug-01', files, 'python'))
    assert 'ValueError: diagnostic example' in result['error']
    files['main.py'] = 'from auth import authenticate\ndef login(username, password):\n    return authenticate(username, password)\n'
    result = asyncio.run(service.evaluate('login-debug-01', files, 'python'))
    errors = [row for row in result['tests'] if row['status'] == 'error']
    assert errors and 'ValueError: diagnostic example' in errors[0]['message']
    assert 'auth.py:2' in errors[0]['message'] and '_clario_tests' not in errors[0]['message']
    files = starter('login-debug-01', 'cpp')
    files['solution.hpp'] = '#pragma once\nthis is invalid C++'
    result = asyncio.run(service.evaluate('login-debug-01', files, 'cpp'))
    assert not result['success'] and result['not_run'] == result['total']
    assert 'solution.hpp:2' in result['error'], result


@pytest.mark.skipif(os.getenv('PISTON_REPO_TESTS') != '1', reason='Requires real Piston')
def test_cpp_exception_messages_remain_valid_json():
    files = starter('login-debug-01', 'cpp')
    files['solution.hpp'] = files['solution.hpp'].replace('return authenticate(username,password);', 'throw runtime_error("line one\\nline two \\"quoted\\" text");')
    result = asyncio.run(service.evaluate('login-debug-01', files, 'cpp'))
    assert not result['error'], result
    assert result['failed'] > 0
    assert any('line one' in row['message'] and 'line two' in row['message'] for row in result['tests'] if not row['passed'])
