
from fastapi import APIRouter, HTTPException, Query
from db import supabase

router = APIRouter(
    prefix="/api/system-design",
    tags=["System Design"]
)


@router.get("")
def get_system_design_questions(
    company: str = Query(..., min_length=1)
):
    """
    Retrieve company-specific system design questions.
    """

    try:
        response = (
            supabase.table("system_design_questions")
            .select("id,slug,company,title,prompt,difficulty,created_at")
            .ilike("company", company.strip())
            .order("created_at")
            .execute()
        )

        return {
            "company": company,
            "count": len(response.data),
            "questions": response.data
        }

    except Exception as e:
        print(f"System design query failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve system design questions"
        )