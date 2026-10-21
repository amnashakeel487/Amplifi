import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileEdit,
  Send,
  Sparkles,
  Layers,
  FileText,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Check,
  RotateCcw,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { Post, PostWorkflowStatus } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Drawer } from '@/components/ui/drawer';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { GoogleDocsBriefPanel } from '@/components/google-docs/GoogleDocsBriefPanel';
import { MediaPreviewLightbox, MediaAsset } from '@/components/media/MediaPreviewLightbox';
import { PlatformCounters } from '@/components/posts/PlatformCounters';
import { FormattedContent } from '@/components/ui/formatted-content';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { formatBytes, formatRelativeTime } from '@/lib/utils';

interface InlineSuggestion {
  id: string;
  author: string;
  role: string;
  originalText: string;
  suggestedText: string;
  comment: string;
  type: 'suggestion' | 'revision' | 'note';
  resolved: boolean;
  createdAt: string;
}

export const ProofreadingReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const postId = id || 'post-01';
  const post = mockDb.getPost(postId);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaAsset, setActiveMediaAsset] = useState<MediaAsset | null>(null);

  // Suggestions & Proofreading Comments
  const [suggestions, setSuggestions] = useState<InlineSuggestion[]>([
    {
      id: 'sug-1',
      author: 'Sarah Jenkins',
      role: 'manager',
      originalText: 'mitigating exposure in volatile markets',
      suggestedText: 'neutralizing tail-risk exposure in sub-second trading environments',
      comment: 'Use sharper institutional terminology consistent with C-suite expectations.',
      type: 'suggestion',
      resolved: false,
      createdAt: '2 hours ago',
    },
    {
      id: 'sug-2',
      author: 'Sarah Jenkins',
      role: 'manager',
      originalText: 'link in bio to read our Q4 whitepaper',
      suggestedText: 'Access our peer-reviewed algorithmic benchmark at the link in bio',
      comment: 'Emphasize data credibility and peer-reviewed methodology.',
      type: 'suggestion',
      resolved: true,
      createdAt: '1 hour ago',
    },
  ]);

  // Form to add suggestion
  const [newOriginal, setNewOriginal] = useState('');
  const [newSuggested, setNewSuggested] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newType, setNewType] = useState<'suggestion' | 'revision' | 'note'>('suggestion');

  // Decision Dialogs
  const [revisionDrawerOpen, setRevisionDrawerOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionError, setRevisionError] = useState('');

  const [decisionConfirmOpen, setDecisionConfirmOpen] = useState(false);
  const [targetDecision, setTargetDecision] = useState<'approve' | 'forward'>('approve');

  if (!post) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Post Not Found</h2>
        <Button onClick={() => navigate('/posts')} className="mt-4">
          Back to Posts
        </Button>
      </div>
    );
  }

  const sampleMedia: MediaAsset = {
    id: 'media-rev-1',
    title: `${post.title} (Production Deliverable)`,
    type: post.platforms.includes('tiktok') ? 'video' : 'carousel',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
    aspectRatio: '1:1',
    sizeBytes: 4201940,
    slides: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1000&auto=format&fit=crop&q=80',
    ],
    driveUrl: post.google_drive_assets_url,
  };

  const handleAddSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggested && !newRationale) return;

    const newEntry: InlineSuggestion = {
      id: `sug-${Date.now()}`,
      author: user?.full_name || 'Sarah Jenkins',
      role: user?.role || 'manager',
      originalText: newOriginal.trim(),
      suggestedText: newSuggested.trim(),
      comment: newRationale.trim(),
      type: newType,
      resolved: false,
      createdAt: 'Just now',
    };

    setSuggestions(prev => [newEntry, ...prev]);
    setNewOriginal('');
    setNewSuggested('');
    setNewRationale('');
    showToast({
      type: 'info',
      title: 'Suggestion Recorded',
      message: 'Creator will see this change request in their workspace.',
    });
  };

  const toggleResolved = (sugId: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === sugId ? { ...s, resolved: !s.resolved } : s))
    );
  };

  const isTextStage = ['text_submitted', 'submitted'].includes(post.status);
  const isMediaStage = ['media_submitted', 'under_review'].includes(post.status);

  const handleApproveText = () => {
    mockDb.updatePost(post.id, {
      status: 'text_approved',
      updated_at: new Date().toISOString(),
    });
    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'TEXT_APPROVED_BY_MANAGER',
      entity_type: 'post',
      entity_id: post.id,
      details: { decision: 'Manager approved text. Media stage unlocked for creator.' },
    });
    showToast({
      type: 'success',
      title: 'Text Copy Approved!',
      message: `"${post.title}" moved to Text Approved. Creator can now create & upload media assets to Drive.`,
    });
    setDecisionConfirmOpen(false);
    navigate(`/posts/${post.id}`);
  };

  const handleForwardToAdmin = () => {
    mockDb.updatePost(post.id, {
      status: 'pending_admin_approval',
      updated_at: new Date().toISOString(),
    });
    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'FORWARDED_TO_ADMIN',
      entity_type: 'post',
      entity_id: post.id,
      details: { decision: 'Manager proofreading passed. Forwarded to Admin Queue.' },
    });
    showToast({
      type: 'success',
      title: 'Sent to Admin for Final Approval',
      message: `"${post.title}" is now awaiting executive sign-off. Manager cannot grant final approval.`,
    });
    setDecisionConfirmOpen(false);
    navigate(`/posts/${post.id}`);
  };

  const handleExecuteRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (revisionNotes.trim().length < 10) {
      setRevisionError('Please provide a specific feedback explanation (minimum 10 characters).');
      return;
    }
    setRevisionError('');

    const targetRevStatus = isTextStage ? 'text_revision_required' : 'media_revision_required';

    mockDb.updatePost(post.id, {
      status: targetRevStatus,
      revision_instructions: revisionNotes.trim(),
      updated_at: new Date().toISOString(),
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: isTextStage ? 'TEXT_REVISION_REQUESTED' : 'MEDIA_REVISION_REQUESTED',
      entity_type: 'post',
      entity_id: post.id,
      details: { instructions: revisionNotes.trim() },
    });

    showToast({
      type: 'warning',
      title: 'Revision Dispatched',
      message: `Returned to creator with your specific proofreading notes.`,
    });

    setRevisionDrawerOpen(false);
    navigate(`/posts/${post.id}`);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/posts/${post.id}`)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Post Detail
          </Button>
          <div className="h-4 w-px bg-border/80 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                {post.project?.name}
              </span>
              <StatusBadge status={post.status} size="sm" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-xl">
              {post.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={post.priority} />
          <DeadlineChip deadline={post.deadline} />
        </div>
      </div>

      {/* Side-by-Side Split Workspace (12-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Media Preview & Caption Copy (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Deliverable Media Box */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600" />
                Submitted Visual Deliverable
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveMediaAsset(sampleMedia);
                  setLightboxOpen(true);
                }}
                leftIcon={<Maximize2 className="h-3.5 w-3.5" />}
                className="text-xs h-7"
              >
                Inspect Lightbox
              </Button>
            </div>

            <div
              onClick={() => {
                setActiveMediaAsset(sampleMedia);
                setLightboxOpen(true);
              }}
              className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden bg-black/10 cursor-pointer group shadow-soft-sm"
            >
              <img
                src={sampleMedia.url}
                alt="Deliverable preview"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1.5">
                <Maximize2 className="h-5 w-5" />
                <span>Click to zoom & inspect slides</span>
              </div>
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-semibold">
                {sampleMedia.aspectRatio} format • 2 slides
              </span>
            </div>
          </div>

          {/* Caption & Hashtag Panel (Requirement 2: Rich text preservation & dual copy buttons) */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" />
                Post Copy & Description (Rich Text Preserved)
              </span>
              <CopyTextActions
                htmlContent={post.description_html}
                plainText={post.caption}
                size="xs"
              />
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-sm font-sans leading-relaxed select-text">
              <FormattedContent
                html={post.description_html}
                fallbackText={post.caption}
              />
            </div>

            {/* Platform Counters */}
            <div className="pt-2">
              <PlatformCounters
                caption={post.caption || ''}
                hashtags={post.hashtags || []}
                platforms={post.platforms}
              />
            </div>
          </div>

          {/* Google Docs Brief Accordion */}
          <GoogleDocsBriefPanel
            docsUrl={post.google_docs_brief_url}
            docsId={post.google_docs_brief_id}
            postTitle={post.title}
            defaultExpanded={false}
          />
        </div>

        {/* RIGHT COLUMN: Proofreading, Inline Suggestions & Decision Workspace (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Annotation & Suggestion Composer */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-primary-600" />
                Add Proofreading Annotation
              </span>
              <span className="text-[11px] text-muted-foreground">Inline editorial markup</span>
            </div>

            <form onSubmit={handleAddSuggestion} className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Mark as:</span>
                <button
                  type="button"
                  onClick={() => setNewType('suggestion')}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                    newType === 'suggestion' ? 'bg-primary-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Copy Replacement
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('revision')}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                    newType === 'revision' ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Visual Revision
                </button>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Target Phrase (From caption or slide)</label>
                <Input
                  value={newOriginal}
                  onChange={e => setNewOriginal(e.target.value)}
                  placeholder="e.g. mitigating exposure in volatile markets"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Suggested Replacement</label>
                <Input
                  value={newSuggested}
                  onChange={e => setNewSuggested(e.target.value)}
                  placeholder="e.g. neutralizing tail-risk exposure in sub-second trading environments"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Editorial Rationale / Note</label>
                <Textarea
                  value={newRationale}
                  onChange={e => setNewRationale(e.target.value)}
                  placeholder="Explain why this tone adjustment aligns with the Google Docs brief..."
                  className="text-xs min-h-[70px]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>
                  Post Annotation
                </Button>
              </div>
            </form>
          </div>

          {/* Active Annotations & Suggestions List */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground">
                Editorial Annotations ({suggestions.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                {suggestions.filter(s => s.resolved).length} resolved
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {suggestions.map(item => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                    item.resolved
                      ? 'bg-muted/20 border-border/40 opacity-70'
                      : 'bg-card border-border shadow-soft-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={item.author} size="sm" />
                      <span className="font-semibold text-foreground">{item.author}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted uppercase text-muted-foreground">
                        {item.role}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleResolved(item.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        item.resolved
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{item.resolved ? 'Resolved' : 'Mark Resolved'}</span>
                    </button>
                  </div>

                  {/* Suggestion comparison */}
                  {item.originalText && (
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/40 font-mono text-[11px]">
                      <div className="text-red-600 line-through">
                        - {item.originalText}
                      </div>
                      {item.suggestedText && (
                        <div className="text-emerald-600 font-semibold">
                          + {item.suggestedText}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-muted-foreground leading-relaxed">{item.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY MANAGER DECISION BAR AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 p-4 shadow-soft-xl">
        <div className="mx-auto max-w-[1400px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={user?.full_name || 'Manager'} size="sm" />
            <div className="text-xs">
              <span className="font-semibold text-foreground block">
                Editorial Review Desk • {user?.full_name} ({user?.role})
              </span>
              <span className="text-muted-foreground">
                Sign off on creative deliverables or push back for student revision
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* 1. Request Revision */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevisionDrawerOpen(true)}
              leftIcon={<RotateCcw className="h-4 w-4 text-orange-500" />}
              className="text-xs border-orange-200 dark:border-orange-900/60"
            >
              {isTextStage ? 'Request Text Revision' : 'Request Media Revision'}
            </Button>

            {/* 2. Stage-Specific Advance Action */}
            {isTextStage ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTargetDecision('approve_text' as any);
                  setDecisionConfirmOpen(true);
                }}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Approve Text Copy
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTargetDecision('forward_admin' as any);
                  setDecisionConfirmOpen(true);
                }}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Send to Admin for Final Approval
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Revision Request Drawer (Mandatory Notes Required) */}
      <Drawer
        isOpen={revisionDrawerOpen}
        onClose={() => setRevisionDrawerOpen(false)}
        title={isTextStage ? "Request Copy Changes" : "Request Media Revisions"}
        description="Provide actionable proofreading notes. The creator will be notified immediately."
        width="md"
      >
        <form onSubmit={handleExecuteRevision} className="space-y-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-300">
            A clear explanation of required edits is required to return this deliverable to the creator.
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Specific Revision Checklist & Directions *
            </label>
            <Textarea
              value={revisionNotes}
              onChange={e => {
                setRevisionNotes(e.target.value);
                if (revisionError) setRevisionError('');
              }}
              placeholder={isTextStage ? "e.g. 1. Add call to action. 2. Tone needs to be more authoritative on slide 1..." : "e.g. 1. Color grade slide 2. 2. Fix subtitle timing..."}
              className="min-h-[140px] text-xs font-sans leading-relaxed"
            />
            {revisionError && <p className="text-xs text-red-500 font-medium mt-1">{revisionError}</p>}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setRevisionDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Dispatch Revision to Creator
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Decision Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={decisionConfirmOpen}
        onClose={() => setDecisionConfirmOpen(false)}
        onConfirm={targetDecision === ('approve_text' as any) ? handleApproveText : handleForwardToAdmin}
        title={targetDecision === ('approve_text' as any) ? 'Approve Copy Deliverable' : 'Forward to Admin Approval'}
        description={
          targetDecision === ('approve_text' as any)
            ? `Approve text for "${post.title}"? This will unlock the Media Stage and notify the creator to upload assets into their assigned Drive folder.`
            : `Forward "${post.title}" to the Executive Admin for final approval? (Note: Managers cannot grant final authorization)`
        }
        confirmLabel={targetDecision === ('approve_text' as any) ? 'Approve Text' : 'Send to Admin'}
      />

      {/* Media Lightbox */}
      {activeMediaAsset && (
        <MediaPreviewLightbox
          asset={activeMediaAsset}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
