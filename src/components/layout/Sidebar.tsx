import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  FileText,
  CheckSquare,
  Building2,
  HardDrive,
  Users,
  BarChart3,
  Database,
  ScrollText,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/ui/avatar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/*  Navigation definitions                                             */
/* ------------------------------------------------------------------ */

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Clients', href: '/clients', icon: Building2 },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Posts', href: '/posts', icon: FileText },
      { label: 'Approval Queue', href: '/approvals', icon: CheckSquare },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Google Drive', href: '/drive', icon: HardDrive },
      { label: 'Users', href: '/users', icon: Users, adminOnly: true },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Backup', href: '/backup', icon: Database, adminOnly: true },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, adminOnly: true },
      { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Role badge colour map                                              */
/* ------------------------------------------------------------------ */

const roleBadgeClasses: Record<string, string> = {
  admin: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  student: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  client: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
};

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();

  /* Filter nav items by role */
  const filteredSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.adminOnly || isAdmin),
      })).filter((section) => section.items.length > 0),
    [isAdmin]
  );

  /* ---------------------------------------------------------------- */
  /*  Shared sidebar content                                           */
  /* ---------------------------------------------------------------- */

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col">
        {/* ── Brand ─────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-3 shrink-0 border-b border-sidebar-border px-4',
            isCollapsed ? 'justify-center py-5' : 'py-5'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft-sm">
            <Sparkles className="h-4.5 w-4.5" strokeWidth={1.5} />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold tracking-tight text-sidebar-foreground select-none"
            >
              Amplifi
            </motion.span>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="ml-auto rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* ── Nav sections ──────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 select-none"
                >
                  {section.title}
                </motion.p>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                            isCollapsed && 'justify-center px-0',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft-sm'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── User card & collapse toggle ───────────────────────── */}
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3 space-y-2">
          {/* User card */}
          {user && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <Avatar
                src={user.avatar_url}
                name={user.full_name}
                size="sm"
                className="shrink-0"
              />
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {user.full_name}
                  </p>
                  <span
                    className={cn(
                      'inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      roleBadgeClasses[user.role] ?? 'bg-muted text-muted-foreground'
                    )}
                  >
                    {user.role}
                  </span>
                </motion.div>
              )}
              {!isCollapsed && (
                <button
                  onClick={logout}
                  className="shrink-0 rounded-lg p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-destructive transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <>
                  <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30',
          'bg-sidebar border-r border-sidebar-border',
          'overflow-hidden'
        )}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* ── Mobile sidebar (slide-out drawer) ────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onCloseMobile}
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden',
                'bg-sidebar border-r border-sidebar-border shadow-soft-xl'
              )}
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
