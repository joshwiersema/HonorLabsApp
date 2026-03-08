# Honor Labs Business Control App — Claude Code Development Prompt

## Project Overview

Build a **custom business control dashboard app** for Honor Labs, a B2B/B2C supplement marketplace that connects eye care doctors with patients. The app replaces the need for business owners to manage operations through WordPress/WooCommerce admin panels. It pulls live data from the WordPress/WooCommerce REST API and custom REST endpoints, presenting everything in a clean, modern business application interface.

**The app should feel like a standalone SaaS dashboard — not like WordPress.**

---

## 1. Business Context (Read This First)

Honor Labs is a two-sided marketplace for eye health supplements:

- **Doctors (B2B):** Eye care professionals register with NPI verification, get admin-approved, receive a unique referral code, and order wholesale (minimum 24 units per product at $7-$9/unit).
- **Patients (B2C):** Patients register using a doctor's referral code, get linked to that doctor, and order retail (single units at $14.99-$19.99/unit). Doctors earn 10-15% commission on their patients' orders.
- **Access Control:** Only approved doctors (B2BKing group 599) and verified patients (B2BKing group 695) can browse/buy. General visitors (B2C) cannot access the shop.

### Current Tech Stack
- **Platform:** WordPress 6.x + WooCommerce 10.5.3 on Hostinger Cloud
- **URL:** `https://darkorange-skunk-283648.hostingersite.com`
- **B2B Engine:** B2BKing Core v5.0.25 (free) — manages customer groups
- **Custom Plugins (5):**
  - `honor-labs-doctor-onboarding` v1.0.1 — Doctor registration + NPI verification + admin approval workflow
  - `honor-labs-patient-portal` v1.0.0 — Patient registration + referral code validation + doctor-patient linking
  - `honor-labs-access-control` v1.0.0 — Store gating (only approved doctors/verified patients can browse/buy)
  - `honor-labs-doctor-dashboard` v1.0.0 — Doctor-facing dashboard (patients, commissions, referral codes)
  - `honor-labs-signup` v3.0 — WooCommerce native registration form via shortcode
- **Other Key Plugins:** WooPayments v10.5.1, WP Mail SMTP v4.7.1, WPCode Lite v2.3.4, Elementor v3.35.6, LiteSpeed Cache, MCP Adapter v0.4.1
- **Minimum Order Enforcement:** WPCode snippet (ID 705) — 6 layers of enforcement ensuring doctors must order min 24 units

### Products (4 currently)
| Product | Wholesale Price | Retail Price | Status |
|---------|----------------|--------------|--------|
| Dry Eye Support | $7.00 | $14.99 (planned) | In stock |
| Macular Support | $9.00 | $19.99 (planned) | In stock |
| Men's Multi | $7.00 | $14.99 (planned) | In stock |
| Women's Multi | $7.00 | $14.99 (planned) | In stock |

### User Accounts Structure (10 users currently)
| Role | Count | B2BKing Group ID | Key Meta |
|------|-------|-----------------|----------|
| Admin | 1 | — | Site owner (josh.wiersema06@gmail.com) |
| Doctors (B2B) | 4 | 599 | NPI number, Practice name, Specialty, Referral code |
| Patients | 4 | 695 | Linked doctor, Referral code used |
| Other | 1 | — | General customer |

### Key Technical Details
- **B2BKing group meta:** `b2bking_customergroup` user meta — "599" for doctors, "695" for patients, "b2cuser" for general
- **REST API:** No API keys created yet — you will need to create one via WooCommerce > Settings > Advanced > REST API
- **The `b2bking_customergroup` meta is NOT exposed via the default WordPress REST API** — you'll need custom endpoints or direct DB queries
- **Hostinger blocks PHP file editing** via the Plugin Editor and File Browser — all custom PHP must go through WPCode snippets or SFTP
- **WooCommerce HPOS (High-Performance Order Storage) is enabled** — orders are stored in custom tables, not post meta

---

## 2. App Architecture

### Tech Stack for the App
Build this as a **React + TypeScript** application with the following stack:

- **Frontend:** React 18+ with TypeScript, Vite as build tool
- **UI Framework:** Tailwind CSS + shadcn/ui component library (for a polished, professional look)
- **State Management:** TanStack Query (React Query) for server state, Zustand for client state
- **Routing:** React Router v6
- **Charts:** Recharts for data visualization
- **HTTP Client:** Axios with interceptors for WooCommerce API auth
- **Auth:** WooCommerce REST API keys (Consumer Key + Consumer Secret) stored securely
- **Date handling:** date-fns
- **Tables:** TanStack Table for sortable, filterable data tables
- **Icons:** Lucide React

### API Integration Strategy

The app connects to two APIs:

1. **WooCommerce REST API** (`/wp-json/wc/v3/`) — For orders, products, customers, reports, coupons, shipping, taxes
2. **WordPress REST API** (`/wp-json/wp/v2/`) — For users, posts, pages, and custom endpoints
3. **Custom REST Endpoints** (you will need to create these as a WPCode snippet on the WordPress side) — For Honor Labs-specific data like doctor applications, B2BKing groups, commission tracking, referral code management, and doctor-patient relationships

#### Authentication
Use WooCommerce REST API consumer key/secret authentication. The app should:
- Store credentials securely (environment variables, never in source code)
- Use HTTPS (the site is on HTTPS)
- Pass credentials as query parameters (`consumer_key` and `consumer_secret`) or via HTTP Basic Auth header
- Include a settings page where the user inputs their API keys on first setup

#### Custom WordPress REST Endpoints Needed
You'll need to create a WPCode PHP snippet (to be installed on the WordPress side) that registers these custom REST API endpoints:

```
GET  /wp-json/honor-labs/v1/doctors              — List all doctors (group 599) with NPI, practice, specialty, referral code, patient count
GET  /wp-json/honor-labs/v1/doctors/{id}          — Single doctor detail with linked patients
GET  /wp-json/honor-labs/v1/patients              — List all patients (group 695) with linked doctor info
GET  /wp-json/honor-labs/v1/patients/{id}         — Single patient detail
GET  /wp-json/honor-labs/v1/doctor-applications   — List pending/approved/rejected applications
POST /wp-json/honor-labs/v1/doctor-applications/{id}/approve  — Approve a doctor application
POST /wp-json/honor-labs/v1/doctor-applications/{id}/reject   — Reject a doctor application
GET  /wp-json/honor-labs/v1/commissions           — Commission data (per doctor, per period)
GET  /wp-json/honor-labs/v1/referral-codes        — All referral codes with usage stats
GET  /wp-json/honor-labs/v1/dashboard-stats       — Aggregated business metrics
GET  /wp-json/honor-labs/v1/b2bking/groups        — B2BKing customer groups
```

**Generate both the React app AND the WPCode PHP snippet that registers these endpoints.**

---

## 3. App Pages & Features (Detailed Specifications)

### 3.1 Login / Settings Page
- First-time setup: User enters their WordPress site URL, WooCommerce Consumer Key, and Consumer Secret
- Validate the credentials by making a test API call
- Store credentials in localStorage (encrypted if possible) or a secure store
- Show connection status (connected/disconnected)
- Allow changing credentials later

### 3.2 Dashboard (Home)
The main overview page showing key business metrics at a glance.

**Top Stats Cards (4 across):**
- Total Revenue (all time + this month)
- Total Orders (all time + this month)
- Active Doctors (approved, group 599)
- Active Patients (verified, group 695)

**Revenue Chart:**
- Line/area chart showing revenue over time (last 30 days, 90 days, 12 months toggle)
- Split by wholesale (doctor orders) vs retail (patient orders) with different colors
- Use WooCommerce Reports API (`/wc/v3/reports/sales`)

**Recent Orders Widget:**
- Last 10 orders with: order #, customer name, doctor/patient badge, total, status, date
- Click to view full order detail

**Doctor Pipeline Widget:**
- Count of pending applications
- Recently approved doctors
- Quick-approve button for pending applications

**Quick Actions:**
- "View All Orders" button
- "Manage Doctors" button
- "View Products" button

### 3.3 Orders Page
Full order management interface.

**Order List Table:**
- Columns: Order #, Date, Customer, Type (Doctor/Patient badge based on B2BKing group), Items, Total, Status, Actions
- Color-coded status badges: Processing (blue), Completed (green), On-hold (yellow), Cancelled (red), Refunded (gray)
- Sortable by any column
- Filterable by: status, date range, customer type (doctor/patient), specific doctor, specific patient
- Search by order #, customer name, or email
- Pagination

**Order Detail View (click on an order):**
- Full order info: billing/shipping address, items with quantities and prices, order totals, taxes, shipping
- Customer info with doctor/patient badge
- If patient order: show which doctor referred them
- Order status timeline/history
- Action buttons: Update status, Add note, Refund (with confirmation)

**Order Analytics Sidebar:**
- Average order value
- Orders by status breakdown (pie chart)
- Doctor vs Patient order ratio

### 3.4 Products Page
Product catalog management.

**Product Grid/List View (toggle):**
- Product image thumbnail, name, SKU, wholesale price, retail price (if using variations), stock status, categories
- Edit product button (opens edit modal or navigates to detail)
- Quick stock update

**Product Detail/Edit:**
- Name, description, prices (regular + sale), stock quantity, SKU, categories, images
- Wholesale vs Retail pricing display
- Sales data for this product (chart showing units sold over time)

**Inventory Alerts:**
- Products with low stock highlighted
- Stock level indicators (green/yellow/red)

### 3.5 Doctors Page
Doctor management — the core of the business.

**Doctor Applications Tab:**
- Table of all applications: Name, Email, NPI Number, Practice Name, Specialty, Status (Pending/Approved/Rejected), Date Applied
- Filter by status
- **Pending applications** highlighted at top with Approve/Reject action buttons
- Approve action: triggers the custom REST endpoint which sets `b2bking_customergroup` to "599" and sends approval email
- Reject action: with optional reason field

**Active Doctors Tab:**
- Table: Name, Email, NPI, Practice, Specialty, Referral Code, # Patients Linked, Total Wholesale Orders, Total Revenue Generated, Commission Owed, Last Order Date
- Click to view doctor profile

**Doctor Profile View:**
- Full doctor info (name, email, NPI, practice, specialty, registration date)
- Their unique referral code (with copy button)
- List of linked patients
- Order history (their wholesale orders)
- Patient orders attributed to them (for commission tracking)
- Commission summary (total earned, paid, outstanding)
- Revenue chart for this doctor

### 3.6 Patients Page
Patient management.

**Patient List Table:**
- Name, Email, Linked Doctor, Registration Date, Total Orders, Total Spent, Last Order Date
- Filter by linked doctor
- Search by name or email

**Patient Detail View:**
- Full patient info
- Linked doctor info (with link to doctor profile)
- Order history
- Spending chart

### 3.7 Commissions Page
Track doctor commissions on patient orders.

**Commission Overview:**
- Total commissions earned (all doctors, all time)
- Total commissions paid out
- Total outstanding
- Commission rate display (10-15%, configurable)

**Per-Doctor Commission Table:**
- Doctor Name, # Patient Orders, Patient Revenue, Commission Rate, Commission Earned, Paid, Outstanding
- Expandable rows showing individual patient orders that generated commission
- Export to CSV

**Commission Settings:**
- Set default commission rate (percentage)
- Override per-doctor if needed

### 3.8 Analytics Page
Deep business intelligence.

**Revenue Analytics:**
- Revenue over time (line chart) with wholesale/retail split
- Revenue by product (bar chart)
- Revenue by doctor (who's generating the most business?)
- Monthly recurring revenue trend

**Growth Analytics:**
- New doctors per month (bar chart)
- New patients per month (bar chart)
- Doctor-to-patient ratio over time
- Referral code usage (which doctors are actively referring?)

**Product Analytics:**
- Best-selling products (by units and by revenue)
- Product mix (pie chart)
- Reorder rate (how often do customers come back?)

**Customer Analytics:**
- Customer lifetime value (average for doctors vs patients)
- Geographic distribution (by state, from billing addresses)
- Top customers table

### 3.9 Settings Page
App configuration.

- **API Connection:** WordPress URL, Consumer Key, Consumer Secret, test connection button
- **Business Settings:** Commission rate, notification preferences
- **Display Settings:** Theme (light/dark mode toggle), date format, currency format
- **About:** App version, Honor Labs branding

---

## 4. Design System

### Visual Identity
- **Primary Color:** Deep navy/slate (`#0f172a`, `#1e293b`) — matches Honor Labs' brand
- **Accent Color:** Indigo/purple (`#6366f1`, `#4f46e5`) — matches the existing site
- **Success:** Green (`#22c55e`)
- **Warning:** Amber (`#f59e0b`)
- **Error:** Red (`#ef4444`)
- **Background:** Light gray (`#f8fafc`) for light mode, `#0f172a` for dark mode
- **Font:** Inter (already used on the Honor Labs site)

### Design Principles
- **Clean, spacious layouts** — generous padding, not cramped
- **Card-based UI** — information grouped into cards with subtle shadows
- **Consistent iconography** — Lucide icons throughout
- **Responsive** — works on desktop and tablet (primary use case is desktop)
- **Professional** — this should look like a premium business tool, not a WordPress plugin
- **Data-dense but readable** — show a lot of information without overwhelming

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  Logo    [Honor Labs Control]          [Dark Mode] [User] │  ← Top bar
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  📊 Dashboard │          MAIN CONTENT AREA              │
│  📦 Orders    │                                         │
│  🏷️ Products  │                                         │
│  👨‍⚕️ Doctors   │                                        │
│  👤 Patients  │                                         │
│  💰 Commissions│                                        │
│  📈 Analytics │                                         │
│  ⚙️ Settings  │                                         │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Connection: ● Connected to Honor Labs     v1.0.0       │  ← Status bar
└─────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure

```
honor-labs-app/
├── public/
│   └── honor-labs-logo.svg
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance with WooCommerce auth
│   │   ├── woocommerce.ts         # WC REST API calls (orders, products, customers, reports)
│   │   ├── wordpress.ts           # WP REST API calls (users, custom endpoints)
│   │   └── honor-labs.ts          # Custom Honor Labs API calls
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main layout with sidebar + topbar
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── TopBar.tsx         # Top bar with user info
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   └── DoctorPipeline.tsx
│   │   ├── orders/
│   │   │   ├── OrdersTable.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   ├── products/
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductDetail.tsx
│   │   ├── doctors/
│   │   │   ├── DoctorApplications.tsx
│   │   │   ├── ActiveDoctors.tsx
│   │   │   ├── DoctorProfile.tsx
│   │   │   └── ApproveRejectModal.tsx
│   │   ├── patients/
│   │   │   ├── PatientsTable.tsx
│   │   │   └── PatientDetail.tsx
│   │   ├── commissions/
│   │   │   ├── CommissionOverview.tsx
│   │   │   ├── CommissionTable.tsx
│   │   │   └── CommissionSettings.tsx
│   │   ├── analytics/
│   │   │   ├── RevenueAnalytics.tsx
│   │   │   ├── GrowthAnalytics.tsx
│   │   │   └── ProductAnalytics.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx       # Reusable TanStack Table wrapper
│   │       ├── StatusBadge.tsx
│   │       ├── UserTypeBadge.tsx   # Doctor/Patient/Admin badge
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useOrders.ts
│   │   ├── useProducts.ts
│   │   ├── useDoctors.ts
│   │   ├── usePatients.ts
│   │   ├── useCommissions.ts
│   │   ├── useAnalytics.ts
│   │   └── useAuth.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── Products.tsx
│   │   ├── Doctors.tsx
│   │   ├── Patients.tsx
│   │   ├── Commissions.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── stores/
│   │   ├── authStore.ts           # Zustand store for API credentials
│   │   └── settingsStore.ts       # Theme, preferences
│   ├── types/
│   │   ├── order.ts
│   │   ├── product.ts
│   │   ├── doctor.ts
│   │   ├── patient.ts
│   │   ├── commission.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── formatters.ts          # Currency, date, number formatters
│   │   ├── constants.ts           # B2BKing group IDs, API routes, etc.
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Tailwind imports
├── wordpress/
│   └── honor-labs-api-endpoints.php  # WPCode snippet to install on WordPress
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 6. WordPress Custom API Endpoints (WPCode Snippet)

Generate a complete PHP file (`wordpress/honor-labs-api-endpoints.php`) that should be pasted into WPCode as a PHP snippet on the WordPress site. This snippet must:

1. Register all custom REST API routes under the `honor-labs/v1` namespace
2. Require authentication (check for valid WooCommerce API credentials or WordPress admin capability)
3. Query B2BKing customer groups directly from user meta (`b2bking_customergroup`)
4. Query the doctor onboarding plugin's data (applications are likely stored as custom post types or in custom tables — the plugin file is `honor-labs-doctor-onboarding.php` at ~838 lines)
5. Return properly formatted JSON with pagination support
6. Include commission calculation logic (configurable percentage of patient order totals, attributed to the patient's linked doctor)

### Key data relationships to expose:
- **Doctor → Patients:** One doctor has many patients (linked via referral code during patient registration)
- **Doctor → Referral Code:** Each doctor has a unique referral code
- **Patient → Doctor:** Each patient is linked to exactly one doctor
- **Doctor → Orders:** Doctor's own wholesale orders + their patients' retail orders (for commissions)
- **Commission = percentage × sum of patient order totals for that doctor**

---

## 7. Important Implementation Notes

### WooCommerce API Specifics
- WooCommerce REST API v3 base: `/wp-json/wc/v3/`
- Orders endpoint: `/wc/v3/orders` — supports filtering by status, date, customer
- Products endpoint: `/wc/v3/products`
- Customers endpoint: `/wc/v3/customers` — returns WP users with WC customer data
- Reports: `/wc/v3/reports/sales`, `/wc/v3/reports/top_sellers`
- **CORS:** The app will likely run on a different origin than the WordPress site. You'll need to handle CORS — either configure WordPress to allow the app's origin, or use a proxy in development. Include a CORS-enabling snippet for WordPress in the WPCode output.

### B2BKing Group Identification
```typescript
// constants.ts
export const B2BKING_GROUPS = {
  DOCTORS: '599',    // B2B Users
  PATIENTS: '695',   // Patients
  B2C: 'b2cuser',   // General visitors
} as const;
```

The user meta key is `b2bking_customergroup`. This is stored as a string.

### Doctor-Specific Data Fields (User Meta)
These are custom user meta fields set by the Honor Labs plugins:
- `b2bking_customergroup` — "599" for doctors
- NPI number (stored as user meta by doctor onboarding plugin)
- Practice name
- Specialty
- Referral code
- Doctor approval status (pending/approved/rejected)

### Determining Order Type
To determine if an order is wholesale (doctor) or retail (patient):
1. Get the order's `customer_id`
2. Look up that user's `b2bking_customergroup` meta
3. If "599" → wholesale/doctor order
4. If "695" → retail/patient order

### Commission Attribution
To calculate commissions for a doctor:
1. Get all patients linked to that doctor
2. Get all orders placed by those patients
3. Sum the order totals
4. Multiply by commission rate (default 10%)

---

## 8. Development Phases

### Phase 1: Foundation (Build First)
1. Project scaffolding (Vite + React + TypeScript + Tailwind + shadcn/ui)
2. API client with WooCommerce auth
3. Auth/Settings page with credential storage and connection test
4. App layout (sidebar, topbar, routing)
5. WordPress WPCode snippet with all custom REST endpoints + CORS

### Phase 2: Core Pages
6. Dashboard with stats cards and revenue chart
7. Orders page with full table and detail view
8. Products page with grid/list view

### Phase 3: Honor Labs-Specific
9. Doctors page (applications + active doctors + profiles)
10. Patients page (list + detail)
11. Commissions page (overview + per-doctor + settings)

### Phase 4: Analytics & Polish
12. Analytics page (revenue, growth, product, customer charts)
13. Dark mode toggle
14. Loading states, error states, empty states
15. Export to CSV functionality
16. Mobile responsiveness tweaks

---

## 9. Start Building

Begin with Phase 1. Create the full project structure, install all dependencies, and build out the foundation. Then proceed through each phase.

For the WordPress WPCode snippet, generate the complete PHP code and save it as `wordpress/honor-labs-api-endpoints.php` with clear instructions on how to install it.

**Important:** Make sure the app works against the real WooCommerce REST API at `https://darkorange-skunk-283648.hostingersite.com`. The first thing the user will do is enter their API credentials and test the connection.

Build this app to be production-quality — clean code, proper TypeScript types, error handling, loading states, and a polished UI that business owners would be proud to use every day.
