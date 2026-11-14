import unittest
from auth import authenticate
from main import login


class AuthTests(unittest.TestCase):
    def check_both(self, username, password, expected):
        self.assertIs(login(username, password), expected)
        self.assertIs(authenticate(username, password), expected)

    def test_valid_credentials(self):
        self.check_both("alice", "RiverDuck42!", True)
        self.check_both("bob", "pond-pass", True)

    def test_invalid_password(self):
        self.check_both("alice", "wrong", False)

    def test_unknown_user(self):
        self.check_both("nobody", "RiverDuck42!", False)

    def test_username_normalization(self):
        self.check_both("  ALIce  ", "RiverDuck42!", True)

    def test_password_case(self):
        self.check_both("alice", "riverduck42!", False)

    def test_password_whitespace(self):
        self.check_both("alice", " RiverDuck42! ", False)
        self.check_both("space", " two spaces ", True)
        self.check_both("space", "two spaces", False)

    def test_inactive_user(self):
        self.check_both("paused", "Paused123!", False)

    def test_invalid_inputs(self):
        for username, password in [(None, None), ([], "x"), ("alice", 42), ("", ""), ("alice", "")]:
            self.check_both(username, password, False)
