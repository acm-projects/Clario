
import ast
import html
import json
import re


def parse_value(value: str):
    """Parse JSON or Python-compatible literal values."""
    value = value.strip()

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return ast.literal_eval(value)


def split_top_level(text: str) -> list[str]:
    """
    Split comma-separated arguments without splitting
    nested arrays, objects, or quoted strings.
    """
    parts = []
    start = 0
    depth = 0
    quote = None
    escaped = False

    for index, char in enumerate(text):
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in ('"', "'"):
            quote = char
        elif char in "[{(":
            depth += 1
        elif char in "]})":
            depth -= 1

            if depth < 0:
                raise ValueError("Unbalanced brackets")
        elif char == "," and depth == 0:
            parts.append(text[start:index].strip())
            start = index + 1

    if depth != 0 or quote:
        raise ValueError("Unbalanced input")

    parts.append(text[start:].strip())
    return parts


def get_parameter_names(starter_code: str) -> list[str]:
    """Read parameter order from Python starter code."""
    try:
        tree = ast.parse(starter_code)
    except (SyntaxError, IndentationError):
        # LeetCode starter code may have an empty method body.
        # Add a temporary pass statement for signature inspection.
        lines = starter_code.rstrip().splitlines()

    if not lines:
        raise ValueError("Empty starter code")

    last_line = lines[-1]

    if not last_line.lstrip().startswith("def "):
        raise ValueError("Unsupported incomplete starter code")

    indentation = len(last_line) - len(last_line.lstrip())

    parseable_code = (
        starter_code.rstrip()
        + "\n"
        + " " * (indentation + 4)
        + "pass\n"
    )

    tree = ast.parse(parseable_code)

    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            methods = [
                item
                for item in node.body
                if isinstance(item, ast.FunctionDef)
                and not item.name.startswith("_")
            ]

            if len(methods) != 1:
                raise ValueError("Unsupported Solution class")

            args = methods[0].args

            if (
                args.vararg
                or args.kwarg
                or args.kwonlyargs
                or args.posonlyargs
                or args.defaults
            ):
                raise ValueError("Unsupported function signature")

            names = [arg.arg for arg in args.args]

            if names and names[0] == "self":
                names = names[1:]

            return names

    functions = [
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef)
        and not node.name.startswith("_")
    ]

    if len(functions) != 1:
        raise ValueError("Unsupported starter code")

    args = functions[0].args

    if (
        args.vararg
        or args.kwarg
        or args.kwonlyargs
        or args.posonlyargs
        or args.defaults
    ):
        raise ValueError("Unsupported function signature")

    return [arg.arg for arg in args.args]


def extract_test_cases(problem: dict) -> list[dict]:
    """
    Extract JSON-compatible LeetCode examples.

    If Python starter code is supplied, validate and
    preserve the original function parameter order.

    Unsupported examples are skipped.
    """
    description = problem.get("description_html") or ""

    if not description:
        return []

    starter = (problem.get("starter_code") or {}).get("python3")
    parameter_names = None

    if starter:
        try:
            parameter_names = get_parameter_names(starter)
        except (SyntaxError, ValueError):
            return []

    text = re.sub(
        r"</(?:p|pre|div|li)>|<br\s*/?>",
        "\n",
        description,
        flags=re.IGNORECASE,
    )

    text = html.unescape(
        re.sub(r"<[^>]+>", " ", text)
    )

    sections = re.split(
        r"\bExample\s+\d+\s*:",
        text,
        flags=re.IGNORECASE,
    )[1:]

    test_cases = []

    for section in sections:
        section = re.split(
            r"\bConstraints\s*:|\bFollow-up\s*:",
            section,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0]

        match = re.search(
            r"\bInput\s*:\s*(.*?)\s*\bOutput\s*:\s*"
            r"(.*?)(?=\bExplanation\s*:|$)",
            section,
            flags=re.IGNORECASE | re.DOTALL,
        )
        
        if not match:
            continue

        input_text = match.group(1).strip()
        output_text = match.group(2).strip()

        try:
            assignments = {}

            for part in split_top_level(input_text):
                if "=" not in part:
                    raise ValueError("Unsupported input format")

                name, value = part.split("=", 1)
                name = name.strip()

                if not name.isidentifier():
                    raise ValueError("Invalid argument name")

                if name in assignments:
                    raise ValueError("Duplicate argument")

                assignments[name] = parse_value(value)

            if parameter_names is not None:
                if set(assignments) != set(parameter_names):
                    continue

                arguments = [
                    assignments[name]
                    for name in parameter_names
                ]
            else:
                arguments = list(assignments.values())

            expected = parse_value(output_text)

            # Ensure arguments and expected output can be
            # serialized for the existing Judge0 runner.
            json.dumps(arguments, allow_nan=False)
            json.dumps(expected, allow_nan=False)

            test_cases.append({
                "input": arguments,
                "expected": expected,
            })

        except (
            ValueError,
            SyntaxError,
            TypeError,
            OverflowError,
        ):
            continue

    return test_cases
