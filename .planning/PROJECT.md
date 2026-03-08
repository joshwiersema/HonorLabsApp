# Honor Labs Business Control Dashboard

## What This Is

A standalone SaaS-style business control dashboard for Honor Labs, a two-sided supplement marketplace connecting eye care doctors (B2B wholesale) with patients (B2C retail). The app replaces the WordPress/WooCommerce admin panel with a clean, modern interface that pulls live data from the existing WordPress site via API proxying through a Python FastAPI backend.

## Core Value

Business owners can monitor and manage all Honor Labs operations — orders, doctors, patients, commissions, and analytics — from a single polished dashboard without touching WordPress.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Secure API proxy backend that keeps WooCommerce credentials server-side
- [ ] Google OAuth team authentication (2-5 users)
- [ ] Dashboard with key business metrics (revenue, orders, active doctors, active patients)
- [ ] Revenue chart with wholesale/retail split and time range toggles
- [ ] Full order management (list, detail, status updates, filters, search)
- [ ] Product catalog view with inventory status and quick stock updates
- [ ] Doctor application management (view pending, approve, reject)
- [ ] Active doctors list with profiles, linked patients, referral codes, order history
- [ ] Patient management with linked doctor info and order history
- [ ] Commission tracking per doctor (earned, paid, outstanding) with configurable rates
- [ ] Business analytics (revenue, growth, product, customer charts)
- [ ] Dark mode toggle
- [ ] Custom WordPress REST endpoints (WPCode PHP snippet) for Honor Labs-specific data
- [ ] Export to CSV for key data tables
- [ ] Responsive layout (desktop primary, tablet secondary)

### Out of Scope

- Direct product creation/deletion (use WooCommerce for that) — dashboard is read-heavy with light write operations
- Patient/doctor self-service portal — this is an admin tool
- Mobile native app — web responsive is sufficient
- Email sending from the dashboard — WordPress handles transactional email
- Payment processing — WooPayments handles that on the WordPress side
- Real-time websockets — polling/refresh is fine for admin dashboard

## Context

### Business Model
- **Doctors (B2B):** Register with NPI verification → admin approval → B2BKing group 599 → wholesale ordering (min 24 units, $7-$9/unit)
- **Patients (B2C):** Register with doctor's referral code → B2BKing group 695 → retail ordering ($14.99-$19.99/unit)
- **Commissions:** Doctors earn 10-15% on their linked patients' orders
- **Products:** 4 supplements (Dry Eye Support, Macular Support, Men's Multi, Women's Multi)
- **Users:** ~10 currently (1 admin, 4 doctors, 4 patients, 1 general)

### Existing WordPress Stack
- WordPress 6.x + WooCommerce 10.5.3 on Hostinger Cloud
- URL: `https://darkorange-skunk-283648.hostingersite.com`
- B2BKing Core v5.0.25 (customer groups)
- 5 custom plugins: doctor-onboarding, patient-portal, access-control, doctor-dashboard, signup
- WooCommerce HPOS enabled (orders in custom tables)
- WPCode Lite v2.3.4 for custom PHP snippets
- B2BKing groups: Doctors=599, Patients=695, B2C="b2cuser"

### Key Technical Details
- `b2bking_customergroup` user meta determines user type
- Doctor meta: NPI number, practice name, specialty, referral code, approval status
- Doctor applications likely stored as custom post type by honor-labs-doctor-onboarding plugin
- Hostinger blocks PHP file editing — custom PHP goes through WPCode snippets
- No WooCommerce REST API keys created yet

## Constraints

- **Tech Stack:** React + TypeScript + Vite frontend, Python FastAPI backend, PHP WPCode snippet for WordPress endpoints
- **UI Framework:** Tailwind CSS v4 + shadcn/ui-style components (already installed)
- **Deployment:** Vercel (frontend) + Railway (FastAPI backend)
- **Auth:** Google OAuth for team access (2-5 members)
- **API Architecture:** FastAPI proxies all WooCommerce/WordPress API calls (credentials never in frontend)
- **WordPress Limitation:** Custom PHP only via WPCode snippets (no plugin file editing on Hostinger)
- **Color Palette:** Deep navy/slate primary (#0f172a, #1e293b), Indigo accent (#6366f1, #4f46e5), Inter font

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastAPI backend proxy instead of direct frontend-to-WooCommerce | API keys stay server-side, no CORS issues, business logic centralized in Python | — Pending |
| Google OAuth for team auth | Simple for small team, no password management | — Pending |
| Vercel + Railway deployment | Vercel optimized for React SPAs, Railway good for Python services | — Pending |
| No Radix UI — custom shadcn-style components | Fewer dependencies, simpler for admin dashboard use case | — Pending |
| Tailwind CSS v4 with CSS-based theming | Already installed, v4 uses @theme directives instead of config files | — Pending |

---
*Last updated: 2026-03-07 after initialization*
