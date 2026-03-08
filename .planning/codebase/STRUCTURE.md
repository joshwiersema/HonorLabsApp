# Codebase Structure

**Analysis Date:** 2026-03-07

## Directory Layout

```
HonorLabsCustomApp/
├── frontend/                     # React + TypeScript + Vite SPA
│   ├── public/                   # Static assets served as-is
│   │   └── vite.svg              # Default Vite favicon
│   ├── src/                      # Application source code
│   │   ├── assets/               # Imported assets (bundled by Vite)
│   │   │   └── react.svg         # Default React logo
│   │   ├── App.tsx               # Root component (Vite default, needs replacement)
│   │   ├── App.css               # Root component styles (Vite default, to be replaced)
│   │   ├── main.tsx              # Application entry point
│   │   └── index.css             # Global styles (Vite default, replace with Tailwind)
│   ├── index.html                # HTML shell (Vite entry)
│   ├── package.json              # NPM dependencies and scripts
│   ├── package-lock.json         # Locked dependency tree
│   ├── vite.config.ts            # Vite build configuration
│   ├── tsconfig.json             # TypeScript project references root
│   ├── tsconfig.app.json         # TypeScript config for app source
│   ├── tsconfig.node.json        # TypeScript config for Node tooling (vite.config.ts)
│   └── eslint.config.js          # ESLint flat config
├── backend/                      # Python FastAPI backend (empty, scaffolded)
│   ├── routers/                  # FastAPI route handlers (empty)
│   └── services/                 # Business logic and API clients (empty)
├── wordpress/                    # WPCode PHP snippets (empty)
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Codebase analysis docs
├── .git/                         # Git repository
└── Honor_Labs_App_Claude_Code_Prompt.md  # Full project specification
```

## Directory Purposes

**`frontend/`:**
- Purpose: Houses the entire React SPA -- the business dashboard UI
- Contains: TypeScript/React source, Vite config, npm manifests
- Key files: `frontend/src/main.tsx` (entry), `frontend/src/App.tsx` (root component), `frontend/vite.config.ts` (build config)

**`frontend/src/`:**
- Purpose: All application source code
- Contains: Components, pages, hooks, stores, types, utilities, API clients
- Key files: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`
- Note: Currently only contains Vite boilerplate. The planned subdirectory structure is documented below.

**`frontend/public/`:**
- Purpose: Static files served at root path without processing
- Contains: Favicons, logos, static assets
- Key files: `frontend/public/vite.svg`

**`backend/`:**
- Purpose: Python FastAPI application serving as secure API proxy
- Contains: Routers (endpoint handlers) and services (business logic)
- Key files: None yet -- `backend/main.py` needs to be created as the entry point

**`backend/routers/`:**
- Purpose: FastAPI APIRouter modules, one per domain (orders, doctors, patients, etc.)
- Contains: Python modules with route definitions
- Key files: None yet

**`backend/services/`:**
- Purpose: Business logic, external API orchestration, data transformation
- Contains: Python modules with service functions
- Key files: None yet

**`wordpress/`:**
- Purpose: PHP code to deploy as WPCode snippets on the WordPress site
- Contains: Custom REST endpoint registration and CORS configuration
- Key files: None yet -- `wordpress/honor-labs-api-endpoints.php` needs to be created

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Contains: Markdown analysis files
- Generated: Yes (by GSD tooling)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `frontend/src/main.tsx`: React app bootstrap -- creates root, renders `<App />`
- `frontend/index.html`: HTML shell loaded by browser, references `main.tsx`
- `backend/main.py` (planned): FastAPI app creation and router mounting

**Configuration:**
- `frontend/vite.config.ts`: Vite build/dev config (currently minimal -- only React plugin)
- `frontend/tsconfig.json`: TypeScript project references (delegates to `tsconfig.app.json` and `tsconfig.node.json`)
- `frontend/tsconfig.app.json`: TypeScript config for app code -- strict mode, ES2022 target, `react-jsx` JSX transform
- `frontend/tsconfig.node.json`: TypeScript config for Vite/Node tooling -- ES2023 target
- `frontend/eslint.config.js`: ESLint flat config with TypeScript-ESLint, React Hooks, and React Refresh plugins
- `frontend/package.json`: NPM dependencies and scripts (`dev`, `build`, `lint`, `preview`)

**Core Logic (planned):**
- `frontend/src/api/client.ts`: Axios instance with interceptors
- `frontend/src/api/woocommerce.ts`: WooCommerce API call functions
- `frontend/src/api/wordpress.ts`: WordPress API call functions
- `frontend/src/api/honor-labs.ts`: Honor Labs custom API call functions
- `backend/services/woocommerce.py`: WooCommerce API integration service
- `backend/services/honor_labs.py`: Honor Labs API integration service

**State Management (planned):**
- `frontend/src/stores/authStore.ts`: Zustand store for API credentials and connection state
- `frontend/src/stores/settingsStore.ts`: Zustand store for theme and display preferences

**Type Definitions (planned):**
- `frontend/src/types/order.ts`: Order-related types
- `frontend/src/types/product.ts`: Product-related types
- `frontend/src/types/doctor.ts`: Doctor-related types
- `frontend/src/types/patient.ts`: Patient-related types
- `frontend/src/types/commission.ts`: Commission-related types
- `frontend/src/types/api.ts`: Generic API response/request types

**Specification:**
- `Honor_Labs_App_Claude_Code_Prompt.md`: Complete project specification with business context, architecture decisions, page specs, design system, API contracts, and development phases

## Naming Conventions

**Files (Frontend):**
- React components: PascalCase with `.tsx` extension (e.g., `StatsCards.tsx`, `OrdersTable.tsx`, `DoctorProfile.tsx`)
- Hooks: camelCase with `use` prefix and `.ts` extension (e.g., `useOrders.ts`, `useDoctors.ts`)
- Stores: camelCase with `Store` suffix and `.ts` extension (e.g., `authStore.ts`, `settingsStore.ts`)
- Types: camelCase with `.ts` extension (e.g., `order.ts`, `doctor.ts`)
- Utilities: camelCase with `.ts` extension (e.g., `formatters.ts`, `constants.ts`, `helpers.ts`)
- API modules: kebab-case with `.ts` extension (e.g., `honor-labs.ts`)
- Pages: PascalCase with `.tsx` extension (e.g., `Dashboard.tsx`, `Orders.tsx`, `Settings.tsx`)

**Files (Backend):**
- Python modules: snake_case with `.py` extension (e.g., `woocommerce.py`, `honor_labs.py`)
- Router modules: snake_case with `.py` extension, one per domain

**Files (WordPress):**
- PHP files: kebab-case with `.php` extension (e.g., `honor-labs-api-endpoints.php`)

**Directories:**
- Frontend subdirectories: lowercase, descriptive (e.g., `api/`, `components/`, `hooks/`, `pages/`, `stores/`, `types/`, `utils/`)
- Component subdirectories: lowercase domain name (e.g., `components/dashboard/`, `components/orders/`, `components/doctors/`)
- Backend subdirectories: lowercase (e.g., `routers/`, `services/`)

## Where to Add New Code

**New Page:**
- Page component: `frontend/src/pages/{PageName}.tsx`
- Route: Add to router config in `frontend/src/App.tsx` (once React Router is set up)
- Sub-components: `frontend/src/components/{domain}/`
- Data hook: `frontend/src/hooks/use{Domain}.ts`
- Types: `frontend/src/types/{domain}.ts`

**New API Endpoint (Backend):**
- Router: `backend/routers/{domain}.py` -- add new route function
- Service logic: `backend/services/{domain}.py` -- add business logic function
- Mount router: Register in `backend/main.py`

**New React Component:**
- Layout components: `frontend/src/components/layout/`
- Domain-specific components: `frontend/src/components/{domain}/` (e.g., `components/orders/`, `components/doctors/`)
- Shared/reusable components: `frontend/src/components/shared/`
- shadcn/ui primitives: `frontend/src/components/ui/`

**New Custom Hook:**
- Data-fetching hooks: `frontend/src/hooks/use{Domain}.ts`
- Each hook file groups related queries and mutations for one domain

**New WordPress Endpoint:**
- Add route registration to `wordpress/honor-labs-api-endpoints.php`
- Follow existing pattern: `register_rest_route('honor-labs/v1', '/{path}', [...])`

**Utilities and Helpers:**
- Formatting functions: `frontend/src/utils/formatters.ts`
- Constants (group IDs, API routes): `frontend/src/utils/constants.ts`
- General helpers: `frontend/src/utils/helpers.ts`

**New Zustand Store:**
- Store file: `frontend/src/stores/{name}Store.ts`
- Follow existing naming pattern with `Store` suffix

## Special Directories

**`node_modules/`:**
- Purpose: NPM dependency installations
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by planning/execution commands
- Generated: Yes (by GSD mapping agents)
- Committed: Yes

**`frontend/public/`:**
- Purpose: Static assets served at web root (not processed by Vite)
- Generated: No
- Committed: Yes

## Build and Dev Commands

**Frontend:**
```bash
cd frontend && npm run dev        # Start Vite dev server with HMR
cd frontend && npm run build      # TypeScript check + Vite production build
cd frontend && npm run lint       # Run ESLint
cd frontend && npm run preview    # Preview production build locally
```

**Backend (planned):**
```bash
cd backend && uvicorn main:app --reload    # Start FastAPI dev server
```

## Current State

The project is in early scaffolding. The frontend has been initialized with Vite's React+TypeScript template and all planned npm dependencies are installed. The backend and wordpress directories are empty shells. All source files in `frontend/src/` are Vite boilerplate that needs to be replaced.

**What exists:**
- Vite React TypeScript project with full dependency set in `frontend/`
- Empty directory structure for `backend/routers/`, `backend/services/`, `wordpress/`
- Complete project specification in `Honor_Labs_App_Claude_Code_Prompt.md`

**What needs to be built:**
- Tailwind CSS + shadcn/ui configuration
- React Router setup with all pages
- TanStack Query provider setup
- API client layer (`frontend/src/api/`)
- All page components (`frontend/src/pages/`)
- All domain components (`frontend/src/components/`)
- All hooks (`frontend/src/hooks/`)
- All stores (`frontend/src/stores/`)
- All types (`frontend/src/types/`)
- All utilities (`frontend/src/utils/`)
- FastAPI application (`backend/main.py` and all routers/services)
- WordPress PHP snippet (`wordpress/honor-labs-api-endpoints.php`)

---

*Structure analysis: 2026-03-07*
