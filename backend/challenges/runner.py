"""Runs unit tests only inside Piston; returns candidate-facing diagnostics."""
import contextlib
import importlib
import json
import os
import runpy
import traceback
import unittest

ENTRYPOINT = None
CANDIDATE_FILES = []  # Filled by the API from the manifest, never candidate input.

def diagnostic(error):
    kind, value, trace = error
    lines = [kind.__name__ + ": " + str(value)[:2000]]
    if isinstance(value, SyntaxError):
        name = os.path.basename(value.filename or "")
        if name in CANDIDATE_FILES:
            lines = [f"{name}:{value.lineno}: {kind.__name__}: {value.msg}"]
            if value.text: lines.append(value.text.strip())
    for frame in traceback.extract_tb(trace):
        name = os.path.basename(frame.filename)
        if name in CANDIDATE_FILES:
            lines.append(f"{name}:{frame.lineno} in {frame.name}")
            if frame.line: lines.append("  " + frame.line)
    return "\n".join(lines)[:3000]

class Results(unittest.TestResult):
    def __init__(self):
        super().__init__()
        self.rows = []
    def addSuccess(self, test):
        super().addSuccess(test)
        self.rows.append({"name": test._testMethodName, "passed": True, "status": "passed"})
    def addFailure(self, test, error):
        super().addFailure(test, error)
        self.rows.append({"name": test._testMethodName, "passed": False, "status": "failed", "message": diagnostic(error)})
    def addError(self, test, error):
        super().addError(test, error)
        self.rows.append({"name": test._testMethodName, "passed": False, "status": "error", "message": diagnostic(error)})

error = None
result = Results()
with open(os.devnull, "w") as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
    try:
        for name in CANDIDATE_FILES:
            if name.endswith('.py'):
                with open(name, encoding='utf-8') as source:
                    compile(source.read(), name, 'exec')
        if ENTRYPOINT:
            runpy.run_path(ENTRYPOINT, run_name='__main__')
        module = importlib.import_module("_clario_tests")
        unittest.defaultTestLoader.loadTestsFromModule(module).run(result)
    except Exception:
        import sys
        error = diagnostic(sys.exc_info())
# Keep the existing list protocol when the suite loaded successfully.
print("__CLARIO_REPO_RESULTS__" + json.dumps({"tests": [], "error": error} if error else sorted(result.rows, key=lambda row: row["name"])))
