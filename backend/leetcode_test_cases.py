
import ast
import html
import re

def extract_test_cases(problem: dict) -> list[dict]:
    """
    Extract executable test cases from standard LeetCode
    examples containing named inputs and expected outputs.

    Returns an empty list for unsupported formats.
    """

    description = problem.get("description_html") or ""

    if not description:
        return []

    # Preserve line breaks while removing HTML.
    text = re.sub(
        r"</(?:p|pre|div|li)>|<br\s*/?>",
        "\n",
        description,
        flags=re.IGNORECASE,
    )
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))

    # Extract each example section.
    sections = re.split(
        r"Example\s+\d+\s*:",
        text,
        flags=re.IGNORECASE,
    )[1:]

    test_cases = []

    for section in sections:
        # Stop before the constraints or follow-up section.
        section = re.split(
            r"\bConstraints\s*:|\bFollow-up\s*:",
            section,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0]

        match = re.search(
            r"\bInput\s*:\s*(.*?)\s*\bOutput\s*:\s*(.*?)(?=\bExplanation\s*:|$)",
            section,
            flags=re.IGNORECASE | re.DOTALL,
        )

        if not match:
            continue

        input_text = match.group(1).strip()
        output_text = match.group(2).strip()

        try:
            # Parse named arguments, e.g.:
            # nums = [2,7,11,15], target = 9
            argument_values = []

            assignments = re.findall(
                r"(?:^|,\s*)([A-Za-z_]\w*)\s*=\s*(\[[^\]]*\]|-?\d+|\"[^\"]*\")",
                input_text,
            )

            if not assignments:
                continue

            for _, value in assignments:
                argument_values.append(ast.literal_eval(value))

            expected = ast.literal_eval(output_text)

            test_cases.append({
                "input": argument_values,
                "expected": expected,
            })

        except (ValueError, SyntaxError):
            continue

    return test_cases
