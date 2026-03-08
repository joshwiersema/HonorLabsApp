"""Product endpoints with B2BKing wholesale price enrichment and CRUD."""

from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.security import get_current_user
from backend.services.woocommerce import WooCommerceClient
from backend.state import app_state

router = APIRouter(
    prefix="/products",
    tags=["products"],
    dependencies=[Depends(get_current_user)],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

WHOLESALE_REGULAR_KEY = "b2bking_regular_product_price_group_599"
WHOLESALE_SALE_KEY = "b2bking_sale_product_price_group_599"


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


def enrich_product(product: dict) -> dict:
    """Add wholesale price fields extracted from meta_data."""
    meta = product.get("meta_data", [])
    product["wholesale_regular_price"] = extract_meta(meta, WHOLESALE_REGULAR_KEY)
    product["wholesale_sale_price"] = extract_meta(meta, WHOLESALE_SALE_KEY)
    return product


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    short_description: str | None = None
    regular_price: str | None = None
    sale_price: str | None = None
    sku: str | None = None
    stock_quantity: int | None = None
    stock_status: str | None = None  # instock, outofstock, onbackorder
    manage_stock: bool | None = None
    wholesale_regular_price: str | None = None
    wholesale_sale_price: str | None = None
    categories: list[dict] | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("")
async def list_products(request: Request):
    """List products from WC with wholesale price enrichment.

    Forwards all query parameters (page, per_page, search, category, etc.)
    and returns pagination headers.
    """
    client = get_client()
    params = dict(request.query_params)

    try:
        resp = await client.get("wc/v3/products", params=params)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    products = resp.json()
    enriched = [enrich_product(p) for p in products]

    headers: dict[str, str] = {}
    for header in ("X-WP-Total", "X-WP-TotalPages"):
        if header in resp.headers:
            headers[header] = resp.headers[header]

    return JSONResponse(content=enriched, headers=headers)


@router.get("/{product_id}")
async def get_product(product_id: int):
    """Get a single product with wholesale prices."""
    client = get_client()

    try:
        resp = await client.get(f"wc/v3/products/{product_id}")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Product not found or WC error: {resp.text[:300]}",
        )

    product = resp.json()
    return enrich_product(product)


@router.put("/{product_id}")
async def update_product(product_id: int, body: ProductUpdate):
    """Update a product including wholesale prices.

    Any fields set to ``None`` are omitted from the WC API payload so only
    the provided fields are updated.
    """
    client = get_client()

    # Build the update payload — only include fields that were provided
    payload: dict[str, Any] = {}

    simple_fields = [
        "name",
        "description",
        "short_description",
        "regular_price",
        "sale_price",
        "sku",
        "stock_quantity",
        "stock_status",
        "manage_stock",
    ]
    for field in simple_fields:
        value = getattr(body, field)
        if value is not None:
            payload[field] = value

    if body.categories is not None:
        payload["categories"] = body.categories

    # Handle wholesale prices via meta_data
    meta_data: list[dict[str, Any]] = []
    if body.wholesale_regular_price is not None:
        meta_data.append(
            {"key": WHOLESALE_REGULAR_KEY, "value": body.wholesale_regular_price}
        )
    if body.wholesale_sale_price is not None:
        meta_data.append(
            {"key": WHOLESALE_SALE_KEY, "value": body.wholesale_sale_price}
        )
    if meta_data:
        payload["meta_data"] = meta_data

    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        resp = await client.put(f"wc/v3/products/{product_id}", json_data=payload)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    product = resp.json()
    return enrich_product(product)
