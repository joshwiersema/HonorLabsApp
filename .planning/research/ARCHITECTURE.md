# Architecture Patterns

**Domain:** WooCommerce Business Admin Dashboard (Proxy Architecture)
**Researched:** 2026-03-07
**Overall Confidence:** HIGH

## Recommended Architecture

This system is a **three-tier proxy architecture** with four distinct deployment boundaries:

```
[Browser]
    |
    v
[React SPA on Vercel]  <-- Presentation tier
    |
    v (HTTPS, JWT bearer token)
[FastAPI on Railway]    <-- Application/proxy tier
    |
    v (HTTPS, Basic Auth with WC consumer key/secret)
[WordPress + WooCommerce on Hostinger]  <-- Data tier
    |-- /wp-json/wc/v3/*          (WooCommerce REST API)
    |-- /wp-json/wp/v2/*          (WordPress REST API)
    |-- /wp-json/honor-labs/v1/*  (Custom PHP endpoints via WPCode)
```

The FastAPI backend is the architectural keystone. It serves three critical purposes:
1. **Credential isolation** -- WooCommerce consumer key/secret never reach the browser.
2. **Business logic centralization** -- Commission calculations, data aggregation, user-type classification all live in Python, not scattered across frontend code.
3. **API normalization** -- The frontend consumes a clean, consistent API designed for the dashboard, not the raw WooCommerce/WordPress response shapes.

### Component Boundaries

| Component | Responsibility | Communicates With | Deployed On |
|-----------|---------------|-------------------|-------------|
| **React SPA** | UI rendering, client routing, local state, form validation | FastAPI backend only | Vercel |
| **FastAPI Backend** | Authentication (Google OAuth), authorization, WC/WP API proxying, business logic (commissions, aggregation), response transformation, caching | React SPA (serves), WordPress APIs (consumes) | Railway |
| **WooCommerce REST API** | Orders CRUD, products CRUD, customers, reports, coupons | FastAPI backend (serves) | Hostinger |
| **WordPress REST API** | Users, standard WordPress resources | FastAPI backend (serves) | Hostinger |
| **Custom PHP Endpoints** | Honor Labs-specific data: doctors, patients, applications, commissions, referral codes, B2BKing group queries | FastAPI backend (serves) | Hostinger (via WPCode snippet) |

### Data Flow

#### Read Flow (e.g., Dashboard loads)

```
1. Browser renders Dashboard page
2. TanStack Query fires useQuery hooks for stats, revenue, recent orders
3. Axios sends GET /api/dashboard/stats to FastAPI (JWT in Authorization header)
4. FastAPI validates JWT, checks user is authorized team member
5. FastAPI service layer fans out parallel requests:
   a. GET /wp-json/honor-labs/v1/dashboard-stats  (aggregated metrics)
   b. GET /wp-json/wc/v3/orders?per_page=10&orderby=date  (recent orders)
   c. GET /wp-json/honor-labs/v1/doctor-applications?status=pending  (pipeline)
6. FastAPI transforms/merges responses into dashboard-shaped JSON
7. Response returns to React, TanStack Query caches it
8. Components render with cached data; background revalidation on window focus
```

#### Write Flow (e.g., Approve doctor application)

```
1. Admin clicks "Approve" on doctor application card
2. React sends POST /api/doctors/applications/{id}/approve to FastAPI
3. FastAPI validates JWT, confirms admin role
4. FastAPI sends POST /wp-json/honor-labs/v1/doctor-applications/{id}/approve
5. PHP endpoint sets b2bking_customergroup to "599", updates status
6. FastAPI returns success
7. TanStack Query invalidates ["doctor-applications"] and ["dashboard-stats"]
8. UI refetches both queries automatically
```

#### Authentication Flow (Google OAuth)

```
1. User clicks "Sign in with Google" on login page
2. Browser redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. React sends code to FastAPI POST /api/auth/google/callback
5. FastAPI exchanges code for Google tokens via Google OAuth API
6. FastAPI verifies email is in allowed team list (2-5 emails in config)
7. FastAPI issues short-lived JWT (e.g., 24h) + refresh token (7d)
8. React stores JWT in memory (Zustand), refresh token in httpOnly cookie
9. All subsequent API calls include JWT in Authorization: Bearer header
10. FastAPI dependency injection validates JWT on every protected route
```

## Detailed Component Architecture

### FastAPI Backend Structure

Use a **domain-based service layer architecture**. This is the established pattern for production FastAPI applications when the backend orchestrates external APIs rather than owning a database.

```
backend/
  main.py                    # FastAPI app, lifespan, middleware
  config.py                  # Settings via pydantic-settings (env vars)
  dependencies.py            # Shared dependencies (get_current_user, get_wc_client)
  routers/
    auth.py                  # Google OAuth login/callback/refresh/logout
    dashboard.py             # GET /api/dashboard/stats, /api/dashboard/revenue
    orders.py                # CRUD /api/orders, /api/orders/{id}, status updates
    products.py              # GET/PATCH /api/products, /api/products/{id}
    doctors.py               # /api/doctors, /api/doctors/applications, approve/reject
    patients.py              # /api/patients, /api/patients/{id}
    commissions.py           # /api/commissions, /api/commissions/settings
    analytics.py             # /api/analytics/revenue, growth, products, customers
  services/
    woocommerce.py           # httpx AsyncClient wrapper for WC REST API v3
    wordpress.py             # httpx AsyncClient wrapper for WP REST API
    honor_labs.py            # httpx AsyncClient wrapper for honor-labs/v1 endpoints
    auth_service.py          # Google OAuth exchange, JWT creation, team validation
    commission_service.py    # Commission calculation business logic
    analytics_service.py     # Data aggregation, time-series computation
    cache_service.py         # In-memory TTL cache for expensive aggregations
  schemas/
    auth.py                  # LoginResponse, TokenRefresh, UserInfo
    dashboard.py             # DashboardStats, RevenueData
    orders.py                # Order, OrderList, OrderStatusUpdate
    products.py              # Product, ProductList, StockUpdate
    doctors.py               # Doctor, DoctorApplication, ApprovalAction
    patients.py              # Patient, PatientList
    commissions.py           # Commission, CommissionSummary, CommissionSettings
    analytics.py             # RevenueAnalytics, GrowthAnalytics, etc.
    common.py                # PaginatedResponse, ErrorResponse, enums
  middleware/
    cors.py                  # CORS configuration (Vercel origin)
    error_handler.py         # Global exception handlers
```

**Why domain-based over file-type:** Each router only imports from its matching service and schema modules. When adding the Commissions feature, you touch three files in predictable locations rather than hunting through monolithic files. This directly maps to the phased build order -- Phase 2 adds orders/, products/ modules; Phase 3 adds doctors/, patients/, commissions/ modules.

### React Frontend Structure

The frontend follows the established pattern from the project prompt, organized by feature domain. Key architectural decisions:

```
frontend/src/
  api/
    client.ts               # Axios instance, interceptors, JWT refresh logic
    endpoints/
      dashboard.ts           # Dashboard API calls
      orders.ts              # Order API calls
      products.ts            # Product API calls
      doctors.ts             # Doctor API calls
      patients.ts            # Patient API calls
      commissions.ts         # Commission API calls
      analytics.ts           # Analytics API calls
      auth.ts                # Auth API calls
  hooks/
    useAuth.ts               # Google OAuth flow, JWT management
    useDashboard.ts          # TanStack Query hooks for dashboard data
    useOrders.ts             # TanStack Query hooks for orders (list, detail, mutations)
    useProducts.ts           # TanStack Query hooks for products
    useDoctors.ts            # TanStack Query hooks for doctors + applications
    usePatients.ts           # TanStack Query hooks for patients
    useCommissions.ts        # TanStack Query hooks for commissions
    useAnalytics.ts          # TanStack Query hooks for analytics
  stores/
    authStore.ts             # Zustand: JWT token, user info, login state
    settingsStore.ts         # Zustand: theme (dark/light), preferences
  pages/                     # Route-level components (thin, delegate to feature components)
  components/
    layout/                  # AppLayout, Sidebar, TopBar
    ui/                      # Reusable primitives (Button, Card, Badge, Input, etc.)
    shared/                  # DataTable, StatusBadge, UserTypeBadge, LoadingSpinner
    dashboard/               # StatsCards, RevenueChart, RecentOrders, DoctorPipeline
    orders/                  # OrdersTable, OrderDetail, OrderStatusBadge
    products/                # ProductGrid, ProductCard, ProductDetail
    doctors/                 # DoctorApplications, ActiveDoctors, DoctorProfile
    patients/                # PatientsTable, PatientDetail
    commissions/             # CommissionOverview, CommissionTable, CommissionSettings
    analytics/               # RevenueAnalytics, GrowthAnalytics, ProductAnalytics
  types/                     # TypeScript interfaces matching backend schemas
  utils/                     # Formatters, constants, helpers
```

**State management boundary:** TanStack Query owns ALL server state. Zustand owns ONLY client state (auth tokens, UI preferences). Never duplicate server data into Zustand stores -- this is the most common architectural mistake in React admin dashboards.

### WordPress Custom PHP Endpoints (WPCode Snippet)

A single PHP snippet registered via WPCode that provides the `honor-labs/v1` namespace with all custom endpoints.

```
wordpress/
  honor-labs-api-endpoints.php   # Single WPCode snippet
```

**Authentication strategy for custom endpoints:** The custom PHP endpoints should leverage WooCommerce's existing authentication. When FastAPI sends requests with WC consumer key/secret via HTTP Basic Auth, WooCommerce's `WC_REST_Authentication` class authenticates the request and sets the current user. The custom endpoints then use `permission_callback` to check `current_user_can('manage_woocommerce')` -- which works because the WC API key is generated for an admin user.

**Key endpoints to register:**

| Endpoint | Method | Purpose | Data Source |
|----------|--------|---------|-------------|
| `/doctors` | GET | List all doctors with meta | `b2bking_customergroup = 599` user meta query |
| `/doctors/{id}` | GET | Doctor detail + linked patients | User meta + patient lookup via referral code |
| `/patients` | GET | List all patients with linked doctor | `b2bking_customergroup = 695` user meta query |
| `/patients/{id}` | GET | Patient detail | User meta + linked doctor info |
| `/doctor-applications` | GET | Pending/approved/rejected applications | Custom post type from onboarding plugin |
| `/doctor-applications/{id}/approve` | POST | Approve doctor | Set `b2bking_customergroup` to "599" |
| `/doctor-applications/{id}/reject` | POST | Reject doctor | Update application status |
| `/commissions` | GET | Commission data per doctor | Calculated from patient orders |
| `/referral-codes` | GET | All referral codes with usage | Doctor user meta |
| `/dashboard-stats` | GET | Aggregated business metrics | Cross-query orders, users, revenue |
| `/b2bking/groups` | GET | B2BKing customer groups | B2BKing options/terms |

**HPOS compatibility note:** Since WooCommerce HPOS is enabled, the PHP snippet must use `wc_get_orders()` and WC_Order methods rather than direct `wp_posts`/`wp_postmeta` queries for order data. The WC REST API handles this transparently, but custom PHP that queries orders directly must use the HPOS-aware APIs.

## Patterns to Follow

### Pattern 1: Service Layer Proxy with Response Transformation

**What:** FastAPI routers call service functions that make httpx requests to WordPress, then transform the response into dashboard-optimized shapes.

**When:** Every API call from the frontend.

**Why:** The WooCommerce API returns verbose responses with fields the dashboard does not need. Transforming server-side reduces payload size and keeps the frontend simple.

**Example:**

```python
# services/woocommerce.py
class WooCommerceService:
    def __init__(self, client: httpx.AsyncClient, base_url: str, consumer_key: str, consumer_secret: str):
        self.client = client
        self.base_url = base_url
        self.auth = (consumer_key, consumer_secret)

    async def get_orders(self, page: int = 1, per_page: int = 20, status: str | None = None) -> PaginatedResponse:
        params = {"page": page, "per_page": per_page}
        if status:
            params["status"] = status
        response = await self.client.get(
            f"{self.base_url}/wp-json/wc/v3/orders",
            params=params,
            auth=self.auth,
        )
        response.raise_for_status()
        total = int(response.headers.get("X-WP-Total", 0))
        total_pages = int(response.headers.get("X-WP-TotalPages", 0))
        orders = [transform_order(o) for o in response.json()]
        return PaginatedResponse(items=orders, total=total, total_pages=total_pages, page=page)
```

### Pattern 2: Shared httpx AsyncClient via Lifespan

**What:** Create a single httpx.AsyncClient at application startup, share it across all services via app.state, close it at shutdown.

**When:** Always. This is the correct way to manage HTTP connections in FastAPI.

**Why:** Connection pooling. Creating a new client per request wastes TCP connections and is significantly slower.

**Example:**

```python
# main.py
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)
```

### Pattern 3: TanStack Query Key Conventions

**What:** Use structured query keys that enable granular invalidation.

**When:** Every useQuery/useMutation hook.

**Why:** When a doctor application is approved, you need to invalidate the applications list AND the dashboard stats AND the active doctors list. Structured keys make this precise rather than over-invalidating.

**Example:**

```typescript
// Query key factory
export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: (filters: OrderFilters) => ["orders", "list", filters] as const,
    detail: (id: number) => ["orders", "detail", id] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    applications: (status?: string) => ["doctors", "applications", status] as const,
    active: () => ["doctors", "active"] as const,
    detail: (id: number) => ["doctors", "detail", id] as const,
  },
  dashboard: {
    stats: () => ["dashboard", "stats"] as const,
    revenue: (range: string) => ["dashboard", "revenue", range] as const,
  },
};

// On doctor approval mutation success:
queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
```

### Pattern 4: Optimistic Updates for Status Changes

**What:** Update the UI immediately when changing order status or approving/rejecting doctors, then reconcile with the server response.

**When:** Any mutation where the expected outcome is predictable (status changes, approvals).

**Why:** Admin dashboards feel sluggish if every click requires a loading spinner. The user clicked "Approve" -- show it as approved immediately.

### Pattern 5: In-Memory TTL Cache for Aggregations

**What:** Cache expensive aggregated data (dashboard stats, analytics) in FastAPI with a time-to-live of 60-300 seconds.

**When:** Any endpoint that aggregates multiple WC/WP API calls.

**Why:** The dashboard page triggers 3-5 API calls to WordPress. If multiple team members load the dashboard within a minute, the WordPress server gets hammered. A simple TTL cache on the FastAPI side prevents this without adding Redis complexity for a 2-5 user team.

**Example:**

```python
# services/cache_service.py
from functools import lru_cache
from datetime import datetime, timedelta

class TTLCache:
    def __init__(self, ttl_seconds: int = 120):
        self._cache: dict[str, tuple[datetime, Any]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)

    def get(self, key: str) -> Any | None:
        if key in self._cache:
            timestamp, value = self._cache[key]
            if datetime.now() - timestamp < self._ttl:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = (datetime.now(), value)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Frontend Directly Calling WooCommerce

**What:** Having the React app make requests to WordPress/WooCommerce endpoints directly.

**Why bad:** Exposes WC consumer key/secret in browser network tab. CORS issues between Vercel origin and Hostinger origin. No centralized business logic. Impossible to add caching or rate limiting.

**Instead:** All requests go through FastAPI. The frontend has zero knowledge of WordPress URLs or WC credentials.

### Anti-Pattern 2: Duplicating Server State in Zustand

**What:** Fetching orders via TanStack Query then copying them into a Zustand store for "easier access."

**Why bad:** Two sources of truth. State synchronization bugs. Manual cache invalidation. Defeats TanStack Query's stale-while-revalidate.

**Instead:** TanStack Query IS the server state cache. Zustand is only for client-only state: theme preference, sidebar collapsed state, auth tokens.

### Anti-Pattern 3: Fat Routers

**What:** Putting business logic (commission calculations, data aggregation, response transformation) directly in FastAPI router functions.

**Why bad:** Routers become untestable monoliths. Business logic is not reusable across endpoints. Hard to unit test without spinning up the full HTTP stack.

**Instead:** Routers are thin -- they validate input, call a service, return the response. Services contain all business logic and are independently testable.

### Anti-Pattern 4: Querying wp_posts for Orders

**What:** Writing direct SQL queries against `wp_posts` and `wp_postmeta` tables for order data in the PHP snippet.

**Why bad:** HPOS is enabled. Orders are in `wc_orders`, `wc_order_addresses`, and `wc_order_operational_data` tables. Direct post queries will return incomplete or no data.

**Instead:** Always use `wc_get_orders()` with WC_Order_Query args, or WC_Order methods. These are HPOS-aware and work regardless of storage backend.

### Anti-Pattern 5: Polling for Data Freshness

**What:** Setting up setInterval to refetch data every N seconds.

**Why bad:** Unnecessary API calls when nobody is looking at the tab. Burns through rate limits.

**Instead:** Use TanStack Query's built-in `refetchOnWindowFocus: true` (default), `staleTime` of 30-60 seconds for dashboard data, and explicit invalidation after mutations. For an admin dashboard with 2-5 users, this is more than sufficient.

## Scalability Considerations

| Concern | At 10 users (current) | At 100 users | At 1000 users |
|---------|----------------------|--------------|---------------|
| **API load on WordPress** | Negligible. 2-5 dashboard users generate ~50 req/min peak. | Still manageable. WP handles hundreds of req/min. Add TTL caching in FastAPI. | Need Redis cache layer, possibly read replicas. |
| **FastAPI instances** | Single Railway container is fine. | Single container still fine with async. | Horizontal scaling on Railway, add load balancer. |
| **Auth/Sessions** | JWT tokens, no session store needed. | Same -- JWT is stateless. | Same -- JWT scales horizontally by design. |
| **Data volume (orders)** | ~10 orders. Pagination unnecessary but implement from day one. | Hundreds of orders. Pagination essential. Consider server-side search indexes. | Thousands. May need Elasticsearch or dedicated reporting DB. |
| **Commission calculations** | Calculated on-the-fly from order data. Fast with ~10 patients. | Cache commission results with TTL. | Pre-compute and store commission snapshots. |
| **Custom PHP endpoints** | Direct user meta queries are fast at this scale. | Add database indexes on `b2bking_customergroup` meta key if not present. | Consider custom tables for doctor/patient relationships. |

**For this project (10 users, growing slowly):** Do not over-engineer. Single FastAPI instance, in-memory caching, direct WP queries, JWT auth. The architecture supports growth to ~1000 users without fundamental changes -- just adding a Redis cache layer.

## Suggested Build Order

Build order is driven by dependency chains. You cannot test downstream components without upstream ones.

### Phase 1: Foundation (No dependencies on other phases)

**Build these first because everything else depends on them:**

1. **FastAPI skeleton** -- main.py, config.py, CORS middleware, health check endpoint, lifespan with httpx client
2. **Google OAuth flow** -- auth router, auth service, JWT creation/validation, team email allowlist
3. **WooCommerce service** -- httpx wrapper with Basic Auth, connection test endpoint
4. **React app shell** -- Layout (sidebar, topbar), routing, Axios client with JWT interceptor
5. **Login page** -- Google OAuth integration, protected route wrapper
6. **PHP WPCode snippet** -- Register all custom endpoints under `honor-labs/v1` namespace, authentication via WC credentials

**Why this order:** The FastAPI skeleton and auth flow gate everything. The WC service proves the proxy connection works. The React shell and login page prove the frontend-to-backend connection works. The PHP snippet must exist before any Honor Labs-specific data can be fetched.

### Phase 2: Core Data Views (Depends on Phase 1)

**Build these next because they exercise the core data pipeline:**

7. **Dashboard page** -- Stats cards (requires `/dashboard-stats`), revenue chart (requires `/wc/v3/reports`), recent orders widget
8. **Orders page** -- List with pagination/filtering (exercises `wc/v3/orders`), detail view, status update mutation
9. **Products page** -- Grid/list view (exercises `wc/v3/products`), stock update

**Why this order:** Dashboard first because it is the landing page and exercises the widest variety of API calls, validating the full proxy chain. Orders and products use standard WooCommerce endpoints with well-documented behavior -- lower risk.

### Phase 3: Honor Labs Domain Logic (Depends on Phase 1 + PHP snippet)

**Build these next because they depend on the custom PHP endpoints:**

10. **Doctors page** -- Applications tab (approve/reject mutations), active doctors tab, doctor profiles
11. **Patients page** -- List with linked doctor info, patient detail view
12. **Commissions page** -- Overview aggregation, per-doctor table, commission rate settings

**Why this order:** Doctors first because doctor approval is a core workflow. Patients depend on doctor data (linked via referral code). Commissions depend on both doctor and patient/order data -- it is the most complex aggregation.

### Phase 4: Analytics and Polish (Depends on Phase 2 + 3)

**Build last because analytics consume data from all other domains:**

13. **Analytics page** -- Revenue, growth, product, and customer charts
14. **Dark mode** -- CSS custom properties toggle, Zustand persistence
15. **Error/loading/empty states** -- Skeleton loaders, error boundaries, empty illustrations
16. **CSV export** -- Client-side CSV generation from table data
17. **Responsive layout** -- Sidebar collapse, table scroll, card stack on tablet

**Why this order:** Analytics depend on order, product, doctor, and patient data being established and tested. Polish items (dark mode, error states, CSV) are independent of each other and can be parallelized.

## Environment and Deployment Architecture

```
Production:
  Vercel (frontend)
    - React SPA build output
    - vercel.json rewrites for SPA routing: {"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}
    - VITE_API_URL env var pointing to Railway backend

  Railway (backend)
    - FastAPI with uvicorn
    - Environment variables: WC_CONSUMER_KEY, WC_CONSUMER_SECRET, WP_BASE_URL,
      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, ALLOWED_EMAILS,
      ALLOWED_ORIGINS (Vercel URL)
    - Auto-deploy from git push

  Hostinger (WordPress)
    - WooCommerce REST API keys generated (Read/Write for admin)
    - WPCode snippet installed with custom endpoints
    - CORS headers added via WPCode snippet (allow Railway origin)

Development:
  Frontend: localhost:5173 (Vite dev server)
  Backend: localhost:8000 (uvicorn with --reload)
  WordPress: Same Hostinger instance (dev keys with limited permissions)
```

### CORS Configuration Chain

Three CORS configurations must align:

1. **FastAPI middleware** -- Allow `https://<your-app>.vercel.app` (and `localhost:5173` in dev)
2. **WordPress/WPCode snippet** -- Allow the Railway backend origin for custom endpoints. Standard WC API endpoints handle auth via Basic Auth which bypasses CORS.
3. **Vercel** -- No CORS config needed (Vercel serves the SPA, does not receive cross-origin requests)

Note: The WordPress CORS headers are only needed if the FastAPI backend origin differs from the WordPress origin (which it does -- Railway vs Hostinger). Since FastAPI sends server-to-server requests (not browser requests), standard CORS browser enforcement does not apply. However, WordPress may still enforce CORS on the REST API level, so include appropriate headers in the PHP snippet as a safety measure.

## Sources

- [WooCommerce REST API v3 Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/) -- HIGH confidence: Official documentation for all endpoints, auth, pagination
- [WordPress REST API - Adding Custom Endpoints](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/) -- HIGH confidence: Official guide for register_rest_route, permission_callback, namespace conventions
- [WooCommerce HPOS Documentation](https://developer.woocommerce.com/docs/features/high-performance-order-storage/) -- HIGH confidence: Official docs on custom tables, migration, query APIs
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/) -- HIGH confidence: Official FastAPI CORS configuration
- [FastAPI Proxy Patterns](https://www.getorchestra.io/guides/fast-api-proxies-a-comprehensive-guide-with-python-code-snippets) -- MEDIUM confidence: Community guide on httpx proxy patterns
- [FastAPI Service Layer Architecture](https://medium.com/@abhinav.dobhal/building-production-ready-fastapi-applications-with-service-layer-architecture-in-2025-f3af8a6ac563) -- MEDIUM confidence: Community best practices for domain-based structure
- [TanStack Query as State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager) -- HIGH confidence: Maintainer blog post on stale-while-revalidate patterns
- [Google OAuth in FastAPI](https://python.plainenglish.io/how-to-implement-google-oauth-in-fastapi-from-session-management-to-stateless-jwt-tokens-c0f7c7a1a317) -- MEDIUM confidence: Community guide on Google OAuth + JWT pattern
- [Deploy FastAPI on Railway](https://docs.railway.com/guides/fastapi) -- HIGH confidence: Official Railway deployment guide
- [WooCommerce REST API Rate Limiting](https://developer.woocommerce.com/docs/apis/store-api/rate-limiting/) -- HIGH confidence: Official rate limiting docs (applies to Store API; standard REST API has no built-in rate limits)
- [FastAPI Performance Tuning and Caching](https://blog.greeden.me/en/2025/12/09/complete-fastapi-performance-tuning-guide-build-scalable-apis-with-async-i-o-connection-pools-caching-and-rate-limiting/) -- MEDIUM confidence: Community guide on async caching patterns
