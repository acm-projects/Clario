import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Uses the service_role key because this client runs server-side and needs
# to read/write on behalf of users directly (bypassing RLS). This key must
# NEVER be sent to the frontend or committed to git.
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)