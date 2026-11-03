"""Verify mode persistence using only a newly created, disposable audit account."""
import json
import secrets
import sys
from pathlib import Path
from uuid import uuid4
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from db import supabase
report={"scope":"new disposable account and session only; no existing users modified","created":False,"recommended_mode_persisted":False,"cleanup":{}}
user_id=None
session_id=None
try:
    created=supabase.auth.admin.create_user({"email":f"cla70-audit-{uuid4().hex}@example.invalid","password":secrets.token_urlsafe(40),"email_confirm":True,"user_metadata":{"display_name":"CLA-70 isolated audit"}})
    user_id=created.user.id
    report["created"]=True
    report["test_user_id"]=user_id
    rows=supabase.table("interview_sessions").insert({"user_id":user_id,"problem_slug":"two-sum","mode":"recommended","language":"java","status":"in_progress"}).execute().data
    session_id=rows[0]["id"]
    saved=supabase.table("interview_sessions").select("id,mode,language,problem_slug").eq("id",session_id).eq("user_id",user_id).execute().data[0]
    report["session"]=saved
    report["recommended_mode_persisted"]=saved["mode"]=="recommended"
except Exception as error:
    report["error"]={"type":type(error).__name__,"code":getattr(error,"code",None),"message":getattr(error,"message",str(error))}
finally:
    if session_id:
        try:
            supabase.table("interview_sessions").delete().eq("id",session_id).eq("user_id",user_id).execute()
            report["cleanup"]["test_session_removed"]=True
        except Exception as error:report["cleanup"]["session_error"]=type(error).__name__
    if user_id:
        try:
            supabase.auth.admin.delete_user(user_id)
            report["cleanup"]["test_account_removed"]=True
        except Exception as error:report["cleanup"]["account_error"]=type(error).__name__
    output=Path(__file__).resolve().parents[2]/"docs/cla70-supabase-mode-check.json"
    if output.exists():raise RuntimeError("Refusing to overwrite an existing audit result")
    output.write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))
