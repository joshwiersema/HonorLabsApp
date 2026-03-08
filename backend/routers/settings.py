"""WooCommerce settings management endpoints."""

from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.security import get_current_user
from backend.services.woocommerce import WooCommerceClient
from backend.state import app_state

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_user)],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SETTINGS_GROUPS = [
    "general",
    "products",
    "tax",
    "shipping",
    "checkout",  # WC may call this "advanced" in newer versions
    "email",
]

STORE_SETTING_IDS = [
    "woocommerce_store_address",
    "woocommerce_store_address_2",
    "woocommerce_store_city",
    "woocommerce_store_postcode",
    "woocommerce_default_country",
    "woocommerce_currency",
    "woocommerce_currency_pos",
    "woocommerce_price_thousand_sep",
    "woocommerce_price_decimal_sep",
    "woocommerce_price_num_decimals",
]


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


def normalize_setting(setting: dict) -> dict:
    """Return a consistently shaped setting dict."""
    return {
        "id": setting.get("id", ""),
        "label": setting.get("label", ""),
        "description": setting.get("description", ""),
        "value": setting.get("value", ""),
        "type": setting.get("type", "text"),
        "options": setting.get("options", {}),
        "default": setting.get("default", ""),
        "tip": setting.get("tip", ""),
    }


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class SettingUpdate(BaseModel):
    value: Any


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/store")
async def get_store_info():
    """Get key store settings (address, currency, etc.)."""
    client = get_client()

    try:
        resp = await client.get("wc/v3/settings/general")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    all_settings = resp.json()

    # Filter to just the store-relevant settings
    store_settings: dict[str, Any] = {}
    for setting in all_settings:
        sid = setting.get("id", "")
        if sid in STORE_SETTING_IDS:
            store_settings[sid] = {
                "id": sid,
                "label": setting.get("label", ""),
                "value": setting.get("value", ""),
            }

    return {
        "store_address": store_settings.get("woocommerce_store_address", {}).get("value", ""),
        "store_address_2": store_settings.get("woocommerce_store_address_2", {}).get("value", ""),
        "store_city": store_settings.get("woocommerce_store_city", {}).get("value", ""),
        "store_postcode": store_settings.get("woocommerce_store_postcode", {}).get("value", ""),
        "default_country": store_settings.get("woocommerce_default_country", {}).get("value", ""),
        "currency": store_settings.get("woocommerce_currency", {}).get("value", ""),
        "currency_position": store_settings.get("woocommerce_currency_pos", {}).get("value", ""),
        "thousand_separator": store_settings.get("woocommerce_price_thousand_sep", {}).get("value", ""),
        "decimal_separator": store_settings.get("woocommerce_price_decimal_sep", {}).get("value", ""),
        "num_decimals": store_settings.get("woocommerce_price_num_decimals", {}).get("value", ""),
        "raw_settings": store_settings,
    }


@router.get("/woocommerce")
async def get_all_settings():
    """Get all important WC settings grouped by category.

    Fetches settings from each group and returns them as a structured
    object keyed by group name.
    """
    client = get_client()
    result: dict[str, list[dict]] = {}

    for group in SETTINGS_GROUPS:
        try:
            resp = await client.get(f"wc/v3/settings/{group}")
        except httpx.RequestError:
            # If a group fails (e.g. doesn't exist), skip it
            result[group] = []
            continue

        if resp.status_code == 200:
            settings_list = resp.json()
            result[group] = [normalize_setting(s) for s in settings_list]
        else:
            # Some groups may not exist or may have different names in
            # different WC versions; return an empty list rather than failing.
            result[group] = []

    return result


@router.put("/woocommerce/{group_id}/{setting_id}")
async def update_setting(group_id: str, setting_id: str, body: SettingUpdate):
    """Update a single WooCommerce setting."""
    client = get_client()

    try:
        resp = await client.put(
            f"wc/v3/settings/{group_id}/{setting_id}",
            json_data={"value": body.value},
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

    setting = resp.json()
    return normalize_setting(setting)


@router.get("/email")
async def get_email_settings():
    """Get email-specific settings from WC.

    Returns settings from the ``email`` settings group, focused on
    the key configuration values (from name, from address, header image,
    footer text, colors).
    """
    client = get_client()

    try:
        resp = await client.get("wc/v3/settings/email")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"WooCommerce error: {resp.text[:300]}",
        )

    all_email_settings = resp.json()

    # Key email setting IDs we care about
    key_ids = {
        "woocommerce_email_from_name",
        "woocommerce_email_from_address",
        "woocommerce_email_header_image",
        "woocommerce_email_footer_text",
        "woocommerce_email_base_color",
        "woocommerce_email_background_color",
        "woocommerce_email_body_background_color",
        "woocommerce_email_text_color",
    }

    key_settings: dict[str, dict] = {}
    all_normalized: list[dict] = []
    for s in all_email_settings:
        normalized = normalize_setting(s)
        all_normalized.append(normalized)
        if s.get("id", "") in key_ids:
            key_settings[s["id"]] = normalized

    return {
        "key_settings": key_settings,
        "all_settings": all_normalized,
    }
