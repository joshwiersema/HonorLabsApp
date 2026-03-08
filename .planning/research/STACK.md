# Technology Stack

**Project:** Honor Labs Business Control Dashboard
**Researched:** 2026-03-07

## Recommended Stack

### Frontend Core

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 19.2.0 | UI framework | Already installed. React 19 is stable, all ecosystem libs support it. forwardRef deprecated in favor of ref-as-prop, which simplifies component code. | HIGH |
| TypeScript | ~5.9.3 | Type safety | Already installed. TS 6.0 is the last on the old codebase; 5.9 is stable and avoids any breaking changes from the Go-based TS 7 compiler coming mid-2026. | HIGH |
| Vite | 7.3.1 | Build tool / dev server | Already installed. Vite 7 dropped Node 18 (requires 20.19+), uses `baseline-widely-available` browser target. Vite 8 (Rolldown) is beta -- do NOT use yet. | HIGH |

### Frontend UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.1 | Utility-first CSS | Already installed. v4 uses CSS-first architecture with `@theme inline` directives instead of JS config files. Simpler, faster. | HIGH |
| shadcn/ui | latest (CLI) | Component library | NOT a package dependency -- it's a CLI that copies component source into your project. Run `npx shadcn@latest init` then `npx shadcn@latest add [component]`. Gives you ownership of all component code. Fully supports Tailwind v4 + React 19. | HIGH |
| tw-animate-css | ^1.0.0 | Animation utilities | Replaces deprecated `tailwindcss-animate`. Pure CSS approach for Tailwind v4. shadcn/ui components expect this. Import via `@import "tw-animate-css"` in globals.css. | HIGH |
| Lucide React | 0.577.0 | Icons | Already installed. Tree-shakeable, consistent icon set used by shadcn/ui. | HIGH |
| class-variance-authority | 0.7.1 | Component variants | Already installed. Used by shadcn/ui for variant-based styling (e.g., Button variants). | HIGH |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Class name utilities | Already installed. `clsx` for conditional classes, `tailwind-merge` for deduplication. Typically wrapped in a `cn()` utility. | HIGH |

### Frontend Data & State

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query | 5.90.21 | Server state / data fetching | Already installed. Handles caching, refetching, pagination, loading/error states. This is the primary state management for all API data -- use it for every API call. | HIGH |
| TanStack Table | 8.21.3 | Data tables | Already installed. Headless table logic (sorting, filtering, pagination). Pairs with shadcn/ui DataTable component. | HIGH |
| Zustand | 5.0.11 | Client-side state | Already installed. v5 uses native `useSyncExternalStore`, smaller bundle. Use ONLY for client-only state (theme, sidebar open/closed, auth tokens). Do NOT use for server data -- that's TanStack Query's job. | HIGH |
| Axios | 1.13.6 | HTTP client | Already installed. Used to make requests to the FastAPI backend (not directly to WooCommerce). Configure interceptors for auth token injection and error handling. | HIGH |

### Frontend Visualization & Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.8.0 | Charts & data visualization | Already installed. v3 has performance improvements, new coordinate hooks, React 19 compatible. Good for the dashboard's revenue/analytics charts. | HIGH |
| date-fns | 4.1.0 | Date formatting & manipulation | Already installed. Tree-shakeable, functional API. Use for formatting order dates, chart time ranges, relative time displays. | HIGH |
| React Router | 6.30.3 (keep as react-router-dom) | Client-side routing | Already installed as `react-router-dom@6`. v7 exists but merges Remix concepts we don't need. v6 is stable, well-documented, and the upgrade to v7 is non-breaking when ready. Stay on v6 for now -- no benefit to upgrading for a pure SPA. | HIGH |

### Backend Core

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Python | 3.12+ | Runtime | Python 3.12 is the sweet spot: fully supported by FastAPI, stable, fast. 3.13 works too but 3.12 has broader library compatibility. | HIGH |
| FastAPI | 0.135.1 | API framework | Async-first, automatic OpenAPI docs, dependency injection for auth, Pydantic integration for request/response validation. This IS the backend. | HIGH |
| Uvicorn | 0.41.0 | ASGI server | Production server for FastAPI. Use with `--host 0.0.0.0 --port $PORT` for Railway. For production scale, run behind Gunicorn with Uvicorn workers. | HIGH |
| Pydantic | 2.x (bundled with FastAPI) | Data validation | Comes with FastAPI. All request/response models, settings, and data transformations use Pydantic models. | HIGH |
| pydantic-settings | 2.13.1 | Configuration management | Type-safe environment variable loading. Reads from `.env` files with validation. Use `@lru_cache` on the settings getter for single-load. | HIGH |

### Backend HTTP & Auth

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| HTTPX | 0.28.1 | Async HTTP client | Use instead of `requests` because FastAPI is async. HTTPX supports async/await natively, HTTP/2, and is the recommended HTTP client for FastAPI apps. Use it for all WooCommerce/WordPress API calls. | HIGH |
| Authlib | 1.6.9 | Google OAuth client | Full OAuth 2.0 + OpenID Connect implementation. Has explicit FastAPI integration (`authlib.integrations.starlette`). Handles the Google OAuth flow, token verification, and session management. | MEDIUM |
| PyJWT | 2.x | JWT token handling | For creating/verifying session JWTs after Google OAuth login. Do NOT use `python-jose` -- it's abandoned since 2021 and has security issues. PyJWT is actively maintained and recommended by FastAPI docs. | HIGH |

### Backend Supporting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| python-dotenv | latest | .env file loading | pydantic-settings uses this under the hood. Install it so settings can read `.env` files. | HIGH |
| python-multipart | latest | Form data parsing | Required by FastAPI for file uploads and form data. Install even if not immediately needed. | HIGH |

### WordPress / PHP

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| WPCode Lite | 2.3.4 (on site) | Custom PHP snippet host | Already installed on the WordPress site. All custom REST endpoints go into a single PHP snippet registered via WPCode. No plugin file editing possible on Hostinger. | HIGH |
| WooCommerce REST API | v3 | Data source | The primary data source. OAuth 1.0a authentication with consumer key/secret. FastAPI backend stores these credentials and proxies all requests. ~120 req/min rate limit. | HIGH |
| WordPress REST API | v2 | User data source | For user meta queries. Custom endpoints under `honor-labs/v1` namespace expose B2BKing group data, doctor applications, commissions. | HIGH |

### Deployment

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Vercel | Frontend hosting | Optimized for React SPAs. Free tier handles this scale easily. Configure as SPA with fallback to index.html. | HIGH |
| Railway | Backend hosting | Native FastAPI support with auto-detection. Supports environment variables, IPv6 private networking, custom domains. Bind to `[::]:$PORT`. Use Dockerfile for production. | MEDIUM |

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.39.1 | Linting | Already installed with TypeScript ESLint. v9 uses flat config format. | HIGH |
| @vitejs/plugin-react | 5.1.1 | Vite React integration | Already installed. Handles JSX transform, fast refresh. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| HTTP client (Python) | HTTPX | requests / aiohttp | `requests` is synchronous, blocks FastAPI's async event loop. `aiohttp` is overkill for a proxy -- HTTPX is simpler with similar performance. |
| HTTP client (Frontend) | Axios | fetch / ky | Axios already installed, provides interceptors, request/response transforms, and better error handling than raw fetch. |
| JWT library (Python) | PyJWT | python-jose | python-jose abandoned since 2021, has security vulnerabilities, incompatible with Python 3.10+. |
| Client state | Zustand | Redux Toolkit / Jotai | Redux is overkill for this app (small client state). Jotai is fine but Zustand is already installed and simpler for this use case. |
| Routing | React Router v6 | React Router v7 / TanStack Router | v7 merges Remix SSR concepts we don't need. TanStack Router is newer with less ecosystem support. v6 is stable and battle-tested for SPAs. |
| Charts | Recharts | Nivo / Victory / Tremor | Recharts already installed, simpler API, good enough for admin dashboard charts. Nivo is more powerful but heavier. Tremor is nice but adds another component library. |
| CSS | Tailwind v4 | CSS Modules / Emotion / styled-components | Tailwind already installed, shadcn/ui built on it, fastest iteration speed for admin dashboards. |
| OAuth (Python) | Authlib | FastAPI-Users / custom | Authlib is the most complete OAuth library with explicit FastAPI support. FastAPI-Users adds unnecessary DB user management we don't need (Google OAuth only). |
| Animation | tw-animate-css | tailwindcss-animate / Framer Motion | tailwindcss-animate deprecated for Tailwind v4. Framer Motion is overkill for an admin dashboard -- subtle CSS animations are sufficient. |
| Backend server | Uvicorn | Hypercorn / Daphne | Uvicorn is the standard for FastAPI, best documented, most community support. Hypercorn works but less ecosystem familiarity. |

## Installation

### Frontend (already scaffolded -- remaining setup)

```bash
cd /home/josh-wiersema/Documents/HonorLabsCustomApp/frontend

# Initialize shadcn/ui (run interactively)
npx shadcn@latest init

# Install animation library for Tailwind v4
npm install -D tw-animate-css

# Add common shadcn/ui components
npx shadcn@latest add button card badge input table tabs dialog dropdown-menu select separator skeleton toast avatar
```

### Backend

```bash
cd /home/josh-wiersema/Documents/HonorLabsCustomApp/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Core
pip install fastapi==0.135.1 uvicorn[standard]==0.41.0

# HTTP client for WooCommerce/WordPress API calls
pip install httpx==0.28.1

# Configuration
pip install pydantic-settings==2.13.1 python-dotenv

# Authentication
pip install authlib==1.6.9 PyJWT

# Form data support
pip install python-multipart

# Freeze
pip freeze > requirements.txt
```

### Backend requirements.txt (expected)

```
fastapi==0.135.1
uvicorn[standard]==0.41.0
httpx==0.28.1
pydantic-settings==2.13.1
python-dotenv
authlib==1.6.9
PyJWT
python-multipart
```

## Key Configuration Notes

### Tailwind CSS v4 + shadcn/ui

Tailwind v4 uses CSS-first configuration. No `tailwind.config.ts` needed (it may exist from scaffolding but v4 ignores it). All theming goes in `src/index.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(238.7 83.5% 66.7%);  /* Indigo #6366f1 */
  --primary-foreground: hsl(0 0% 100%);
  /* ... other variables */
}

.dark {
  --background: hsl(222.2 84% 4.9%);   /* Deep navy #0f172a */
  --foreground: hsl(210 40% 98%);
  /* ... dark mode overrides */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... map all variables */
}
```

### FastAPI CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev
        "https://your-app.vercel.app",    # Production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

### FastAPI Settings with pydantic-settings

```python
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    wc_consumer_key: str
    wc_consumer_secret: str
    wp_site_url: str
    google_client_id: str
    google_client_secret: str
    jwt_secret: str
    allowed_emails: list[str] = []

    model_config = {"env_file": ".env"}

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### React Router v6 vs v7 Decision

Stay on `react-router-dom@6.30.3`. React Router v7 merges the react-router and react-router-dom packages and adds Remix-style data loaders, SSR, and framework features. None of these benefit a client-side SPA proxying through FastAPI. The upgrade path is non-breaking when you decide to move, but there is no urgency.

### WooCommerce API Authentication via FastAPI

The FastAPI backend authenticates to WooCommerce using OAuth 1.0a (consumer key + consumer secret). These are passed as query parameters or HTTP Basic Auth. HTTPX handles this:

```python
import httpx
from functools import lru_cache

@lru_cache
def get_wc_client(settings) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=f"{settings.wp_site_url}/wp-json/wc/v3",
        auth=(settings.wc_consumer_key, settings.wc_consumer_secret),
        timeout=30.0,
    )
```

### Vite Path Aliases

Required for shadcn/ui's `@/` import convention:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Also update `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| python-jose | Abandoned since 2021, security vulnerabilities, Python 3.10+ incompatible. Use PyJWT instead. |
| tailwindcss-animate | Deprecated for Tailwind v4. Use tw-animate-css. |
| requests (Python) | Synchronous -- blocks FastAPI's async event loop. Use HTTPX. |
| Redux / Redux Toolkit | Overkill for this project. Only ~5 pieces of client state. Zustand is simpler. |
| React Router v7 | Unnecessary Remix/SSR complexity for a pure SPA. Stay on v6. |
| Radix UI directly | shadcn/ui already wraps Radix primitives. Install via shadcn CLI, not raw Radix packages. |
| next.js | This is a Vite SPA, not a Next.js app. FastAPI handles the backend. |
| tailwind.config.ts | Tailwind v4 uses CSS-first config. Config files are for v3 only. Remove if present. |
| WooCommerce Python SDK | The official `WooCommerce` pip package uses synchronous `requests`. Use HTTPX directly with OAuth 1.0a Basic Auth instead. |
| Vite 8 | Still in beta (Rolldown integration). Stick with Vite 7.3.1. |
| TypeScript 6.0 / 7.0 | TS 6 is not released yet. TS 7 (Go compiler) targets mid-2026 with breaking changes. Stay on 5.9.x. |

## Sources

- [FastAPI Official Docs - Settings](https://fastapi.tiangolo.com/advanced/settings/)
- [FastAPI PyPI](https://pypi.org/project/fastapi/)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite)
- [shadcn/ui React 19 Compatibility](https://ui.shadcn.com/docs/react-19)
- [WooCommerce REST API Docs](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [woocommerceaio - Async WooCommerce Python](https://github.com/luismedel/woocommerceaio)
- [HTTPX Official Docs](https://www.python-httpx.org/)
- [Authlib FastAPI Integration](https://docs.authlib.org/en/latest/client/fastapi.html)
- [FastAPI python-jose Deprecation Discussion](https://github.com/fastapi/fastapi/discussions/11345)
- [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5)
- [TanStack Query v5](https://tanstack.com/query/latest)
- [React Router v6 to v7 Upgrade Guide](https://reactrouter.com/upgrading/v6)
- [tw-animate-css GitHub](https://github.com/Wombosvideo/tw-animate-css)
- [Railway FastAPI Deploy Guide](https://docs.railway.com/guides/fastapi)
- [Vite 7.0 Release](https://vite.dev/blog/announcing-vite7)
- [pydantic-settings PyPI](https://pypi.org/project/pydantic-settings/)
- [Recharts Releases](https://github.com/recharts/recharts/releases)
