import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { mockDb } from '@/lib/mock-db';
import { Avatar } from '@/components/ui/avatar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CommandPalette } from '@/components/ui/command-palette';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const { user, role, logout, switchRoleUser } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute breadcrumbs from route
  const getBreadcrumbs = () => {
    const pathname = location.pathname;
    if (pathname === '/' || pathname === '/dashboard') {
      return [{ label: 'Workspace' }, { label: 'Dashboard' }];
    }
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href?: string }[] = [{ label: 'Workspace', href: '/' }];

    parts.forEach((part, index) => {
      const url = `/${parts.slice(0, index + 1).join('/')}`;
      const formatted = part
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      if (index === parts.length - 1) {
        crumbs.push({ label: formatted });
      } else {
        crumbs.push({ label: formatted, href: url });
      }
    });

    return crumbs;
  };

  const allUsers = mockDb.getUsers();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left Section: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open mobile navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <Breadcrumbs items={getBreadcrumbs()} />
          </div>
        </div>

        {/* Right Section: Global Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-soft-sm"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search anything...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            title={`Toggle Theme (Current: ${resolvedTheme})`}
            aria-label="Toggle color theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white ring-2 ring-card animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary-50 dark:bg-primary-950 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className={cn(
                        'flex items-start gap-3 p-3.5 text-xs transition-colors cursor-pointer hover:bg-accent',
                        !n.read && 'bg-primary-50/40 dark:bg-primary-950/20'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'action_required' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                        {n.type === 'info' && <Clock className="h-4 w-4 text-blue-500" />}
                        {n.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                        {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-foreground font-medium', !n.read && 'font-semibold')}>
                          {n.title}
                        </p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0 mt-1" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border/80 p-2 text-center">
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-full rounded-md py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />

          {/* User Profile & Role Switcher Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                <Avatar
                  name={user?.full_name || 'User'}
                  src={user?.avatar_url}
                  size="sm"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
                    {user?.full_name || 'Signed In'}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    {role || 'Guest'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
                  <div className="pt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                      {role} Access Level
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Role Switcher Submenu (for testing & role demonstration) */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Users className="h-4 w-4 mr-2 text-primary-600" />
                  <span>Switch Role / User</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuLabel className="text-xs">Quick Role Switching</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allUsers.map(u => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => switchRoleUser(u.id)}
                      className={cn(u.id === user?.id && 'bg-primary-50 dark:bg-primary-950/50 font-semibold')}
                    >
                      <Avatar name={u.full_name} src={u.avatar_url} size="sm" className="mr-2" />
                      <div className="flex flex-col">
                        <span className="text-xs">{u.full_name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{u.role}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={() => navigate('/force-password-change')}>
                <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Security & Password</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} destructive>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
};
