"""Attach/update only get_current_code on the agent selected in backend/.env.

Usage: venv/bin/python scripts/configure_code_tool.py --public-url https://host
Secret values are never printed. Existing unrelated agent tools are preserved.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from dotenv import dotenv_values
from elevenlabs import ElevenLabs, ToolRequestModel
from elevenlabs.core.api_error import ApiError


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public-url', required=True)
    args = parser.parse_args()
    url = args.public_url.rstrip('/')
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
        parser.error('Supply a public HTTPS origin, without a path, credentials, query, or fragment')
    backend = Path(__file__).resolve().parents[1]
    config = dotenv_values(backend / '.env')
    for key in ('ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID', 'ELEVENLABS_TOOL_SECRET'):
        if not config.get(key):
            parser.error(f'Missing {key} in backend/.env')
    client = ElevenLabs(api_key=config['ELEVENLABS_API_KEY'])
    agent_id = config['ELEVENLABS_AGENT_ID']
    agent = client.conversational_ai.agents.get(agent_id=agent_id)
    prompt = agent.conversation_config.agent.prompt
    tool_ids = list(prompt.tool_ids or [])
    # Do not silently replace legacy inline tool configurations.
    if prompt.tools:
        parser.error('Agent uses inline tools; migrate/review them before attaching a tool by ID')
    matches = []
    for tool_id in tool_ids:
        tool = client.conversational_ai.tools.get(tool_id=tool_id)
        if tool.tool_config.name == 'get_current_code':
            matches.append(tool_id)
    if len(matches) > 1:
        parser.error('More than one attached get_current_code tool; review before updating')

    secret_name = f'clario-code-tool-{agent_id}'
    secrets = client.conversational_ai.secrets.list()
    matching = [secret for secret in secrets.secrets if secret.name == secret_name]
    if len(matching) > 1:
        parser.error('Duplicate tool secrets; review before updating')
    if matching:
        secret_id = matching[0].secret_id
        client.conversational_ai.secrets.update(secret_id=secret_id, name=secret_name, value=config['ELEVENLABS_TOOL_SECRET'])
    else:
        secret_id = client.conversational_ai.secrets.create(name=secret_name, value=config['ELEVENLABS_TOOL_SECRET']).secret_id
    template = json.loads((backend.parent / 'docs' / 'elevenlabs-get-current-code.json').read_text())
    template['api_schema']['url'] = url + '/api/voice-tools/sessions/{session_id}/code'
    template['api_schema']['request_headers']['X-ElevenLabs-Tool-Secret']['secret_id'] = secret_id
    request = ToolRequestModel.model_validate({'tool_config': template})
    if matches:
        tool_id = matches[0]
        client.conversational_ai.tools.update(tool_id=tool_id, request=request)
    else:
        tool_id = client.conversational_ai.tools.create(request=request).id
        tool_ids.append(tool_id)
        client.conversational_ai.agents.update(agent_id=agent_id, conversation_config={'agent': {'prompt': {'tool_ids': tool_ids}}})

    saved = client.conversational_ai.agents.get(agent_id=agent_id)
    saved_tool = client.conversational_ai.tools.get(tool_id=tool_id)
    if tool_id not in (saved.conversation_config.agent.prompt.tool_ids or []):
        raise RuntimeError('Tool attachment was not confirmed')
    if saved_tool.tool_config.api_schema.url != template['api_schema']['url']:
        raise RuntimeError('Saved tool URL does not match requested URL')
    print('Configured and verified get_current_code on the selected agent.')
    print('Tool URL:', saved_tool.tool_config.api_schema.url)
    print('Session variable and conversation header are bound automatically. Secret value not displayed.')


if __name__ == '__main__':
    try:
        main()
    except ApiError as error:
        print(f'ElevenLabs API rejected configuration (HTTP {error.status_code}). Check API-key permissions in the dashboard.')
        raise SystemExit(1)
