from piston.harness import split_output, wrap_python


def test_split_output_preserves_user_output_and_decodes_results():
    stdout, results = split_output('debug\n__CLARIO_RESULTS__[{"ok":true,"output":1}]')
    assert stdout == "debug"
    assert results == [{"ok": True, "output": 1}]


def test_split_output_returns_no_results_for_crashed_program():
    assert split_output("Traceback",) == ("Traceback", None)


def test_wrap_python_includes_method_and_cases():
    script = wrap_python("class Solution:\n    def f(self, value):\n        return value", "f", [[1]])
    assert "class Solution" in script
    assert "__CLARIO_RESULTS__" in script
