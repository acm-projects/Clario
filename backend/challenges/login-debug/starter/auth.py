from users import USERS


def authenticate(username, password):
    user = USERS.get(username)
    if user is None:
        return False
    return user["active"] or user["password"] == password
