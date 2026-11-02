"""Retry durable post-call jobs after a transient storage/provider failure.

Usage from backend: venv/bin/python -m scripts.reprocess_post_calls --limit 20
Run periodically with a scheduler in a deployed environment.
"""
import argparse
import asyncio
from datetime import datetime, timedelta, timezone
from db import supabase
from voice.webhooks import process_post_call, RETRY_STATUSES

async def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit',type=int,default=20)
    args=parser.parse_args()
    if not 1<=args.limit<=100:parser.error('limit must be between 1 and 100')
    # Recover jobs abandoned by a process restart, without stealing fresh work.
    cutoff=(datetime.now(timezone.utc)-timedelta(minutes=10)).isoformat()
    supabase.table('post_call_jobs').update({'status':'failed'}).eq('status','processing').lt('updated_at',cutoff).execute()
    jobs=supabase.table('post_call_jobs').select('conversation_id').in_('status',RETRY_STATUSES).order('received_at').limit(args.limit).execute().data
    for job in jobs:await process_post_call(job['conversation_id'])
    print(f'Retried {len(jobs)} post-call job(s). Inspect post_call_jobs.status for results.')

if __name__=='__main__':asyncio.run(main())
