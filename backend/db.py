import os

from supabase import create_client

from config import require_setting, settings

SUPABASE_URL = require_setting("SUPABASE_URL", settings.supabase_url)
SUPABASE_SERVICE_ROLE_KEY = require_setting(
    "SUPABASE_SERVICE_ROLE_KEY", settings.supabase_service_role_key
)

# Uses the service_role key because this client runs server-side and needs
# to read/write on behalf of users directly (bypassing RLS). This key must
# NEVER be sent to the frontend or committed to git.
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)