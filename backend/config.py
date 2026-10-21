from pathlib import Path
from dotenv import load_dotenv

# Match Vite's local environment precedence, regardless of the launch directory.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env.local")
load_dotenv(BACKEND_DIR / ".env")
