import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Stethoscope,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';

const iconMap = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Stethoscope,
  Users,
  DollarSign,
  BarChart3,
  Settings,
} as const;

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const storeUrl = useAuthStore((s) => s.storeUrl);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight">Honor Labs</span>
          <span className="text-xs text-sidebar-foreground/60">Control Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Connection Status */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">
                {username ?? 'User'}
              </span>
              {storeUrl && (
                <span className="text-xs text-sidebar-foreground/50 truncate max-w-[130px]">
                  {storeUrl.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
