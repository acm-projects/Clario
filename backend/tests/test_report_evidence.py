import copy
import json
import unittest
from pydantic import ValidationError
from report_evidence import build_evidence, validate_references
from gemini_feedback import validate_feedback
from communication import CommunicationCapture
from test_feedback import CONTENT

SESSION = {'started_at': '2026-11-03T12:00:00Z', 'ended_at': '2026-11-03T12:02:00Z'}
TURNS = [{'id': 'a', 'speaker': 'agent', 'text': 'Um, explain?', 'started_at': SESSION['started_at']},
         {'id': 'b', 'speaker': 'user', 'text': 'Um uh, use a map.', 'started_at': '2026-11-03T12:00:20Z'}]
DETAILS = {'verdict': 'Explain your plan before coding.',
           'sectors': {k: {'summary': 'Observable evidence.', 'evidence': [{'transcript_id': 'b', 'observation': 'Named a map.', 'effect': 'raised'}]} for k in ('coding','reasoning','communication','overall')},
           'umpire': [{'step': step, 'status': 'insufficient evidence', 'summary': 'Not recorded.', 'did_well': '', 'improve': 'Explain this step.', 'evidence': []} for step in ('Understand','Match','Plan','Implement','Review','Evaluate')],
           'moments': [{'moment_id': 'filler-b', 'context': 'Before naming the approach.', 'suggested_fix': 'Pause briefly before explaining.'}],
           'fix_first': [{'habit': 'State a plan.', 'drill': 'Explain a two-step plan before coding your next three solutions.'}], 'dont_worry': ['One filler.'],
           'specific_strengths': [{'transcript_id': 'b', 'observation': 'Identified a map.', 'effect': 'raised'}]}

class ReportEvidenceTests(unittest.TestCase):
    def test_counts_user_only_and_uses_call_minutes_not_speaking_minutes(self):
        evidence = build_evidence(SESSION, TURNS, [])
        self.assertEqual(evidence['filler_total'], 2)
        self.assertEqual(evidence['filler_rate_per_interview_minute'], 1)
        self.assertEqual(evidence['measured_moments'][0]['seconds'], 20)

    def test_latest_capture_wins_and_no_silence_inferred_from_turn_gaps(self):
        event = lambda duration: {'metadata': {'capture_id': 'c', 'silence_intervals': [{'started_at': '2026-11-03T12:00:04Z', 'duration_seconds': duration}]}}
        evidence = build_evidence(SESSION, TURNS, [event(4), event(8)])
        silence = [m for m in evidence['measured_moments'] if m['kind'] == 'silence']
        self.assertEqual(silence, [])
        self.assertEqual(build_evidence(SESSION, TURNS, [])['measured_moments'][0]['kind'], 'filler')

    def test_unknown_references_are_removed_without_discarding_the_report(self):
        evidence = build_evidence(SESSION, TURNS, [])
        report = {'details': copy.deepcopy(DETAILS)}
        self.assertEqual(validate_references(report, evidence), 0)
        self.assertEqual(report['session_evidence'], evidence)
        report['details']['moments'].append({**DETAILS['moments'][0]})
        report['details']['moments'].append({**DETAILS['moments'][0], 'moment_id': 'invented'})
        report['details']['specific_strengths'][0]['transcript_id'] = 'invented'
        self.assertEqual(validate_references(report, evidence), 3)
        self.assertEqual([m['moment_id'] for m in report['details']['moments']], ['filler-b'])
        self.assertIsNone(report['details']['specific_strengths'][0]['transcript_id'])
        self.assertEqual(report['details']['specific_strengths'][0]['observation'], 'Identified a map.')

    def test_all_sectors_and_six_unique_ordered_steps_required(self):
        content = {**CONTENT, 'details': copy.deepcopy(DETAILS)}
        self.assertIsNotNone(validate_feedback(json.dumps(content), has_code=True, has_problem=True, has_speech=True)['details'])
        content['details']['umpire'][1]['step'] = 'Understand'
        with self.assertRaises(ValueError): validate_feedback(json.dumps(content), has_code=True, has_problem=True, has_speech=True)

    def test_max_three_drills(self):
        content = {**CONTENT, 'details': copy.deepcopy(DETAILS)}
        content['details']['fix_first'] *= 4
        with self.assertRaises(ValidationError): validate_feedback(json.dumps(content), has_code=True, has_problem=True, has_speech=True)

    def test_silence_interval_validation(self):
        with self.assertRaises(ValidationError):
            CommunicationCapture(capture_id='11111111-1111-4111-8111-111111111111', monitored_seconds=10, silent_seconds=2, longest_pause_seconds=2,
                                 silence_intervals=[{'started_at': '2026-11-03T12:00:00Z', 'duration_seconds': float('inf')}])

    def test_legacy_captures_with_null_intervals_remain_readable(self):
        evidence = build_evidence(SESSION, TURNS, [{'metadata': {'capture_id': 'old', 'silence_intervals': None}}])
        self.assertEqual(evidence['filler_total'], 2)

    def test_missing_times_remain_unavailable(self):
        evidence = build_evidence({}, [{'id': 'b', 'speaker': 'user', 'text': 'um'}], [])
        self.assertIsNone(evidence['filler_rate_per_interview_minute'])
        self.assertIsNone(evidence['measured_moments'][0]['seconds'])

    def test_nearby_fillers_cluster_but_distant_turns_stay_separate(self):
        turns = TURNS + [{'id': 'c', 'speaker': 'user', 'text': 'um', 'started_at': '2026-11-03T12:00:35Z'},
                         {'id': 'd', 'speaker': 'user', 'text': 'uh', 'started_at': '2026-11-03T12:01:30Z'}]
        evidence = build_evidence(SESSION, turns, [])
        self.assertEqual([m['count'] for m in evidence['measured_moments']], [3, 1])
        self.assertEqual(evidence['measured_moments'][0]['transcript_id'], 'b')


class ProviderReportTests(unittest.IsolatedAsyncioTestCase):
    async def test_provider_v2_attaches_server_measured_evidence(self):
        import httpx
        from unittest.mock import patch
        from gemini_feedback import generate_feedback
        measured = build_evidence(SESSION, TURNS, [])
        content = {**CONTENT, 'details': DETAILS}
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={
            'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': json.dumps(content)}]}}]})))
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test'}), patch('gemini_feedback.httpx.AsyncClient', return_value=client):
            result = await generate_feedback({'code': 'return 1', 'problem': {'title': 'Example'}, 'candidate_transcript': 'um', 'session_evidence': measured})
        self.assertEqual(result['version'], 2)
        self.assertEqual(result['session_evidence'], measured)
        self.assertEqual(result['overall_score'], 75)

    async def test_provider_without_new_sections_is_rejected_for_real_session(self):
        import httpx
        from unittest.mock import patch
        from fastapi import HTTPException
        from gemini_feedback import generate_feedback
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={
            'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': json.dumps(CONTENT)}]}}]})))
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test'}), patch('gemini_feedback.httpx.AsyncClient', return_value=client):
            with self.assertRaises(HTTPException) as error:
                await generate_feedback({'session_evidence': build_evidence(SESSION, TURNS, [])})
        self.assertEqual(error.exception.status_code, 502)
