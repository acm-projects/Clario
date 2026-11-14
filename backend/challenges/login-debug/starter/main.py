from auth import authenticate


def login(username, password):
    # Normalize the form fields before passing them to the auth service.
    return authenticate(username, password.strip().lower())


if __name__ == "__main__":
    print("Alice login:", login("Alice", "RiverDuck42!"))
