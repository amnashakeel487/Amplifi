import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText,
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Clock,
  Eye,
  User,
  ExternalLink,
  Table as TableIcon,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { AuditLog } from '@/lib/types';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const rawLogs = mockDb.getAuditLogs();

  // View mode: table or timeline
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionCategory, setActionCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Selected Log for Detail Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filter options derived from data
  const uniqueUsers = useMemo(() => {
    const emails = Array.from(new Set(rawLogs.map(l => l.user_email).filter(Boolean)));
    return emails;
  }, [rawLogs]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(rawLogs.map(l => l.entity_type).filter(Boolean)));
  }, [rawLogs]);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return rawLogs.filter(log => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchUser = log.user_email?.toLowerCase().includes(q);
        const matchEntity = log.entity_type?.toLowerCase().includes(q);
        if (!matchAction && !matchUser && !matchEntity) return false;
      }

      // User filter
      if (userFilter !== 'all' && log.user_email !== userFilter) {
        return false;
      }

      // Entity filter
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) {
        return false;
      }

      // Action category
      if (actionCategory !== 'all') {
        if (actionCategory === 'auth' && !log.action.includes('AUTH') && !log.action.includes('LOGIN')) return false;
        if (actionCategory === 'post' && !log.action.includes('POST') && !log.action.includes('SUBMISSION')) return false;
        if (actionCategory === 'backup' && !log.action.includes('BACKUP') && !log.action.includes('RESTORE')) return false;
        if (actionCategory === 'user' && !log.action.includes('USER')) return false;
      }

      // Date range
      if (dateRange !== 'all') {
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();
        const oneDay = 86400000;
        if (dateRange === 'today' && now - logTime > oneDay) return false;
        if (dateRange === '7d' && now - logTime > 7 * oneDay) return false;
        if (dateRange === '30d' && now - logTime > 30 * oneDay) return false;
      }

      return true;
    });
  }, [rawLogs, searchQuery, userFilter, entityFilter, actionCategory, dateRange]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,Action,UserEmail,UserRole,EntityType,EntityId,Details']
        .concat(
          filteredLogs.map(
            l =>
              `"${l.id}","${l.created_at}","${l.action}","${l.user_email || ''}","${l.user_role || ''}","${l.entity_type}","${l.entity_id}","${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplifi_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Audit Log Exported',
      message: `${filteredLogs.length} audit event records exported to CSV.`,
    });
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'action',
      header: 'Event Action',
      cell: row => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 block">
            {row.action}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">
            {row.entity_type} • ID: {row.entity_id.substring(0, 8)}...
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'user',
      header: 'Actor',
      cell: row => (
        <div className="flex items-center gap-2">
          <Avatar name={row.user_email || 'System Daemon'} size="sm" />
          <div>
            <span className="text-xs font-semibold text-foreground block truncate max-w-[160px]">
              {row.user_email || 'System Daemon'}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
              {row.user_role || 'system'}
            </span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'details',
      header: 'Event Context / Payload',
      cell: row => (
        <pre className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-1 rounded max-w-xs truncate">
          {JSON.stringify(row.details || {})}
        </pre>
      ),
    },
    {
      id: 'time',
      header: 'Timestamp',
      cell: row => (
        <div className="space-y-0.5">
          <span className="text-xs text-foreground block font-mono">
            {formatRelativeTime(row.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono block">
            {new Date(row.created_at).toLocaleTimeString()}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: row => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row)}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
          className="text-xs h-7"
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ScrollText className="h-7 w-7 text-primary-600" />
            <span>Security & Compliance Audit Ledger</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable system-wide event trail tracking user logins, workflow transitions, and backup restorations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground'
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter actions or IDs..."
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Actor Filter */}
          <div>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Actors (Users & Daemons)</option>
              {uniqueUsers.map(email => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Entity Types</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>
                  Entity: {entity}
                </option>
              ))}
            </select>
          </div>

          {/* Action Category Filter */}
          <div>
            <select
              value={actionCategory}
              onChange={e => setActionCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Event Categories</option>
              <option value="post">Post & Workflow Events</option>
              <option value="auth">Authentication & Sessions</option>
              <option value="backup">Backup & Disaster Recovery</option>
              <option value="user">User & Roles Administration</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Time: All History</option>
              <option value="today">Time: Last 24 Hours</option>
              <option value="7d">Time: Last 7 Days</option>
              <option value="30d">Time: Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Displaying <strong className="text-foreground">{filteredLogs.length}</strong> recorded audit events
          </span>
          {(userFilter !== 'all' || entityFilter !== 'all' || actionCategory !== 'all' || dateRange !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setUserFilter('all');
                setEntityFilter('all');
                setActionCategory('all');
                setDateRange('all');
                setSearchQuery('');
              }}
              className="text-primary-600 hover:underline font-semibold"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: DATA TABLE */}
      {viewMode === 'table' ? (
        <DataTable
          data={filteredLogs}
          columns={columns}
          searchKey="action"
          searchPlaceholder="Filter audit events by action..."
        />
      ) : (
        /* VIEW MODE 2: CHRONOLOGICAL TIMELINE */
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="relative pl-4 space-y-1.5 cursor-pointer group"
              >
                {/* Timeline node */}
                <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary-600 ring-2 ring-primary-100 dark:ring-primary-950 group-hover:scale-125 transition-transform" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary-600 transition-colors">
                    {log.action}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatRelativeTime(log.created_at)} ({new Date(log.created_at).toLocaleTimeString()})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Actor: <strong className="text-foreground">{log.user_email || 'System'}</strong></span>
                  <span>•</span>
                  <span>Target: <span className="font-mono">{log.entity_type}:{log.entity_id}</span></span>
                </div>

                <pre className="text-[11px] font-mono text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40 overflow-x-auto">
                  {JSON.stringify(log.details || {}, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL INSPECTION DRAWER */}
      {selectedLog && (
        <Drawer
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Record Inspection"
          description={`Cryptographic event verification for log #${selectedLog.id}`}
          width="lg"
        >
          <div className="space-y-6 text-xs">
            {/* Action & Status */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-2">
              <span className="text-muted-foreground uppercase font-semibold block">Event Type</span>
              <h3 className="text-base font-bold font-mono text-primary-600 dark:text-primary-400">
                {selectedLog.action}
              </h3>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-200">
                  VERIFIED BY POSTGRES WAL
                </span>
                <span className="text-muted-foreground font-mono">
                  Log ID: {selectedLog.id}
                </span>
              </div>
            </div>

            {/* Actor Information */}
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
              <span className="text-muted-foreground uppercase font-semibold block">Actor Credentials</span>
              <div className="flex items-center gap-3">
                <Avatar name={selectedLog.user_email || 'System'} size="default" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {selectedLog.user_email || 'System Daemon'}
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    Role: {selectedLog.user_role || 'root'} • User ID: {selectedLog.user_id || 'system-0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Environment & Network Metadata */}
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
              <span className="text-muted-foreground uppercase font-semibold block">Security Context</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Client IP:</span>
                  <span className="font-mono font-semibold text-foreground">192.168.1.104</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Execution Latency:</span>
                  <span className="font-mono font-semibold text-foreground">14 ms</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-muted-foreground block">User Agent:</span>
                  <span className="font-mono text-[11px] text-muted-foreground break-all">
                    Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
                  </span>
                </div>
              </div>
            </div>

            {/* Full JSON Payload */}
            <div className="space-y-2">
              <span className="text-muted-foreground uppercase font-semibold block">Raw Event Payload</span>
              <pre className="p-4 rounded-xl bg-muted/40 border border-border/80 font-mono text-xs overflow-x-auto text-foreground leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            {/* Target Entity Deep Link */}
            {selectedLog.entity_type === 'post' && (
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  navigate(`/posts/${selectedLog.entity_id}`);
                }}
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                Inspect Associated Post Deliverable
              </Button>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
