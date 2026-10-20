import React, { useState } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCode,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useNotifications } from '@/context/NotificationContext';
import { formatBytes, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GuidedRestoreWizardModal } from '@/components/backup/GuidedRestoreWizardModal';

export const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState(() => mockDb.getBackups());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const { showToast } = useNotifications();

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    await new Promise(r => setTimeout(r, 1200));

    const newRec = mockDb.addBackup({
      backup_name: `amplifi-snapshot-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}.json.gz`,
      size_bytes: 4920140,
      checksum: 'sha256:' + Math.random().toString(36).substring(2, 12) + 'a8f10b',
      record_counts: { users: 5, clients: 3, projects: 3, posts: 6, comments: 14, audit_logs: 210 },
      status: 'completed',
    });

    setBackups(mockDb.getBackups());
    setIsBackingUp(false);
    showToast({
      type: 'success',
      title: 'Safety Backup Created',
      message: 'Database schema, relations, and asset pointers snapshot stored.',
    });
  };

  const handleRestore = () => {
    showToast({
      type: 'success',
      title: 'Disaster Recovery Completed',
      message: 'Workspace data restored to verified snapshot point.',
    });
    setRestoreModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Backup & Disaster Recovery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated nightly database snapshots, checksum verification, and guided restore procedures.
          </p>
        </div>
        <Button
          onClick={handleCreateBackup}
          isLoading={isBackingUp}
          variant="primary"
          leftIcon={<Database className="h-4 w-4" />}
        >
          Create Backup Now
        </Button>
      </div>

      {/* Prominent Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Snapshot Engine</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">SHA-256 Verified</div>
          <p className="text-xs text-muted-foreground">Immutable storage on Cloud Object Bucket</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Last Automated Backup</span>
          <div className="text-2xl font-bold text-foreground">
            {formatRelativeTime(backups[0]?.created_at)}
          </div>
          <p className="text-xs text-muted-foreground font-mono">02:00:00 UTC (Daily Cron)</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Next Scheduled Run</span>
          <div className="text-2xl font-bold text-foreground">In ~6 Hours</div>
          <p className="text-xs text-muted-foreground">30-day retention cycle enforced</p>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft space-y-0">
        <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Snapshot Archive & Checksums</h2>
          <span className="text-xs text-muted-foreground">{backups.length} snapshots stored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Snapshot Archive</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Record Counts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {backups.map(b => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-foreground">
                    {b.backup_name}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {formatRelativeTime(b.created_at)}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">{formatBytes(b.size_bytes)}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className="text-muted-foreground">
                      {Object.entries(b.record_counts || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(b);
                        setRestoreModalOpen(true);
                      }}
                      leftIcon={<RotateCcw className="h-3.5 w-3.5 text-amber-600" />}
                      className="text-xs h-7"
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guided 6-Stage Restore Wizard */}
      {selectedBackup && (
        <GuidedRestoreWizardModal
          isOpen={restoreModalOpen}
          onClose={() => setRestoreModalOpen(false)}
          backup={selectedBackup}
          onRestoreComplete={() => {
            setBackups(mockDb.getBackups());
          }}
        />
      )}
    </div>
  );
};
