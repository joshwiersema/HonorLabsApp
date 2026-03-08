# Roadmap: Honor Labs Business Control Dashboard

## Overview

This roadmap delivers a standalone business control dashboard for Honor Labs in four phases. We start by building the three-tier infrastructure (FastAPI backend, PHP WordPress endpoints, React app shell with auth) so that every subsequent phase has a working pipeline to pull live data. Phase 2 exercises that pipeline with standard WooCommerce data -- the dashboard homepage, order management, and product catalog. Phase 3 builds the Honor Labs-specific domain: doctor applications, patient management, and commission tracking, all powered by the custom PHP endpoints from Phase 1. Phase 4 adds analytics charts, dark mode, and CSV export once the underlying data is proven correct.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Backend proxy, WordPress PHP endpoints, app shell with auth and navigation
- [ ] **Phase 2: Core Data Views** - Dashboard KPIs, order management, and product catalog
- [ ] **Phase 3: Doctor, Patient, and Commission Management** - Doctor applications, active doctors, patients, and commission tracking
- [ ] **Phase 4: Analytics and Polish** - Business analytics charts, dark mode, and CSV export

## Phase Details

### Phase 1: Foundation
**Goal**: A working three-tier pipeline where an authenticated user can log in via Google OAuth, see an app shell with sidebar navigation, and the backend can successfully proxy requests to WooCommerce and custom WordPress endpoints
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, AUTH-01, AUTH-02, AUTH-03, AUTH-04, UX-02, UX-03, UX-06
**Success Criteria** (what must be TRUE):
  1. User can sign in with Google OAuth and remain logged in after refreshing the browser
  2. First-time setup screen allows entering WordPress site URL and WooCommerce API credentials, and a connection test confirms they work
  3. App shell displays a sidebar with navigation links to all pages (Dashboard, Orders, Products, Doctors, Patients, Commissions, Analytics) and a top bar with app title and connection status
  4. Backend can proxy a request to the WooCommerce REST API and return live data (e.g., fetching orders)
  5. Custom PHP endpoints under `honor-labs/v1` namespace are registered on WordPress and return B2BKing customer group data, doctor applications, doctor-patient relationships, and commission-relevant data
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Core Data Views
**Goal**: Users can view real-time business metrics on a dashboard homepage, manage orders with full filtering and status updates, and browse the product catalog with inventory status
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, ORD-01, ORD-02, ORD-03, ORD-04, ORD-05, ORD-06, ORD-07, ORD-08, ORD-09, ORD-10, PROD-01, PROD-02, PROD-03, PROD-04, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. Dashboard displays KPI stat cards (total revenue, total orders, active doctors, active patients) with both all-time and current-month values, a revenue chart with wholesale/retail split and 30d/90d/12m toggles, recent orders widget, and doctor pipeline widget with quick-approve buttons
  2. Orders page shows a sortable, filterable, searchable, paginated table with color-coded status badges, and clicking an order opens a detail view where admin can update order status
  3. Products page displays all products with image, name, SKU, price, and color-coded inventory status, with a grid/list toggle and product detail view
  4. All data-fetching views show loading spinners while fetching and helpful empty-state messages when no data exists
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Doctor, Patient, and Commission Management
**Goal**: Users can manage the full doctor lifecycle (applications through active status), view patients with their linked doctors, and track commissions per doctor with configurable rates
**Depends on**: Phase 1, Phase 2
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-08, PAT-01, PAT-02, PAT-03, PAT-04, COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06
**Success Criteria** (what must be TRUE):
  1. Doctors page shows pending applications with approve/reject actions (approve sets B2BKing group 599, reject accepts optional reason) and a separate active doctors table with referral codes, patient counts, and revenue
  2. Clicking a doctor opens a profile view showing full info, a copyable referral code, linked patients list, wholesale order history, and patient orders attributed to them
  3. Patients page shows a searchable, filterable patient table with linked doctor info, and clicking a patient opens a detail view with full info, linked doctor, and order history
  4. Commissions page shows overview totals (earned, paid, outstanding), a per-doctor commission table with expandable rows showing individual patient orders, configurable default rate, per-doctor rate overrides, and CSV export
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Analytics and Polish
**Goal**: Users can analyze business trends through dedicated analytics charts and toggle dark mode for comfortable viewing
**Depends on**: Phase 2, Phase 3
**Requirements**: ANAL-01, ANAL-02, ANAL-03, UX-01
**Success Criteria** (what must be TRUE):
  1. Analytics page displays revenue-by-product bar chart, revenue-by-doctor chart, and growth charts showing new doctors and new patients per month
  2. Dark mode toggle in the top bar switches the entire app to a dark color scheme and the preference persists across browser sessions
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/? | Not started | - |
| 2. Core Data Views | 0/? | Not started | - |
| 3. Doctor, Patient, and Commission Management | 0/? | Not started | - |
| 4. Analytics and Polish | 0/? | Not started | - |
