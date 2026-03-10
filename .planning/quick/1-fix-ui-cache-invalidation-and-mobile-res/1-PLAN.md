---
phase: quick-fix
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useDoctors.ts
  - frontend/src/hooks/useProducts.ts
  - frontend/src/components/layout/AppLayout.tsx
  - frontend/src/components/layout/Sidebar.tsx
  - frontend/src/components/layout/TopBar.tsx
autonomous: true
must_haves:
  truths:
    - "Approving/rejecting a doctor updates UI immediately without page reload"
    - "Editing a product updates UI immediately without page reload"
    - "On mobile (<768px), sidebar is hidden by default and app content is usable"
    - "On mobile, hamburger button opens sidebar as overlay"
    - "On desktop (>=768px), sidebar is always visible as before"
  artifacts:
    - path: "frontend/src/hooks/useDoctors.ts"
      provides: "Doctor mutations with refetchType: none on invalidation"
    - path: "frontend/src/hooks/useProducts.ts"
      provides: "Product mutations with refetchType: none on invalidation"
    - path: "frontend/src/components/layout/AppLayout.tsx"
      provides: "Mobile sidebar state management"
    - path: "frontend/src/components/layout/Sidebar.tsx"
      provides: "Responsive sidebar with mobile overlay mode"
    - path: "frontend/src/components/layout/TopBar.tsx"
      provides: "Hamburger menu button on mobile"
  key_links:
    - from: "AppLayout.tsx"
      to: "Sidebar.tsx"
      via: "sidebarOpen state + onClose prop"
      pattern: "sidebarOpen.*setSidebarOpen"
    - from: "AppLayout.tsx"
      to: "TopBar.tsx"
      via: "onMenuClick prop"
      pattern: "onMenuClick.*setSidebarOpen"
---

<objective>
Fix two UI bugs: (1) mutations (doctor approve/reject, product edit) revert in the UI because `invalidateQueries` triggers an immediate refetch that overwrites optimistic/direct cache updates with stale WooCommerce data. (2) The sidebar is always 240px wide with no responsive behavior, making the app unusable on mobile screens.

Purpose: Make the app functional on mobile and eliminate the confusing "changes disappear" behavior after mutations.
Output: Patched hook files and responsive layout components.
</objective>

<context>
@frontend/src/hooks/useDoctors.ts
@frontend/src/hooks/useProducts.ts
@frontend/src/components/layout/AppLayout.tsx
@frontend/src/components/layout/Sidebar.tsx
@frontend/src/components/layout/TopBar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix cache invalidation in mutation hooks</name>
  <files>frontend/src/hooks/useDoctors.ts, frontend/src/hooks/useProducts.ts</files>
  <action>
In `frontend/src/hooks/useDoctors.ts`:
- In `useApproveDoctor` `onSettled`, change both `invalidateQueries` calls for `['doctors']` and `['doctor']` to include `{ refetchType: 'none' }`. This marks them stale without triggering an immediate refetch that overwrites the optimistic update. Keep the `['customerStats']` invalidation as-is (normal refetch is fine for stats).
- Apply the identical change to `useRejectDoctor` `onSettled`.

Resulting `onSettled` for both should look like:
```typescript
onSettled: () => {
  qc.invalidateQueries({ queryKey: ['doctors'], refetchType: 'none' });
  qc.invalidateQueries({ queryKey: ['doctor'], refetchType: 'none' });
  qc.invalidateQueries({ queryKey: ['customerStats'] });
},
```

In `frontend/src/hooks/useProducts.ts`:
- In `useUpdateProduct` `onSuccess`, the direct cache update via `setQueryData` is correct. Change the two `invalidateQueries` calls for `['products']` and `['product']` to include `{ refetchType: 'none' }`.

Resulting invalidation lines:
```typescript
qc.invalidateQueries({ queryKey: ['products'], refetchType: 'none' });
qc.invalidateQueries({ queryKey: ['product'], refetchType: 'none' });
```

WHY `refetchType: 'none'`: This marks the queries as stale so they refetch on next navigation/window focus, but does NOT trigger an immediate refetch that would race against the optimistic/direct cache update with potentially stale WooCommerce API data.
  </action>
  <verify>
    <automated>cd /home/josh-wiersema/Documents/HonorLabsCustomApp && grep -n "refetchType" frontend/src/hooks/useDoctors.ts frontend/src/hooks/useProducts.ts | wc -l</automated>
    Expected: 6 lines (4 in useDoctors.ts + 2 in useProducts.ts)
  </verify>
  <done>All 6 invalidateQueries calls for doctors/doctor/products/product use refetchType: 'none'. customerStats invalidation unchanged. No other changes to these files.</done>
</task>

<task type="auto">
  <name>Task 2: Add responsive mobile sidebar with hamburger toggle</name>
  <files>frontend/src/components/layout/AppLayout.tsx, frontend/src/components/layout/Sidebar.tsx, frontend/src/components/layout/TopBar.tsx</files>
  <action>
**AppLayout.tsx** -- Add mobile sidebar state:
```tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Sidebar.tsx** -- Accept `open` and `onClose` props, add responsive behavior:
- Add props: `open: boolean` and `onClose: () => void`
- Import `X` from lucide-react (already using lucide-react, no new package)
- Import `useEffect` from react for route-change auto-close
- Use `useLocation` (already imported) to auto-close sidebar on navigation

Desktop (md+): The `<aside>` element renders normally with classes `hidden md:flex` (hidden on mobile, flex on desktop). Keep `w-60` and all existing styling.

Mobile (<md): Render a separate mobile overlay structure:
- A backdrop `<div>` with `fixed inset-0 z-40 bg-black/50` that appears when `open` is true, clicking it calls `onClose`
- The sidebar `<aside>` with `fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200` plus conditional `translate-x-0` (open) vs `-translate-x-full` (closed)
- Add a close (X) button in the top-right of the mobile sidebar header
- Auto-close on route change: `useEffect` watching `location.pathname` that calls `onClose()`

Structure:
```tsx
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // ... existing store selectors ...

  // Auto-close on navigation
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const sidebarContent = (
    <>
      {/* Logo / Brand - same as current, but add X button for mobile */}
      {/* Navigation - same as current */}
      {/* User & Connection Status - same as current */}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <div className="md:hidden">
        {/* Backdrop */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        )}
        {/* Sliding sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
```

For the mobile sidebar content, add a close button in the brand header area:
- Position an `X` icon button absolute top-right of the brand section or as a flex item
- Use: `<button onClick={onClose} className="md:hidden ml-auto ..."><X className="h-4 w-4" /></button>`
- Place it inside the brand `<div>` as the last flex item

**TopBar.tsx** -- Add hamburger button on mobile:
- Import `Menu` from lucide-react (already using lucide-react)
- Accept prop `onMenuClick: () => void`
- Add a hamburger button as the FIRST element inside the header, visible only on mobile:
```tsx
<button
  onClick={onMenuClick}
  className="mr-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
  aria-label="Open menu"
>
  <Menu className="h-5 w-5" />
</button>
```
- Place it before the `<div>` containing the page title, inside the same flex container. Wrap the hamburger + title in a flex container with `items-center`.
  </action>
  <verify>
    <automated>cd /home/josh-wiersema/Documents/HonorLabsCustomApp && npx tsc --noEmit 2>&1 | tail -20</automated>
    Expected: No TypeScript errors (or only pre-existing ones unrelated to layout)
  </verify>
  <done>
    - Desktop: sidebar renders identically to before (no visual change)
    - Mobile (<768px): sidebar hidden by default, hamburger icon in top bar, tapping hamburger slides sidebar in from left with dark backdrop, tapping backdrop or navigating auto-closes sidebar
    - No new npm packages added
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. Run `npx tsc --noEmit` from frontend/ -- no new type errors
2. Run `npm run build` from frontend/ -- builds successfully
3. Manual spot-check: open app at mobile viewport width, confirm sidebar is hidden and hamburger works
4. Manual spot-check: approve a doctor, confirm status updates immediately without reverting
</verification>

<success_criteria>
- Doctor approve/reject updates persist in UI without page reload
- Product edits persist in UI without page reload
- App is usable on mobile: content visible, sidebar toggleable via hamburger
- Desktop layout unchanged
- No new dependencies added
- Frontend builds cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-ui-cache-invalidation-and-mobile-res/1-SUMMARY.md`
</output>
