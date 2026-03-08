import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from backend.security import get_current_user
from backend.services.woocommerce import WooCommerceClient
from backend.state import app_state

router = APIRouter(tags=["proxy"], dependencies=[Depends(get_current_user)])


def get_client() -> WooCommerceClient:
    """Return an authenticated WooCommerceClient or raise 401."""
    if not app_state.is_connected or not app_state.credentials:
        raise HTTPException(
            status_code=401, detail="Not connected. Please connect first."
        )
    return WooCommerceClient(app_state.credentials)


async def _proxy(
    namespace: str, path: str, request: Request, *, forward_pagination: bool = False
) -> JSONResponse:
    """Shared proxy logic for all namespaces."""
    client = get_client()
    params = dict(request.query_params)

    body = None
    if request.method in ("POST", "PUT"):
        try:
            body = await request.json()
        except Exception:
            body = None

    try:
        response = await client.request(
            request.method, f"{namespace}/{path}", params=params, json_data=body
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    # Try to parse JSON; fall back to plain text on decode errors
    try:
        content = response.json()
    except Exception:
        content = {"raw": response.text}

    headers: dict[str, str] = {}
    if forward_pagination:
        for header in ("X-WP-Total", "X-WP-TotalPages"):
            if header in response.headers:
                headers[header] = response.headers[header]

    return JSONResponse(
        content=content, status_code=response.status_code, headers=headers
    )


# ---------------------------------------------------------------------------
# WooCommerce proxy  — forwards pagination headers
# ---------------------------------------------------------------------------

@router.api_route("/wc/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def wc_proxy(path: str, request: Request) -> JSONResponse:
    """Proxy requests to WooCommerce REST API (wc/v3/...)."""
    return await _proxy("wc", path, request, forward_pagination=True)


# ---------------------------------------------------------------------------
# WordPress proxy
# ---------------------------------------------------------------------------

@router.api_route("/wp/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def wp_proxy(path: str, request: Request) -> JSONResponse:
    """Proxy requests to WordPress REST API (wp/v2/...)."""
    return await _proxy("wp", path, request)


# ---------------------------------------------------------------------------
# Honor Labs custom endpoints proxy
# ---------------------------------------------------------------------------

@router.api_route(
    "/honor-labs/{path:path}", methods=["GET", "POST", "PUT", "DELETE"]
)
async def honor_labs_proxy(path: str, request: Request) -> JSONResponse:
    """Proxy requests to Honor Labs custom REST API."""
    return await _proxy("honor-labs", path, request)
