import unittest
from metrics import calculate_communication_metrics, count_filler_words, count_questions

class MetricsTests(unittest.TestCase):
    def test_three_ums_and_two_questions(self):
        transcript = [
            {'role':'agent','message':'Um, can you explain?'},
            {'role':'user','message':'Um, um, UM. I will use a map.'},
            {'role':'user','message':'What if there are duplicates'},
            {'role':'user','message':'An empty list is allowed?'},
        ]
        result = calculate_communication_metrics(transcript)
        self.assertEqual(result['filler_word_count'],3)
        self.assertEqual(result['questions_asked'],2)

    def test_like_so_and_substrings_are_not_fillers(self):
        self.assertEqual(count_filler_words(['I like this approach, so I will use it.', 'thumb summary ultimate']),0)

    def test_all_requested_fillers_and_phrase_whitespace(self):
        self.assertEqual(count_filler_words(['UM uh Erm you know kind of sort of', 'YOU  KNOW']),7)

    def test_one_question_per_turn_and_question_word_boundaries(self):
        self.assertEqual(count_questions(['How should I do this?', 'Two questions? Really?', 'island is a word', 'Whatsoever']),2)
        for word in ('what','how','can','should','is','does','are','do','would','will'):
            self.assertEqual(count_questions([word+' this works']),1)

    def test_no_timing_is_null_never_zero(self):
        result = calculate_communication_metrics([{'role':'user','message':'Hello'}])
        self.assertIsNone(result['average_response_time_seconds'])
        self.assertIsNone(result['words_per_minute'])

    def test_turn_starts_call_duration_and_service_latency_are_not_speech_duration(self):
        result = calculate_communication_metrics([
            {'role':'agent','message':'Explain.', 'time_in_call_secs':0},
            {'role':'user','message':'I am explaining', 'time_in_call_secs':5,
             'conversation_turn_metrics':{'metrics':{'convai_turn_silence_before_initiation':{'elapsed_time':0.5}}}},
        ])
        self.assertIsNone(result['average_response_time_seconds'])
        self.assertIsNone(result['words_per_minute'])

    def test_missing_transcript_differs_from_observed_empty_transcript(self):
        self.assertIsNone(calculate_communication_metrics(None)['filler_word_count'])
        self.assertEqual(calculate_communication_metrics([])['filler_word_count'],0)

    def test_stored_user_turns_supported_and_agent_excluded(self):
        result = calculate_communication_metrics([{'speaker':'user','text':'uh'}, {'speaker':'agent','text':'um um?'}])
        self.assertEqual(result['filler_word_count'],1)
        self.assertEqual(result['questions_asked'],0)
