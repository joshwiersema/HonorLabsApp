# Architecture

**Analysis Date:** 2026-03-07

## Pattern Overview

**Overall:** Three-tier client-server architecture with a secure backend proxy

The system follows a React SPA (frontend) -> Python FastAPI (backend proxy) -> WordPress/WooCommerce REST API (data source) pattern. The FastAPI backend acts as a secure intermediary, preventing direct frontend-to-WooCommerce API calls and keeping API credentials server-side.

**Key Characteristics:**
- Frontend is a standalone React SPA that communicates only with the FastAPI backend
- Backend proxies and orchestrates calls to two external APIs: WooCommerce REST API (`/wp-json/wc/v3/`) and custom Honor Labs REST endpoints (`/wp-json/honor-labs/v1/`)
- WordPress custom endpoints are deployed as a WPCode PHP snippet, not a plugin
- Authentication flows through WooCommerce consumer key/secret, managed by the backend
- The app is a business dashboard, not a customer-facing storefront

## Layers

**Presentation Layer (Frontend):**
- Purpose: Renders the business dashboard UI, handles user interaction, manages client-side state
- Location: `frontend/src/`
- Contains: React components, pages, hooks, Zustand stores, TypeScript types, utility functions
- Depends on: FastAPI backend (via Axios HTTP calls)
- Used by: End users (business owner/admin) via browser

**API Proxy Layer (Backend):**
- Purpose: Secure proxy between frontend and WordPress/WooCommerce APIs; holds API credentials server-side
- Location: `backend/`
- Contains: FastAPI routers (`backend/routers/`) and service modules (`backend/services/`)
- Depends on: WordPress/WooCommerce REST API, Honor Labs custom REST endpoints
- Used by: Frontend (via HTTP)

**Data Source Layer (WordPress):**
- Purpose: Provides business data via REST endpoints; the actual data store (MySQL on Hostinger)
- Location: `wordpress/` (contains the WPCode PHP snippet to deploy)
- Contains: Custom REST endpoint registrations under `honor-labs/v1` namespace
- Depends on: WordPress core, WooCommerce, B2BKing, Honor Labs custom plugins
- Used by: FastAPI backend

## Data Flow

**Dashboard Data Request:**

1. User navigates to a page in the React SPA
2. TanStack Query hook fires, sending request to FastAPI backend via Axios
3. FastAPI router receives request, delegates to appropriate service module
4. Service module calls WooCommerce REST API and/or Honor Labs custom endpoints (with stored credentials)
5. Service aggregates/transforms response data
6. FastAPI returns JSON to frontend
7. TanStack Query caches response, React renders the data

**Doctor Application Approval:**

1. Admin clicks "Approve" on a pending doctor application in the Doctors page
2. Frontend sends POST to FastAPI backend
3. Backend calls `POST /wp-json/honor-labs/v1/doctor-applications/{id}/approve`
4. WordPress endpoint sets `b2bking_customergroup` user meta to "599" and triggers approval email
5. Success response propagates back; TanStack Query invalidates relevant caches

**State Management:**
- **Server state:** TanStack Query (React Query) -- all data from the API is treated as server state with caching, refetching, and invalidation
- **Client state:** Zustand -- used for API credentials/auth (`stores/authStore.ts`), theme/display preferences (`stores/settingsStore.ts`)
- **URL state:** React Router v6 -- page routing and navigation state

## Key Abstractions

**API Client:**
- Purpose: Centralized Axios instance with auth interceptors for communicating with the FastAPI backend
- Planned location: `frontend/src/api/client.ts`
- Pattern: Singleton Axios instance with request/response interceptors

**Custom Hooks per Domain:**
- Purpose: Encapsulate TanStack Query logic for each data domain (orders, products, doctors, patients, commissions, analytics)
- Planned location: `frontend/src/hooks/use*.ts` (e.g., `useOrders.ts`, `useDoctors.ts`)
- Pattern: Each hook wraps `useQuery`/`useMutation` calls with typed parameters and return values

**FastAPI Routers:**
- Purpose: Group API endpoints by domain (orders, products, doctors, patients, commissions)
- Planned location: `backend/routers/` (e.g., `orders.py`, `doctors.py`)
- Pattern: FastAPI APIRouter instances, one per domain, mounted on the main app

**FastAPI Services:**
- Purpose: Business logic and external API call orchestration, separated from routing
- Planned location: `backend/services/` (e.g., `woocommerce.py`, `honor_labs.py`)
- Pattern: Service functions called by routers; handle HTTP calls to WordPress/WooCommerce

**Type Definitions:**
- Purpose: Shared TypeScript interfaces for all API entities
- Planned location: `frontend/src/types/` (e.g., `order.ts`, `doctor.ts`, `patient.ts`, `commission.ts`, `product.ts`, `api.ts`)
- Pattern: One file per domain entity, exported types/interfaces

## Entry Points

**Frontend Entry:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser loads `frontend/index.html`, which loads `main.tsx` as ESM module
- Responsibilities: Creates React root, renders `<App />` wrapped in `<StrictMode>`

**Frontend App Root:**
- Location: `frontend/src/App.tsx`
- Triggers: Rendered by `main.tsx`
- Responsibilities: Will hold React Router provider, TanStack Query provider, and the main layout. Currently contains Vite default template (counter demo).

**Backend Entry (planned):**
- Location: `backend/main.py` (does not exist yet)
- Triggers: `uvicorn backend.main:app` or similar
- Responsibilities: Creates FastAPI app instance, mounts routers, configures CORS middleware

**WordPress Endpoints (planned):**
- Location: `wordpress/honor-labs-api-endpoints.php` (does not exist yet)
- Triggers: WordPress loads the WPCode snippet on every request
- Responsibilities: Registers all custom REST routes under `honor-labs/v1` namespace

## Error Handling

**Strategy:** Not yet implemented. The planned approach (from the project spec) is:

**Frontend Patterns:**
- TanStack Query provides built-in error states per query/mutation
- Each page should render error states, loading states, and empty states
- Axios interceptors on the API client should handle auth failures globally (e.g., redirect to settings if 401)
- Toast/notification system for user-facing errors on mutations

**Backend Patterns:**
- FastAPI HTTPException for structured error responses
- Service layer should catch external API errors and translate them to meaningful HTTP status codes
- Validation via Pydantic models on request/response schemas

## Cross-Cutting Concerns

**Authentication:**
- WooCommerce REST API consumer key + consumer secret, stored by the FastAPI backend
- Frontend stores a local connection config (site URL) in Zustand/localStorage
- The backend holds the actual API credentials -- frontend never directly touches WooCommerce credentials
- WordPress custom endpoints verify authentication via WooCommerce API key validation or `current_user_can('manage_woocommerce')`

**CORS:**
- The FastAPI backend must allow requests from the frontend origin
- A CORS-enabling WordPress snippet is also needed if the backend calls WordPress APIs from a different origin (though server-to-server calls bypass browser CORS)

**Data Transformation:**
- The backend should normalize WooCommerce and WordPress API responses into consistent, frontend-friendly JSON structures
- B2BKing group identification: user meta `b2bking_customergroup` values "599" (doctors), "695" (patients), "b2cuser" (general)
- Commission calculation: `commission = rate * sum(patient_order_totals)` per linked doctor

**Logging:** Not yet configured for either frontend or backend.

**Validation:**
- Frontend: TypeScript types enforce compile-time correctness
- Backend: Pydantic models (planned) for request/response validation
- WordPress: PHP-level validation in custom endpoint callbacks

## External API Contracts

**WooCommerce REST API v3** (base: `/wp-json/wc/v3/`):
- `GET /orders` -- list/filter orders (supports status, date, customer filters)
- `GET /products` -- list products
- `GET /customers` -- list customers (WP users with WC data)
- `GET /reports/sales` -- sales reports by period
- `GET /reports/top_sellers` -- top selling products

**Honor Labs Custom API v1** (base: `/wp-json/honor-labs/v1/`):
- `GET /doctors` -- all doctors (group 599) with NPI, practice, specialty, referral code, patient count
- `GET /doctors/{id}` -- single doctor with linked patients
- `GET /patients` -- all patients (group 695) with linked doctor
- `GET /patients/{id}` -- single patient detail
- `GET /doctor-applications` -- pending/approved/rejected applications
- `POST /doctor-applications/{id}/approve` -- approve a doctor
- `POST /doctor-applications/{id}/reject` -- reject a doctor
- `GET /commissions` -- commission data per doctor per period
- `GET /referral-codes` -- all referral codes with usage stats
- `GET /dashboard-stats` -- aggregated business metrics
- `GET /b2bking/groups` -- B2BKing customer groups

**WordPress REST API v2** (base: `/wp-json/wp/v2/`):
- `GET /users` -- user data (note: `b2bking_customergroup` meta is NOT exposed by default, hence custom endpoints)

---

*Architecture analysis: 2026-03-07*
