"""Read-only CLA-70 audit: public catalog/schema only; synthetic profiles; no writes to Supabase."""
import json
import re
import sys
from collections import Counter
from datetime import timedelta
from pathlib import Path
import httpx
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from config import settings
from routers import assessment
from leetcode import fetch_live_problem_list

root=Path(__file__).resolve().parents[2]
response=httpx.get(settings.supabase_url.rstrip('/')+'/rest/v1/',headers={'apikey':settings.supabase_service_role_key,'Authorization':'Bearer '+settings.supabase_service_role_key,'Accept':'application/openapi+json'},timeout=20)
response.raise_for_status()
definitions=response.json().get('definitions',{})
schema={name:definition.get('properties',{}) for name,definition in definitions.items()}
company_tables={name: list(columns) for name,columns in schema.items() if 'compan' in name.lower()}
saved=assessment.load_problems()
try:
    live=fetch_live_problem_list()
    live_error=None
except Exception as error:
    live=[]
    live_error=type(error).__name__
seen=set()
pool=assessment.collect_eligible_records(saved,set(),seen)+assessment.collect_eligible_records(live,set(),seen)
source=(root/'frontend/src/lib/practiceProfile.ts').read_text(encoding='utf-8')
options=re.findall(r'"([^"\n]+)"',source.split('export const topicOptions = [',1)[1].split('];',1)[0])
coverage={topic:sum(topic in p['topics'] for p in pool) for topic in options}
profiles={}
completed={'two-sum','add-two-numbers'}
for name,experience,rating,days,topics,company in [('A','beginner',2,30,['Array','String'],'Google'),('B','intermediate',6,14,['Hash Table','Binary Search'],'Amazon'),('C','advanced',9,7,['Dynamic Programming','Tree'],'Microsoft')]:
    answers=assessment.AssessmentAnswers(experience=experience,language='java',language_comfort={'python':rating,'java':rating},interview_date=(assessment.today_chicago()+timedelta(days=days)).isoformat(),struggle_topics=topics,confident_topics=['Math'],companies=[company])
    eligible=[p.copy() for p in pool if p['slug'] not in completed]
    selected=assessment.select_recommendations(eligible,answers,25)
    profiles[name]={'answers':answers.model_dump(),'count':len(selected),'unique':len({p['slug'] for p in selected}),'difficulty':dict(Counter(p['difficulty'] for p in selected)),'topic_matches':sum(bool(set(topics)&set(p['topics'])) for p in selected),'company_preferences_applied':False,'completed_excluded':not any(p['slug'] in completed for p in selected),'recommendations':[{**p,'reason':assessment.generate_reason(p,answers)} for p in selected]}
report={'phase':'before fixes','date':assessment.today_chicago().isoformat(),'saved_rows':len(saved),'live_rows':len(live),'live_error':live_error,'pool_unique':len(pool),'coverage':coverage,'coverage_gaps':{key:value for key,value in coverage.items() if value<2},'problem_columns':list(schema.get('problems',{})),'company_tables':company_tables,'session_mode_schema':schema.get('interview_sessions',{}).get('mode'),'current_mode_mapping':'recommended -> practice; URL mode recommended only','profiles':profiles,'pool':pool}
output=root/'docs/cla70-initial-audit.json'
if output.exists():raise RuntimeError('Refusing to overwrite an existing audit artifact')
output.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({key:value for key,value in report.items() if key not in ['pool','profiles']},indent=2))
print('Profiles:',json.dumps({key:{k:v for k,v in value.items() if k not in ['answers','recommendations']} for key,value in profiles.items()}))
