"""Isolated CLA-70 app: real route handlers; captured public catalog; no external writes."""
import json
from copy import deepcopy
from pathlib import Path
from tests import part5_server as fixture
from routers import assessment

report=json.loads((Path(__file__).resolve().parents[2]/"docs/cla70-initial-audit.json").read_text(encoding="utf-8"))
fixture.PROBLEMS=[{**problem,"id":str(index),"description_html":"<p>Isolated audit fixture; execution and voice are disabled.</p>","starter_code":{"python3":"# Isolated audit fixture","java":"// Isolated audit fixture"},"example_testcases":""} for index,problem in enumerate(report["pool"])]
fixture.store.tables["problems"]=deepcopy(fixture.PROBLEMS)
assessment.load_additional_problems=lambda: []
app=fixture.app
