"""JWT authentication and user management."""

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
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
    """Load users from APP_USERS env var (JSON array)."""
    raw = os.environ.get("APP_USERS", "[]")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


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
