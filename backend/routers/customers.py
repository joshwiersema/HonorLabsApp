"""Doctor & Patient customer endpoints.

Doctors are sourced from the Honor Labs REST API (honor-labs/v1) which
queries WordPress user meta directly — far more reliable than trying to
extract custom plugin meta from the WooCommerce customer API.

Patient data still uses the WooCommerce customer API since B2BKing
group membership is native WC meta.
"""

import asyncio
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.security import get_current_user
from backend.services.woocommerce import WooCommerceClient
from backend.state import app_state

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
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
    if not app_state.is_connected or not app_state.credentials:
        raise HTTPException(
            status_code=401, detail="Not connected. Please connect first."
        )
    return WooCommerceClient(app_state.credentials)


def extract_meta(meta_data: list[dict], key: str, default: str = "") -> str:
    """Extract a value from WooCommerce meta_data array by exact key."""
    for meta in meta_data:
        if meta.get("key") == key:
            return str(meta.get("value", default))
    return default


def get_customer_group(meta_data: list[dict]) -> str:
    return extract_meta(meta_data, "b2bking_customergroup", "")


# ---------------------------------------------------------------------------
# Honor Labs REST API helpers
# ---------------------------------------------------------------------------


async def fetch_all_applications(
    client: WooCommerceClient,
    status: str = "",
) -> list[dict]:
    """Paginate through all doctor applications from the honor-labs REST API."""
    applications: list[dict] = []
    page = 1
    while True:
        params: dict[str, Any] = {"per_page": 100, "page": page}
        if status:
            params["status"] = status
        try:
            resp = await client.request(
                "GET",
                "honor-labs/v1/doctor-applications",
                params=params,
                query_auth=True,
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502, detail=f"Upstream request failed: {exc}"
            ) from exc
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Failed to fetch doctor applications: {resp.text[:300]}",
            )
        batch = resp.json()
        if not batch:
            break
        applications.extend(batch)
        total_pages = int(resp.headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            break
        page += 1
    return applications


def transform_application(app: dict) -> dict:
    """Transform a WordPress doctor-application into the Doctor type the frontend expects."""
    status_raw = app.get("status", "pending")
    if status_raw == "approved":
        doctor_status = "approved"
    elif status_raw == "rejected":
        doctor_status = "rejected"
    else:
        doctor_status = "pending"

    return {
        "id": app.get("id") or app.get("user_id"),
        "email": app.get("email", ""),
        "first_name": app.get("first_name", ""),
        "last_name": app.get("last_name", ""),
        "username": app.get("email", ""),
        "date_created": app.get("date_applied", ""),
        "avatar_url": "",
        "billing": {},
        "shipping": {},
        "npi_number": app.get("npi_number", ""),
        "practice_name": app.get("practice_name", ""),
        "specialty": app.get("specialty", ""),
        "referral_code": app.get("referral_code", ""),
        "phone": app.get("phone", ""),
        "practice_state": app.get("practice_state", ""),
        "license_number": app.get("license_number", ""),
        "application_date": app.get("date_applied", ""),
        "doctor_status": doctor_status,
        "customer_group": DOCTOR_GROUP,
        "orders_count": 0,
        "total_spent": "0",
    }


def matches_search(record: dict, search: str) -> bool:
    if not search:
        return True
    q = search.lower()
    fields = [
        record.get("first_name", ""),
        record.get("last_name", ""),
        record.get("email", ""),
    ]
    return any(q in f.lower() for f in fields)


# ---------------------------------------------------------------------------
# WooCommerce helpers (used for patients and order enrichment)
# ---------------------------------------------------------------------------


async def fetch_all_customers(
    client: WooCommerceClient,
    extra_params: dict | None = None,
) -> list[dict]:
    """Paginate through all WC customers."""
    customers: list[dict] = []
    page = 1
    while True:
        params: dict[str, Any] = {"per_page": 100, "page": page}
        if extra_params:
            params.update(extra_params)
        try:
            resp = await client.get("wc/v3/customers", params=params)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502, detail=f"Upstream request failed: {exc}"
            ) from exc
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"WooCommerce error: {resp.text[:300]}",
            )
        batch = resp.json()
        if not batch:
            break
        customers.extend(batch)
        total_pages = int(resp.headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            break
        page += 1
    return customers


async def fetch_customer_orders(
    client: WooCommerceClient, customer_id: int
) -> list[dict]:
    """Fetch all orders for a customer."""
    orders: list[dict] = []
    page = 1
    while True:
        params: dict[str, Any] = {
            "customer": customer_id,
            "per_page": 100,
            "page": page,
        }
        try:
            resp = await client.get("wc/v3/orders", params=params)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502, detail=f"Upstream request failed: {exc}"
            ) from exc
        if resp.status_code != 200:
            break
        batch = resp.json()
        if not batch:
            break
        orders.extend(batch)
        total_pages = int(resp.headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            break
        page += 1
    return orders


def build_patient_summary(customer: dict, doctor_name: str = "") -> dict:
    """Transform a raw WC customer into a structured patient dict."""
    meta = customer.get("meta_data", [])
    return {
        "id": customer.get("id"),
        "email": customer.get("email", ""),
        "first_name": customer.get("first_name", ""),
        "last_name": customer.get("last_name", ""),
        "username": customer.get("username", ""),
        "date_created": customer.get("date_created", ""),
        "avatar_url": customer.get("avatar_url", ""),
        "billing": customer.get("billing", {}),
        "shipping": customer.get("shipping", {}),
        "linked_doctor_id": extract_meta(meta, "hl_linked_doctor_id"),
        "referral_code_used": extract_meta(meta, "hl_joined_via_code"),
        "patient_phone": extract_meta(meta, "hl_patient_phone"),
        "patient_verified": extract_meta(meta, "hl_patient_verified"),
        "registration_date": extract_meta(meta, "hl_patient_registration_date"),
        "linked_doctor_name": doctor_name,
        "customer_group": PATIENT_GROUP,
        "orders_count": int(customer.get("orders_count", 0)),
        "total_spent": customer.get("total_spent", "0.00"),
    }


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class CustomerStats(BaseModel):
    doctor_count: int
    patient_count: int
    pending_doctors: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/doctors")
async def list_doctors(search: str = Query("", description="Filter by name or email")):
    """List all doctors from the Honor Labs doctor-applications REST API.

    Fetches applications from honor-labs/v1/doctor-applications which
    queries WordPress user meta directly, then enriches approved doctors
    with order stats from the WooCommerce API.
    """
    client = get_client()

    # Fetch all doctor applications from the honor-labs REST API
    applications = await fetch_all_applications(client)

    # Filter by search
    if search:
        applications = [a for a in applications if matches_search(a, search)]

    # Transform to Doctor type
    doctors = [transform_application(a) for a in applications]

    # Enrich approved doctors with order data in parallel
    async def _enrich_orders(doctor: dict) -> dict:
        if doctor["doctor_status"] == "approved":
            orders = await fetch_customer_orders(client, doctor["id"])
            doctor["orders_count"] = len(orders)
            doctor["total_spent"] = str(
                sum(float(o.get("total", 0)) for o in orders)
            )
        return doctor

    doctors = list(await asyncio.gather(*[_enrich_orders(d) for d in doctors]))
    return {"doctors": doctors, "total": len(doctors)}


@router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: int):
    """Get a single doctor with linked patients and orders."""
    client = get_client()

    # Fetch the doctor application from honor-labs API
    try:
        resp = await client.request(
            "GET",
            "honor-labs/v1/doctor-applications",
            params={"per_page": 100},
            query_auth=True,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Failed to fetch doctor data: {resp.text[:300]}",
        )

    # Find this doctor in the applications list
    app_data = None
    for app in resp.json():
        if app.get("id") == doctor_id or app.get("user_id") == doctor_id:
            app_data = app
            break

    if not app_data:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    doctor = transform_application(app_data)

    # Fetch orders for this doctor
    orders = await fetch_customer_orders(client, doctor_id)
    doctor["orders_count"] = len(orders)
    doctor["total_spent"] = str(
        sum(float(o.get("total", 0)) for o in orders)
    )

    # Fetch linked patients via WC API
    all_customers = await fetch_all_customers(client)
    patients_raw = [
        c for c in all_customers
        if get_customer_group(c.get("meta_data", [])) == PATIENT_GROUP
        and extract_meta(c.get("meta_data", []), "hl_linked_doctor_id") == str(doctor_id)
    ]
    doctor_name = f"{doctor.get('first_name', '')} {doctor.get('last_name', '')}".strip()
    patients = [build_patient_summary(p, doctor_name) for p in patients_raw]

    order_summaries = [
        {
            "id": o.get("id"),
            "number": o.get("number"),
            "status": o.get("status"),
            "total": o.get("total"),
            "date_created": o.get("date_created"),
            "line_items_count": len(o.get("line_items", [])),
        }
        for o in orders
    ]

    return {
        "doctor": doctor,
        "patients": patients,
        "orders": order_summaries,
    }


@router.get("/patients")
async def list_patients(search: str = Query("", description="Filter by name or email")):
    """List all patients (B2BKing group) with linked doctor names."""
    client = get_client()
    all_customers = await fetch_all_customers(client)

    doctor_lookup: dict[str, str] = {}
    patients_raw: list[dict] = []
    for c in all_customers:
        meta = c.get("meta_data", [])
        group = get_customer_group(meta)
        if group == DOCTOR_GROUP:
            doctor_lookup[str(c["id"])] = (
                f"{c.get('first_name', '')} {c.get('last_name', '')}".strip()
            )
        elif group == PATIENT_GROUP and matches_search(c, search):
            patients_raw.append(c)

    patients = []
    for p in patients_raw:
        linked_id = extract_meta(p.get("meta_data", []), "hl_linked_doctor_id")
        doctor_name = doctor_lookup.get(linked_id, "")
        patients.append(build_patient_summary(p, doctor_name))
    return {"patients": patients, "total": len(patients)}


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: int):
    """Get a single patient with linked doctor info and orders."""
    client = get_client()

    try:
        resp = await client.get(f"wc/v3/customers/{patient_id}")
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc
    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Customer not found or WC error: {resp.text[:300]}",
        )
    customer = resp.json()

    if get_customer_group(customer.get("meta_data", [])) != PATIENT_GROUP:
        raise HTTPException(status_code=404, detail="Customer is not a patient.")

    # Resolve linked doctor
    linked_doctor_id = extract_meta(
        customer.get("meta_data", []), "hl_linked_doctor_id"
    )
    doctor_name = ""
    doctor_info: dict[str, Any] | None = None
    if linked_doctor_id:
        try:
            doc_resp = await client.get(f"wc/v3/customers/{linked_doctor_id}")
            if doc_resp.status_code == 200:
                doc = doc_resp.json()
                doc_meta = doc.get("meta_data", [])
                doctor_name = f"{doc.get('first_name', '')} {doc.get('last_name', '')}".strip()
                doctor_info = {
                    "id": doc.get("id"),
                    "name": doctor_name,
                    "email": doc.get("email", ""),
                    "practice_name": extract_meta(doc_meta, "hl_practice_name"),
                }
        except httpx.RequestError:
            pass

    patient = build_patient_summary(customer, doctor_name)
    patient["linked_doctor"] = doctor_info

    orders = await fetch_customer_orders(client, patient_id)
    patient["orders"] = [
        {
            "id": o.get("id"),
            "number": o.get("number"),
            "status": o.get("status"),
            "total": o.get("total"),
            "date_created": o.get("date_created"),
            "line_items_count": len(o.get("line_items", [])),
        }
        for o in orders
    ]
    return {"patient": patient, "orders": patient["orders"]}


@router.post("/doctors/{doctor_id}/approve")
async def approve_doctor(doctor_id: int):
    """Approve a pending doctor via the WordPress doctor-onboarding plugin.

    Calls the honor-labs REST endpoint which runs hl_approve_doctor(),
    handling ALL facets of approval:
      - B2BKing meta (account_approved, account_approval, b2buser, group)
      - Referral code generation
      - B2BKing action hooks & transient cache busting
      - Approval email via the plugin's email watcher

    Falls back to direct WC meta update if the WP endpoint is unavailable.
    """
    client = get_client()

    # Try the WordPress plugin endpoint first (comprehensive approval)
    try:
        resp = await client.request(
            "POST",
            f"honor-labs/v1/doctor-applications/{doctor_id}/approve",
            query_auth=True,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code == 200:
        data = resp.json()
        return {
            "status": "approved",
            "doctor_id": doctor_id,
            "referral_code": data.get("referral_code", ""),
        }

    # Fallback: set meta directly via WC API if the WP endpoint failed
    payload = {
        "meta_data": [
            {"key": "b2bking_account_approved", "value": "yes"},
            {"key": "b2bking_account_approval", "value": "approved"},
            {"key": "b2bking_b2buser", "value": "yes"},
            {"key": "b2bking_customergroup", "value": DOCTOR_GROUP},
        ]
    }
    try:
        resp = await client.put(
            f"wc/v3/customers/{doctor_id}", json_data=payload
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Failed to approve doctor: {resp.text[:300]}",
        )

    return {"status": "approved", "doctor_id": doctor_id}


@router.post("/doctors/{doctor_id}/reject")
async def reject_doctor(doctor_id: int):
    """Reject a pending doctor via the WordPress doctor-onboarding plugin.

    Calls the honor-labs REST endpoint which handles rejection email
    and meta updates. Falls back to direct WC meta if unavailable.
    """
    client = get_client()

    # Try the WordPress plugin endpoint first
    try:
        resp = await client.request(
            "POST",
            f"honor-labs/v1/doctor-applications/{doctor_id}/reject",
            query_auth=True,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code == 200:
        return {"status": "rejected", "doctor_id": doctor_id}

    # Fallback: set meta directly via WC API
    payload = {
        "meta_data": [
            {"key": "b2bking_account_approved", "value": "no"},
            {"key": "b2bking_account_approval", "value": "rejected"},
        ]
    }
    try:
        resp = await client.put(
            f"wc/v3/customers/{doctor_id}", json_data=payload
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Failed to reject doctor: {resp.text[:300]}",
        )

    return {"status": "rejected", "doctor_id": doctor_id}


@router.get("/stats", response_model=CustomerStats)
async def customer_stats():
    """Return aggregate counts: doctors, patients, pending doctors.

    Doctor counts come from the honor-labs REST API (reliable).
    Patient counts come from the WooCommerce customer API.
    """
    client = get_client()

    # Fetch doctor applications and patient customers in parallel
    apps_task = fetch_all_applications(client)
    customers_task = fetch_all_customers(client)
    applications, all_customers = await asyncio.gather(apps_task, customers_task)

    # Count doctors by status
    doctor_count = len(applications)
    pending_doctors = sum(
        1 for a in applications
        if a.get("status", "pending") in ("pending", "", None)
    )

    # Count patients from WC customers
    patient_count = sum(
        1 for c in all_customers
        if get_customer_group(c.get("meta_data", [])) == PATIENT_GROUP
    )

    return CustomerStats(
        doctor_count=doctor_count,
        patient_count=patient_count,
        pending_doctors=pending_doctors,
    )
