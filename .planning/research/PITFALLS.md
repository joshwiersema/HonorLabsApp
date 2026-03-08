# Pitfalls Research

**Domain:** WooCommerce business admin dashboard with FastAPI proxy backend
**Researched:** 2026-03-07
**Confidence:** HIGH (multiple sources verified, domain-specific issues well-documented)

## Critical Pitfalls

### Pitfall 1: WooCommerce Customer Meta Not Exposed by Default

**What goes wrong:**
The WooCommerce REST API does not expose custom user meta fields (like `b2bking_customergroup`, NPI numbers, referral codes) through the standard `/wc/v3/customers` endpoint. After WooCommerce security update 242, `meta_data` on customer objects is only returned when the API key has **Administrator-level** permissions. Even then, you cannot filter/query customers by meta fields -- the `meta_query` parameter is not supported on the customers endpoint. This means you cannot use the standard WooCommerce API to list all doctors (group 599) or all patients (group 695).

**Why it happens:**
Developers assume WooCommerce exposes all user meta through the REST API like it does for order or product meta. The security update further restricts meta_data access, and the inability to filter by meta is a fundamental API limitation that catches everyone building B2B dashboards.

**How to avoid:**
Build the custom `honor-labs/v1` WordPress REST endpoints from Day 1. These endpoints must query `usermeta` directly using `get_users()` with `meta_query` arguments to filter by `b2bking_customergroup`. Do NOT attempt to use the standard WooCommerce customers endpoint for doctor/patient listing. The custom PHP snippet must handle all B2BKing-specific queries.

Specifically:
- Create API keys with **Read/Write** permissions and **Administrator** scope
- Implement custom endpoints that use `get_users(['meta_key' => 'b2bking_customergroup', 'meta_value' => '599'])` for doctors
- Return all relevant user meta (NPI, practice name, specialty, referral code) explicitly in the response

**Warning signs:**
- `meta_data` array returns empty on customer objects
- Unable to filter customers by B2BKing group through standard endpoints
- Resorting to fetching ALL customers and filtering client-side (kills performance)

**Phase to address:**
Phase 1 (Foundation) -- the custom WordPress REST endpoints must be the first thing built and tested, before any frontend work that depends on doctor/patient data.

---

### Pitfall 2: WooCommerce Reports API Broken with HPOS Enabled

**What goes wrong:**
The site has HPOS (High-Performance Order Storage) enabled. The standard `/wc/v3/reports/sales` and `/wc/v3/reports/orders/totals` endpoints return incorrect data (all zeros, stale counts) when HPOS is active without legacy sync. This is a documented bug (GitHub issue #45354) caused by these endpoints still using `wp_count_posts()` which queries the old `wp_posts` table, while HPOS stores orders in custom tables (`wp_wc_orders`).

**Why it happens:**
Developers build analytics dashboards relying on the documented reports endpoints, only to discover the data is wrong. The fix was merged but may not be in the installed WooCommerce version. The `wc-analytics` endpoints are more reliable with HPOS but are **completely undocumented**.

**How to avoid:**
Two-pronged approach:
1. **Verify WooCommerce version:** Check if the site runs WooCommerce 10.5.3 (it does per PROJECT.md). Verify whether the HPOS reports fix from PR #46715 is included in this version.
2. **Use `wc-analytics` endpoints as primary, `wc/v3/reports` as fallback.** The undocumented `/wp-json/wc-analytics/reports/revenue/stats`, `/wc-analytics/reports/orders/stats` endpoints are HPOS-aware and what the WooCommerce admin dashboard itself uses internally.
3. **Build custom aggregation in the PHP snippet.** For Honor Labs-specific metrics (wholesale vs. retail revenue split, commission calculations), query the `wp_wc_orders` table directly in the custom endpoint rather than relying on WooCommerce's reports API.

**Warning signs:**
- Dashboard shows $0 revenue despite having orders
- Order counts don't match what you see in WooCommerce admin
- Reports data doesn't update after new orders

**Phase to address:**
Phase 1 (Foundation) for the custom PHP endpoint aggregations; Phase 2 (Core Pages) for dashboard analytics integration. Must test with real data before building charts.

---

### Pitfall 3: CORS Configuration Fails in Production (Vercel + Railway)

**What goes wrong:**
CORS works perfectly in development (Vite dev server proxy) but breaks completely in production. Three distinct failure modes:
1. **FastAPI on Railway:** HTTP requests get 301-redirected to HTTPS, and browsers change the method from POST to GET on redirect, causing 405 errors. The `Origin` header is lost in the redirect.
2. **Vercel frontend:** Deployment protection blocks unauthenticated preflight OPTIONS requests with 401.
3. **Origin mismatch:** A subtle difference like missing `https://`, a trailing slash, or `www.` prefix causes the CORS middleware to reject legitimate requests silently.

**Why it happens:**
Developers test CORS in development using Vite's proxy (which bypasses CORS entirely) and never encounter the actual browser CORS enforcement until production deployment. The FastAPI `CORSMiddleware` configuration that works locally requires exact origin matching against production URLs.

**How to avoid:**
- **Always use `https://` in Railway API calls** from the frontend. Set `VITE_API_URL` to the full `https://` Railway URL.
- **Disable Vercel deployment protection** for the project, or configure the `x-vercel-protection-bypass` header.
- **Configure FastAPI CORS with exact origins**, not wildcards:
  ```python
  origins = [
      "https://your-app.vercel.app",
      "https://your-custom-domain.com",
      "http://localhost:5173",  # dev only
  ]
  app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
  ```
- **Test CORS in a staging environment** before going live. Use `curl -H "Origin: https://your-frontend.vercel.app" -X OPTIONS` to verify preflight responses.
- **Store origins in environment variables** so they differ between dev/staging/production.

**Warning signs:**
- "CORS policy: No 'Access-Control-Allow-Origin' header" in browser console
- POST requests mysteriously becoming GET requests
- Preflight OPTIONS returning 401 or 405

**Phase to address:**
Phase 1 (Foundation) -- CORS configuration must be part of the initial FastAPI setup, tested against actual Vercel/Railway URLs, not just localhost.

---

### Pitfall 4: WPCode Snippet Execution Context and Size Limits

**What goes wrong:**
The entire custom API surface (12+ REST endpoints with authentication, database queries, commission calculations) is delivered as a single WPCode PHP snippet. WPCode snippets execute on `init` by default, but REST API route registration requires the `rest_api_init` hook. If the snippet fires at the wrong priority or the code is too large, endpoints either don't register or cause site-wide performance issues because the code runs on every page load.

**Why it happens:**
WPCode is designed for small snippets (analytics tracking, CSS tweaks), not for registering complex REST API surfaces. Developers don't realize that WPCode snippet execution timing differs from `functions.php` in subtle ways, and that large snippets loading on every request add overhead.

**How to avoid:**
- **Wrap all REST route registration inside `add_action('rest_api_init', ...)`.** This ensures routes only register when the REST API is actually being loaded, not on every frontend page request.
- **Set WPCode snippet to run "Everywhere" (not just frontend/admin)** -- REST API requests are neither frontend nor admin in WPCode's classification.
- **Set priority to 10 or lower** to ensure registration happens before any request routing.
- **Keep the snippet focused:** Only register routes and define callback functions. Move heavy logic (commission calculations, complex queries) into the callback functions themselves so they only execute when the endpoint is called.
- **Test the snippet won't crash the site.** If the snippet has a PHP error, WPCode's error handling may silently disable it. Always test with WP_DEBUG enabled.
- **Add snippet versioning comments** at the top so you can track which version is deployed on WordPress.

**Warning signs:**
- Custom endpoints return 404 "No route was found matching the URL and request method"
- Site becomes noticeably slower after adding the snippet
- WPCode shows the snippet as "inactive" after activation (auto-disabled due to error)

**Phase to address:**
Phase 1 (Foundation) -- the PHP snippet is the first deliverable and must be tested on the live Hostinger site before any frontend work begins.

---

### Pitfall 5: Google OAuth Without Domain Restriction Allows Unauthorized Access

**What goes wrong:**
Google OAuth is implemented but any Google account holder can log into the dashboard. Without domain restriction or an explicit allowlist, the dashboard meant for 2-5 team members is accessible to anyone with a Gmail account. Since this dashboard exposes customer PII, order data, and business financials, this is a serious security issue.

**Why it happens:**
Google OAuth tutorials focus on "login with Google" and skip the authorization step. Authentication (who are you?) is solved by Google, but authorization (should you have access?) must be handled by the application. Most tutorials don't cover restricting access to specific email addresses or domains.

**How to avoid:**
- **Implement an email allowlist** in the FastAPI backend. After Google OAuth validates the token, check the email against a hardcoded or environment-variable-based list of authorized emails.
  ```python
  ALLOWED_EMAILS = os.getenv("ALLOWED_EMAILS", "").split(",")
  if user_email not in ALLOWED_EMAILS:
      raise HTTPException(status_code=403, detail="Not authorized")
  ```
- **Restrict the Google OAuth consent screen** to "Internal" if using a Google Workspace domain, or validate against specific email addresses for personal Gmail accounts.
- **Use JWT tokens with short expiry** (15-30 minutes) and refresh tokens for session management. Store JWT in HTTP-only cookies, not localStorage.
- **Never store the Google OAuth client secret in the frontend.** The entire OAuth flow must go through the FastAPI backend.

**Warning signs:**
- No 403 response when logging in with an unauthorized Google account
- OAuth client secret visible in frontend JavaScript bundle
- Tokens stored in localStorage (accessible via XSS)

**Phase to address:**
Phase 1 (Foundation) -- authentication and authorization must be the first backend feature, with the email allowlist as a hard requirement before any other endpoints are exposed.

---

### Pitfall 6: WooCommerce API Key Permissions Misconfigured

**What goes wrong:**
The WooCommerce REST API key is created with insufficient permissions (Read-only when Write is needed for order status updates, or non-Administrator scope which restricts customer meta access). Alternatively, the key is created with too-broad permissions unnecessarily.

**Why it happens:**
WooCommerce API keys have two separate permission dimensions: **read/write/read-write** and **user scope** (which WordPress user the key is associated with). The user scope determines what capabilities the key inherits. If the key is tied to a non-admin user, customer meta_data will be empty (security update 242). If Read-only, order status updates and doctor approvals will fail with 403s.

**How to avoid:**
- **Create the API key under the admin user account** (josh.wiersema06@gmail.com) to ensure Administrator-level capabilities
- **Set permissions to Read/Write** since the dashboard needs to update order statuses and approve doctor applications
- **Document the required API key configuration** in the setup instructions
- **Test the key immediately** after creation with a simple GET to `/wc/v3/customers/1?_fields=meta_data` to verify meta_data is returned

**Warning signs:**
- Customer `meta_data` array returns empty
- PUT/POST requests to orders return 403 Forbidden
- Doctor approval endpoint fails silently

**Phase to address:**
Phase 1 (Foundation) -- API key creation and validation is literally the first setup step.

---

### Pitfall 7: Doctor Application Data Structure Unknown

**What goes wrong:**
The frontend is built assuming doctor applications have a specific data structure, but the actual structure depends on the `honor-labs-doctor-onboarding` plugin's implementation (838 lines of PHP). Applications might be stored as custom post types, custom database tables, or user meta -- and without examining the actual plugin code, the custom REST endpoint will query the wrong location and return no data.

**Why it happens:**
The PROJECT.md notes "Doctor applications likely stored as custom post type" (emphasis on "likely"). Building endpoints against an assumed data structure is a recipe for silent failures. The plugin could store applications as `hldo_application` posts, or in `wp_usermeta`, or in a custom `wp_hldo_applications` table.

**How to avoid:**
- **Before writing the PHP snippet, inspect the actual database.** Use phpMyAdmin on Hostinger or a WP-CLI command to find where doctor applications are stored:
  ```sql
  -- Check for custom post types
  SELECT DISTINCT post_type FROM wp_posts WHERE post_type LIKE '%doctor%' OR post_type LIKE '%application%' OR post_type LIKE '%onboard%';

  -- Check for custom tables
  SHOW TABLES LIKE '%doctor%';
  SHOW TABLES LIKE '%honor%';
  SHOW TABLES LIKE '%onboard%';

  -- Check user meta keys
  SELECT DISTINCT meta_key FROM wp_usermeta WHERE meta_key LIKE '%doctor%' OR meta_key LIKE '%approval%' OR meta_key LIKE '%npi%' OR meta_key LIKE '%practice%';
  ```
- **Read the plugin source code** (accessible via SFTP even though the plugin editor is blocked) to understand the exact data model
- **Build the PHP endpoint with explicit error handling** that returns meaningful errors if the expected data structure doesn't exist

**Warning signs:**
- Doctor applications endpoint returns empty array despite pending applications existing in WP admin
- Meta keys in the response don't match what the frontend expects
- Approval action doesn't actually change the doctor's status

**Phase to address:**
Phase 0 (Pre-development research) -- this investigation must happen before any code is written. It directly determines the PHP snippet design.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetching all orders then filtering client-side | Quick implementation, no custom endpoint needed | O(n) scaling, unusable past ~500 orders, high bandwidth | Never -- use server-side filtering from the start |
| Using `wc/v3/reports/sales` without verifying HPOS compat | Simple single API call for revenue | Returns wrong data, erodes trust in dashboard | Never with HPOS enabled -- verify or use wc-analytics |
| Storing WooCommerce API keys in FastAPI environment variables only | Works for single-instance deployment | Cannot rotate keys without redeployment, no key management | Acceptable for MVP with <5 users, replace with secrets manager later |
| Building all 12 custom REST endpoints at once | Complete API surface ready | Large untested PHP snippet, hard to debug, risky single deployment to production WPCode | Only if thoroughly tested in staging; prefer incremental deployment |
| Hardcoding B2BKing group IDs (599, 695) | Simpler code, fewer config files | Breaks if groups change, unclear magic numbers | Acceptable if documented as constants with comments explaining what they represent |
| Using localStorage for JWT/session tokens | Simple, works immediately | Vulnerable to XSS attacks | Never for a dashboard with business/PII data -- use HTTP-only cookies |
| Polling WooCommerce API on timer for dashboard updates | Simple to implement, no webhook setup needed | Unnecessary API calls, Hostinger rate limits, stale data between polls | Acceptable for MVP -- admin dashboards don't need real-time data; 30-second minimum interval |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WooCommerce REST API | Passing `consumer_key`/`consumer_secret` as query parameters | Use HTTP Basic Auth header (`Authorization: Basic base64(key:secret)`). Query params work but leak credentials in server access logs. FastAPI backend must use Basic Auth. |
| WooCommerce REST API | Not handling pagination (default 10 items per page, max 100) | Always check `X-WP-Total` and `X-WP-TotalPages` response headers. Implement automatic pagination in the FastAPI service layer to aggregate all pages. |
| WordPress REST API | Assuming custom endpoints inherit WooCommerce API key auth | Custom `honor-labs/v1` endpoints use WordPress authentication (application passwords, cookies, or nonce), NOT WooCommerce consumer key/secret. Must implement separate auth or use `permission_callback` checking for `manage_woocommerce` capability. |
| B2BKing (Free) | Expecting a dedicated REST API from B2BKing | B2BKing Free has no REST API. All B2BKing data is standard WordPress user meta and must be queried through custom endpoints. |
| Hostinger | Assuming `.htaccess` modifications for auth header forwarding are possible | Hostinger Cloud may restrict `.htaccess` changes. If Basic Auth headers aren't forwarded, test with query parameter auth as fallback, or contact Hostinger support. |
| WPCode | Registering routes with `add_action('init', ...)` | Must use `add_action('rest_api_init', ...)` -- routes registered on `init` may or may not work depending on timing. |
| Google OAuth | Exchanging the auth code on the frontend | The authorization code exchange must happen server-side (FastAPI). The frontend only handles the redirect and passes the code to the backend. |
| Railway | Using HTTP URLs for API calls | Railway 301-redirects HTTP to HTTPS, browsers convert POST to GET on redirect. Always use `https://` explicitly. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all customers to determine doctor/patient counts | Dashboard load takes 5-10+ seconds | Custom dashboard-stats endpoint that uses `count_users()` with meta_query on the WordPress side | At ~100 users the latency becomes noticeable |
| Loading full order objects for analytics | Chart data takes 30+ seconds to load | Use aggregated queries in the PHP snippet (SQL `SUM`, `GROUP BY`) or `wc-analytics` stats endpoints | At ~500 orders |
| No caching on FastAPI proxy | Every dashboard refresh hits WooCommerce API, Hostinger may rate-limit | Add TTL-based caching (Redis on Railway, or in-memory with `cachetools`) for read endpoints. 60-second TTL for dashboard stats, 5-minute for analytics. | When multiple team members use the dashboard simultaneously |
| Recharts rendering with too many data points | Charts become janky, browser tab uses 500MB+ RAM | Aggregate data to daily/weekly/monthly buckets server-side. Never send raw per-order data to charts. | At ~1000 data points on a single chart |
| N+1 queries in custom PHP endpoints | Doctor list endpoint takes 10+ seconds | Use single SQL query with JOINs instead of looping through users and calling `get_user_meta()` per user | At ~50 doctors |
| No request deduplication in React Query | Same endpoint called 5 times simultaneously on page load | Configure `staleTime` and `gcTime` in TanStack Query. Use query key conventions that enable proper caching. | Immediately -- wastes API calls from first use |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| WooCommerce API credentials in frontend JavaScript bundle | Anyone can inspect the bundle, extract credentials, and make arbitrary API calls to your store (create/delete orders, access all customer data) | This is why the FastAPI proxy exists. NEVER expose WooCommerce credentials to the frontend. All WooCommerce API calls must go through FastAPI. |
| Custom WordPress REST endpoints without `permission_callback` | Any unauthenticated user can call your custom endpoints, access doctor PII, patient data, commission data, and approve/reject applications | Every `register_rest_route()` must include `'permission_callback' => function() { return current_user_can('manage_woocommerce'); }` at minimum |
| FastAPI proxy without its own authentication | Anyone who discovers the Railway URL can access all proxied WooCommerce data | FastAPI must validate Google OAuth JWT tokens on every request. No endpoint should be accessible without a valid session. |
| CORS wildcard (`*`) with credentials | Any website can make authenticated requests to your API using a visitor's existing session | Use explicit origin allowlist. Never `allow_origins=["*"]` with `allow_credentials=True` (browsers block this anyway, but the intent matters). |
| Storing Google OAuth client secret in `.env` committed to git | Credential leak if repo is ever made public or shared | Use `.env.local` (gitignored), Railway environment variables, or Vercel environment variables. Never commit secrets. |
| No rate limiting on FastAPI endpoints | An attacker or buggy frontend can flood the WooCommerce site through the proxy | Add rate limiting middleware to FastAPI (e.g., `slowapi`). Limit to ~60 requests/minute per user for the proxy. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Loading full page while waiting for multiple API calls | User sees blank page for 5-10 seconds on dashboard | Load layout immediately with skeleton loaders. Fetch stat cards, chart, recent orders, and doctor pipeline in parallel using separate React Query hooks. |
| No optimistic updates on order status changes | User clicks "Complete" on an order, nothing happens for 2-3 seconds, user clicks again, double-update | Apply optimistic update via React Query's `onMutate`, revert on error. Show immediate visual feedback. |
| Commission calculations feel "off" because of rounding | Doctor sees $147.23 commission but expects $147.25 based on their math | Use server-side decimal precision (Python `Decimal`, PHP `bcmath`). Show calculation breakdown (rate x order total = commission) so users can verify. |
| No empty states for new installations | Dashboard shows "0 orders, 0 doctors, 0 patients" with blank charts -- looks broken | Design intentional empty states with calls to action: "No doctors yet -- share the registration link" with the URL. |
| Mixing up wholesale and retail in analytics | Business owner draws wrong conclusions about revenue mix | Use consistent, distinct visual treatments: blue for wholesale/B2B, green for retail/B2C. Label everything explicitly. Never show a single "revenue" number without the split. |
| CSV export includes internal IDs or raw meta keys | Exported data is unusable without translation | Map internal fields to human-readable column headers. Format dates, currency, and phone numbers for spreadsheet use. |

## "Looks Done But Isn't" Checklist

- [ ] **API Connection Test:** Often missing error differentiation -- verify it distinguishes between wrong credentials (401), wrong URL (connection error), missing WooCommerce (404 on /wp-json/wc/v3), and network issues
- [ ] **Doctor Approval:** Often missing the B2BKing group assignment -- verify approving a doctor actually sets `b2bking_customergroup` to "599", not just updates a status field
- [ ] **Order Status Update:** Often missing the WooCommerce note -- verify status changes create an order note visible in WooCommerce admin (not just updating the status field)
- [ ] **Commission Calculations:** Often missing refund handling -- verify refunded orders are excluded from commission totals, and partial refunds reduce commission proportionally
- [ ] **Pagination:** Often missing on secondary views -- verify doctor's patient list, doctor's order history, and commission detail rows all paginate (not just the main tables)
- [ ] **Search:** Often missing debouncing -- verify search doesn't fire API calls on every keystroke (should debounce 300ms minimum)
- [ ] **Dark Mode:** Often missing on modals, dropdowns, and toast notifications -- verify dark mode applies to ALL UI elements, not just the main layout
- [ ] **Error Recovery:** Often missing retry logic -- verify that after a network error, the user can retry without refreshing the entire page
- [ ] **WPCode Snippet:** Often missing update path -- verify the snippet includes a version number and can be updated without breaking existing functionality
- [ ] **Date/Timezone Handling:** Often mixing UTC and local time -- verify all dates display in the user's timezone, and date range filters use consistent timezone handling

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Customer meta not exposed (Pitfall 1) | LOW | Build custom endpoints -- no wasted work if caught early, significant rework if frontend was built assuming standard API |
| Reports API returns wrong data (Pitfall 2) | MEDIUM | Switch to wc-analytics endpoints or custom aggregation SQL. May require rewriting analytics data fetching layer. |
| CORS broken in production (Pitfall 3) | LOW | Configuration-only fix once diagnosed. Add exact origins to FastAPI middleware, verify Railway uses HTTPS. |
| WPCode snippet too large/wrong timing (Pitfall 4) | MEDIUM | Restructure snippet to use rest_api_init hook. May need to split into multiple snippets if WPCode has size issues. |
| Unauthorized Google accounts can log in (Pitfall 5) | HIGH if data was accessed | Add email allowlist immediately. Audit access logs. Rotate WooCommerce API keys if compromised. Cannot undo data exposure. |
| Wrong API key permissions (Pitfall 6) | LOW | Generate new API key with correct permissions. Update FastAPI environment variables. Takes 5 minutes. |
| Wrong doctor application data model (Pitfall 7) | HIGH | Must reverse-engineer the plugin, rewrite PHP endpoints, and update frontend type definitions. Can waste days if caught late. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Customer meta not exposed (1) | Phase 0 (pre-dev) + Phase 1 | Test custom endpoint returns B2BKing group, NPI, referral code for a known doctor |
| Reports API with HPOS (2) | Phase 1 + Phase 2 | Compare dashboard revenue numbers against WooCommerce admin dashboard; verify they match |
| CORS in production (3) | Phase 1 | Deploy to Railway/Vercel immediately after FastAPI scaffold is ready; verify preflight and authenticated requests work before building features |
| WPCode snippet execution (4) | Phase 1 | Install snippet on live WordPress, call endpoint from browser/Postman, verify 200 response |
| Google OAuth authorization (5) | Phase 1 | Attempt login with unauthorized Google account; verify 403 response |
| API key permissions (6) | Phase 1 | Verify meta_data is populated on customer GET; verify PUT to order status succeeds |
| Doctor application data model (7) | Phase 0 (pre-dev) | Run SQL queries against live database to locate application data; map fields before writing code |

## Sources

- [WooCommerce REST API Developer Docs](https://developer.woocommerce.com/docs/apis/rest-api/) -- HIGH confidence
- [WooCommerce HPOS Reports Bug #45354](https://github.com/woocommerce/woocommerce/issues/45354) -- HIGH confidence, verified fix PR
- [WooCommerce Security Update 242 - Customer Meta Restriction](https://wordpress.org/support/topic/api-and-customer-meta-data-security-update-242/) -- HIGH confidence
- [WordPress REST API Adding Custom Endpoints](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/) -- HIGH confidence, official docs
- [WooCommerce wc-analytics Undocumented Endpoints](https://github.com/woocommerce/woocommerce-admin/issues/4390) -- MEDIUM confidence, undocumented but functional
- [B2BKing REST API Documentation](https://woocommerce-b2b-plugin.com/docs/does-b2bking-have-a-rest-api-wp-and-woo-apis/) -- MEDIUM confidence
- [Railway CORS and 405 Troubleshooting](https://docs.railway.com/networking/troubleshooting/405-method-not-allowed) -- HIGH confidence
- [Vercel CORS Configuration](https://vercel.com/kb/guide/how-to-enable-cors) -- HIGH confidence
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/) -- HIGH confidence
- [WooCommerce REST API Meta Query Limitations](https://kayart.dev/woocommerce-rest-api-how-to-filter-by-a-meta-field/) -- MEDIUM confidence
- [Hostinger WordPress REST API Troubleshooting](https://www.hostinger.com/support/11035915-hostinger-wordpress-site-health-troubleshooting/) -- MEDIUM confidence

---
*Pitfalls research for: WooCommerce business admin dashboard with FastAPI proxy backend*
*Researched: 2026-03-07*
