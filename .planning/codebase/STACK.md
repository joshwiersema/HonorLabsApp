# Technology Stack

**Analysis Date:** 2026-03-07

## Languages

**Primary:**
- TypeScript ~5.9.3 - Frontend application code (`frontend/src/`)
- PHP - WordPress custom REST endpoints (planned, `wordpress/`)

**Secondary:**
- Python 3.12.3 - Backend API proxy (planned, `backend/`)
- CSS - Styling (`frontend/src/index.css`, `frontend/src/App.css`)

## Runtime

**Environment:**
- Node.js v22.22.1 - Frontend build and dev server
- Python 3.12.3 - Backend runtime (no dependencies installed yet)

**Package Manager:**
- npm 10.9.4
- Lockfile: `frontend/package-lock.json` (present)

**No version pinning files** (.nvmrc, .node-version, .python-version) exist. Consider adding them.

## Frameworks

**Core:**
- React 19.2.0 - UI framework (`frontend/src/`)
- Vite 7.3.1 - Build tool and dev server (`frontend/vite.config.ts`)
- FastAPI - Backend API proxy (planned, `backend/` - not yet implemented)

**Planned UI:**
- Tailwind CSS 4.2.1 - Utility-first CSS (installed, not yet configured in `vite.config.ts`)
- shadcn/ui - Component library (planned, not yet installed)

**State Management:**
- TanStack React Query 5.90.21 - Server state (installed, not yet used)
- Zustand 5.0.11 - Client state (installed, not yet used)

**Routing:**
- React Router DOM 6.30.3 - Client-side routing (installed, not yet used)

**Data Display:**
- TanStack React Table 8.21.3 - Data tables (installed, not yet used)
- Recharts 3.8.0 - Charts and data visualization (installed, not yet used)

**Testing:**
- None configured. No test runner, assertion library, or test files exist.

**Build/Dev:**
- Vite 7.3.1 - Dev server and production bundler (`frontend/vite.config.ts`)
- `@vitejs/plugin-react` 5.1.1 - React Fast Refresh in dev
- TypeScript ~5.9.3 - Type checking (strict mode enabled)
- ESLint 9.39.1 - Linting (`frontend/eslint.config.js`)

## Key Dependencies

**Critical (frontend/package.json):**
- `react` ^19.2.0 - Core UI framework
- `react-dom` ^19.2.0 - DOM rendering
- `axios` ^1.13.6 - HTTP client for WooCommerce/WordPress API calls
- `@tanstack/react-query` ^5.90.21 - Server state management, caching, and data fetching
- `zustand` ^5.0.11 - Lightweight client-side state (auth credentials, theme preferences)
- `react-router-dom` ^6.30.3 - SPA routing

**UI/Presentation:**
- `tailwindcss` ^4.2.1 - Utility CSS framework
- `@tailwindcss/vite` ^4.2.1 - Tailwind Vite plugin
- `lucide-react` ^0.577.0 - Icon library
- `recharts` ^3.8.0 - Chart components (line, bar, pie, area)
- `@tanstack/react-table` ^8.21.3 - Headless table library
- `class-variance-authority` ^0.7.1 - Component variant management (for shadcn/ui pattern)
- `clsx` ^2.1.1 - Conditional className utility
- `tailwind-merge` ^3.5.0 - Tailwind class deduplication

**Utilities:**
- `date-fns` ^4.1.0 - Date formatting and manipulation

**Dev Dependencies:**
- `@types/react` ^19.2.7 - React type definitions
- `@types/react-dom` ^19.2.3 - ReactDOM type definitions
- `@types/node` ^24.10.1 - Node.js type definitions
- `typescript-eslint` ^8.48.0 - TypeScript ESLint parser/plugin
- `eslint-plugin-react-hooks` ^7.0.1 - React Hooks linting rules
- `eslint-plugin-react-refresh` ^0.4.24 - React Refresh linting rules
- `globals` ^16.5.0 - Global variable definitions for ESLint

**Backend (planned, not yet installed):**
- FastAPI - Python async web framework
- httpx or requests - HTTP client for proxying to WooCommerce
- python-dotenv - Environment variable management

## Configuration

**TypeScript:**
- `frontend/tsconfig.json` - Project references config (delegates to app and node configs)
- `frontend/tsconfig.app.json` - App code config: ES2022 target, strict mode, `react-jsx`, bundler module resolution
- `frontend/tsconfig.node.json` - Node/tooling config: ES2023 target, strict mode

**Key TypeScript settings (tsconfig.app.json):**
- `strict: true` - Full strict type checking
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused parameters
- `erasableSyntaxOnly: true` - Only erasable TypeScript syntax
- `verbatimModuleSyntax: true` - Strict ESM import/export

**Vite:**
- `frontend/vite.config.ts` - Minimal config with React plugin only
- NOTE: `@tailwindcss/vite` plugin is installed but NOT added to `vite.config.ts` yet

**ESLint:**
- `frontend/eslint.config.js` - Flat config format (ESLint v9)
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` vite preset
- Targets: `**/*.{ts,tsx}` files
- Ignores: `dist/`

**Prettier:**
- Not configured. No `.prettierrc` file exists.

**Environment Variables:**
- No `.env` files exist yet
- No `.env.example` exists yet
- Credentials (WooCommerce API keys, WordPress URL) will be needed

**Build Commands (`frontend/package.json` scripts):**
```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js 22.x (currently installed)
- npm 10.x (currently installed)
- Python 3.12+ (for backend, currently installed)
- No Docker configuration exists

**Production:**
- Frontend: Static files (Vite build output in `frontend/dist/`)
- Backend: Python FastAPI server (deployment target not yet determined)
- WordPress: Hostinger Cloud (`https://darkorange-skunk-283648.hostingersite.com`)

**Target WordPress Environment:**
- WordPress 6.x + WooCommerce 10.5.3
- WooCommerce HPOS (High-Performance Order Storage) enabled
- B2BKing Core v5.0.25
- 5 custom Honor Labs plugins
- Hostinger Cloud hosting (blocks PHP file editing, requires WPCode snippets)

## Current State

The project is in early scaffolding. The frontend has been initialized with `create-vite` (React + TypeScript template) and all planned npm dependencies are installed, but:

- **Tailwind CSS** is installed but not wired into `frontend/vite.config.ts`
- **shadcn/ui** is not yet installed or configured
- **No application code** exists beyond the Vite boilerplate (`frontend/src/App.tsx`, `frontend/src/main.tsx`)
- **Backend** has empty directory structure only (`backend/routers/`, `backend/services/`)
- **WordPress** directory is empty (`wordpress/`)
- **No test framework** is installed or configured
- **No `.env.example`** or environment configuration exists

---

*Stack analysis: 2026-03-07*
