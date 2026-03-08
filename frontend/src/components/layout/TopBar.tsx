import { useLocation } from 'react-router-dom';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { NAV_ITEMS } from '@/utils/constants';

export function TopBar() {
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
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
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
