# Requirements: Honor Labs Business Control Dashboard

**Defined:** 2026-03-07
**Core Value:** Business owners can monitor and manage all Honor Labs operations from a single polished dashboard without touching WordPress.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: FastAPI backend serves as secure proxy to WooCommerce/WordPress REST APIs
- [ ] **INFRA-02**: WooCommerce consumer key/secret stored server-side (never in frontend)
- [ ] **INFRA-03**: Custom WordPress REST endpoints registered via WPCode PHP snippet under `honor-labs/v1` namespace
- [ ] **INFRA-04**: PHP endpoints query B2BKing customer groups (`b2bking_customergroup` user meta)
- [ ] **INFRA-05**: PHP endpoints expose doctor applications, doctor-patient relationships, referral codes, and commission data
- [ ] **INFRA-06**: CORS configured correctly for Vercel→Railway→WordPress chain

### Authentication

- [ ] **AUTH-01**: Team members can sign in via Google OAuth
- [ ] **AUTH-02**: User session persists across browser refreshes (JWT tokens)
- [ ] **AUTH-03**: First-time setup allows configuring WordPress site URL and WC API credentials
- [ ] **AUTH-04**: Connection test validates WooCommerce API credentials work

### Dashboard

- [ ] **DASH-01**: KPI stat cards display total revenue, total orders, active doctors, active patients
- [ ] **DASH-02**: Stat cards show both all-time and current-month values
- [ ] **DASH-03**: Revenue chart shows data over time with 30d/90d/12m toggle
- [ ] **DASH-04**: Revenue chart splits wholesale (doctor) vs retail (patient) revenue
- [ ] **DASH-05**: Recent orders widget shows last 10 orders with customer name, type badge, total, status, date
- [ ] **DASH-06**: Doctor pipeline widget shows pending application count with quick-approve buttons
- [ ] **DASH-07**: Quick action buttons navigate to Orders, Doctors, Products pages

### Orders

- [ ] **ORD-01**: Order list table with columns: #, Date, Customer, Type (Doctor/Patient badge), Items, Total, Status
- [ ] **ORD-02**: Orders sortable by any column
- [ ] **ORD-03**: Orders filterable by status, date range, and customer type (doctor/patient)
- [ ] **ORD-04**: Orders searchable by order number, customer name, or email
- [ ] **ORD-05**: Order list paginates results
- [ ] **ORD-06**: Color-coded status badges (Processing=blue, Completed=green, On-hold=yellow, Cancelled=red, Refunded=gray)
- [ ] **ORD-07**: Order detail view shows billing/shipping, line items, totals, taxes, shipping cost
- [ ] **ORD-08**: Order detail shows customer info with doctor/patient badge
- [ ] **ORD-09**: Patient orders show which doctor referred them
- [ ] **ORD-10**: Admin can update order status from detail view

### Products

- [ ] **PROD-01**: Product list displays image, name, SKU, price, stock status
- [ ] **PROD-02**: Grid/list toggle view for products
- [ ] **PROD-03**: Product detail view with full info (description, prices, stock, categories)
- [ ] **PROD-04**: Inventory status indicators (green=in stock, yellow=low, red=out of stock)

### Doctors

- [ ] **DOC-01**: Doctor applications table with name, email, NPI, practice, specialty, status, date
- [ ] **DOC-02**: Pending applications highlighted with Approve/Reject action buttons
- [ ] **DOC-03**: Approve action sets B2BKing group to 599 and triggers approval workflow
- [ ] **DOC-04**: Reject action accepts optional reason
- [ ] **DOC-05**: Active doctors table with name, email, NPI, practice, referral code, patient count, revenue
- [ ] **DOC-06**: Doctor profile view with full info, referral code (copy button), linked patients list
- [ ] **DOC-07**: Doctor profile shows their wholesale order history
- [ ] **DOC-08**: Doctor profile shows patient orders attributed to them (for commissions)

### Patients

- [ ] **PAT-01**: Patient list table with name, email, linked doctor, registration date, total orders, total spent
- [ ] **PAT-02**: Patient list filterable by linked doctor
- [ ] **PAT-03**: Patient list searchable by name or email
- [ ] **PAT-04**: Patient detail view with full info, linked doctor, order history

### Commissions

- [ ] **COMM-01**: Commission overview shows total earned, total paid, total outstanding
- [ ] **COMM-02**: Per-doctor commission table with patient order count, patient revenue, rate, earned, paid, outstanding
- [ ] **COMM-03**: Expandable rows showing individual patient orders that generated commission
- [ ] **COMM-04**: Configurable default commission rate (percentage)
- [ ] **COMM-05**: Per-doctor commission rate override
- [ ] **COMM-06**: Commission data exportable to CSV

### Analytics

- [ ] **ANAL-01**: Revenue by product bar chart
- [ ] **ANAL-02**: Revenue by doctor chart (which doctors generate the most business)
- [ ] **ANAL-03**: Growth charts showing new doctors and new patients per month

### UI/UX

- [ ] **UX-01**: Dark mode toggle that persists across sessions
- [ ] **UX-02**: Sidebar navigation with all page links
- [ ] **UX-03**: Top bar with app title, dark mode toggle, connection status
- [ ] **UX-04**: Loading states for all data-fetching views
- [ ] **UX-05**: Empty states with helpful messaging when no data
- [ ] **UX-06**: Responsive layout optimized for desktop, functional on tablet

## v2 Requirements

### Authentication

- **AUTH-V2-01**: Email allowlist restricting which Google accounts can access
- **AUTH-V2-02**: Role-based access (admin vs viewer)

### Analytics

- **ANAL-V2-01**: Customer lifetime value comparison (doctors vs patients)
- **ANAL-V2-02**: Geographic distribution by state from billing addresses
- **ANAL-V2-03**: Top customers table
- **ANAL-V2-04**: Reorder rate and product mix pie chart

### Orders

- **ORD-V2-01**: Order analytics sidebar (average order value, status breakdown pie chart)
- **ORD-V2-02**: Add order notes from dashboard
- **ORD-V2-03**: Issue refunds from dashboard

### Products

- **PROD-V2-01**: Quick stock quantity update from product list
- **PROD-V2-02**: Product edit modal (name, prices, description)
- **PROD-V2-03**: Sales data chart per product (units sold over time)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct product creation/deletion | Use WooCommerce admin for catalog management |
| Patient/doctor self-service portal | This is an admin tool, not a customer-facing app |
| Mobile native app | Web responsive is sufficient for admin use |
| Email sending from dashboard | WordPress handles transactional email |
| Payment processing | WooPayments handles payments on WordPress side |
| Real-time websockets | Polling/refresh is fine for 2-5 admin users |
| Full product editing | Read-heavy dashboard; use WooCommerce for writes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| DASH-05 | Phase 2 | Pending |
| DASH-06 | Phase 2 | Pending |
| DASH-07 | Phase 2 | Pending |
| ORD-01 | Phase 2 | Pending |
| ORD-02 | Phase 2 | Pending |
| ORD-03 | Phase 2 | Pending |
| ORD-04 | Phase 2 | Pending |
| ORD-05 | Phase 2 | Pending |
| ORD-06 | Phase 2 | Pending |
| ORD-07 | Phase 2 | Pending |
| ORD-08 | Phase 2 | Pending |
| ORD-09 | Phase 2 | Pending |
| ORD-10 | Phase 2 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| DOC-01 | Phase 3 | Pending |
| DOC-02 | Phase 3 | Pending |
| DOC-03 | Phase 3 | Pending |
| DOC-04 | Phase 3 | Pending |
| DOC-05 | Phase 3 | Pending |
| DOC-06 | Phase 3 | Pending |
| DOC-07 | Phase 3 | Pending |
| DOC-08 | Phase 3 | Pending |
| PAT-01 | Phase 3 | Pending |
| PAT-02 | Phase 3 | Pending |
| PAT-03 | Phase 3 | Pending |
| PAT-04 | Phase 3 | Pending |
| COMM-01 | Phase 3 | Pending |
| COMM-02 | Phase 3 | Pending |
| COMM-03 | Phase 3 | Pending |
| COMM-04 | Phase 3 | Pending |
| COMM-05 | Phase 3 | Pending |
| COMM-06 | Phase 3 | Pending |
| ANAL-01 | Phase 4 | Pending |
| ANAL-02 | Phase 4 | Pending |
| ANAL-03 | Phase 4 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 1 | Pending |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 2 | Pending |
| UX-05 | Phase 2 | Pending |
| UX-06 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
