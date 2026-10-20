import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Database,
  FileCheck,
  Server,
  Layers,
  ArrowRight,
  ArrowLeft,
  Lock,
  RefreshCw,
  HardDrive,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/mock-db';
import { formatBytes } from '@/lib/utils';

export interface BackupRecord {
  id: string;
  backup_name: string;
  size_bytes: number;
  checksum: string;
  record_counts: Record<string, number>;
  status: string;
  created_at: string;
}

interface GuidedRestoreWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: BackupRecord | null;
  onRestoreComplete: () => void;
}

type WizardStep = 'select' | 'validate' | 'preview' | 'safety' | 'confirm' | 'result';

export const GuidedRestoreWizardModal: React.FC<GuidedRestoreWizardModalProps> = ({
  isOpen,
  onClose,
  backup,
  onRestoreComplete,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [step, setStep] = useState<WizardStep>('select');
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

  // Step 2 Validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validationPassed, setValidationPassed] = useState(false);

  // Step 4 Safety Snapshot states
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [safetySnapshotId, setSafetySnapshotId] = useState<string | null>(null);

  // Step 5 Confirm states
  const [confirmInput, setConfirmInput] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  if (!backup) return null;

  const handleStartValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setValidationPassed(true);
      setStep('preview');
    }, 1200);
  };

  const handleCreateSafetySnapshot = () => {
    setIsSnapshotting(true);
    setTimeout(() => {
      const snapId = `snap-pre-restore-${Date.now().toString().slice(-6)}`;
      setSafetySnapshotId(snapId);
      setIsSnapshotting(false);
      setStep('confirm');
    }, 1500);
  };

  const handleExecuteRestore = () => {
    if (confirmInput.trim() !== 'RESTORE') {
      showToast({
        type: 'error',
        title: 'Confirmation Failed',
        message: 'You must type "RESTORE" exactly to authorize recovery.',
      });
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      mockDb.logAudit({
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        action: 'DISASTER_RECOVERY_RESTORE_APPLIED',
        entity_type: 'backup',
        entity_id: backup.id,
        details: {
          snapshot_name: backup.backup_name,
          mode: restoreMode,
          pre_restore_safety_checkpoint: safetySnapshotId,
          restored_record_counts: backup.record_counts,
        },
      });

      setIsRestoring(false);
      setStep('result');
      showToast({
        type: 'success',
        title: 'Database Restored Successfully',
        message: `Workspace reset to state "${backup.backup_name}".`,
      });
    }, 1800);
  };

  const stepsList: { key: WizardStep; label: string; num: number }[] = [
    { key: 'select', label: 'Select & Mode', num: 1 },
    { key: 'validate', label: 'Validate', num: 2 },
    { key: 'preview', label: 'Preview Diff', num: 3 },
    { key: 'safety', label: 'Safety Snap', num: 4 },
    { key: 'confirm', label: 'Authorize', num: 5 },
    { key: 'result', label: 'Result', num: 6 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guided Disaster Recovery Wizard"
      description="Six-stage verified restoration procedure with safety checkpoints."
      maxWidth="2xl"
    >
      <div className="space-y-6 pt-2">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          {stepsList.map((s, idx) => {
            const isCurrent = step === s.key;
            const isPassed = stepsList.findIndex(x => x.key === step) > idx;

            return (
              <div key={s.key} className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
                    isPassed
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-200 dark:ring-primary-900'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPassed ? <Check className="h-3 w-3" /> : s.num}
                </span>
                <span
                  className={`hidden md:inline ${
                    isCurrent
                      ? 'text-primary-600 dark:text-primary-400 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
                {idx < stepsList.length - 1 && (
                  <span className="text-border mx-1 hidden sm:inline">•</span>
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1: SELECT & RESTORE MODE */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Selected Snapshot Package
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-mono text-foreground">
                    {backup.backup_name}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Size: {formatBytes(backup.size_bytes)} • Status: {backup.status}
                  </span>
                </div>
                <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border">
                  {backup.checksum.substring(0, 16)}...
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Choose Restoration Strategy:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setRestoreMode('replace')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    restoreMode === 'replace'
                      ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/30 ring-2 ring-primary-500/30'
                      : 'border-border/80 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Full Replacement</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-600 text-white">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Completely replaces working database tables with the snapshot point. Guarantees deterministic state.
                  </p>
                </div>

                <div
                  onClick={() => setRestoreMode('merge')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    restoreMode === 'merge'
                      ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/30 ring-2 ring-primary-500/30'
                      : 'border-border/80 hover:bg-muted/20'
                  }`}
                >
                  <span className="text-sm font-bold text-foreground block">Additive Merge</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upserts missing records and preserves any newer audit logs or user sessions created after snapshot date.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('validate')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Proceed to Validation
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATE ARCHIVE INTEGRITY */}
        {step === 'validate' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Archive Validation Checklist</h4>
                {isValidating && (
                  <span className="text-xs text-primary-600 animate-pulse flex items-center gap-1 font-mono">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying bytes...
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-foreground">1. SHA-256 Checksum Cryptographic Verification</span>
                  <span className="font-mono text-emerald-600 font-bold">MATCH</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-foreground">2. Postgres Schema Version (20261020000002)</span>
                  <span className="font-mono text-emerald-600 font-bold">COMPATIBLE</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-foreground">3. Foreign Key & Orphaned Asset References</span>
                  <span className="font-mono text-emerald-600 font-bold">ZERO CORRUPTION</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-foreground">4. Google Drive Folder Pointer Resolutions</span>
                  <span className="font-mono text-emerald-600 font-bold">100% REACHABLE</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('select')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartValidation}
                isLoading={isValidating}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Run Diagnostics & Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW IMPACT DIFF */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-foreground space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Restoration Scope & Differential Analysis</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Applying this snapshot using <strong>{restoreMode === 'replace' ? 'Full Replacement' : 'Additive Merge'}</strong> will overwrite table indices and reset the workflow state machine.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Target Entity Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(backup.record_counts || {}).map(([key, count]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <span className="text-muted-foreground capitalize block">{key}</span>
                    <span className="text-base font-bold text-foreground font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('validate')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('safety')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next: Safety Snapshot
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PRE-RESTORE SAFETY SNAPSHOT */}
        {step === 'safety' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <ShieldAlert className="h-5 w-5 text-primary-600" />
                <span>Create Pre-Restore Safety Checkpoint</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Before altering production tables, Amplifi automatically saves an immediate backup of the current database state. In the event of an interruption, you can immediately rollback.
              </p>

              {isSnapshotting && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Dumping active PostgreSQL relations...</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} />
                </div>
              )}

              {safetySnapshotId && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-mono flex items-center justify-between">
                  <span>Safety Checkpoint: {safetySnapshotId}</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('preview')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateSafetySnapshot}
                isLoading={isSnapshotting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Create Safety Checkpoint & Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: AUTHORIZATION & CONFIRMATION */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Destructive Operation Confirmation</span>
              </div>
              <p className="leading-relaxed">
                You are about to restore snapshot "{backup.backup_name}". All uncommitted live changes since snapshot creation will be superseded.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Type <span className="font-mono text-rose-600 font-bold">RESTORE</span> to authorize:
                </label>
                <Input
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  placeholder="RESTORE"
                  className="font-mono text-center tracking-widest font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Administrator PIN / Security Token:
                </label>
                <Input
                  type="password"
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="font-mono text-center"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('safety')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExecuteRestore}
                isLoading={isRestoring}
                disabled={confirmInput.trim() !== 'RESTORE'}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Apply Disaster Recovery
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: RESULT & FINISH */}
        {step === 'result' && (
          <div className="space-y-5 text-center py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Database Successfully Restored
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All records, workflow machines, and Google Drive links were restored to snapshot specifications.
              </p>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border/60 rounded-xl text-xs font-mono max-w-sm mx-auto text-left space-y-1">
              <span className="text-muted-foreground block">Snapshot: {backup.backup_name}</span>
              <span className="text-muted-foreground block">Mode: {restoreMode.toUpperCase()}</span>
              <span className="text-emerald-600 font-semibold block">Audit Log: #rec-dr-{Date.now().toString().slice(-4)}</span>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  onRestoreComplete();
                  onClose();
                  window.location.reload();
                }}
              >
                Reload Application Workspace
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
