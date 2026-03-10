"""Doctor & Patient customer endpoints with B2BKing group filtering.

Uses the REAL meta keys from the Honor Labs plugins:
  Doctor onboarding: hl_npi_number, hl_practice_name, hl_specialty,
                     hl_referral_code, hl_phone, hl_practice_state,
                     hl_license_number, hl_application_date
  Patient portal:    hl_linked_doctor_id, hl_joined_via_code,
                     hl_patient_phone, hl_patient_verified,
                     hl_patient_registration_date
  B2BKing:           b2bking_customergroup, b2bking_account_approved
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


def is_doctor_applicant(meta_data: list[dict]) -> bool:
    """Check if a customer registered through the doctor onboarding form.

    New applicants have hl_application_date set but may NOT yet be in the
    B2BKing doctor group (group assignment only happens upon approval).
    """
    return bool(extract_meta(meta_data, "hl_application_date"))


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
    """Fetch all completed/processing orders for a customer."""
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


def build_doctor_summary(customer: dict, orders: list[dict] | None = None) -> dict:
    """Transform a raw WC customer into a structured doctor dict."""
    meta = customer.get("meta_data", [])
    # B2BKing uses 'b2bking_account_approved' with values 'yes' / 'no'
    b2b_approved = extract_meta(meta, "b2bking_account_approved", "")
    if b2b_approved == "yes":
        doctor_status = "approved"
    elif b2b_approved == "no":
        doctor_status = "pending"
    else:
        # No B2BKing approval meta at all — treat as pending
        doctor_status = "pending"

    result: dict[str, Any] = {
        "id": customer.get("id"),
        "email": customer.get("email", ""),
        "first_name": customer.get("first_name", ""),
        "last_name": customer.get("last_name", ""),
        "username": customer.get("username", ""),
        "date_created": customer.get("date_created", ""),
        "avatar_url": customer.get("avatar_url", ""),
        "billing": customer.get("billing", {}),
        "shipping": customer.get("shipping", {}),
        # Doctor-specific fields (hl_ prefix from doctor-onboarding plugin)
        "npi_number": extract_meta(meta, "hl_npi_number"),
        "practice_name": extract_meta(meta, "hl_practice_name"),
        "specialty": extract_meta(meta, "hl_specialty"),
        "referral_code": extract_meta(meta, "hl_referral_code"),
        "phone": extract_meta(meta, "hl_phone"),
        "practice_state": extract_meta(meta, "hl_practice_state"),
        "license_number": extract_meta(meta, "hl_license_number"),
        "application_date": extract_meta(meta, "hl_application_date"),
        "doctor_status": doctor_status,
        "customer_group": DOCTOR_GROUP,
    }
    if orders is not None:
        result["orders_count"] = len(orders)
        result["total_spent"] = str(
            sum(float(o.get("total", 0)) for o in orders)
        )
    else:
        result["orders_count"] = 0
        result["total_spent"] = "0"
    return result


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
        # Patient-specific fields (hl_ prefix from patient-portal plugin)
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


def matches_search(customer: dict, search: str) -> bool:
    if not search:
        return True
    q = search.lower()
    fields = [
        customer.get("first_name", ""),
        customer.get("last_name", ""),
        customer.get("email", ""),
        customer.get("username", ""),
    ]
    return any(q in f.lower() for f in fields)


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
    """List all doctors (B2BKing group OR doctor onboarding applicants) with order stats."""
    client = get_client()
    all_customers = await fetch_all_customers(client)
    seen_ids: set[int] = set()
    doctors_raw: list[dict] = []
    for c in all_customers:
        meta = c.get("meta_data", [])
        # Include if in doctor group OR if they applied through doctor onboarding
        is_doctor = (
            get_customer_group(meta) == DOCTOR_GROUP
            or is_doctor_applicant(meta)
        )
        if is_doctor and matches_search(c, search):
            cid = c.get("id")
            if cid not in seen_ids:
                seen_ids.add(cid)
                doctors_raw.append(c)

    async def _enrich(doc: dict) -> dict:
        orders = await fetch_customer_orders(client, doc["id"])
        return build_doctor_summary(doc, orders)

    doctors = list(await asyncio.gather(*[_enrich(d) for d in doctors_raw]))
    return {"doctors": doctors, "total": len(doctors)}


@router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: int):
    """Get a single doctor with linked patients and orders."""
    client = get_client()

    try:
        resp = await client.get(f"wc/v3/customers/{doctor_id}")
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

    meta = customer.get("meta_data", [])
    if get_customer_group(meta) != DOCTOR_GROUP and not is_doctor_applicant(meta):
        raise HTTPException(status_code=404, detail="Customer is not a doctor.")

    orders = await fetch_customer_orders(client, doctor_id)
    doctor = build_doctor_summary(customer, orders)

    # Fetch linked patients
    all_customers = await fetch_all_customers(client)
    patients_raw = [
        c for c in all_customers
        if get_customer_group(c.get("meta_data", [])) == PATIENT_GROUP
        and extract_meta(c.get("meta_data", []), "hl_linked_doctor_id") == str(doctor_id)
    ]
    doctor_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
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
    """Approve a pending doctor by setting ALL approval meta fields.

    Sets BOTH B2BKing AND doctor-onboarding plugin meta so the doctor is
    recognised as approved everywhere:
      - b2bking_account_approved = 'yes'     (B2BKing core check)
      - b2bking_account_approval = 'approved' (doctor-onboarding plugin)
      - b2bking_b2buser = 'yes'
      - b2bking_customergroup = DOCTOR_GROUP (599)
    """
    client = get_client()

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
    """Reject a pending doctor by setting both B2BKing and plugin meta."""
    client = get_client()

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
    """Return aggregate counts: doctors, patients, pending doctors."""
    client = get_client()
    all_customers = await fetch_all_customers(client)

    doctor_count = 0
    patient_count = 0
    pending_doctors = 0
    seen_doctor_ids: set[int] = set()

    for c in all_customers:
        meta = c.get("meta_data", [])
        group = get_customer_group(meta)
        cid = c.get("id")
        is_doc = group == DOCTOR_GROUP or is_doctor_applicant(meta)
        if is_doc and cid not in seen_doctor_ids:
            seen_doctor_ids.add(cid)
            doctor_count += 1
            b2b_approved = extract_meta(meta, "b2bking_account_approved", "")
            if b2b_approved != "yes":
                pending_doctors += 1
        elif group == PATIENT_GROUP:
            patient_count += 1

    return CustomerStats(
        doctor_count=doctor_count,
        patient_count=patient_count,
        pending_doctors=pending_doctors,
    )
