# External Integrations

**Analysis Date:** 2026-03-07

## APIs & External Services

**WooCommerce REST API v3 (primary data source):**
- Base URL: `https://darkorange-skunk-283648.hostingersite.com/wp-json/wc/v3/`
- SDK/Client: `axios` ^1.13.6 (planned in `frontend/src/api/client.ts`, not yet created)
- Auth: WooCommerce Consumer Key + Consumer Secret (not yet generated on WP side)
- Auth method: HTTP Basic Auth or query parameters (`consumer_key` + `consumer_secret`)
- Endpoints used:
  - `GET /wc/v3/orders` - Order listing with status, date, customer filters
  - `GET /wc/v3/products` - Product catalog
  - `GET /wc/v3/customers` - WooCommerce customer records
  - `GET /wc/v3/reports/sales` - Revenue/sales reports
  - `GET /wc/v3/reports/top_sellers` - Top-selling products
  - `PUT /wc/v3/orders/{id}` - Update order status
- Note: HPOS (High-Performance Order Storage) is enabled on WooCommerce - orders are in custom tables, not post meta

**WordPress REST API (user management):**
- Base URL: `https://darkorange-skunk-283648.hostingersite.com/wp-json/wp/v2/`
- SDK/Client: Same `axios` instance (planned)
- Auth: Same WooCommerce credentials or WordPress application password
- Endpoints used:
  - `GET /wp/v2/users` - User listing (limited, does not expose B2BKing meta)

**Custom Honor Labs REST API (to be created):**
- Base URL: `https://darkorange-skunk-283648.hostingersite.com/wp-json/honor-labs/v1/`
- Implementation: PHP WPCode snippet (to be created in `wordpress/honor-labs-api-endpoints.php`)
- Auth: WooCommerce API credentials or WordPress admin capability check
- Endpoints:
  - `GET /honor-labs/v1/doctors` - List doctors (B2BKing group 599) with NPI, practice, specialty, referral code, patient count
  - `GET /honor-labs/v1/doctors/{id}` - Single doctor with linked patients
  - `GET /honor-labs/v1/patients` - List patients (B2BKing group 695) with linked doctor
  - `GET /honor-labs/v1/patients/{id}` - Single patient detail
  - `GET /honor-labs/v1/doctor-applications` - Pending/approved/rejected applications
  - `POST /honor-labs/v1/doctor-applications/{id}/approve` - Approve doctor application
  - `POST /honor-labs/v1/doctor-applications/{id}/reject` - Reject doctor application
  - `GET /honor-labs/v1/commissions` - Commission data per doctor per period
  - `GET /honor-labs/v1/referral-codes` - Referral codes with usage stats
  - `GET /honor-labs/v1/dashboard-stats` - Aggregated business metrics
  - `GET /honor-labs/v1/b2bking/groups` - B2BKing customer groups

**CORS Handling:**
- The React app runs on a different origin than the WordPress site
- A CORS-enabling PHP snippet must be installed on WordPress (via WPCode)
- Alternatively, the Python FastAPI backend acts as a same-origin proxy, eliminating CORS issues

## API Proxy Architecture

**Python FastAPI backend (planned, `backend/`):**
- Purpose: Secure proxy between the React frontend and WordPress/WooCommerce APIs
- Prevents exposing WooCommerce API credentials to the browser
- Handles CORS by serving both frontend and API from the same origin
- Location: `backend/routers/` for route handlers, `backend/services/` for business logic
- Status: Directory structure created, no code written

**Flow:**
```
React Frontend  -->  FastAPI Backend  -->  WooCommerce REST API
  (browser)         (secure proxy)        (WordPress server)
                    Stores API keys
                    Handles auth
                    Transforms data
```

## Data Storage

**Databases:**
- No local database. All data lives in the WordPress/WooCommerce database on Hostinger Cloud.
- WooCommerce HPOS (High-Performance Order Storage) - orders in custom tables
- B2BKing user meta stored in WordPress `wp_usermeta` table
- Key meta field: `b2bking_customergroup` (string: "599" for doctors, "695" for patients, "b2cuser" for general)

**File Storage:**
- No file storage integration. Product images served from WordPress media library.

**Caching:**
- TanStack React Query handles client-side data caching (stale-while-revalidate pattern)
- No server-side cache configured
- WordPress side uses LiteSpeed Cache plugin

**Local Storage:**
- API credentials stored in browser localStorage (via Zustand persist)
- Theme/display preferences stored in browser localStorage (via Zustand persist)

## Authentication & Identity

**App Authentication:**
- No user login system. The app authenticates to WordPress using WooCommerce REST API keys.
- First-time setup flow: user enters WordPress URL + Consumer Key + Consumer Secret
- Credentials validated by making a test API call
- Stored in browser localStorage (consider encryption)

**WooCommerce API Auth:**
- Consumer Key + Consumer Secret pair
- Generated via WooCommerce > Settings > Advanced > REST API (not yet created)
- Passed as HTTP Basic Auth header or as query parameters over HTTPS
- Requires HTTPS (site is on HTTPS)

**WordPress User Roles (on WP side, not in this app):**
- Admin (1 user): josh.wiersema06@gmail.com
- Doctors/B2B (4 users): B2BKing group 599
- Patients (4 users): B2BKing group 695
- General (1 user): "b2cuser"

**Custom WordPress Plugins (authentication-related):**
- `honor-labs-doctor-onboarding` v1.0.1 - Doctor registration + NPI verification + admin approval
- `honor-labs-patient-portal` v1.0.0 - Patient registration + referral code validation
- `honor-labs-access-control` v1.0.0 - Store gating by user group

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- None configured. Console logging only (browser dev tools).

**Analytics:**
- None for the app itself. Business analytics are built into the app's Analytics page using WooCommerce data.

## CI/CD & Deployment

**Hosting:**
- Frontend: Not yet determined (static files from Vite build)
- Backend: Not yet determined (Python FastAPI server)
- WordPress: Hostinger Cloud (existing, not managed by this project)

**CI Pipeline:**
- None configured. No GitHub Actions, no CI/CD workflow files.

**Build Output:**
- Frontend: `frontend/dist/` (Vite production build)
- Backend: Direct Python execution (no build step needed)

## Environment Configuration

**Required env vars (to be created):**
- `VITE_API_BASE_URL` - Backend API URL (for frontend, prefixed with VITE_ for Vite exposure)
- `WP_BASE_URL` - WordPress site URL (for backend proxy)
- `WC_CONSUMER_KEY` - WooCommerce API consumer key (for backend proxy)
- `WC_CONSUMER_SECRET` - WooCommerce API consumer secret (for backend proxy)

**Current state:**
- No `.env` files exist anywhere in the project
- No `.env.example` template exists
- The prompt specifies credentials should be stored as environment variables, never in source code

**Secrets location:**
- WooCommerce API keys: to be stored in backend `.env` (not yet created)
- Frontend: credentials entered by user, stored in localStorage via Zustand

## Webhooks & Callbacks

**Incoming:**
- None currently. The app polls WooCommerce APIs on demand.
- Potential future: WooCommerce webhooks for real-time order notifications

**Outgoing:**
- None. The app does not send webhooks.

## Third-Party WordPress Services (on WP side)

These are not direct integrations of this app, but the WordPress site uses them and they affect data:

- **WooPayments v10.5.1** - Payment processing (Stripe-based)
- **WP Mail SMTP v4.7.1** - Email delivery (used for doctor approval/rejection emails)
- **Elementor v3.35.6** - Page builder (not relevant to API data)
- **LiteSpeed Cache** - Server-side caching (may require cache purging after API writes)
- **MCP Adapter v0.4.1** - Model Context Protocol adapter (development tool)
- **WPCode Lite v2.3.4** - PHP snippet manager (where custom REST endpoints will be installed)

## Key Technical Constraints

1. **Hostinger blocks PHP file editing** via Plugin Editor and File Browser. All custom PHP must go through WPCode snippets or SFTP.
2. **B2BKing `b2bking_customergroup` meta is NOT exposed via default WordPress REST API.** Custom endpoints are required.
3. **WooCommerce HPOS is enabled.** Order queries must use WooCommerce's API, not direct `wp_posts` queries.
4. **Minimum order enforcement** exists as WPCode snippet (ID 705) with 6 layers - doctors must order minimum 24 units.
5. **CORS must be handled** either via WordPress PHP snippet or via the FastAPI backend proxy.

---

*Integration audit: 2026-03-07*
