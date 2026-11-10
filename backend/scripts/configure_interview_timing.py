"""Apply the interview silence policy to the configured hosted voice agent."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import settings
from voice.router import get_elevenlabs


def configure():
    client = get_elevenlabs()
    agent = client.conversational_ai.agents.get(agent_id=settings.elevenlabs_agent_id)
    # Send a minimal patch so unrelated prompt, voice, and tool settings stay intact.
    client.conversational_ai.agents.update(
        agent_id=settings.elevenlabs_agent_id,
        conversation_config={"turn": {"turn_timeout": 30, "silence_end_call_timeout": -1,
                                      "turn_eagerness": "patient"}},
    )
    saved = client.conversational_ai.agents.get(agent_id=settings.elevenlabs_agent_id)
    assert saved.conversation_config.turn.turn_timeout == 30
    print("Verified hosted silence timeout: 30 seconds; patient turn-taking; silence does not end calls.")


if __name__ == "__main__":
    configure()
