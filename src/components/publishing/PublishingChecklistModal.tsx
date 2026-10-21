import React, { useState } from 'react';
import {
  Send,
  Copy,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  HardDrive,
  Share2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Check,
  Globe,
  Radio,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { Post, SocialPlatform } from '@/lib/types';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IntegrationStatusChip } from '@/components/ui/integration-status-chip';
import { StatusBadge } from '@/components/ui/status-badge';

interface PublishingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPublished?: (publishedUrl: string) => void;
}

export const PublishingChecklistModal: React.FC<PublishingChecklistModalProps> = ({
  isOpen,
  onClose,
  post,
  onPublished,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Tab state
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');

  // Manual publishing fields
  const [targetAccount, setTargetAccount] = useState<string>(
    post.project?.client?.code
      ? `@${post.project.client.code.toLowerCase()}_official`
      : '@brand_primary'
  );
  const [publishedUrl, setPublishedUrl] = useState<string>(post.published_url || '');
  const [publishDate, setPublishDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    mediaVerified: false,
    captionCopied: false,
    disclaimerVerified: false,
    nativeScheduled: false,
  });

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedMedia, setCopiedMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyFormattedToClipboard = async () => {
    const plain = post.caption || '';
    const html = post.description_html || `<p>${plain.replace(/\n/g, '<br/>')}</p>`;
    try {
      if (typeof window !== 'undefined' && 'ClipboardItem' in window && navigator.clipboard?.write) {
        const textBlob = new Blob([plain], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopiedFormatted(true);
      showToast({
        type: 'success',
        title: 'Formatted Text Copied',
        message: 'Rich formatting (bold, italics, lists, emojis) copied to clipboard.',
      });
      setTimeout(() => setCopiedFormatted(false), 2000);
    } catch {
      await navigator.clipboard.writeText(plain);
      setCopiedFormatted(true);
      setTimeout(() => setCopiedFormatted(false), 2000);
    }
  };

  const copyToClipboard = async (text: string, label: string, setFn: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFn(true);
      showToast({
        type: 'success',
        title: `${label} Copied`,
        message: 'Content copied to clipboard for direct posting.',
      });
      setTimeout(() => setFn(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Clipboard Error',
        message: 'Could not access clipboard.',
      });
    }
  };

  const handleConfirmPublish = () => {
    if (!publishedUrl.trim()) {
      showToast({
        type: 'error',
        title: 'Published URL Required',
        message: 'Please paste the live URL of the published social post.',
      });
      return;
    }

    try {
      new URL(publishedUrl);
    } catch {
      showToast({
        type: 'error',
        title: 'Invalid URL Format',
        message: 'Please enter a valid URL beginning with https://',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      mockDb.updatePost(post.id, {
        status: 'published',
        published_url: publishedUrl.trim(),
        published_at: new Date(publishDate).toISOString(),
        assigned_publisher_id: post.assigned_publisher_id || user?.id,
        publisher_role: post.publisher_role || user?.role,
      });

      mockDb.logAudit({
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        action: 'POST_PUBLISHED_MANUAL',
        entity_type: 'post',
        entity_id: post.id,
        details: {
          published_url: publishedUrl,
          target_account: targetAccount,
          published_at: publishDate,
        },
      });

      showToast({
        type: 'success',
        title: 'Post Published Successfully',
        message: `Deliverable marked as Published on ${post.platforms.join(', ')}.`,
      });

      setIsSubmitting(false);
      if (onPublished) onPublished(publishedUrl);
      onClose();
    }, 600);
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publishing Station & Distribution"
      description={`Manage release for "${post.title}" across target channels.`}
      maxWidth="xl"
    >
      <div className="space-y-6 pt-2">
        {/* Post Quick Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border/80">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">
              {post.project?.name} • {post.project?.client?.name}
            </span>
            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
              {post.title}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} size="sm" />
            <div className="flex items-center gap-1">
              {post.platforms.map(p => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Manual Publishing vs Auto API */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="manual" className="text-xs">
              Manual Publishing Checklist
            </TabsTrigger>
            <TabsTrigger value="auto" className="text-xs">
              Auto-Publishing Connectors (APIs)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MANUAL PUBLISHING */}
          <TabsContent value="manual" className="space-y-5 mt-4">
            {/* Quick Copy Station */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Content Copy Desk
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyFormattedToClipboard}
                  leftIcon={copiedFormatted ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  className="justify-center text-xs h-9 font-medium"
                >
                  {copiedFormatted ? 'Rich Copied!' : 'Copy Formatted'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(post.caption || '', 'Plain Caption', setCopiedCaption)
                  }
                  leftIcon={copiedCaption ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  className="justify-center text-xs h-9"
                >
                  {copiedCaption ? 'Plain Copied!' : 'Copy Plain'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      (post.hashtags || []).map(t => `#${t}`).join(' '),
                      'Hashtags',
                      setCopiedTags
                    )
                  }
                  leftIcon={copiedTags ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  className="justify-center text-xs h-9"
                >
                  {copiedTags ? 'Tags Copied!' : 'Copy Hashtags'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      post.google_drive_assets_url || 'https://drive.google.com',
                      'Asset Folder URL',
                      setCopiedMedia
                    )
                  }
                  leftIcon={copiedMedia ? <Check className="h-4 w-4 text-emerald-500" /> : <HardDrive className="h-4 w-4" />}
                  className="justify-center text-xs h-9"
                >
                  {copiedMedia ? 'Drive Copied!' : 'Drive Assets'}
                </Button>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2.5 p-4 rounded-xl border border-border/80 bg-muted/20">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Quality & Compliance Sign-Off
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={checklist.mediaVerified}
                    onChange={() => toggleChecklist('mediaVerified')}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>1. High-resolution media downloaded and color accuracy verified</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={checklist.captionCopied}
                    onChange={() => toggleChecklist('captionCopied')}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>2. Caption text and strategic hashtags pasted to native channel</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={checklist.disclaimerVerified}
                    onChange={() => toggleChecklist('disclaimerVerified')}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>3. Mandatory client compliance & financial disclosures confirmed present</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={checklist.nativeScheduled}
                    onChange={() => toggleChecklist('nativeScheduled')}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>4. Post officially published or locked into native scheduled queue</span>
                </label>
              </div>
            </div>

            {/* Target Account & Published URL Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Target Social Handle / Page
                </label>
                <Input
                  value={targetAccount}
                  onChange={e => setTargetAccount(e.target.value)}
                  placeholder="@handle or Company Page"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Actual Publish Timestamp
                </label>
                <Input
                  type="datetime-local"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Live Published URL <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Public permalink to the live post
                </span>
              </label>
              <div className="relative">
                <Input
                  value={publishedUrl}
                  onChange={e => setPublishedUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                  className="pl-9"
                />
                <LinkIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Final Action Bar */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {!allChecked && 'Complete all 4 checklist steps for best practice.'}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmPublish}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm Manual Publishing
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: AUTO-PUBLISHING APIS */}
          <TabsContent value="auto" className="space-y-4 mt-4">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-foreground space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span>Enterprise API Guard Active</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Direct automated publishing via Meta Graph, X API v2, and LinkedIn Marketing requires verified OAuth2 application tokens. Until credentials pass backend validation, integrations remain locked.
              </p>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">LinkedIn Marketing API</span>
                  <span className="text-muted-foreground">App ID: lkd-prod-9402 • Org Scope: w_member_social</span>
                </div>
                <IntegrationStatusChip status="configuration_required" />
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">Meta Graph API (Instagram & Facebook)</span>
                  <span className="text-muted-foreground">App ID: meta-8120 • Scope: instagram_content_publish</span>
                </div>
                <IntegrationStatusChip status="configuration_required" />
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">X (Twitter) API v2 Enterprise</span>
                  <span className="text-muted-foreground">Client ID: twt-771 • Scope: tweet.write</span>
                </div>
                <IntegrationStatusChip status="token_expired" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                To link production OAuth keys, visit the administrative settings console.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  showToast({
                    type: 'info',
                    title: 'Configuration Required',
                    message: 'Please supply client API credentials in Settings -> Integrations.',
                  });
                }}
              >
                Configure APIs
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Modal>
  );
};
