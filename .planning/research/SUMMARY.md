# Research Summary: Honor Labs Business Control Dashboard

**Domain:** WooCommerce B2B/B2C Admin Dashboard with FastAPI Proxy
**Researched:** 2026-03-07
**Overall confidence:** HIGH

## Executive Summary

The Honor Labs Business Control Dashboard is a three-tier proxy architecture: a React SPA (Vercel) communicates with a FastAPI backend (Railway), which proxies all requests to a WordPress/WooCommerce site (Hostinger). The architecture decision to proxy through FastAPI rather than hitting WooCommerce directly from the browser is sound and well-supported by the ecosystem -- it keeps API credentials server-side, centralizes business logic in Python, and eliminates CORS issues between the frontend and WordPress.

The frontend stack is already scaffolded with React 19, Vite 7, Tailwind CSS v4, TanStack Query/Table, Zustand, Recharts, and Axios. All installed versions are current and stable. The primary remaining frontend setup is initializing shadcn/ui (CLI-based component library) and configuring Tailwind v4's CSS-first theming. The backend needs to be built from scratch using FastAPI 0.135.1, HTTPX 0.28.1 (async HTTP client for WooCommerce API calls), Authlib (Google OAuth), and PyJWT (session tokens).

The single most critical piece is the custom WordPress PHP snippet that registers REST endpoints under the `honor-labs/v1` namespace. Without these endpoints, the dashboard cannot access B2BKing customer groups (doctor vs. patient classification), doctor applications, commission data, or referral code relationships. WooCommerce's standard REST API does not expose custom user meta fields, and the standard reports API has known issues with HPOS-enabled sites. This PHP snippet is the critical path -- it must be built and tested before any Honor Labs-specific frontend work.

The project's biggest risk is the unknown doctor application data structure. The `honor-labs-doctor-onboarding` plugin (838 lines) stores applications in an undetermined location (custom post type, user meta, or custom table). This must be investigated via database inspection before writing the PHP endpoints.

## Key Findings

**Stack:** React 19 + Vite 7 + Tailwind v4 frontend (already scaffolded), Python FastAPI + HTTPX backend (to build), WPCode PHP snippet for custom WordPress endpoints (to build). All versions are current; no major updates needed.

**Architecture:** Three-tier proxy pattern. FastAPI is the keystone -- it handles auth (Google OAuth -> JWT), credential storage (WC consumer key/secret), API proxying (HTTPX to WooCommerce), and business logic (commission calculations, data aggregation).

**Critical pitfall:** WooCommerce REST API does not expose B2BKing customer group meta, and the reports API returns incorrect data with HPOS enabled. Both are solved by custom PHP endpoints, making the WPCode snippet the single most important deliverable.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation (Backend + PHP + App Shell)** - Build the infrastructure everything depends on
   - Addresses: FastAPI skeleton, Google OAuth, WC service layer, custom PHP endpoints, React app shell with layout/routing/login
   - Avoids: Building frontend pages that can't be tested without backend/PHP endpoints
   - This is the longest phase because it crosses three codebases (Python, TypeScript, PHP)

2. **Core Data Views (Dashboard + Orders + Products)** - Exercise the standard WooCommerce API pipeline
   - Addresses: Dashboard KPIs, revenue chart, order management, product catalog
   - Avoids: Starting with custom endpoints before validating the basic proxy chain works
   - Orders and products use well-documented WC endpoints -- lower risk than custom data

3. **Honor Labs Domain (Doctors + Patients + Commissions)** - Build the unique business value
   - Addresses: Doctor applications, active doctors, patients, commission tracking
   - Avoids: Building commissions before doctor-patient relationships are established
   - Depends entirely on custom PHP endpoints from Phase 1

4. **Analytics & Polish (Charts + Dark Mode + Export + Responsive)** - Aggregate and refine
   - Addresses: Full analytics page, dark mode, CSV export, error/loading/empty states, responsive layout
   - Avoids: Building analytics before the underlying data views are proven correct
   - Most items are independent of each other and can be parallelized

**Phase ordering rationale:**
- Phase 1 must come first because Phase 2 and 3 cannot function without the backend proxy and PHP endpoints
- Phase 2 before Phase 3 because standard WooCommerce API calls are lower risk and validate the proxy architecture
- Phase 3 before Phase 4 because analytics consume data from doctors, patients, and orders -- all must be stable first
- Dark mode and CSV export could technically be done in any phase but are deferred to avoid gold-plating before core features work

**Research flags for phases:**
- Phase 1: Needs pre-development investigation -- the doctor application data structure in the onboarding plugin must be reverse-engineered before writing PHP endpoints. Run SQL queries against the live database.
- Phase 1: CORS configuration must be tested against actual Railway/Vercel URLs, not just localhost
- Phase 2: WooCommerce Reports API must be verified for HPOS compatibility. May need to use undocumented `wc-analytics` endpoints or custom SQL aggregation.
- Phase 3: Commission calculation is the most complex feature -- start with a global rate (10%), defer per-doctor overrides

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (frontend) | HIGH | All packages already installed and verified current. React 19 + Vite 7 + Tailwind v4 are stable and well-documented. |
| Stack (backend) | HIGH | FastAPI + HTTPX + Authlib are all current, well-documented, and appropriate for this use case. Version numbers verified against PyPI. |
| Features | HIGH | Feature set is well-defined by project prompt. Table stakes vs. differentiators are clear. Anti-features are correctly scoped. |
| Architecture | HIGH | Three-tier proxy is a standard pattern. Component boundaries are clean. Data flow is straightforward. |
| Pitfalls | HIGH | WooCommerce HPOS issues, B2BKing meta limitations, and CORS challenges are well-documented with verified sources. |
| Doctor application data model | LOW | Unknown data structure in plugin. Must investigate before Phase 1 implementation. |
| Authlib + FastAPI integration | MEDIUM | Authlib has documented FastAPI support, but the specific Google OAuth -> JWT flow for this project needs testing. |

## Gaps to Address

- **Doctor onboarding plugin data schema:** Must inspect the WordPress database (via phpMyAdmin or SFTP + code review) to determine where doctor applications are stored. This blocks the PHP endpoint design.
- **WooCommerce Reports API + HPOS verification:** Need to test `/wc/v3/reports/sales` against the live site to confirm whether it returns correct data or needs the `wc-analytics` fallback.
- **WordPress custom endpoint authentication:** Need to verify that WooCommerce consumer key/secret Basic Auth correctly sets `current_user_can('manage_woocommerce')` for custom endpoints registered outside of WooCommerce's own route handlers.
- **Hostinger-specific limitations:** May need to verify that Hostinger doesn't block HTTP Basic Auth headers (some shared hosts strip the `Authorization` header). If blocked, need a fallback auth strategy for custom endpoints.
- **Google OAuth consent screen setup:** Need to configure the Google Cloud project with correct redirect URIs for both localhost (dev) and Railway (prod). The consent screen configuration is outside the codebase.

## Files Created

| File | Purpose |
|------|---------|
| `.planning/research/SUMMARY.md` | This file -- executive summary with roadmap implications |
| `.planning/research/STACK.md` | Technology recommendations with versions, rationale, and installation commands |
| `.planning/research/FEATURES.md` | Feature landscape with table stakes, differentiators, anti-features, and MVP prioritization |
| `.planning/research/ARCHITECTURE.md` | Three-tier proxy architecture, component boundaries, data flow, code patterns |
| `.planning/research/PITFALLS.md` | 7 critical pitfalls with prevention strategies, plus integration gotchas and security warnings |
