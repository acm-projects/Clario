"""Measured report evidence and validation of AI references."""
from datetime import datetime
import math
from metrics import FILLERS


def offset(value, start):
    try:
        seconds = (datetime.fromisoformat(value.replace('Z', '+00:00')) - datetime.fromisoformat(start.replace('Z', '+00:00'))).total_seconds()
        return round(seconds, 1) if math.isfinite(seconds) and seconds >= 0 else None
    except (ValueError, TypeError, AttributeError):
        return None


def build_evidence(session, transcript, captures):
    turns, moments = [], []
    count = 0
    remaining = 50000
    for index, row in enumerate(transcript):
        if remaining <= 0:
            break
        turn = {'id': str(row.get('id') or f'turn-{index}'), 'speaker': row.get('speaker'),
                'text': row.get('text', '')[:min(4000, remaining)], 'seconds': offset(row.get('started_at') or row.get('created_at'), session.get('started_at'))}
        turns.append(turn)
        remaining -= len(turn['text'])
        if turn['speaker'] in ('user', 'candidate', 'human', 'interviewee'):
            matches = len(FILLERS.findall(turn['text']))
            count += matches
            if matches:
                moments.append({'id': 'filler-' + turn['id'], 'kind': 'filler', 'seconds': turn['seconds'],
                                'duration_seconds': None, 'count': matches, 'transcript_id': turn['id']})
    # Nearby candidate turns form one cluster; keep a representative transcript link.
    clusters = []
    for moment in moments:
        previous = clusters[-1] if clusters else None
        if previous and moment['seconds'] is not None and previous['seconds'] is not None and 0 <= moment['seconds'] - previous['last_seconds'] <= 30:
            previous['count'] += moment['count']
            previous['last_seconds'] = moment['seconds']
        else:
            clusters.append({**moment, 'last_seconds': moment['seconds']})
    moments = [{k: v for k, v in cluster.items() if k != 'last_seconds'} for cluster in clusters]
    duration = offset(session.get('ended_at'), session.get('started_at'))
    return {'transcript': turns, 'measured_moments': sorted(moments, key=lambda m: m['seconds'] if m['seconds'] is not None else float('inf')),
            'filler_total': count if turns else None, 'filler_rate_per_interview_minute': round(count * 60 / duration, 2) if duration and turns else None}


def validate_references(report, evidence):
    """Repair model references in place so one bad ID never discards a whole report.

    Unknown transcript links are removed (the written observation is kept but no longer
    claims a quote); invented or duplicate moments are dropped. Returns the repair count.
    """
    details = report.get('details')
    if not details:
        return 0
    turns = {t['id'] for t in evidence['transcript']}
    moments = {m['id']: m for m in evidence['measured_moments']}
    refs = [ref for score in details['sectors'].values() for ref in score['evidence']]
    refs += [ref for step in details['umpire'] for ref in step['evidence']]
    refs += details['specific_strengths']
    repairs = 0
    for ref in refs:
        if ref['transcript_id'] is not None and ref['transcript_id'] not in turns:
            ref['transcript_id'] = None
            repairs += 1
    kept, seen = [], set()
    for moment in details['moments']:
        if moment['moment_id'] in moments and moment['moment_id'] not in seen:
            seen.add(moment['moment_id'])
            kept.append(moment)
        else:
            repairs += 1
    kept.sort(key=lambda m: moments[m['moment_id']]['seconds'] if moments[m['moment_id']]['seconds'] is not None else float('inf'))
    details['moments'] = kept
    report['session_evidence'] = evidence
    return repairs
