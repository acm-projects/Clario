# Starting and recording an interview

The room reuses the authenticated session selected in the URL. If opened without one,
Start Interview creates a session using the loaded problem, selected language, and mode.
Standard sessions link to a problems row; missing problem records are saved first.
Company scenario voice startup is intentionally rejected until scenario prompt integration
is implemented; it must not fall back to a LeetCode prompt.

## ElevenLabs configuration

Use the existing ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in backend/.env.
In the configured agent's Security settings, enable the agent system prompt override.
The browser passes the backend-generated interview instructions as a prompt override.
Without that permission ElevenLabs can reject startup. The full problem description
(including its constraints) and selected language are included in this prompt.
Dynamic variables also include session_id, language, problem_title,
problem_description, and interview_instructions. No secret is sent to the browser.

## Troubleshooting voice credits

`[quota_exceeded] You've run out of credits` during voice startup comes from
ElevenLabs. Check usage and billing in the workspace associated with the backend's
`ELEVENLABS_API_KEY`, and confirm `ELEVENLABS_AGENT_ID` is the intended agent.
Restore available credits or wait for the quota reset before retrying. Repeated
startup attempts do not restore quota. Gemini feedback uses a separate provider
and changing its key does not restore ElevenLabs credits.

Getting a signed URL does not establish that the workspace can start a call;
the provider can reject the subsequent browser connection for insufficient credits.

## API flow

1. POST /api/sessions creates a session when needed.
2. GET /voice/session?session_id=<uuid> verifies ownership and in-progress status,
   loads the problem, and returns a signed URL plus the prompt and dynamic variables.
3. The client starts ElevenLabs, reads conversation.getId(), then PATCHes
   /api/sessions/<uuid>/conversation with conversation_id.
4. onMessage callbacks queue POST /api/sessions/<uuid>/transcript with speaker,
   text, received_at, and sequence_number. Messages received during startup wait
   until linking succeeds. Failed linking stops the call. Transcript save failures
   are surfaced in the call panel.

Transcript created_at records browser receipt time, not speech timing. started_at
and ended_at stay null. This endpoint inserts live turns; post-call reconciliation,
retry deduplication, and final authoritative transcript handling are separate work.
A session currently supports one conversation; a second call needs a new session.

## Manual verification

Open Two Sum through interview selection, click Start Interview, and speak a few turns.
Confirm interview_sessions has user_id, problem_id, language, started_at, and
conversation_id. Confirm transcript_events receives both user and agent rows for
that session while the call is running. Verify the agent discusses Two Sum's
requirements. Check the call panel for persistence errors.

Automated tests mock storage and do not replace a real ElevenLabs/Supabase call.

## Current-code tool and Run updates

The room now saves an initial snapshot before voice startup, then saves changed
code every 10 seconds while the room is ready. Unchanged autosaves are skipped.
Run and End snapshots share the same ordered writer, so a slow autosave cannot
finish after a newer final save and overwrite what the tool sees. Autosave failures
are visible in the room and retried on the next interval.

The tool endpoint is GET /api/voice-tools/sessions/{session_id}/code. It requires:

- X-ElevenLabs-Tool-Secret: the secret configured as ELEVENLABS_TOOL_SECRET in backend/.env.
- X-Conversation-Id: the ElevenLabs system__conversation_id dynamic variable.

The endpoint verifies that the conversation belongs to the requested session and
that the session is in progress. It returns available, code, language, snapshot_id,
saved_at, and session_id. No snapshots returns available=false with code=null;
an empty editor returns available=true with code="". Responses are not cached.
The browser never receives the shared tool secret. This endpoint uses server-tool
authentication rather than a browser's Supabase JWT.

### Configure ElevenLabs

1. Restart FastAPI after adding ELEVENLABS_TOOL_SECRET to backend/.env.
2. Run `ngrok http 8000` to expose FastAPI, or use your existing public HTTPS host.
3. In the intended ElevenLabs agent, add a **Webhook/server tool** named
   `get_current_code` using method GET.
4. Set the URL to
   `https://YOUR-PUBLIC-HOST/api/voice-tools/sessions/{session_id}/code`.
   Configure the `session_id` path parameter as **Dynamic variable**, bound to
   `session_id`; do not let the LLM choose it. This is the tool-parameter binding
   equivalent of using `{{session_id}}` in a prompt template. The frontend already
   sends that variable when starting the call.
5. Add header `X-ElevenLabs-Tool-Secret` using a stored ElevenLabs **Secret** with
   the exact value of ELEVENLABS_TOOL_SECRET from backend/.env. Do not put the
   secret in the URL, prompt, frontend env, or committed JSON.
6. Add header `X-Conversation-Id` with **Dynamic variable** value
   `system__conversation_id` (a built-in variable; the frontend does not supply it).
7. Use the description from elevenlabs-get-current-code.json and attach the tool
   to the agent. That JSON is a template: replace the public host and ElevenLabs
   secret ID before importing it. It contains no secret values.
8. Keep the system-prompt override enabled. The backend now instructs the agent
   to fetch current code before implementation questions and to use Run updates
   factually on its next natural turn.

ElevenLabs must call the public URL, not localhost. If a free ngrok hostname
changes, update the tool URL. A separate developer's agent should use that
developer's public host and tool secret.

### Run results

After a successful /run/tests response, the room calls sendContextualUpdate on
its currently open conversation. The summary includes pass/total counts, verdict,
the first failing case's expected/actual result, and a short error excerpt.
It is capped at 600 characters and excludes stdout. Request failures are described
as request failures, without inventing a test verdict. Runs without an active call
still work and do not enqueue updates for an unrelated future call. The update
does not force the interviewer to interrupt or speak immediately.

### Verify these two tasks

- Start a new Two Sum session, write distinctive code, and wait 10 seconds.
- Confirm a snapshot appears, then leave the editor unchanged for another interval:
  no extra autosave should appear. Change it again and confirm another snapshot.
- Ask the interviewer to review your implementation; inspect the ElevenLabs tool
  call log for get_current_code and confirm its returned code matches your edits.
- Run a failing solution while voice is active. Confirm the results panel still
  opens and the next natural agent response can refer to the reported failure.
- Run with the call inactive: results should still display without a voice error.
- Check missing/wrong tool headers fail and a conversation cannot read a different
  session. Do not paste real header secrets into shared logs or screenshots.

Local checks:

```sh
cd backend
venv/bin/python -m unittest discover -s tests -p test_voice_tools.py -v
```

```sh
node --experimental-strip-types --test frontend/tests/interview-context.test.mjs
npm run build --prefix frontend
```

A real voice interview is still required to verify the configured remote tool and
how the agent incorporates Run results. These changes do not add code_executions
logging or the final post-call webhook.

### Update the tool URL from the command line

The setup script reads the selected agent and credentials from backend/.env,
creates/updates the dedicated stored secret, and attaches get_current_code while
preserving unrelated tool IDs. It verifies the saved URL and tool attachment.
It makes changes in ElevenLabs; use the intended developer agent's .env.

```sh
cd backend
venv/bin/python scripts/configure_code_tool.py --public-url https://YOUR-PUBLIC-HOST
```

After changing ELEVENLABS_TOOL_SECRET, restart FastAPI. HTTP 503 from the public
code-tool route means the running backend has not loaded that setting. Missing
credentials should return 401 once it is configured; valid credentials with a
nonexistent session/conversation should return 404.

### Proactive code review

After a changed autosave succeeds, the room sends a brief code-activity contextual
update to the current open voice call. Successful notifications are limited to one
per 30 seconds per session; saving still checks every 10 seconds. Unchanged code,
failed saves, inactive calls, and forced Run/End snapshots do not produce these
notifications. The notification contains no code; the agent uses get_current_code
to retrieve the latest saved snapshot on its next natural turn.

The startup prompt now tells the interviewer to proactively review available code
and ask one relevant implementation question, without waiting for an explicit
review request or interrupting the candidate. Contextual updates do not force an
immediate response or guarantee tool use: verify the behavior in a new live call.
No additional backend polling or background code evaluation was added.

For a manual check, start a new interview, edit code, and let autosave finish.
Continue explaining your approach rather than asking for review. Check the
ElevenLabs conversation/tool logs for get_current_code on a subsequent agent turn.
Keep editing to check notifications are at least 30 seconds apart, then stop editing
and confirm no new code-activity notifications appear.
