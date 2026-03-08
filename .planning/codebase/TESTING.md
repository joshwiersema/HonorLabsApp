# Testing Patterns

**Analysis Date:** 2026-03-07

## Current State

**No testing infrastructure is set up.** The frontend has been scaffolded with Vite + React + TypeScript, but no test framework, test runner, or test files exist. The backend (`backend/`) and WordPress (`wordpress/`) directories are empty. This document prescribes the testing patterns to establish.

## Recommended Test Framework

### Frontend (React + TypeScript)

**Runner:**
- Vitest (recommended - integrates natively with Vite, same config, same transforms)
- Config: `frontend/vitest.config.ts` (or extend `frontend/vite.config.ts`)

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`, `vi`)

**DOM Testing:**
- `@testing-library/react` for component rendering
- `@testing-library/jest-dom` for DOM matchers (`.toBeInTheDocument()`, `.toHaveTextContent()`)
- `@testing-library/user-event` for simulating user interactions

**Installation Required:**
```bash
cd /home/josh-wiersema/Documents/HonorLabsCustomApp/frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

**Vitest Configuration (create `frontend/vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Test Setup File (create `frontend/src/test/setup.ts`):**
```typescript
import '@testing-library/jest-dom/vitest'
```

**Add scripts to `frontend/package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Run Commands:**
```bash
npm run test               # Run all tests once
npm run test:watch         # Watch mode (re-runs on file change)
npm run test:coverage      # Run with coverage report
```

### Backend (Python / FastAPI)

**Runner:**
- pytest (standard Python test runner)

**Assertion Library:**
- pytest built-in assertions
- `httpx` with `TestClient` from FastAPI for API endpoint testing

**Installation Required:**
```bash
cd /home/josh-wiersema/Documents/HonorLabsCustomApp/backend
pip install pytest pytest-asyncio httpx
```

**pytest Configuration (in `backend/pyproject.toml`):**
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

## Test File Organization

### Frontend

**Location:** Co-located with source files (test file next to the file it tests).

**Naming:** `{filename}.test.tsx` for components, `{filename}.test.ts` for non-JSX modules.

**Structure:**
```
frontend/src/
├── api/
│   ├── client.ts
│   ├── client.test.ts
│   ├── woocommerce.ts
│   └── woocommerce.test.ts
├── components/
│   ├── shared/
│   │   ├── DataTable.tsx
│   │   ├── DataTable.test.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusBadge.test.tsx
│   ├── orders/
│   │   ├── OrdersTable.tsx
│   │   └── OrdersTable.test.tsx
├── hooks/
│   ├── useOrders.ts
│   └── useOrders.test.ts
├── stores/
│   ├── authStore.ts
│   └── authStore.test.ts
├── utils/
│   ├── formatters.ts
│   └── formatters.test.ts
├── test/
│   ├── setup.ts              # Test setup (jest-dom matchers)
│   ├── fixtures/              # Shared test data
│   │   ├── orders.ts
│   │   ├── doctors.ts
│   │   └── patients.ts
│   └── helpers/               # Test utilities
│       ├── render.tsx         # Custom render with providers
│       └── mocks.ts           # Common mock factories
```

### Backend

**Location:** Separate `tests/` directory mirroring source structure.

**Naming:** `test_{filename}.py`

**Structure:**
```
backend/
├── routers/
│   ├── orders.py
│   └── doctors.py
├── services/
│   ├── woocommerce.py
│   └── commission.py
├── tests/
│   ├── conftest.py            # Shared fixtures
│   ├── test_orders.py
│   ├── test_doctors.py
│   └── test_commission.py
```

## Test Structure

### Frontend Component Test Pattern

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders completed status with green styling', () => {
    render(<StatusBadge status="completed" />)

    const badge = screen.getByText('Completed')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100')
  })

  it('renders processing status with blue styling', () => {
    render(<StatusBadge status="processing" />)

    expect(screen.getByText('Processing')).toHaveClass('bg-blue-100')
  })
})
```

### Frontend Hook Test Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { useOrders } from './useOrders'
import type { ReactNode } from 'react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useOrders', () => {
  it('fetches orders successfully', async () => {
    vi.mock('@/api/woocommerce', () => ({
      fetchOrders: vi.fn().mockResolvedValue([
        { id: 1, status: 'completed', total: '100.00' },
      ]),
    }))

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })
})
```

### Frontend Store Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
      siteUrl: '',
      consumerKey: '',
      consumerSecret: '',
      isConnected: false,
    })
  })

  it('sets site URL', () => {
    useAuthStore.getState().setSiteUrl('https://example.com')
    expect(useAuthStore.getState().siteUrl).toBe('https://example.com')
  })

  it('sets credentials', () => {
    useAuthStore.getState().setCredentials('ck_test', 'cs_test')
    expect(useAuthStore.getState().consumerKey).toBe('ck_test')
    expect(useAuthStore.getState().consumerSecret).toBe('cs_test')
  })
})
```

### Frontend Utility Test Pattern

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './formatters'

describe('formatCurrency', () => {
  it('formats whole numbers', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })

  it('formats decimal numbers', () => {
    expect(formatCurrency(7.5)).toBe('$7.50')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})
```

### Backend API Test Pattern (FastAPI)

```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_get_orders(client):
    response = await client.get("/api/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
```

## Mocking

### Frontend Mocking Framework

**Framework:** Vitest's built-in `vi` module (API-compatible with Jest's `jest` mock functions).

**Mocking API Calls:**
```typescript
import { vi } from 'vitest'

// Mock an entire module
vi.mock('@/api/woocommerce', () => ({
  fetchOrders: vi.fn().mockResolvedValue([]),
  fetchOrderById: vi.fn().mockResolvedValue({ id: 1 }),
}))

// Mock axios instance
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
```

**Mocking React Router:**
```typescript
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// Wrap component with router for tests
render(
  <MemoryRouter initialEntries={['/orders']}>
    <OrdersPage />
  </MemoryRouter>
)

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})
```

**What to Mock:**
- API calls (axios, fetch) - always mock, never hit real APIs in tests
- Browser APIs not available in jsdom (localStorage, navigator)
- External service SDKs
- Date/time (use `vi.useFakeTimers()` for time-dependent logic)

**What NOT to Mock:**
- React components under test (test the real component)
- Utility functions (test them directly)
- Zustand stores (test real store behavior, reset state in `beforeEach`)
- TanStack Query (use real QueryClient with `retry: false`)

### Backend Mocking (Python)

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_proxy_woocommerce_orders(client):
    mock_response = [{"id": 1, "status": "completed"}]
    with patch("services.woocommerce.fetch_orders", new_callable=AsyncMock, return_value=mock_response):
        response = await client.get("/api/orders")
        assert response.status_code == 200
        assert response.json() == mock_response
```

## Fixtures and Factories

### Frontend Test Data

**Create fixture files at `frontend/src/test/fixtures/`:**

```typescript
// frontend/src/test/fixtures/orders.ts
import type { Order } from '@/types/order'

export const mockOrder: Order = {
  id: 1001,
  status: 'completed',
  date_created: '2026-03-01T10:00:00',
  total: '100.00',
  customer_id: 5,
  billing: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  },
  line_items: [
    {
      id: 1,
      name: 'Dry Eye Support',
      quantity: 24,
      total: '168.00',
    },
  ],
}

export const mockOrders: Order[] = [
  mockOrder,
  { ...mockOrder, id: 1002, status: 'processing', total: '56.00' },
  { ...mockOrder, id: 1003, status: 'on-hold', total: '42.00' },
]
```

```typescript
// frontend/src/test/fixtures/doctors.ts
import type { Doctor } from '@/types/doctor'

export const mockDoctor: Doctor = {
  id: 5,
  name: 'Dr. Jane Smith',
  email: 'jane@eyecare.com',
  npiNumber: '1234567890',
  practiceName: 'Smith Eye Care',
  specialty: 'Optometry',
  referralCode: 'DRSMITH',
  patientCount: 3,
  status: 'approved',
}
```

### Custom Render Helper

**Create at `frontend/src/test/helpers/render.tsx`:**

```typescript
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

interface RenderOptions {
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={options.initialEntries ?? ['/']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}
```

**Location:**
- Frontend fixtures: `frontend/src/test/fixtures/`
- Frontend test helpers: `frontend/src/test/helpers/`
- Backend fixtures: `backend/tests/conftest.py`

## Coverage

**Requirements:** No coverage thresholds are currently enforced. Recommended minimum targets:
- Utility functions (`utils/`): 90%+
- Hooks (`hooks/`): 80%+
- Zustand stores (`stores/`): 90%+
- Shared components (`components/shared/`): 80%+
- Page components (`pages/`): 60%+
- API client code (`api/`): 70%+

**View Coverage:**
```bash
cd /home/josh-wiersema/Documents/HonorLabsCustomApp/frontend
npm run test:coverage     # Generates text + HTML report
# HTML report at: frontend/coverage/index.html
```

## Test Types

### Unit Tests
- **Scope:** Individual functions, hooks, stores, and UI components in isolation
- **Location:** Co-located with source files as `*.test.ts(x)`
- **What to test:** Pure utility functions, Zustand store state transitions, component rendering and user interactions, hook behavior with mocked API calls
- **Priority:** Write unit tests for ALL utility functions and store logic. Write component tests for shared/reusable components.

### Integration Tests
- **Scope:** Multiple components working together, page-level rendering with real stores and mocked API
- **Location:** Co-located with page components (e.g., `pages/Orders.test.tsx`)
- **What to test:** Full page renders with mocked API responses, navigation between views, form submissions triggering API calls
- **Priority:** Write integration tests for each major page after core functionality is built.

### E2E Tests
- **Framework:** Not set up. Consider Playwright or Cypress if E2E testing becomes needed.
- **Priority:** Low. Focus on unit and integration tests first.

### Backend Tests
- **Scope:** FastAPI endpoint responses, service function logic, proxy behavior
- **What to test:** Correct proxying of WooCommerce API calls, authentication forwarding, error response handling, commission calculation logic
- **Priority:** Test all proxy endpoints and the commission calculation service.

## Common Patterns

### Async Testing (Frontend)

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('OrdersPage', () => {
  it('displays orders after loading', async () => {
    renderWithProviders(<OrdersPage />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Order #1001')).toBeInTheDocument()
  })
})
```

### Error State Testing (Frontend)

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

describe('OrdersPage', () => {
  it('displays error message on API failure', async () => {
    vi.mock('@/api/woocommerce', () => ({
      fetchOrders: vi.fn().mockRejectedValue(new Error('Network error')),
    }))

    renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### User Interaction Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

describe('LoginForm', () => {
  it('submits credentials', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Site URL'), 'https://example.com')
    await user.type(screen.getByLabelText('Consumer Key'), 'ck_test')
    await user.type(screen.getByLabelText('Consumer Secret'), 'cs_test')
    await user.click(screen.getByRole('button', { name: /connect/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      siteUrl: 'https://example.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
    })
  })
})
```

### Testing TanStack Table Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { DataTable } from './DataTable'
import { mockOrders } from '@/test/fixtures/orders'

describe('DataTable', () => {
  const columns = [
    { accessorKey: 'id', header: 'Order #' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'total', header: 'Total' },
  ]

  it('renders rows from data', () => {
    render(<DataTable columns={columns} data={mockOrders} />)

    expect(screen.getByText('1001')).toBeInTheDocument()
    expect(screen.getByText('1002')).toBeInTheDocument()
  })

  it('sorts by column on header click', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={mockOrders} />)

    await user.click(screen.getByText('Total'))
    // Assert sort order changed
  })
})
```

---

*Testing analysis: 2026-03-07*
