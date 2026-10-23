"""Dummy fixtures, not a production authentication implementation."""
USERS = {
    "alice": {"password": "RiverDuck42!", "active": True},
    "bob": {"password": "pond-pass", "active": True},
    "paused": {"password": "Paused123!", "active": False},
    "space": {"password": " two spaces ", "active": True},
}
