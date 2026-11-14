"""Temporary feedback when the AI provider is unavailable; never persisted as a grade."""
from communication import transcript_fillers


def fallback_report(evidence: dict) -> dict:
    code = evidence.get("code") or ""
    speech = evidence.get("candidate_transcript") or ""
    notice = "Your AI review is pending. Displayed scores are temporary and do not affect your progress. Refresh the review for an assessment of your interview."
    actions = ["Refresh your AI review for a detailed assessment.", "Walk through your solution with one example.", "Check the task's edge cases.", "Explain your approach and its complexity.", "Compare your submitted code with the task requirements."]
    return {
        "provider": "fallback", "is_fallback": True, "version": 2,
        "summary": notice,
        "full_summary": notice + "\n\nYour saved solution and filler-word observations are shown below. No mistakes, strengths, or UMPIRE ratings have been inferred from the pending review.\n\nThe next steps are general practice suggestions. A corrected solution will be available after a successful AI review.",
        **{key: 25 for key in ("technical_score", "reasoning_score", "communication_score", "overall_score")},
        "submitted_code": code, "corrected_solution": None,
        "strengths": [], "weaknesses": [], "recommendations": actions,
        "actions": {"fix": actions, "keep": []},
        "umpire": {key: {"stars": None, "summary": "AI review pending.", "details": "Your review will assess this stage using your saved interview evidence.", "evidence_quotes": []} for key in ("understand", "match", "plan", "implement", "review", "evaluate")},
        "filler_words": transcript_fillers(speech),
        "communication_metrics": evidence.get("communication_metrics"),
        "evidence_limitations": [notice, "This temporary report is not saved and does not affect your progress scores."],
        "technique_gaps": [],
    }


async def review_with_fallback(evidence: dict, generate):
    from fastapi import HTTPException
    try:
        return await generate(evidence)
    except HTTPException as error:
        if error.status_code < 500:
            raise
        return fallback_report(evidence)
