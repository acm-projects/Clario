"""Verify three profiles through real routes backed by isolated in-memory storage."""
import json
import sys
from collections import Counter
from datetime import timedelta
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from tests.cla70_server import app, fixture
from routers import assessment

completed={"two-sum","add-two-numbers"}
fixture.store.tables["interview_sessions"]=[{"id":str(index),"user_id":fixture.USER,"status":"completed","problem_slug":slug,"mode":"recommended"} for index,slug in enumerate(sorted(completed))]
results={"storage":"isolated in-memory; captured real public catalog","profiles":{},"all_assertions_passed":False}
with TestClient(app) as client:
    for name,experience,rating,days,topics,company,language,preferred in [
        ("A","beginner",2,30,["Array","String"],"Google","python3","Python"),
        ("B","intermediate",6,14,["Hash Table","Binary Search"],"Amazon","java","Java"),
        ("C","advanced",9,7,["Dynamic Programming","Tree"],"Microsoft","python3","C++"),
    ]:
        ratings={"python":rating,"java":rating}
        if preferred=="C++":ratings["c++"]=rating
        body={"experience":experience,"language":language,"preferred_language":preferred,"language_comfort":ratings,"interview_date":(assessment.today_chicago()+timedelta(days=days)).isoformat(),"struggle_topics":topics,"confident_topics":["Math"],"companies":[company]}
        saved=client.post("/api/assessment",json=body)
        assert saved.status_code==200,saved.text
        response=client.get("/api/recommendations")
        assert response.status_code==200,response.text
        data=response.json()
        problems=data["problems"]
        assert data["target_count"]==25 and data["minimum_count"]==20
        assert len(problems)==len({p["slug"] for p in problems})==25
        assert all(p["reason"].strip() for p in problems)
        assert not any(p["slug"] in completed for p in problems)
        if name=="A":assert all(p["difficulty"]!="Hard" for p in problems)
        matches=sum(bool(set(topics)&set(p["topics"])) for p in problems)
        assert matches>0
        results["profiles"][name]={"answers":body,"count":len(problems),"unique_count":len({p["slug"] for p in problems}),"difficulty":dict(Counter(p["difficulty"] for p in problems)),"direct_topic_matches":matches,"matches_by_topic":{topic:sum(topic in p["topics"] for p in problems) for topic in topics},"company_preferences_applied":False,"company_status":"Unavailable: audited schema/source have no company metadata; no invented associations","completed_excluded":True,"recommendations":problems}
results["all_assertions_passed"]=True
output=Path(__file__).resolve().parents[2]/"docs/cla70-profile-results.json"
if output.exists():raise RuntimeError("Refusing to overwrite existing results")
output.write_text(json.dumps(results,indent=2),encoding="utf-8")
print(json.dumps({key:{k:v for k,v in value.items() if k not in ["answers","recommendations"]} for key,value in results["profiles"].items()},indent=2))
