"""JWT authentication and user management."""

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()

JWT_ALGORITHM = "HS256"


def _jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "honor-labs-dev-secret-change-in-prod")


def _jwt_expiry_hours() -> int:
    return int(os.environ.get("JWT_EXPIRY_HOURS", "72"))


def get_users() -> list[dict]:
    """Load users from APP_USERS env var.

    Format: username:password,username:password,...
    Example: josh:mypass123,brian.peck:otherpass
    """
    raw = os.environ.get("APP_USERS", "").strip()
    if not raw:
        return []
    users = []
    for entry in raw.split(","):
        entry = entry.strip()
        if ":" not in entry:
            continue
        username, password = entry.split(":", 1)
        users.append({"username": username.strip(), "password": password.strip()})
    return users


def verify_password(plain: str, stored: str) -> bool:
    return plain == stored


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=_jwt_expiry_hours()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """FastAPI dependency — validates JWT and returns username."""
    try:
        payload = decode_token(credentials.credentials)
        username: str | None = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        users = get_users()
        if not any(u.get("username") == username for u in users):
            raise HTTPException(status_code=401, detail="User no longer exists")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
