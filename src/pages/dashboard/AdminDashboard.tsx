import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  FolderKanban,
  FileCheck,
  HardDrive,
  Database,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { IntegrationStatusChip } from '@/components/ui/integration-status-chip';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const posts = mockDb.getPosts();
  const projects = mockDb.getProjects();
  const settings = mockDb.getSettings();
  const backups = mockDb.getBackups();
  const auditLogs = mockDb.getAuditLogs();

  // Metrics
  const pendingApprovals = useMemo(
    () => posts.filter(p => ['recommended_to_admin', 'pending_admin_approval', 'manager_approved'].includes(p.status)),
    [posts]
  );

  const overduePosts = useMemo(() => {
    const now = new Date();
    return posts.filter(
      p =>
        p.deadline &&
        new Date(p.deadline) < now &&
        p.status !== 'published' &&
        p.status !== 'cancelled'
    );
  }, [posts]);

  const activeProjects = useMemo(
    () => projects.filter(p => p.status === 'active'),
    [projects]
  );

  const lastBackup = backups[0];

  // Pipeline Chart Data
  const pipelineData = useMemo(() => {
    const statusGroups = [
      { name: 'Draft / Assigned', count: posts.filter(p => ['draft', 'assigned', 'student_created'].includes(p.status)).length, color: '#94A3B8' },
      { name: 'In Progress', count: posts.filter(p => p.status === 'in_progress').length, color: '#F59E0B' },
      { name: 'Review Queue', count: posts.filter(p => ['submitted', 'under_review', 'revision_required'].includes(p.status)).length, color: '#6366F1' },
      { name: 'Recommended to Admin', count: posts.filter(p => ['recommended_to_admin', 'manager_approved', 'pending_admin_approval'].includes(p.status)).length, color: '#8B5CF6' },
      { name: 'Ready to Publish', count: posts.filter(p => ['approved', 'ready_to_publish'].includes(p.status)).length, color: '#10B981' },
      { name: 'Published', count: posts.filter(p => ['published', 'scheduled'].includes(p.status)).length, color: '#059669' },
    ];
    return statusGroups;
  }, [posts]);

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide operational oversight, approval bottlenecks, and cloud infrastructure health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/approval-queue')}
            variant="primary"
            leftIcon={<FileCheck className="h-4 w-4" />}
          >
            Review Approvals ({pendingApprovals.length})
          </Button>
          <Button
            onClick={() => navigate('/projects')}
            variant="outline"
          >
            All Projects
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Admin Approvals"
          value={pendingApprovals.length}
          subtitle="Action required in queue"
          icon={<Clock className="h-5 w-5" />}
          onClick={() => navigate('/approval-queue')}
          className="border-primary-500/30"
        />
        <StatCard
          title="Overdue Posts"
          value={overduePosts.length}
          subtitle="Past agreed deadline"
          icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          className={overduePosts.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : ''}
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle="Across 3 global clients"
          icon={<FolderKanban className="h-5 w-5" />}
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title="Disaster Recovery"
          value={lastBackup ? 'Healthy' : 'Pending'}
          subtitle={`Last snapshot: ${formatRelativeTime(lastBackup?.created_at)}`}
          icon={<Database className="h-5 w-5 text-emerald-500" />}
          onClick={() => navigate('/backup')}
        />
      </div>

      {/* Main Grid: Pipeline Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart (2 cols on large) */}
        <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h2 className="text-base font-semibold text-foreground">Content Workflow Pipeline</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time volume distribution across production stages
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
              {posts.length} Active Posts
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Activity Feed */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-600" />
              <h2 className="text-base font-semibold text-foreground">System Audit Stream</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/audit-logs')}
              className="text-xs h-7 px-2"
            >
              Full Log
            </Button>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[300px] pr-1 divide-y divide-border/40">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  by <span className="font-medium text-foreground">{log.user_email || 'System'}</span>
                </p>
                {log.details && (
                  <p className="text-[11px] font-mono bg-muted/50 rounded px-1.5 py-0.5 mt-1 text-muted-foreground inline-block">
                    {JSON.stringify(log.details).slice(0, 50)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration & Infrastructure Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Google Drive Health */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Google Drive Root</h3>
                <p className="text-xs text-muted-foreground">Asset storage bridge</p>
              </div>
            </div>
            <IntegrationStatusChip
              status={settings.google_connected ? 'connected' : 'not_connected'}
              verified={settings.google_connected}
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
            <div className="flex justify-between py-0.5">
              <span>Account:</span>
              <span className="font-mono text-foreground">{settings.google_account_email}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Folder:</span>
              <span className="font-mono text-foreground truncate max-w-[150px]">{settings.google_drive_root_folder_name}</span>
            </div>
          </div>
        </div>

        {/* Database & Backup Health */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Backup Engine</h3>
                <p className="text-xs text-muted-foreground">Nightly automated snapshot</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
            <div className="flex justify-between py-0.5">
              <span>Cron Schedule:</span>
              <span className="font-mono text-foreground">{settings.backup_schedule_cron} (2:00 AM UTC)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Last Snapshot:</span>
              <span className="text-foreground">{formatRelativeTime(settings.last_backup_at)}</span>
            </div>
          </div>
        </div>

        {/* High Priority Approval Action Item */}
        <div className="rounded-xl border border-primary-500/30 bg-primary-50/20 dark:bg-primary-950/20 p-5 shadow-soft flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Urgent Attention
              </span>
              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-ping" />
            </div>
            <h3 className="text-base font-semibold text-foreground mt-2">
              {pendingApprovals.length} Posts Require Sign-off
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Posts reviewed by managers are currently awaiting final executive clearance before publishing.
            </p>
          </div>
          <Button
            onClick={() => navigate('/approval-queue')}
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full"
          >
            Open Approval Desk
          </Button>
        </div>
      </div>
    </div>
  );
};
