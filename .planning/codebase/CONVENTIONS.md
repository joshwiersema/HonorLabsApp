# Coding Conventions

**Analysis Date:** 2026-03-07

## Project State

This project is in **early scaffolding phase**. The frontend has been initialized with Vite's React+TypeScript template and dependencies installed, but no custom application code has been written yet. The backend (`backend/`) and WordPress (`wordpress/`) directories are empty. The conventions below are derived from the project's configuration files, the development prompt (`/home/josh-wiersema/Documents/HonorLabsCustomApp/Honor_Labs_App_Claude_Code_Prompt.md`), and the installed tooling. These conventions MUST be followed when writing new code.

## Naming Patterns

**Files (Frontend - React/TypeScript):**
- React components: PascalCase with `.tsx` extension (e.g., `OrdersTable.tsx`, `DoctorProfile.tsx`, `StatsCards.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useOrders.ts`, `useDoctors.ts`, `useAuth.ts`)
- Type definition files: camelCase with `.ts` extension (e.g., `order.ts`, `doctor.ts`, `api.ts`)
- Utility/helper files: camelCase with `.ts` extension (e.g., `formatters.ts`, `constants.ts`, `helpers.ts`)
- Store files: camelCase suffixed with `Store` (e.g., `authStore.ts`, `settingsStore.ts`)
- API client files: camelCase with `.ts` extension (e.g., `client.ts`, `woocommerce.ts`, `honor-labs.ts`)
- CSS files: match the component name in PascalCase or use `index.css` for global styles

**Files (Backend - Python/FastAPI):**
- Use snake_case for all Python files (e.g., `woocommerce_proxy.py`, `doctor_service.py`)
- Router files go in `backend/routers/`
- Service/business logic files go in `backend/services/`

**Files (WordPress - PHP):**
- Use kebab-case (e.g., `honor-labs-api-endpoints.php`)

**Functions/Methods:**
- TypeScript: camelCase (e.g., `fetchOrders`, `calculateCommission`, `formatCurrency`)
- Python: snake_case (e.g., `get_orders`, `calculate_commission`)
- PHP: snake_case (e.g., `register_honor_labs_endpoints`)

**Variables:**
- TypeScript: camelCase (e.g., `orderTotal`, `doctorList`, `isLoading`)
- Python: snake_case (e.g., `order_total`, `doctor_list`)
- Constants: UPPER_SNAKE_CASE (e.g., `B2BKING_GROUPS`, `API_BASE_URL`)

**Types/Interfaces (TypeScript):**
- PascalCase, no `I` prefix (e.g., `Order`, `Doctor`, `Patient`, `CommissionData`)
- Use `type` for unions and simple types, `interface` for object shapes that may be extended

**React Components:**
- PascalCase function names matching file names (e.g., `function OrdersTable()` in `OrdersTable.tsx`)
- Use function declarations (`function Component()`) or arrow functions with explicit typing
- Export as default for page components, named exports for shared/reusable components

## Code Style

**Formatting:**
- No Prettier installed. ESLint handles style through `typescript-eslint`.
- If adding Prettier later, configure it alongside ESLint. For now, follow ESLint defaults.
- Use 2-space indentation (Vite template default)
- Use single quotes for imports (as seen in existing scaffolded files like `frontend/src/main.tsx` and `frontend/src/App.tsx`)
- No semicolons at end of statements (as seen in existing scaffolded files)
- Trailing commas in multi-line constructs

**Linting:**
- ESLint 9 flat config at `frontend/eslint.config.js`
- Active plugins: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Lint command: `npm run lint` (runs `eslint .`)
- Config targets `**/*.{ts,tsx}` files, ignores `dist/`

**TypeScript Strictness:**
- `strict: true` is enabled in `frontend/tsconfig.app.json`
- `noUnusedLocals: true` - do not leave unused variables
- `noUnusedParameters: true` - do not leave unused function parameters (prefix with `_` if intentionally unused)
- `noFallthroughCasesInSwitch: true` - always break/return in switch cases
- `erasableSyntaxOnly: true` - use `type` imports for type-only imports
- `noUncheckedSideEffectImports: true`
- `verbatimModuleSyntax: true` - use `import type` for type-only imports
- Target: ES2022, module: ESNext, JSX: react-jsx

## Import Organization

**Order (TypeScript/React files):**
1. React and React-related imports (`react`, `react-dom`, `react-router-dom`)
2. Third-party library imports (`@tanstack/react-query`, `zustand`, `axios`, `recharts`, `date-fns`, `lucide-react`)
3. Internal absolute imports - API clients (`@/api/*`)
4. Internal absolute imports - Components (`@/components/*`)
5. Internal absolute imports - Hooks (`@/hooks/*`)
6. Internal absolute imports - Stores (`@/stores/*`)
7. Internal absolute imports - Types (`@/types/*`)
8. Internal absolute imports - Utils (`@/utils/*`)
9. Relative imports (sibling components, local styles)
10. CSS/style imports last

**IMPORTANT:** Use `import type { X }` (with `type` keyword) for type-only imports. This is enforced by `verbatimModuleSyntax: true` in tsconfig.

**Path Aliases:**
- No path aliases are currently configured. The project prompt's structure suggests `@/` pointing to `src/`.
- When adding path aliases, configure both `frontend/tsconfig.app.json` (paths) and `frontend/vite.config.ts` (resolve.alias).

Example:
```typescript
// In tsconfig.app.json compilerOptions:
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}

// In vite.config.ts:
import path from 'path'
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Component Patterns

**React Component Structure:**
```typescript
import { useState } from 'react'
import type { Order } from '@/types/order'

interface OrdersTableProps {
  orders: Order[]
  onOrderClick: (orderId: number) => void
}

function OrdersTable({ orders, onOrderClick }: OrdersTableProps) {
  const [sortBy, setSortBy] = useState<string>('date')

  return (
    // JSX
  )
}

export default OrdersTable
```

**Hooks Pattern (TanStack Query):**
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '@/api/woocommerce'
import type { Order } from '@/types/order'

export function useOrders(params?: { status?: string; page?: number }) {
  return useQuery<Order[]>({
    queryKey: ['orders', params],
    queryFn: () => fetchOrders(params),
  })
}
```

**Zustand Store Pattern:**
```typescript
import { create } from 'zustand'

interface AuthState {
  siteUrl: string
  consumerKey: string
  consumerSecret: string
  isConnected: boolean
  setSiteUrl: (url: string) => void
  setCredentials: (key: string, secret: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  siteUrl: '',
  consumerKey: '',
  consumerSecret: '',
  isConnected: false,
  setSiteUrl: (url) => set({ siteUrl: url }),
  setCredentials: (key, secret) => set({ consumerKey: key, consumerSecret: secret }),
}))
```

## Error Handling

**Frontend (React/TypeScript):**
- Use TanStack Query's built-in error handling (`isError`, `error` properties) for API calls
- Display user-friendly error messages, not raw API errors
- Use error boundaries for unexpected component errors
- Axios interceptors in `frontend/src/api/client.ts` for global error handling (401, 403, 500)
- Type errors explicitly: `catch (error: unknown)` then narrow with type guards

**Backend (Python/FastAPI):**
- Use FastAPI's `HTTPException` for expected errors with appropriate status codes
- Use custom exception classes for domain-specific errors
- Return consistent error response shapes: `{ "detail": "message" }`
- Log unexpected errors with full stack traces

**WordPress (PHP):**
- Use `WP_Error` for WordPress REST API error responses
- Use `rest_ensure_response()` to wrap all responses
- Always check `is_wp_error()` on WP function returns

## Logging

**Frontend:** Use `console.error()` for actual errors only. Remove `console.log()` debug statements before committing. Consider a lightweight logger utility if debug logging is needed.

**Backend (Python):** Use Python's `logging` module with structured log messages. Use `uvicorn` logger for request logging.

## Comments

**When to Comment:**
- Complex business logic (commission calculations, B2BKing group detection)
- Non-obvious API integration quirks (WooCommerce HPOS, B2BKing meta field names)
- TODO markers for known incomplete implementations

**JSDoc/TSDoc:**
- Use JSDoc on exported utility functions and complex hooks
- Document function parameters and return types in JSDoc when types alone are not descriptive enough
- Do not add JSDoc to simple, self-documenting React components

**Python Docstrings:**
- Use Google-style docstrings on all public functions and classes

## Function Design

**Size:** Keep functions under ~50 lines. Extract sub-operations into helper functions.

**Parameters:** Prefer object parameters for functions with 3+ parameters (use destructuring). Use TypeScript interfaces for parameter shapes.

**Return Values:** Always type return values explicitly on non-trivial functions. Prefer returning typed objects over tuples for multi-value returns.

## Module Design

**Exports:**
- Page components: default export
- Shared/reusable components: named exports
- Hooks: named exports (one hook per file, function name matches file name)
- Types: named exports, grouped by domain in single files (e.g., all order-related types in `types/order.ts`)
- Utils: named exports

**Barrel Files:**
- Use barrel files (`index.ts`) sparingly. Prefer direct imports to avoid circular dependency issues.
- Acceptable for `components/ui/index.ts` (shadcn/ui re-exports) and `types/index.ts`

## CSS / Styling

**Approach:** Tailwind CSS v4 with `@tailwindcss/vite` plugin. No `tailwind.config.ts` needed with v4 (use CSS-based configuration).

**Patterns:**
- Use Tailwind utility classes directly in JSX
- Use `clsx` (from installed deps) + `tailwind-merge` (from installed deps) via a `cn()` utility for conditional class merging
- Use `class-variance-authority` (from installed deps) for component variants (shadcn/ui pattern)
- Avoid custom CSS files for individual components; use Tailwind utilities instead
- Global styles only in `frontend/src/index.css`

**cn() utility (create at `frontend/src/utils/cn.ts`):**
```typescript
import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## State Management

**Server State:** TanStack Query (React Query v5) for all API data. Use query keys consistently (e.g., `['orders']`, `['orders', orderId]`, `['doctors', 'applications']`).

**Client State:** Zustand for UI state that persists across routes (auth credentials, theme preferences). Use React's `useState`/`useReducer` for component-local state.

**Do NOT:**
- Store server-fetched data in Zustand (use TanStack Query cache instead)
- Use React Context for frequently-changing state (use Zustand)

---

*Convention analysis: 2026-03-07*
