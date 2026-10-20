import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, FileText, CheckSquare, HardDrive, Users, Database, BarChart3, Sun, Moon, LogOut, Building2 } from 'lucide-react';
import { Modal } from './modal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { mockDb } from '../../lib/mock-db';

export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [search, setSearch] = React.useState('');
  const navigate = useNavigate();
  const { user, isAdmin, isManager, logout } = useAuth();
  const { toggleTheme } = useTheme();

  const posts = mockDb.getPosts();
  const projects = mockDb.getProjects();

  React.useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const runCommand = (action: () => void) => {
    onClose();
    action();
  };

  const navItems = [
    { label: 'Go to Dashboard', icon: <FileText className="h-4 w-4" />, path: '/' },
    { label: 'Client Accounts & Portfolios', icon: <Building2 className="h-4 w-4" />, path: '/clients' },
    { label: 'View All Projects', icon: <FolderKanban className="h-4 w-4" />, path: '/projects' },
    { label: 'View All Posts', icon: <FileText className="h-4 w-4" />, path: '/posts' },
    ...(isAdmin || isManager ? [{ label: 'Approval Queue', icon: <CheckSquare className="h-4 w-4" />, path: '/approval-queue' }] : []),
    { label: 'Google Drive Assets', icon: <HardDrive className="h-4 w-4" />, path: '/drive' },
    ...(isAdmin ? [{ label: 'User Management', icon: <Users className="h-4 w-4" />, path: '/users' }] : []),
    ...(isAdmin ? [{ label: 'Backup & Disaster Recovery', icon: <Database className="h-4 w-4" />, path: '/backup' }] : []),
    { label: 'Performance Reports & Analytics', icon: <BarChart3 className="h-4 w-4" />, path: '/reports' },
  ];

  const filteredNav = navItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPosts = posts
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 4);

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 3);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" showCloseButton={false}>
      <div className="-m-6">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commands, projects, posts, or press ESC..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredNav.map(item => (
                  <button
                    key={item.path}
                    onClick={() => runCommand(() => navigate(item.path))}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {filteredPosts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Matching Posts
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredPosts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => runCommand(() => navigate(`/posts/${p.id}`))}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    <span className="truncate pr-2">{p.title}</span>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{p.status.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences & Session
            </div>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => runCommand(toggleTheme)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-accent text-left transition-colors"
              >
                <Sun className="h-4 w-4 text-muted-foreground dark:hidden" />
                <Moon className="h-4 w-4 text-muted-foreground hidden dark:inline-block" />
                <span>Toggle Light / Dark Mode</span>
              </button>
              <button
                onClick={() => runCommand(logout)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out ({user?.email})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
