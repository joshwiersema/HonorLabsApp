#!/usr/bin/env python3
"""Generate a bcrypt password hash for use in APP_USERS env var.

Usage:
    python scripts/create_user.py <username> <password>

Output: JSON object ready to paste into APP_USERS array.
"""

import json
import sys

import bcrypt


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python scripts/create_user.py <username> <password>")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user_obj = {"username": username, "password_hash": hashed}
    print(json.dumps(user_obj))
    print()
    print("Add this to your APP_USERS env var (JSON array).")
    print(f'Example: APP_USERS=\'[{json.dumps(user_obj)}]\'')


if __name__ == "__main__":
    main()
