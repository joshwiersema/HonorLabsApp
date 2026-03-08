"""User authentication endpoints (JWT-based)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.security import (
    create_token,
    get_current_user,
    get_users,
    verify_password,
)
from backend.state import app_state

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


class MeResponse(BaseModel):
    username: str
    store_connected: bool
    store_url: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """Authenticate with username + password, return JWT."""
    users = get_users()
    for user in users:
        if user.get("username") == body.username:
            if verify_password(body.password, user.get("password_hash", "")):
                token = create_token(body.username)
                return LoginResponse(token=token, username=body.username)
            break
    raise HTTPException(status_code=401, detail="Invalid username or password")


@router.get("/me", response_model=MeResponse)
async def me(username: str = Depends(get_current_user)) -> MeResponse:
    """Return current user info + WooCommerce connection status."""
    creds = app_state.credentials
    return MeResponse(
        username=username,
        store_connected=creds is not None,
        store_url=creds.site_url if creds else None,
    )
