# Codebase Concerns

**Analysis Date:** 2026-03-07

## Tech Debt

**Scaffolding-only state -- everything needs to be built:**
- Issue: The entire project is a bare Vite scaffold with no application code. `frontend/src/App.tsx` is the default Vite counter demo. `backend/` has empty `routers/` and `services/` directories with no Python files, no `requirements.txt`, no `pyproject.toml`, no `main.py`. `wordpress/` is completely empty.
- Files: `frontend/src/App.tsx`, `frontend/src/App.css`, `frontend/src/index.css`, `backend/`, `wordpress/`
- Impact: No functionality exists yet. Every feature described in the prompt (`Honor_Labs_App_Claude_Code_Prompt.md`) must be built from scratch.
- Fix approach: Follow the phased build plan in `Honor_Labs_App_Claude_Code_Prompt.md` Sections 8 (Development Phases) and 5 (Project Structure). Start with Phase 1: Foundation.

**Vite boilerplate CSS conflicts with Tailwind:**
- Issue: `frontend/src/index.css` and `frontend/src/App.css` contain default Vite CSS (dark background, custom button styles, centered layout) that will conflict with Tailwind CSS and shadcn/ui styling. These files need to be replaced entirely.
- Files: `frontend/src/index.css`, `frontend/src/App.css`
- Impact: If not replaced, Vite's default styles will fight with Tailwind utilities, causing unpredictable visual bugs.
- Fix approach: Replace `frontend/src/index.css` with Tailwind directives (`@import "tailwindcss"` for Tailwind v4). Delete `frontend/src/App.css` entirely. Remove the CSS import from `frontend/src/App.tsx`.

**Tailwind v4 installed but not configured:**
- Issue: `tailwindcss@^4.2.1` and `@tailwindcss/vite@^4.2.1` are in `frontend/package.json` dependencies, but the `@tailwindcss/vite` plugin is NOT added to `frontend/vite.config.ts`. The Vite config only includes the React plugin. There is no `tailwind.config.ts` file (though Tailwind v4 uses CSS-based config by default). The prompt references `tailwind.config.ts` in its project structure, suggesting the original spec expected Tailwind v3.
- Files: `frontend/vite.config.ts`, `frontend/package.json`
- Impact: Tailwind utilities will not work at all until the Vite plugin is registered. All UI work is blocked.
- Fix approach: Add `@tailwindcss/vite` to the plugins array in `frontend/vite.config.ts`. Replace `frontend/src/index.css` with `@import "tailwindcss";`. For Tailwind v4, CSS-based configuration is used instead of `tailwind.config.ts`.

**shadcn/ui not initialized:**
- Issue: shadcn/ui is referenced throughout the design spec but has not been initialized. There is no `components.json` config file, no `frontend/src/components/ui/` directory, and no shadcn/ui component files. The `class-variance-authority`, `clsx`, and `tailwind-merge` dependencies (shadcn/ui prerequisites) are installed.
- Files: `frontend/package.json` (dependencies present), `frontend/` (missing `components.json`)
- Impact: Cannot build any UI components until shadcn/ui is initialized and base components are added.
- Fix approach: Run `npx shadcn@latest init` in the `frontend/` directory. This will create `components.json` and set up the `src/components/ui/` directory. Then add individual components with `npx shadcn@latest add button card table` etc.

**Backend has no Python environment at all:**
- Issue: The `backend/` directory contains only empty `routers/` and `services/` subdirectories. There is no `requirements.txt`, `pyproject.toml`, `Pipfile`, `main.py`, `__init__.py` files, or any Python code. There is no virtual environment. FastAPI and its dependencies are not declared anywhere.
- Files: `backend/`, `backend/routers/`, `backend/services/`
- Impact: The entire backend API proxy layer is non-existent. The frontend cannot securely communicate with WooCommerce without this layer.
- Fix approach: Create `backend/requirements.txt` (or `pyproject.toml`) with FastAPI, uvicorn, httpx, python-dotenv, pydantic. Create `backend/main.py` as the FastAPI entry point. Add `__init__.py` files to make packages importable.

## Security Considerations

**Credential storage design -- localStorage is risky:**
- Risk: The prompt (`Honor_Labs_App_Claude_Code_Prompt.md`, Section 3.1) specifies storing WooCommerce API credentials in localStorage. WooCommerce Consumer Key/Secret provide full read/write access to all store data (orders, customers, products). localStorage is accessible to any JavaScript running on the same origin, making it vulnerable to XSS attacks.
- Files: Not yet implemented, but planned for `frontend/src/stores/authStore.ts`
- Current mitigation: None -- not yet built.
- Recommendations: The Python FastAPI backend proxy (per MEMORY.md architecture decision) is the correct mitigation. Store credentials server-side only. The frontend should authenticate to the backend with a session token or JWT, and the backend should hold the WooCommerce API keys. Never expose WooCommerce Consumer Key/Secret to the browser.

**No root .gitignore -- secrets at risk of being committed:**
- Risk: The project root has NO `.gitignore` file. Only `frontend/.gitignore` exists (standard Vite ignores). When `.env` files are created for the backend (with WooCommerce API keys, WordPress credentials), they could easily be committed to git. The `Honor_Labs_App_Claude_Code_Prompt.md` references `.env.example` in the project structure, implying `.env` files are planned.
- Files: Root directory (missing `.gitignore`), `frontend/.gitignore` (exists but only covers frontend)
- Current mitigation: None.
- Recommendations: Create a root `.gitignore` immediately that excludes: `.env`, `.env.*`, `*.env`, `__pycache__/`, `*.pyc`, `venv/`, `.venv/`, `node_modules/`, `dist/`, `*.pem`, `*.key`. This must happen before any credentials are created.

**WordPress site URL hardcoded in prompt:**
- Risk: `Honor_Labs_App_Claude_Code_Prompt.md` contains the live WordPress site URL (`https://darkorange-skunk-283648.hostingersite.com`). If this prompt file is committed to a public repository, it exposes the production WordPress installation URL.
- Files: `Honor_Labs_App_Claude_Code_Prompt.md`
- Current mitigation: None.
- Recommendations: Ensure this file is excluded from any public repository via `.gitignore`, or redact the URL. The URL should be configured via environment variable only.

**CORS configuration needed on WordPress side:**
- Risk: The prompt (Section 7) notes CORS will need to be configured. If done too permissively (`Access-Control-Allow-Origin: *`), it would allow any website to make authenticated requests to the WooCommerce API if credentials are leaked.
- Files: Not yet implemented, planned for `wordpress/honor-labs-api-endpoints.php`
- Current mitigation: None -- not yet built.
- Recommendations: Lock CORS `Access-Control-Allow-Origin` to the specific backend server origin only. Do NOT use wildcard. The Python backend proxy pattern (per MEMORY.md) eliminates the need for browser-to-WordPress CORS entirely, since the backend communicates server-to-server.

**WooCommerce API keys have not been created yet:**
- Risk: Per `Honor_Labs_App_Claude_Code_Prompt.md` Section 1, "No API keys created yet." When they are created, they must have the minimum required permissions (read-only where possible) and be stored securely.
- Files: N/A -- WordPress admin action
- Current mitigation: N/A
- Recommendations: Create separate keys for read-only and read-write operations. Store them as backend environment variables only.

## Performance Bottlenecks

**No caching strategy planned for WooCommerce API calls:**
- Problem: The app makes many calls to the WooCommerce REST API (orders, products, customers, reports, commissions). WooCommerce REST API can be slow on shared hosting (Hostinger Cloud), especially for aggregated reports. Every page load will hit the WordPress server.
- Files: Not yet implemented, planned for `frontend/src/api/` and `backend/services/`
- Cause: WooCommerce REST API is not designed for high-frequency dashboard polling. Each request involves WordPress bootstrapping + database queries.
- Improvement path: Implement caching at the Python backend layer using in-memory cache (e.g., `cachetools`) or Redis. Use TanStack Query's `staleTime` and `cacheTime` on the frontend to reduce redundant requests. Consider server-side aggregation so the backend computes commission totals rather than the frontend making N+1 queries.

**Commission calculation requires multiple API calls:**
- Problem: Calculating commissions requires: (1) list all doctors, (2) for each doctor get linked patients, (3) for each patient get their orders, (4) sum totals and apply rate. This is an N+1 query problem that will not scale as doctor and patient counts grow.
- Files: Not yet implemented, planned for custom WordPress endpoints and `backend/services/`
- Cause: WooCommerce REST API does not natively support doctor-patient-order relationship queries.
- Improvement path: Handle commission aggregation entirely in the PHP custom endpoint (`wordpress/honor-labs-api-endpoints.php`) using direct SQL queries, returning pre-computed totals. The backend should cache these results.

## Fragile Areas

**Architecture mismatch between prompt and MEMORY.md:**
- Files: `Honor_Labs_App_Claude_Code_Prompt.md`, MEMORY.md (at `~/.claude/projects/.../memory/MEMORY.md`)
- Why fragile: The original prompt spec (Section 2) describes a direct frontend-to-WooCommerce architecture with Axios interceptors for API auth. MEMORY.md records a decision to use a "Python FastAPI backend as secure proxy (NOT direct frontend-to-WooCommerce)." The prompt's project structure (Section 5) does NOT include a backend directory. These two specs conflict, and developers following the prompt literally will build the wrong architecture.
- Safe modification: Follow the MEMORY.md architecture decision (Python backend proxy). The `frontend/src/api/` layer should call the FastAPI backend, not WooCommerce directly. The backend handles all WooCommerce/WordPress API communication.
- Test coverage: None.

**B2BKing plugin dependency:**
- Files: Planned for `wordpress/honor-labs-api-endpoints.php`, `frontend/src/utils/constants.ts`
- Why fragile: The entire doctor/patient identification system depends on B2BKing's `b2bking_customergroup` user meta field with hardcoded group IDs (599 for doctors, 695 for patients). If B2BKing is updated, uninstalled, or changes its meta key naming, all user-type identification breaks. These IDs are also WordPress-instance-specific.
- Safe modification: Abstract B2BKing group IDs into configuration (environment variables or a settings endpoint), not hardcoded constants. Add validation that the expected groups exist on app startup.
- Test coverage: None.

**WordPress plugin data structure assumptions:**
- Files: Planned for `wordpress/honor-labs-api-endpoints.php`
- Why fragile: The custom REST endpoints must query data from 5 custom Honor Labs plugins (doctor onboarding, patient portal, access control, doctor dashboard, signup). The prompt notes the doctor onboarding plugin is ~838 lines but provides no schema documentation. The PHP snippet must reverse-engineer post types, meta keys, and custom table structures from these plugins. If any plugin is updated, the custom endpoints could break.
- Safe modification: Document all assumed meta keys and table names in the PHP snippet with comments. Add error handling for missing meta keys. Build a health-check endpoint that verifies expected data structures exist.
- Test coverage: None.

## Scaling Limits

**Hostinger Cloud shared hosting:**
- Current capacity: Small user base (10 users, 4 products). Adequate for now.
- Limit: WooCommerce on shared hosting becomes slow with heavy API usage. The WordPress REST API bootstraps the full WordPress stack on every request. Dashboard polling from multiple admin sessions will compound this.
- Scaling path: Backend caching layer reduces WordPress API load. Long-term, consider migrating to dedicated hosting or using webhooks for real-time order updates instead of polling.

**10 users currently, but patient growth could be rapid:**
- Current capacity: 4 doctors, 4 patients. All API calls are trivial.
- Limit: If each doctor refers 50+ patients, the system will have hundreds of patients. Commission calculations, patient listing with doctor lookups, and order aggregation queries will slow significantly.
- Scaling path: Pre-compute commission summaries in the PHP endpoint. Use pagination on all list endpoints. Add database indexes on B2BKing meta queries.

## Dependencies at Risk

**Tailwind CSS v4 (major version):**
- Risk: Tailwind v4 (`^4.2.1`) was released recently and has a significantly different configuration model from v3 (CSS-based config instead of `tailwind.config.js`). Many online resources, AI training data, and shadcn/ui documentation still reference v3 patterns. This increases risk of incorrect configuration during development.
- Impact: Styling issues, incompatible plugins, wasted debugging time.
- Migration plan: If problems arise, downgrade to Tailwind v3 (well-documented, mature ecosystem). Alternatively, ensure all Tailwind v4 patterns are followed correctly from the start.

**React 19 (`^19.2.0`):**
- Risk: React 19 is relatively new. Some ecosystem libraries may not be fully compatible (though the major ones like TanStack Query and React Router v6 are). Server component patterns in React 19 are not relevant for this Vite SPA, so the risk is low.
- Impact: Minimal for this use case.
- Migration plan: None needed -- React 19 is stable for client-side SPA usage.

## Missing Critical Features

**No .env.example file:**
- Problem: The project structure in the prompt specifies a `.env.example` file, but none exists. Developers (including AI agents) have no reference for what environment variables are expected.
- Blocks: Backend setup, API configuration, deployment.
- Fix: Create `.env.example` at the project root and `frontend/.env.example` documenting all required variables (with placeholder values, not real secrets).

**No Python dependency declaration:**
- Problem: The backend has no `requirements.txt` or `pyproject.toml`. Cannot install dependencies, cannot create a virtual environment, cannot deploy.
- Blocks: All backend development.
- Fix: Create `backend/requirements.txt` with at minimum: `fastapi`, `uvicorn[standard]`, `httpx`, `python-dotenv`, `pydantic`, `pydantic-settings`.

**No Dockerfile or deployment configuration:**
- Problem: No `Dockerfile`, `docker-compose.yml`, or deployment scripts exist. The prompt does not specify a deployment target for the React + FastAPI app.
- Blocks: Deployment and CI/CD setup.
- Fix: Add a `Dockerfile` for the backend (Python), a build step for the frontend (static files), and a `docker-compose.yml` for local development. Determine hosting target (Vercel for frontend + a Python host for backend, or a single VPS).

**No test infrastructure:**
- Problem: No test runner, test configuration, or test files exist for frontend or backend. No `vitest.config.ts`, no `pytest.ini`, no test directories.
- Blocks: Quality assurance, regression prevention.
- Fix: Add Vitest for frontend testing (`vitest.config.ts`, `src/**/*.test.tsx`). Add pytest for backend testing (`backend/tests/`, `pytest.ini`).

## Test Coverage Gaps

**Zero test coverage -- no tests exist:**
- What's not tested: Everything. No test files, no test configuration, no test runner for either frontend or backend.
- Files: Entire `frontend/src/` directory, entire `backend/` directory
- Risk: Any code written without tests is fragile from day one. For a business dashboard handling financial data (orders, commissions), untested code is particularly risky.
- Priority: Medium -- establish test infrastructure during Phase 1 foundation work. Critical paths (commission calculations, order type identification, API authentication) should be tested first.

---

*Concerns audit: 2026-03-07*
