import { useLocation } from 'react-router-dom';
import { Moon, Sun, Monitor, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { NAV_ITEMS } from '@/utils/constants';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useSettingsStore();
  const storeUrl = useAuthStore((s) => s.storeUrl);

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  );

  const themeIcon =
    theme === 'dark' ? <Moon className="h-4 w-4" /> :
    theme === 'light' ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {currentPage?.label ?? 'Honor Labs'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {storeUrl && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {storeUrl.replace(/^https?:\/\//, '')}
          </span>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Theme: ${theme}`}>
          {themeIcon}
        </Button>
      </div>
    </header>
  );
}
