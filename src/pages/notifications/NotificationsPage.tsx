import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/lib/types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'action_required' | 'info'>('all');

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread') return !n.read;
      if (filter === 'action_required') return n.type === 'action_required';
      if (filter === 'info') return n.type === 'info' || n.type === 'success';
      return true;
    });
  }, [notifications, filter]);

  // Group notifications by date: Today, Yesterday, Earlier This Week, Older
  const groupedNotifications = useMemo(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const thisWeek: NotificationItem[] = [];
    const older: NotificationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 86400000;
    const startOfYesterday = startOfToday - oneDayMs;
    const startOfWeek = startOfToday - 6 * oneDayMs;

    filteredNotifications.forEach(n => {
      const time = new Date(n.created_at).getTime();
      if (time >= startOfToday) {
        today.push(n);
      } else if (time >= startOfYesterday) {
        yesterday.push(n);
      } else if (time >= startOfWeek) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Earlier This Week', items: thisWeek },
      { label: 'Older Activity', items: older },
    ].filter(g => g.items.length > 0);
  }, [filteredNotifications]);

  const handleNotificationClick = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    showToast({
      type: 'success',
      title: 'All Read',
      message: 'All notifications have been marked as read.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-primary-600" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay aligned on client reviews, executive approvals, revision requests, and publishing triggers.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="h-4 w-4" />}
          >
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white font-semibold'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white font-semibold'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('action_required')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'action_required'
              ? 'bg-primary-600 text-white font-semibold'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Action Required
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'info'
              ? 'bg-primary-600 text-white font-semibold'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Updates & Submissions
        </button>
      </div>

      {/* Grouped Notifications List */}
      {groupedNotifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center bg-card shadow-soft">
          <Inbox className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? "You're all caught up! No unread notifications at this time."
              : 'There are no notification logs matching your active filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map(group => (
            <div key={group.label} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                {group.label}
              </h3>

              <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 shadow-soft overflow-hidden">
                {group.items.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 sm:p-5 flex items-start gap-4 transition-all cursor-pointer group ${
                      !n.read
                        ? 'bg-primary-50/40 dark:bg-primary-950/20 border-l-4 border-l-primary-600'
                        : 'border-l-4 border-l-transparent hover:bg-muted/20'
                    }`}
                  >
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'action_required' && (
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      )}
                      {n.type === 'info' && (
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Clock className="h-5 w-5" />
                        </div>
                      )}
                      {n.type === 'warning' && (
                        <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      )}
                      {n.type === 'success' && (
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                          {n.title}
                        </h4>
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>

                      {n.link && (
                        <div className="pt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                          <span>Inspect Deliverable</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary-600 shrink-0 mt-2 ring-4 ring-primary-100 dark:ring-primary-950" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
