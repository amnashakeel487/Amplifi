import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Copy,
  Sparkles,
  Target,
  Users,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';

export interface BriefContent {
  campaignGoal: string;
  targetAudience: string;
  toneOfVoice: string[];
  keyMessages: string[];
  callToAction: string;
  complianceDisclaimers?: string;
  referenceDocsUrl?: string;
  lastSyncedAt: string;
}

interface GoogleDocsBriefPanelProps {
  docsUrl?: string;
  docsId?: string;
  postTitle?: string;
  briefData?: Partial<BriefContent>;
  defaultExpanded?: boolean;
}

export const GoogleDocsBriefPanel: React.FC<GoogleDocsBriefPanelProps> = ({
  docsUrl,
  docsId,
  postTitle = 'Content Creative Brief',
  briefData,
  defaultExpanded = true,
}) => {
  const { showToast } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(briefData?.lastSyncedAt || '5 mins ago');

  const content: BriefContent = {
    campaignGoal:
      briefData?.campaignGoal ||
      'Position the brand as an authority on algorithmic risk modeling ahead of the Q4 Banking Summit.',
    targetAudience:
      briefData?.targetAudience ||
      'Enterprise CISOs, Compliance Officers, VP of Risk Infrastructure at Tier-1 Global Banks.',
    toneOfVoice: briefData?.toneOfVoice || ['Authoritative', 'Analytical', 'Forward-looking', 'Trustworthy'],
    keyMessages: briefData?.keyMessages || [
      'Autonomous intelligence mitigates high-frequency exposure before manual auditing catches it.',
      '40% reduction in false-positive regulatory flags based on 12-month backtested data.',
      'Compliance is no longer a bottleneck — it is a competitive differentiator.',
    ],
    callToAction:
      briefData?.callToAction || 'Read the full Q4 algorithmic compliance whitepaper (link in bio).',
    complianceDisclaimers:
      briefData?.complianceDisclaimers ||
      'Regulated under FinTech Advisory Protocol 2026. Data models are simulated; past performance is not indicative of future yield.',
    referenceDocsUrl: docsUrl || 'https://docs.google.com/document/d/brief-acme-post-01/edit',
    lastSyncedAt: lastSync,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 600));
    setLastSync('Just now');
    setIsRefreshing(false);
    showToast({
      type: 'success',
      title: 'Google Docs Brief Synced',
      message: 'Pulled latest revisions and stakeholder comments from Google Docs.',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'info',
      title: 'Copied',
      message: `${label} copied to clipboard!`,
    });
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft transition-all">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 select-none border-b border-border/60"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Google Docs Creative Brief</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Live Synced
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synced {lastSync} • Docs ID: <span className="font-mono">{docsId || 'docs-brief-01'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            className="text-xs h-8"
          >
            Refresh
          </Button>

          {content.referenceDocsUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(content.referenceDocsUrl, '_blank')}
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
              className="text-xs h-8"
            >
              Open Docs
            </Button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="p-5 space-y-4 text-xs animate-in fade-in-50">
          {/* Campaign Goal & Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Target className="h-3.5 w-3.5 text-primary-600" />
                Strategic Objective
              </span>
              <p className="text-muted-foreground leading-relaxed">{content.campaignGoal}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Users className="h-3.5 w-3.5 text-indigo-500" />
                Target Persona
              </span>
              <p className="text-muted-foreground leading-relaxed">{content.targetAudience}</p>
            </div>
          </div>

          {/* Tone of Voice Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-semibold text-foreground mr-1">Tone & Voice:</span>
            {content.toneOfVoice.map(tone => (
              <span
                key={tone}
                className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium"
              >
                {tone}
              </span>
            ))}
          </div>

          {/* Key Message Pillars */}
          <div className="space-y-2 pt-1">
            <span className="font-semibold text-foreground block">Key Messaging Pillars:</span>
            <ul className="space-y-1.5 pl-2">
              {content.keyMessages.map((msg, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Call to Action */}
          <div className="p-3 rounded-lg bg-primary-50/40 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-900/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-primary-900 dark:text-primary-200 block text-[11px] uppercase tracking-wider">
                Approved Call-To-Action (CTA)
              </span>
              <p className="text-primary-800 dark:text-primary-300 font-medium mt-0.5">
                "{content.callToAction}"
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(content.callToAction, 'Call-to-Action')}
              leftIcon={<Copy className="h-3.5 w-3.5" />}
              className="text-xs h-7 shrink-0 bg-background"
            >
              Copy CTA
            </Button>
          </div>

          {/* Mandatory Compliance Disclaimer */}
          {content.complianceDisclaimers && (
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Mandatory Legal Disclaimer
              </span>
              <p className="text-amber-800 dark:text-amber-400 font-mono text-[11px] leading-relaxed">
                {content.complianceDisclaimers}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
