"""Executed inside Piston only. Never import this runner in the API process."""
import contextlib
import json
import os
import unittest


class Results(unittest.TestResult):
    def __init__(self):
        super().__init__()
        self.rows = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.rows.append({"name": test._testMethodName, "passed": True})

    def addFailure(self, test, error):
        super().addFailure(test, error)
        self.rows.append({"name": test._testMethodName, "passed": False, "message": self._exc_info_to_string(error, test)})

    def addError(self, test, error):
        super().addError(test, error)
        self.rows.append({"name": test._testMethodName, "passed": False, "message": self._exc_info_to_string(error, test)})


with open(os.devnull, "w") as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
    suite = unittest.defaultTestLoader.loadTestsFromName("_clario_tests")
    if os.path.exists("test_checkout.py"):
        suite.addTests(unittest.defaultTestLoader.loadTestsFromName("test_checkout"))
    result = Results()
    suite.run(result)
print("__CLARIO_REPO_RESULTS__" + json.dumps(sorted(result.rows, key=lambda row: row["name"])))
