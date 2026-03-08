# Feature Research

**Domain:** B2B/B2C e-commerce admin dashboard (WooCommerce-backed supplement marketplace)
**Researched:** 2026-03-07
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any e-commerce admin dashboard. Missing these makes the product feel broken or incomplete. These are informed by what Shopify Admin, Metorik, and standard WooCommerce analytics plugins all include.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **KPI summary cards** (revenue, orders, customers) | Every admin dashboard opens with headline metrics. Without them users have no quick pulse check. | LOW | 4 cards: Total Revenue (all-time + this month), Total Orders, Active Doctors, Active Patients. Include delta/trend vs. prior period. |
| **Revenue chart with time-range toggles** | Metorik, Shopify, and WooCommerce native analytics all provide this. Users expect to see revenue over 30/90/365 days. | MEDIUM | Line/area chart with wholesale vs. retail color split. Use WC Reports API for data. |
| **Order list with filtering and search** | Core function of any commerce admin. Orders are the heartbeat of the business. | MEDIUM | Sortable columns, status filter (processing/completed/on-hold/cancelled/refunded), date range, customer type (doctor/patient), search by order number/name/email. Pagination required. |
| **Order detail view** | Clicking an order and seeing nothing is a dead end. Users need line items, billing/shipping, totals, status history. | MEDIUM | Include customer badge (doctor/patient), linked doctor for patient orders, order notes, and status update action. |
| **Order status updates** | Admin needs to move orders through the pipeline without opening WooCommerce. | LOW | Dropdown or button set for status transitions with confirmation. Calls WC REST API PUT. |
| **Product catalog view** | Even read-heavy dashboards must show inventory. Users need to see what they sell and current stock. | LOW | Grid or list toggle. Show image thumbnail, name, wholesale price, retail price, stock status. |
| **Stock status indicators** | Inventory visibility is non-negotiable for a product business. Low/out-of-stock must be visually obvious. | LOW | Green/yellow/red badges. Threshold-based (e.g., <10 = yellow, 0 = red). |
| **Customer list (doctors + patients)** | The business revolves around two user types. An admin must be able to browse and search both. | MEDIUM | Two separate pages (Doctors, Patients) with search, sorting, and click-through to profiles. |
| **Doctor application management** | This is the onboarding funnel. Pending applications that sit unreviewed block revenue. | MEDIUM | List pending/approved/rejected with approve/reject action buttons. Approve triggers B2BKing group assignment via custom REST endpoint. |
| **Dark mode** | Expected in any modern admin dashboard since 2022. SaaS users assume it exists. | LOW | CSS-based theme toggle using Tailwind dark mode. Persist preference in localStorage/Zustand. |
| **Responsive layout** (desktop primary, tablet secondary) | Admins occasionally check from tablets. Full mobile optimization is not expected for admin tools, but tablet must work. | LOW | Sidebar collapses to hamburger on smaller screens. Tables scroll horizontally. |
| **Loading, error, and empty states** | Without these the app feels broken on slow connections or when data is missing. | LOW | Skeleton screens for loading (not spinners for primary content), error messages with retry, helpful empty states ("No orders yet"). |
| **Connection/auth settings page** | Users need to configure API credentials and test connectivity before anything works. | LOW | Google OAuth for team auth. API connection test with clear success/failure feedback. Store config server-side via FastAPI. |

### Differentiators (Competitive Advantage)

Features that set this dashboard apart from using Metorik or the native WooCommerce admin. These are where the value of a custom-built solution lives.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Doctor-patient relationship view** | No off-the-shelf tool understands Honor Labs' two-sided marketplace. Seeing which doctor referred which patient, and the revenue chain, is the unique insight this dashboard provides. | MEDIUM | Doctor profile shows linked patients. Patient profile shows linked doctor. Requires custom WP REST endpoints querying B2BKing group meta and referral code linkages. |
| **Commission tracking and management** | The core financial relationship. Doctors earn 10-15% on patient orders. No generic WooCommerce plugin calculates this specific model. Metorik cannot do this. | HIGH | Per-doctor commission breakdown: patient orders attributed to them, commission rate, earned/paid/outstanding. Configurable default rate with per-doctor override. This is the single most valuable differentiator. |
| **Commission export to CSV** | Commissions need to be reconciled with actual payouts. A downloadable report is essential for bookkeeping. | LOW | CSV of commission table with doctor name, patient orders, commission earned, paid, outstanding. Straightforward with client-side CSV generation (e.g., papaparse or manual). |
| **Wholesale vs. retail revenue split** | Generic dashboards show total revenue. Honor Labs needs to see B2B wholesale vs. B2C retail as separate revenue streams because margins and strategies differ. | MEDIUM | Revenue chart split by customer group. Requires classifying each order by the customer's B2BKing group. Custom endpoint aggregates this server-side for performance. |
| **Doctor pipeline widget** (pending applications count + quick-approve) | Reduces friction in the onboarding funnel. Surfacing pending applications on the dashboard home page means they get processed faster instead of being buried in a sub-page. | LOW | Dashboard card showing count of pending, with top 3 listed and one-click approve. Links to full Doctors page. |
| **Referral code performance tracking** | Each doctor has a unique referral code. Knowing which codes are actively used vs. dormant tells you which doctors are engaged. | MEDIUM | Table: referral code, doctor name, times used, patients generated, revenue attributed. Requires custom endpoint joining referral code meta with patient registrations and orders. |
| **Per-doctor revenue chart** | Goes beyond "who ordered the most" to show the full value chain: doctor's own wholesale orders PLUS the patient retail orders they generated. | MEDIUM | Mini line chart on doctor profile page. Data from custom endpoint aggregating doctor direct orders + attributed patient orders. |
| **Business analytics page** (growth, product mix, customer LTV) | Metorik charges $50-200/month for analytics at this depth. Building it in means no recurring SaaS cost and data stays in-house. | HIGH | Revenue by product (bar chart), new doctors/patients per month (growth chart), product mix (pie chart), top customers table, doctor-to-patient ratio over time. |
| **NPI number display and lookup context** | Healthcare-specific professional identity. When reviewing a doctor application, seeing the NPI front-and-center with practice/specialty info builds confidence in approval decisions. | LOW | Display NPI prominently on doctor profile and application review. Optionally link to CMS NPI Registry lookup for verification. |
| **Secure API proxy architecture** | Credentials never touch the browser. Unlike Metorik (SaaS with data on their servers) or direct frontend-to-WC (keys in browser), this keeps everything server-side. | N/A (architectural, not feature) | Already decided. This is a selling point vs. alternatives, not a feature to build separately. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but create problems for this specific project scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full product creation/editing** | "Why not manage everything from one place?" | WooCommerce product editor is deeply complex (variations, attributes, images, SEO, categories, cross-sells). Rebuilding it is months of work for 4 products. Maintenance burden exceeds value. | Read-only product view with stock-level quick-update. Link to WooCommerce admin for full editing. |
| **Real-time websockets** | "I want live order notifications." | For ~10 users and low order volume, websockets add infrastructure complexity (WebSocket server, connection management, reconnection logic) with near-zero payback. | Polling on 60-second intervals. TanStack Query's refetchInterval handles this cleanly. Manual refresh button for impatient moments. |
| **Email sending from dashboard** | "Let me email doctors/patients from here." | Email deliverability is a whole domain (SPF, DKIM, templates, bounce handling). WordPress already handles transactional email via WP Mail SMTP. Duplicating it creates confusion about which system sent what. | Link to doctor/patient email address (mailto:). Let WordPress handle all transactional email. |
| **Payment processing or refund initiation** | "Process refunds right from the dashboard." | WooPayments handles payment processing. Initiating refunds through a proxy API adds risk of partial failures, double-refunds, and audit trail gaps. The blast radius of a bug is financial loss. | Display refund status from WooCommerce. For refund actions, link to WooCommerce order admin. Consider adding refund capability only after v1 is stable and well-tested. |
| **Customer self-service portal** | "Let doctors and patients log in too." | Completely different auth model, permission system, and UI needs. Doctors already have a WordPress-based dashboard plugin. Adding self-service turns a 2-5 user admin tool into a multi-tenant SaaS platform. | This is an admin-only tool. Doctors and patients use the existing WordPress frontend. |
| **Mobile-native app** | "We should have an app." | 2-5 admin users who primarily work at desks. Native app development doubles the codebase for no validated need. | Responsive web app. Works on mobile browsers if needed. PWA install is trivial to add later if demand arises. |
| **Multi-store support** | "What if we expand?" | Premature abstraction. Honor Labs has one store. Building multi-store now adds complexity to every data query and UI element for a scenario that may never happen. | Single-store architecture. If expansion happens, refactoring a well-structured single-store app is easier than maintaining unused multi-store abstractions. |
| **AI-powered insights/recommendations** | "AI is hot, add some AI features." | Generic AI insights ("your revenue is up 12%!") are noise. Useful AI requires domain-specific training data that doesn't exist at 10 users. | Simple trend indicators (up/down arrows, percentage changes). If the business scales to meaningful data volumes, revisit with specific hypotheses about what AI should answer. |
| **Notification/alert system** | "Alert me when a new application comes in." | Push notifications require service workers, notification permissions, and a delivery mechanism. For a small team checking the dashboard daily, the pipeline widget on the home page serves the same purpose. | Dashboard home page shows pending application count prominently. Browser tab title could show count (e.g., "(3) Honor Labs Dashboard"). |
| **Drag-and-drop dashboard customization** | "Let users rearrange dashboard widgets." | 2-5 users, one dashboard purpose. Building a layout engine (grid system, persistence, responsive breakpoints per layout) is high effort for cosmetic personalization. | Fixed, well-designed layout. If a widget arrangement isn't working, change it in code -- it's faster than building a layout editor. |

## Feature Dependencies

```
Google OAuth Authentication
    +-- requires --> FastAPI Backend (proxy + auth middleware)
                        +-- requires --> WooCommerce REST API Keys configured
                        +-- requires --> Custom WP REST Endpoints (WPCode PHP snippet)

Dashboard Home (KPI cards, revenue chart, recent orders, pipeline widget)
    +-- requires --> Order data (WC REST API /wc/v3/orders)
    +-- requires --> Customer data (custom /honor-labs/v1/doctors, /honor-labs/v1/patients)
    +-- requires --> Doctor applications (custom /honor-labs/v1/doctor-applications)
    +-- requires --> Revenue aggregation (custom /honor-labs/v1/dashboard-stats)

Order Management (list + detail + status updates)
    +-- requires --> WC REST API /wc/v3/orders
    +-- requires --> Customer type identification (B2BKing group lookup)

Doctor Management (applications + active list + profiles)
    +-- requires --> Custom WP REST endpoints
    +-- requires --> B2BKing group meta access
    +-- enhances --> Commission Tracking (doctor profiles show commission data)

Patient Management (list + profiles)
    +-- requires --> Custom WP REST endpoints
    +-- requires --> Doctor-patient linkage data (referral code relationships)

Commission Tracking
    +-- requires --> Doctor Management (need doctor list and profiles)
    +-- requires --> Patient Management (need patient-to-doctor linkages)
    +-- requires --> Order data with customer type classification
    +-- requires --> Custom commission calculation endpoint

Analytics Page
    +-- requires --> Order Management (historical order data)
    +-- requires --> Doctor Management (doctor enrollment dates)
    +-- requires --> Patient Management (patient enrollment dates)
    +-- enhances --> Dashboard Home (shares chart components and data patterns)

CSV Export
    +-- requires --> Data tables to be functional first (orders, doctors, patients, commissions)

Dark Mode
    +-- independent --> No dependencies, can be built at any phase
```

### Dependency Notes

- **Custom WP REST endpoints are the critical path.** The dashboard-stats, doctors, patients, doctor-applications, and commissions endpoints must be built before any Honor Labs-specific UI can be functional. This PHP snippet is the single biggest blocker.
- **Commission tracking depends on three other features.** It needs working doctor profiles, patient-doctor linkages, and order classification. Build it last among the domain-specific features.
- **Analytics is an aggregation layer.** It depends on all other data features being stable first. It reuses the same API endpoints but with different time-range and grouping parameters.
- **CSV export is a thin layer** on top of existing tables. Low complexity but depends on the underlying data being correct first.

## MVP Definition

### Launch With (v1)

The minimum needed to replace daily WooCommerce admin logins for business monitoring and doctor management.

- [ ] **FastAPI backend proxy with Google OAuth** -- Without auth and the proxy, nothing works
- [ ] **Custom WP REST Endpoints (WPCode PHP snippet)** -- Without these, all Honor Labs-specific features are blocked
- [ ] **Dashboard home with KPI cards and revenue chart** -- The first thing the owner sees; validates the entire concept
- [ ] **Order list with filtering, search, and detail view** -- Orders are the daily bread-and-butter of admin work
- [ ] **Order status updates** -- Must be able to process orders without switching to WooCommerce
- [ ] **Doctor application management (view, approve, reject)** -- Active business process that currently requires WooCommerce admin
- [ ] **Active doctors list with profiles** -- Need to see doctor details and their linked patients
- [ ] **Patient list with linked doctor info** -- Need to see patient-doctor relationships
- [ ] **Product catalog view with stock indicators** -- Need to see inventory status at a glance
- [ ] **Settings/connection page** -- Must configure API connection and test it
- [ ] **Loading, error, and empty states** -- Without these the app feels broken
- [ ] **Dark mode** -- Low effort, high perceived polish; include from day one

### Add After Validation (v1.x)

Features to add once the core dashboard is being used daily and the data pipelines are proven reliable.

- [ ] **Commission tracking page** -- Add when the owner starts asking "how much do I owe each doctor?" (likely within first week of use)
- [ ] **Commission CSV export** -- Add alongside commission tracking
- [ ] **Wholesale vs. retail revenue split on charts** -- Refine the revenue chart once basic version is validated
- [ ] **Doctor pipeline widget on dashboard** -- Quick-approve from home page once application flow is proven
- [ ] **Referral code performance tracking** -- Add when there are enough doctors/patients to make the data meaningful
- [ ] **Per-doctor revenue chart** -- Add to doctor profile page after profiles are validated
- [ ] **Quick stock update on products** -- Light write operation, add after read-only product view is stable
- [ ] **Order analytics sidebar** (AOV, status breakdown pie chart) -- Polish for the orders page

### Future Consideration (v2+)

Features to defer until the dashboard has been in use for weeks/months and real usage patterns emerge.

- [ ] **Full analytics page** (growth charts, product mix, customer LTV, geographic distribution) -- Defer until there's enough historical data for charts to be meaningful; 10 users today won't produce insightful analytics
- [ ] **CSV export for all data tables** (orders, doctors, patients) -- Add per user request; commission CSV is the priority
- [ ] **Responsive mobile optimization** -- Defer unless usage data shows tablet/mobile access
- [ ] **Per-doctor commission rate overrides** -- Defer unless the business actually has different rates for different doctors
- [ ] **NPI Registry lookup integration** -- Nice to have on doctor profiles; defer until doctor volume justifies it

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| FastAPI backend proxy + Google OAuth | HIGH | MEDIUM | P1 |
| Custom WP REST Endpoints (PHP snippet) | HIGH | HIGH | P1 |
| Dashboard KPI cards + revenue chart | HIGH | MEDIUM | P1 |
| Order list + detail + status update | HIGH | MEDIUM | P1 |
| Doctor application management | HIGH | MEDIUM | P1 |
| Active doctors list + profiles | HIGH | MEDIUM | P1 |
| Patient list + profiles | MEDIUM | MEDIUM | P1 |
| Product catalog view + stock indicators | MEDIUM | LOW | P1 |
| Settings/connection page | HIGH | LOW | P1 |
| Loading/error/empty states | MEDIUM | LOW | P1 |
| Dark mode | MEDIUM | LOW | P1 |
| Commission tracking page | HIGH | HIGH | P2 |
| Commission CSV export | HIGH | LOW | P2 |
| Wholesale/retail revenue split | MEDIUM | MEDIUM | P2 |
| Doctor pipeline widget (dashboard) | MEDIUM | LOW | P2 |
| Referral code tracking | MEDIUM | MEDIUM | P2 |
| Per-doctor revenue chart | MEDIUM | MEDIUM | P2 |
| Quick stock update | LOW | LOW | P2 |
| Order analytics sidebar | LOW | LOW | P2 |
| Full analytics page | MEDIUM | HIGH | P3 |
| CSV export (all tables) | LOW | LOW | P3 |
| Mobile responsiveness polish | LOW | MEDIUM | P3 |
| Per-doctor commission rate overrides | LOW | LOW | P3 |
| NPI Registry lookup | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- the dashboard is incomplete without these
- P2: Should have, add in first iteration after launch -- high value, moderate effort
- P3: Nice to have, add based on real usage data and user feedback

## Competitor Feature Analysis

| Feature | Metorik ($50-200/mo) | Shopify Admin (native) | WooCommerce Admin (native) | Honor Labs Dashboard (this project) |
|---------|---------------------|----------------------|---------------------------|--------------------------------------|
| KPI summary cards | Yes, customizable | Yes, fixed layout | Basic, limited | Yes, tailored to Honor Labs metrics |
| Revenue charts | Yes, extensive with segmentation | Yes, with channel breakdown | Basic line chart | Yes, with wholesale/retail split |
| Order management | Yes, full CRUD with bulk actions | Yes, full CRUD | Yes, full CRUD | Read + status updates (no create/delete) |
| Customer segmentation | Yes, infinite filter stacking | Yes, by tags/segments | Limited by role | By B2BKing group (doctor/patient) |
| Product analytics | Yes, profit margins + forecasting | Yes, with inventory tracking | Basic sales data | Read-only catalog + stock status |
| Commission tracking | No | No (needs app) | No (needs plugin) | Yes, built-in and purpose-built |
| Doctor-patient relationships | No | No | No | Yes, core feature |
| Doctor application workflow | No | No | No | Yes, approve/reject with B2BKing integration |
| Referral code tracking | No | No | No (needs plugin) | Yes, with revenue attribution |
| B2B/B2C revenue split | Possible with manual tagging | Yes (native B2B on Plus) | No | Yes, automatic via B2BKing groups |
| CSV export | Yes, extensive | Yes | Yes | Yes, targeted (commissions first) |
| Dark mode | No | No | No | Yes |
| API credentials in browser | N/A (SaaS, data on their servers) | N/A (native) | N/A (native) | No, FastAPI proxy keeps credentials server-side |
| Cost | $50-200/month ongoing | Included with Shopify | Free (limited) | One-time build cost, no recurring SaaS fee |

**Key insight:** No existing tool combines WooCommerce admin capabilities with Honor Labs' specific B2B/B2C doctor-patient relationship model, commission tracking, and application workflow. Metorik is the closest competitor for general analytics, but it cannot model the referral-commission chain. That chain is the core reason this custom dashboard exists.

## Sources

- [Metorik Reports & Features](https://metorik.com/features/reports) -- Comprehensive WooCommerce analytics SaaS, closest competitor
- [Metorik Custom Dashboards](https://metorik.com/blog/custom-woocommerce-dashboards) -- Customizable dashboard capabilities
- [Shopify Admin Dashboard Guide](https://www.eesel.ai/blog/shopify-admin) -- Feature set of the industry-leading e-commerce admin
- [Shopify B2B Features](https://help.shopify.com/en/manual/b2b/getting-started/features) -- B2B wholesale capabilities in Shopify Plus
- [WooCommerce Analytics Plugins Comparison](https://wplift.com/best-woocommerce-reports-analytics-plugins/) -- Landscape of WC analytics solutions
- [Dashboard Anti-Patterns](https://startingblockonline.org/dashboard-anti-patterns-12-mistakes-and-the-patterns-that-replace-them/) -- 12 common dashboard design mistakes and solutions
- [E-commerce Dashboard Best Practices](https://www.usedatabrain.com/blog/ecommerce-admin-dashboard) -- Admin panel design principles
- [B2B E-commerce Features Checklist](https://www.shopify.com/enterprise/blog/b2b-ecommerce-features-wholesale) -- Wholesale feature requirements
- [CSS Sales Team (commission tracking)](https://apps.shopify.com/sales-rep) -- Commission management app reference
- [NPI Registry (CMS)](https://npiregistry.cms.hhs.gov/) -- NPI verification source for doctor management

---
*Feature research for: B2B/B2C e-commerce admin dashboard (WooCommerce-backed supplement marketplace)*
*Researched: 2026-03-07*
