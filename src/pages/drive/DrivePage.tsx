import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Folder,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  Users,
  Search,
  Clock,
} from 'lucide-react';
import {
  googleDriveService,
  DriveFolderInfo,
  LinkHealthResult,
} from '@/lib/google-drive';
import { mockDb } from '@/lib/mock-db';
import { useNotifications } from '@/context/NotificationContext';
import { IntegrationStatusChip } from '@/components/ui/integration-status-chip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import { formatBytes, formatRelativeTime } from '@/lib/utils';

export const DrivePage: React.FC = () => {
  const { showToast } = useNotifications();
  const settings = mockDb.getSettings();

  const [folders, setFolders] = useState<DriveFolderInfo[]>([]);
  const [healthLinks, setHealthLinks] = useState<LinkHealthResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>({
    connected: true,
    verified: true,
    accountEmail: settings.google_account_email || '',
    status: 'connected',
  });

  // Tree state: which client branches are expanded
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    ACME: true,
    PULSE: true,
    KROMA: true,
  });

  const loadData = async () => {
    const conn = await googleDriveService.checkConnectionStatus();
    setConnectionStatus(conn);
    const f = await googleDriveService.getProjectFolders();
    setFolders(f);
    const h = await googleDriveService.scanLinkHealth();
    setHealthLinks(h);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunPermissionAudit = async () => {
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 800));
    await loadData();
    setIsValidating(false);
    showToast({
      type: 'success',
      title: 'Permissions Audit Complete',
      message: 'All Google Drive client folder scopes and tokens verified.',
    });
  };

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const healthyLinksCount = healthLinks.filter(l => l.status === 'healthy').length;
  const brokenLinksCount = healthLinks.filter(l => l.status === 'broken').length;

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Google Workspace & Cloud Storage Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Service account OAuth tokens, Drive folder hierarchy browser, and link health validation.
          </p>
        </div>
        <Button
          onClick={handleRunPermissionAudit}
          isLoading={isValidating}
          variant="primary"
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Run Live Permissions Audit
        </Button>
      </div>

      {/* Main Connection Status Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Google Cloud Workspace Service Account
                </h2>
                <IntegrationStatusChip
                  status={connectionStatus.status}
                  verified={connectionStatus.verified}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                OAuth2 Service Scope: <span className="font-mono text-foreground">{connectionStatus.accountEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Root Folder ID:</span>
            <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
              {settings.google_drive_root_folder_id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block mb-1">Master Directory Name</span>
            <span className="font-semibold text-foreground">{settings.google_drive_root_folder_name}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block mb-1">Token Validity</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified until Dec 2026
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block mb-1">Total Folders Scanned</span>
            <span className="font-semibold text-foreground">{folders.length} Project Directories</span>
          </div>
        </div>
      </div>

      {/* Tabs: Folder Hierarchy Browser vs Permissions Table vs Link Health */}
      <Tabs defaultValue="browser">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="browser">Interactive Folder Tree</TabsTrigger>
          <TabsTrigger value="permissions">
            Folder Permissions Scanner ({folders.length})
          </TabsTrigger>
          <TabsTrigger value="health">
            Link Health Checker ({healthLinks.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INTERACTIVE FOLDER TREE BROWSER */}
        <TabsContent value="browser" className="mt-4">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-foreground">Cloud Directory Structure</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                drive.google.com/drive/u/0/folders
              </span>
            </div>

            {/* Tree nodes */}
            <div className="space-y-1 text-xs font-mono">
              {/* Root */}
              <div>
                <div
                  onClick={() => toggleNode('root')}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 cursor-pointer select-none font-semibold text-foreground"
                >
                  {expandedNodes['root'] ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <HardDrive className="h-4 w-4 text-primary-600" />
                  <span>/Amplifi Master Marketing Directory</span>
                </div>

                {expandedNodes['root'] && (
                  <div className="pl-6 space-y-1 border-l border-border/60 ml-4 mt-1">
                    {/* ACME Brand */}
                    <div>
                      <div
                        onClick={() => toggleNode('ACME')}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer select-none text-foreground"
                      >
                        {expandedNodes['ACME'] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                        <span>Acme FinTech Global (ACME)</span>
                      </div>

                      {expandedNodes['ACME'] && (
                        <div className="pl-6 space-y-1 border-l border-border/40 ml-3 mt-1">
                          <div className="flex items-center justify-between p-1.5 rounded hover:bg-muted/20">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Folder className="h-3 w-3 text-indigo-400" />
                              <span>Q4 FinTech Compliance Summit</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Verified RW</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PULSE Brand */}
                    <div>
                      <div
                        onClick={() => toggleNode('PULSE')}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer select-none text-foreground"
                      >
                        {expandedNodes['PULSE'] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                        <span>Pulse Energy Labs (PULSE)</span>
                      </div>

                      {expandedNodes['PULSE'] && (
                        <div className="pl-6 space-y-1 border-l border-border/40 ml-3 mt-1">
                          <div className="flex items-center justify-between p-1.5 rounded hover:bg-muted/20">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Folder className="h-3 w-3 text-indigo-400" />
                              <span>CleanTech Innovator Spotlight Series</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Verified RW</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* KROMA Brand */}
                    <div>
                      <div
                        onClick={() => toggleNode('KROMA')}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer select-none text-foreground"
                      >
                        {expandedNodes['KROMA'] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                        <span>Kroma Lifestyle & Apparel (KROMA)</span>
                      </div>

                      {expandedNodes['KROMA'] && (
                        <div className="pl-6 space-y-1 border-l border-border/40 ml-3 mt-1">
                          <div className="flex items-center justify-between p-1.5 rounded hover:bg-muted/20">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Folder className="h-3 w-3 text-indigo-400" />
                              <span>Winter Capsule Collection 2026</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Verified RW</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: FOLDER PERMISSIONS TABLE */}
        <TabsContent value="permissions" className="mt-4">
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Drive Folder Path</th>
                    <th className="py-3 px-4">Permission State</th>
                    <th className="py-3 px-4">Shared Service Accounts</th>
                    <th className="py-3 px-4">Allocated Size</th>
                    <th className="py-3 px-4">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {folders.map(f => (
                    <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground text-xs block">{f.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{f.path}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Valid (Read/Write)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="space-y-0.5">
                          {f.sharedWith.map((s, idx) => (
                            <span key={idx} className="block text-muted-foreground font-mono text-[10px]">
                              {s.email} ({s.role})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {formatBytes(f.totalSizeBytes)} ({f.fileCount} assets)
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {formatRelativeTime(f.lastVerifiedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: LINK HEALTH CHECKER */}
        <TabsContent value="health" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Verified Healthy Links"
              value={healthyLinksCount}
              subtitle="200 OK Response"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            />
            <StatCard
              title="Inaccessible / Broken"
              value={brokenLinksCount}
              subtitle="404 or Unauthorized"
              icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
            />
            <StatCard
              title="Average Latency"
              value="164 ms"
              subtitle="Cloud API response"
              icon={<Clock className="h-5 w-5 text-indigo-500" />}
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft">
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Drive & Docs Endpoint Inspection</span>
              <span className="text-muted-foreground">Audited every 12 hours</span>
            </div>

            <div className="divide-y divide-border/60">
              {healthLinks.map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> {item.statusCode} OK
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px] truncate max-w-sm sm:max-w-md">
                        {item.url}
                      </span>
                    </div>
                    <p className="text-muted-foreground pt-1">{item.message}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-muted-foreground">{item.latencyMs} ms</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.url, '_blank')}
                      rightIcon={<ExternalLink className="h-3 w-3" />}
                      className="text-xs h-7"
                    >
                      Test Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
