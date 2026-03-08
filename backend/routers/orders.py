"""Enhanced order management with customer type enrichment and actions."""

from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.security import get_current_user
from backend.services.woocommerce import WooCommerceClient
from backend.state import app_state

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    dependencies=[Depends(get_current_user)],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DOCTOR_GROUP = "599"
PATIENT_GROUP = "695"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def get_client() -> WooCommerceClient:
    """Return an authenticated WooCommerceClient or raise 401."""
    if not app_state.is_connected or not app_state.credentials:
        raise HTTPException(
            status_code=401, detail="Not connected. Please connect first."
        )
    return WooCommerceClient(app_state.credentials)


def extract_meta(meta_data: list[dict], key: str, default: str = "") -> str:
    """Extract a value from WooCommerce meta_data array."""
    for meta in meta_data:
        if meta.get("key") == key:
            return str(meta.get("value", default))
    return default


async def resolve_customer_type(
    client: WooCommerceClient,
    customer_id: int,
    cache: dict[int, str],
) -> str:
    """Return 'doctor', 'patient', or 'unknown' for a customer id.

    Uses and populates ``cache`` to avoid redundant API calls.
    """
    if customer_id == 0:
        return "guest"
    if customer_id in cache:
        return cache[customer_id]
    try:
        resp = await client.get(f"wc/v3/customers/{customer_id}")
        if resp.status_code == 200:
            meta = resp.json().get("meta_data", [])
            group = extract_meta(meta, "b2bking_customergroup")
            if group == DOCTOR_GROUP:
                ctype = "doctor"
            elif group == PATIENT_GROUP:
                ctype = "patient"
            else:
                ctype = "unknown"
        else:
            ctype = "unknown"
    except httpx.RequestError:
        ctype = "unknown"
    cache[customer_id] = ctype
    return ctype


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class StatusUpdate(BaseModel):
    status: str


class OrderNoteCreate(BaseModel):
    note: str
    customer_note: bool = False


class LogoRequestBody(BaseModel):
    message: str | None = None


# ---------------------------------------------------------------------------
# Default logo request template
# ---------------------------------------------------------------------------

LOGO_REQUEST_TEMPLATE = """Hi {customer_name},

Thank you for your order (#{order_number})!

We're preparing your custom supplement bottles and need your logo to proceed. Could you please reply to this email with:

1. Your logo in high resolution (PNG or SVG preferred, minimum 300 DPI)
2. Any specific color requirements or brand guidelines

If you have any questions about the logo requirements, please don't hesitate to reach out.

Best regards,
The Honor Labs Team"""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("")
async def list_orders(request: Request):
    """List orders enriched with customer_type field.

    Forwards all query parameters and pagination headers from WC.
    """
    client = get_client()
    params = dict(request.query_params)

    try:
        resp = await client.get("wc/v3/orders", params=params)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    orders = resp.json()

    # Enrich orders with customer type — use a shared cache to avoid
    # re-fetching the same customer for multiple orders.
    customer_cache: dict[int, str] = {}
    for order in orders:
        cid = order.get("customer_id", 0)
        order["customer_type"] = await resolve_customer_type(
            client, cid, customer_cache
        )

    headers: dict[str, str] = {}
    for header in ("X-WP-Total", "X-WP-TotalPages"):
        if header in resp.headers:
            headers[header] = resp.headers[header]

    return JSONResponse(content=orders, headers=headers)


@router.get("/{order_id}")
async def get_order(order_id: int):
    """Get a single order enriched with customer_type."""
    client = get_client()

    try:
        resp = await client.get(f"wc/v3/orders/{order_id}")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Order not found or WC error: {resp.text[:300]}",
        )

    order = resp.json()
    cache: dict[int, str] = {}
    cid = order.get("customer_id", 0)
    order["customer_type"] = await resolve_customer_type(client, cid, cache)
    return order


@router.put("/{order_id}/status")
async def update_order_status(order_id: int, body: StatusUpdate):
    """Update an order's status."""
    client = get_client()

    try:
        resp = await client.put(
            f"wc/v3/orders/{order_id}",
            json_data={"status": body.status},
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    order = resp.json()
    cache: dict[int, str] = {}
    cid = order.get("customer_id", 0)
    order["customer_type"] = await resolve_customer_type(client, cid, cache)
    return order


@router.post("/{order_id}/notes")
async def add_order_note(order_id: int, body: OrderNoteCreate):
    """Add a note to an order.

    When ``customer_note`` is ``true``, WooCommerce sends an email to the
    customer with the note content.
    """
    client = get_client()

    payload: dict[str, Any] = {
        "note": body.note,
        "customer_note": body.customer_note,
    }

    try:
        resp = await client.post(
            f"wc/v3/orders/{order_id}/notes",
            json_data=payload,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    return resp.json()


@router.post("/{order_id}/request-logo")
async def request_logo(order_id: int, body: LogoRequestBody | None = None):
    """Send a logo request email to the customer via an order note.

    Uses a default template if no custom message is provided.  The note is
    sent as a ``customer_note`` so WooCommerce will email the customer.
    """
    client = get_client()

    # Fetch the order to get customer name and order number
    try:
        order_resp = await client.get(f"wc/v3/orders/{order_id}")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if order_resp.status_code != 200:
        raise HTTPException(
            status_code=order_resp.status_code,
            detail=f"Order not found or WC error: {order_resp.text[:300]}",
        )

    order = order_resp.json()
    billing = order.get("billing", {})
    customer_name = (
        f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip()
        or "Valued Customer"
    )
    order_number = order.get("number", order.get("id", ""))

    # Determine message text
    if body and body.message:
        note_text = body.message
    else:
        note_text = LOGO_REQUEST_TEMPLATE.format(
            customer_name=customer_name,
            order_number=order_number,
        )

    # Post as a customer note (triggers email)
    payload: dict[str, Any] = {
        "note": note_text,
        "customer_note": True,
    }

    try:
        resp = await client.post(
            f"wc/v3/orders/{order_id}/notes",
            json_data=payload,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    return {
        "success": True,
        "message": "Logo request email sent to customer.",
        "note": resp.json(),
    }
