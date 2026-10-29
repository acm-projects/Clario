import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv(override=True)


class GeneratedScenario(BaseModel):
    title: str = Field(min_length=3)
    prompt: str = Field(min_length=20)
    hidden_details: list[str] = Field(min_length=3, max_length=5)


def generate_scenario_framing(
    company: str,
    problem: dict,
) -> dict:
    """
    Generate company-specific framing for a real LeetCode problem.
    Does not change its solution, function signature, or test cases.
    """

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    instructions = f"""
    You are creating a realistic technical interview scenario.

    Company: {company}
    LeetCode title: {problem.get("title")}
    Description: {problem.get("description_html")}
    Difficulty: {problem.get("difficulty")}
    Example test cases: {problem.get("example_testcases")}

    Generate:
    1. title: A short, company-specific scenario title.
    2. prompt: A vague real-world problem in 2-3 sentences.
    3. hidden_details: 3-5 constraints or edge cases.

    Rules:
    - The scenario must fit the company's product.
    - Do not mention the LeetCode title or algorithm pattern.
    - Do not reveal the underlying solution.
    - Preserve all original input/output requirements.
    - Do not invent constraints that contradict LeetCode.
    - Do not modify function names, parameters, or return types.
    - Return only structured JSON.
    """

    last_error = None

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=instructions,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedScenario,
                    "temperature": 0.4,
                },
            )

            scenario = GeneratedScenario.model_validate_json(
                response.text
            )

            # Reject obvious disclosure of the original problem title.
            original_title = (problem.get("title") or "").lower()
            generated_prompt = scenario.prompt.lower()

            if original_title and original_title in generated_prompt:
                raise ValueError(
                    "Generated prompt reveals the LeetCode title"
                )

            forbidden_patterns = (
                "two pointers",
                "sliding window",
                "binary search",
                "dynamic programming",
                "breadth-first search",
                "depth-first search",
                "top k frequent",
            )

            if any(
                pattern in generated_prompt
                for pattern in forbidden_patterns
            ):
                raise ValueError(
                    "Generated prompt reveals an algorithm pattern"
                )

            return scenario.model_dump()

        except Exception as exc:
            last_error = exc

    raise RuntimeError(
        "Gemini scenario generation failed after two attempts"
    ) from last_error