"""Configure the selected agent's HMAC post-call webhook without changing other agents."""
import argparse
from pathlib import Path
from urllib.parse import urlparse
from dotenv import dotenv_values, set_key
from elevenlabs import ElevenLabs, WebhookHmacSettings
from elevenlabs.core.api_error import ApiError
from supabase import create_client


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public-url',required=True)
    args=parser.parse_args()
    origin=args.public_url.rstrip('/')
    parsed=urlparse(origin)
    if parsed.scheme!='https' or not parsed.hostname or parsed.path or parsed.query or parsed.fragment or parsed.username:
        parser.error('Use a public HTTPS origin, with no path, query, or credentials')
    env=Path(__file__).resolve().parents[1]/'.env'
    values=dotenv_values(env)
    for key in ('ELEVENLABS_API_KEY','ELEVENLABS_AGENT_ID','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'):
        if not values.get(key):parser.error(f'Missing {key} in backend/.env')
    db=create_client(values['SUPABASE_URL'],values['SUPABASE_SERVICE_ROLE_KEY'])
    try:db.table('post_call_jobs').select('conversation_id').limit(0).execute()
    except Exception:parser.error('Apply 20261102_post_call_pipeline.sql before configuring the webhook')
    client=ElevenLabs(api_key=values['ELEVENLABS_API_KEY'])
    agent_id=values['ELEVENLABS_AGENT_ID']
    agent=client.conversational_ai.agents.get(agent_id=agent_id)
    overrides=agent.platform_settings.workspace_overrides
    overrides=overrides.model_dump(exclude_none=True) if overrides else {}
    old=(overrides.get('webhooks') or {}).get('post_call_webhook_id')
    webhook_id=values.get('ELEVENLABS_WEBHOOK_ID')
    if old and old!=webhook_id:
        parser.error('Agent already has a different post-call webhook. Review that configuration before replacing it.')
    url=origin+'/api/webhooks/elevenlabs'
    if webhook_id:
        existing=next((hook for hook in client.webhooks.list().webhooks if hook.webhook_id==webhook_id),None)
        if existing is None or existing.webhook_url!=url:
            parser.error('Stored webhook URL differs or webhook was deleted. Review it before creating a replacement.')
        if not values.get('ELEVENLABS_WEBHOOK_SECRET'):
            parser.error('Existing webhook secret is missing locally; restore it before enabling delivery')
    else:
        created=client.webhooks.create(settings=WebhookHmacSettings(name='Clario post-call '+agent_id,webhook_url=url))
        webhook_id=created.webhook_id
        if not created.webhook_secret:raise RuntimeError('Provider did not return an HMAC secret')
        set_key(env,'ELEVENLABS_WEBHOOK_ID',webhook_id)
        set_key(env,'ELEVENLABS_WEBHOOK_SECRET',created.webhook_secret)
    client.webhooks.update(webhook_id=webhook_id,name='Clario post-call '+agent_id,is_disabled=False,retry_enabled=True)
    overrides['webhooks']={'post_call_webhook_id':webhook_id,'events':['transcript'],'transcript_format':'json','exclude_transcript':False}
    client.conversational_ai.agents.update(agent_id=agent_id,platform_settings={'workspace_overrides':overrides})
    saved=client.conversational_ai.agents.get(agent_id=agent_id)
    if saved.platform_settings.workspace_overrides.webhooks.post_call_webhook_id!=webhook_id:
        raise RuntimeError('Could not verify selected agent webhook')
    print('Configured and verified JSON post-call transcription for the selected agent only.')
    print('Webhook URL:',url)
    print('HMAC secret saved in backend/.env; value not displayed. Restart FastAPI to load it.')

if __name__=='__main__':
    try:main()
    except ApiError as error:
        detail = error.body.get('detail', {}) if isinstance(error.body, dict) else {}
        print(f'ElevenLabs configuration failed (HTTP {error.status_code}).')
        print('Reason:', detail.get('status', 'unknown'), detail.get('message', 'Check dashboard permissions.'))
        raise SystemExit(1)
