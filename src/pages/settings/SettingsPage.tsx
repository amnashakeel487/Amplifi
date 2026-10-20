import React, { useState } from 'react';
import { Settings, HardDrive, Bell, Save, ShieldCheck } from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useNotifications } from '@/context/NotificationContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const SettingsPage: React.FC = () => {
  const currentSettings = mockDb.getSettings();
  const [cron, setCron] = useState(currentSettings.backup_schedule_cron);
  const [retention, setRetention] = useState(currentSettings.backup_retention_days);
  const { showToast } = useNotifications();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mockDb.updateSettings({
      backup_schedule_cron: cron,
      backup_retention_days: retention,
    });
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'System automation and backup parameters updated.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automations, cron schedules, cloud storage parameters, and retention policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Backup settings */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-base font-semibold text-foreground">Disaster Recovery & Cron</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Backup Schedule Cron
              </label>
              <Input
                value={cron}
                onChange={e => setCron(e.target.value)}
                placeholder="0 2 * * *"
                className="mt-1 font-mono text-sm"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">Default: 2:00 AM UTC daily</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Snapshot Retention (Days)
              </label>
              <Input
                type="number"
                value={retention}
                onChange={e => setRetention(Number(e.target.value))}
                className="mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Google Workspace */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-foreground">Google Cloud Workspace Binding</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Service account credentials and drive folder links are managed in the environment configuration file.
          </p>
          <div className="text-xs font-mono bg-muted/40 p-3 rounded-lg border border-border/60">
            <div>GOOGLE_CLIENT_ID: amplifi-demo-google-client-id</div>
            <div>STATUS: Bound & Active</div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
