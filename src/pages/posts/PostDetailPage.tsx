import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  HardDrive,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  History,
  Send,
  Layers,
  Film,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Maximize2,
  FileCheck,
  Sparkles,
  Share2,
  Lock,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { Post, SocialPlatform, PostWorkflowStatus } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getAvailableTransitions } from '@/lib/workflow-engine';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { WorkflowStepper } from '@/components/ui/stepper';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PlatformCounters } from '@/components/posts/PlatformCounters';
import { MediaPreviewLightbox, MediaAsset } from '@/components/media/MediaPreviewLightbox';
import { StudentSubmissionModal } from '@/components/submissions/StudentSubmissionModal';
import { GoogleDocsBriefPanel } from '@/components/google-docs/GoogleDocsBriefPanel';
import { PublishingChecklistModal } from '@/components/publishing/PublishingChecklistModal';
import { FormattedContent } from '@/components/ui/formatted-content';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn, formatBytes, formatRelativeTime } from '@/lib/utils';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { showToast } = useNotifications();

  const postId = id || 'post-01';
  const post = mockDb.getPost(postId);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaAsset, setActiveMediaAsset] = useState<MediaAsset | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);

  // Comments state
  const [comments, setComments] = useState([
    {
      id: 'c1',
      author: 'Sarah Jenkins',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      time: '3 hours ago',
      content: 'The hook in slide 1 is strong. Please ensure the brand disclaimer appears on the final slide in 10pt minimum.',
      type: 'suggestion',
      resolved: false,
    },
    {
      id: 'c2',
      author: 'Alex Rivera',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      time: '1 hour ago',
      content: 'Added the disclaimer and verified color contrast against the dark background.',
      type: 'general',
      resolved: true,
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentType, setNewCommentType] = useState<'general' | 'suggestion' | 'revision_request'>('general');

  // Confirmation dialog for workflow transitions
  const [transitionDialog, setTransitionDialog] = useState<{
    open: boolean;
    targetStatus?: PostWorkflowStatus;
    actionLabel?: string;
    requiresNote?: boolean;
  }>({ open: false });
  const [transitionNote, setTransitionNote] = useState('');

  // Rich Text Copy Revision Drawer (Requirement 2: Creator can edit and resubmit text)
  const [editTextDrawerOpen, setEditTextDrawerOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(post?.title || '');
  const [editDescriptionHtml, setEditDescriptionHtml] = useState(post?.description_html || `<p>${post?.caption || ''}</p>`);
  const [editCaptionPlain, setEditCaptionPlain] = useState(post?.caption || '');
  const [editHashtagsRaw, setEditHashtagsRaw] = useState((post?.hashtags || []).join(', '));

  const handleSaveTextRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const tagArray = editHashtagsRaw.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    mockDb.addTextVersion(post.id, {
      title: editTitle,
      description_html: editDescriptionHtml,
      caption_plain: editCaptionPlain,
      hashtags: tagArray,
      submitted_by: user?.id,
      submission_notes: 'Creator revised copy with rich-text formatting.',
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'POST_TEXT_REVISED',
      entity_type: 'post',
      entity_id: post.id,
      details: { title: editTitle, hashtags: tagArray },
    });

    showToast({
      type: 'success',
      title: 'Text Copy Updated & Resubmitted',
      message: `"${editTitle}" submitted to Campaign Manager for review.`,
    });

    setEditTextDrawerOpen(false);
    window.location.reload();
  };

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

  // Deliverable media assets from post (Zero fake fallback)
  const mediaAssets: MediaAsset[] = (post.assets || []).map(a => ({
    id: a.id,
    title: a.file_name,
    type: a.file_type.includes('video') ? ('video' as const) : ('image' as const),
    url: a.drive_file_url,
    aspectRatio: '1:1',
    sizeBytes: a.file_size_bytes,
    driveUrl: a.drive_file_url,
  }));

  // Available transitions
  const availableTransitions = getAvailableTransitions(post.status, role || 'student');

  const handleExecuteTransition = (targetStatus: PostWorkflowStatus, note?: string) => {
    mockDb.updatePost(post.id, {
      status: targetStatus,
      rejection_reason: targetStatus === 'rejected' ? note : undefined,
      revision_instructions: targetStatus === 'revision_required' ? note : undefined,
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'POST_WORKFLOW_STATE_CHANGE',
      entity_type: 'post',
      entity_id: post.id,
      details: { from: post.status, to: targetStatus, note },
    });

    showToast({
      type: 'success',
      title: 'Workflow Transitioned',
      message: `Post moved to "${targetStatus.replace(/_/g, ' ')}".`,
    });

    setTransitionDialog({ open: false });
    setTransitionNote('');
    window.location.reload();
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setComments(prev => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: user?.full_name || 'Team Member',
        role: user?.role || 'creator',
        avatar: user?.avatar_url || '',
        time: 'Just now',
        content: newCommentText.trim(),
        type: newCommentType,
        resolved: false,
      },
    ]);
    setNewCommentText('');
    showToast({
      type: 'info',
      message: 'Proofreading annotation recorded.',
    });
  };

  const toggleCommentResolved = (cId: string) => {
    setComments(prev =>
      prev.map(c => (c.id === cId ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied',
      message: `${label} copied to clipboard!`,
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/posts')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          All Deliverables
        </Button>
        <div className="flex items-center gap-2">
          <StatusBadge status={post.status} size="lg" />
          <PriorityBadge priority={post.priority} />
        </div>
      </div>

      {/* Visual Workflow Stepper */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs">
          <span className="font-semibold text-foreground">Content Lifecycle Pipeline</span>
          <span className="text-muted-foreground capitalize">
            Current Stage: <strong className="text-foreground">{post.status.replace(/_/g, ' ')}</strong>
          </span>
        </div>
        <WorkflowStepper currentStatus={post.status} />
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Deliverable Specifications, Previews, Caption (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Post Header */}
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono">
                {post.project?.name} ({post.project?.client?.code})
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-2">
                {post.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground">Distribution Channels:</span>
              {post.platforms.map(p => (
                <span
                  key={p}
                  className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Media Preview Box (Requirement 3: Media stage unlocks ONLY after text approval) */}
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-foreground">Media Assets & Preview</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Synced from Google Drive
              </span>
            </div>

            {!['text_approved', 'media_in_progress', 'media_submitted', 'media_revision_required', 'manager_approved', 'pending_admin_approval', 'approved', 'ready_to_publish', 'published'].includes(post.status) ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30 p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span>Media Stage Locked: Text Approval Required</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Under the editorial workflow, creators can only upload videos and images into their assigned Google Drive folder after the Campaign Manager reviews and approves the Title, Description, and Hashtags.
                </p>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  Current text status: <strong className="font-mono uppercase">{post.status.replace(/_/g, ' ')}</strong>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setActiveMediaAsset(asset);
                      setLightboxOpen(true);
                    }}
                    className="rounded-xl border border-border/80 bg-muted/20 p-3 hover:border-primary-500/50 cursor-pointer transition-all space-y-2 group relative overflow-hidden"
                  >
                    <div className="relative aspect-video sm:aspect-square rounded-lg overflow-hidden bg-black/10 flex items-center justify-center">
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="h-6 w-6" />
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px] font-semibold">
                        {asset.aspectRatio}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground truncate block">
                        {asset.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        {formatBytes(asset.sizeBytes || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption & Hashtags (Requirement 2: Preserves rich text & dual copy buttons) */}
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-foreground">Post Description & Strategy</h3>
              </div>
              <div className="flex items-center gap-2">
                <CopyTextActions
                  htmlContent={post.description_html}
                  plainText={post.caption}
                  size="sm"
                />
                {['draft', 'text_submitted', 'text_revision_required'].includes(post.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditTitle(post.title);
                      setEditDescriptionHtml(post.description_html || `<p>${post.caption || ''}</p>`);
                      setEditCaptionPlain(post.caption || '');
                      setEditHashtagsRaw((post.hashtags || []).join(', '));
                      setEditTextDrawerOpen(true);
                    }}
                    className="text-xs h-7"
                  >
                    Edit / Revise Copy
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-sm leading-relaxed font-sans select-text">
              <FormattedContent
                html={post.description_html}
                fallbackText={post.caption}
              />
            </div>

            {/* Hashtag pills */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.hashtags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-md border border-primary-200 dark:border-primary-900"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Platform limits */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                Platform Limit Verification
              </span>
              <PlatformCounters
                caption={post.caption || ''}
                hashtags={post.hashtags || []}
                platforms={post.platforms}
              />
            </div>
          </div>

          {/* Creative Specs & Brief Links */}
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Creative Brief & Specifications</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {post.creative_specs || 'Standard brand visual specs apply.'}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {post.google_docs_brief_url && (
                <a
                  href={post.google_docs_brief_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Google Docs Live Brief</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
              {post.google_drive_assets_url && (
                <a
                  href={post.google_drive_assets_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  <span>Drive Asset Folder</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          {/* Google Docs Live Strategic Brief Integration */}
          <GoogleDocsBriefPanel
            postTitle={post.title}
            docsUrl={post.google_docs_brief_url}
          />

          {/* Below: Tabbed Timeline / Comments & Proofreading / Submissions & Versions / Approval history */}
          <div className="rounded-xl border border-border/80 bg-card shadow-soft overflow-hidden">
            <Tabs defaultValue="proofreading" className="p-6">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="proofreading">
                  Comments & Proofreading ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="submissions">Submissions & Versions</TabsTrigger>
                <TabsTrigger value="timeline">Workflow Timeline</TabsTrigger>
              </TabsList>

              {/* COMMENTS & PROOFREADING TAB */}
              <TabsContent value="proofreading" className="space-y-4 mt-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {comments.map(c => (
                    <div
                      key={c.id}
                      className={cn(
                        'p-3.5 rounded-xl border text-xs space-y-2 transition-colors',
                        c.resolved
                          ? 'bg-muted/20 border-border/40 opacity-70'
                          : 'bg-card border-border shadow-soft-sm'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.author} src={c.avatar} size="sm" />
                          <span className="font-semibold text-foreground">{c.author}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {c.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{c.time}</span>
                          <button
                            onClick={() => toggleCommentResolved(c.id)}
                            className={cn(
                              'p-1 rounded text-xs flex items-center gap-1 transition-colors',
                              c.resolved ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
                            )}
                            title={c.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{c.resolved ? 'Resolved' : 'Resolve'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-foreground pl-9 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Comment Creator */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Comment Type:</span>
                    <button
                      type="button"
                      onClick={() => setNewCommentType('general')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        newCommentType === 'general' ? 'bg-primary-600 text-white' : 'bg-muted'
                      )}
                    >
                      General Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCommentType('suggestion')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        newCommentType === 'suggestion' ? 'bg-primary-600 text-white' : 'bg-muted'
                      )}
                    >
                      Copy Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCommentType('revision_request')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        newCommentType === 'revision_request' ? 'bg-primary-600 text-white' : 'bg-muted'
                      )}
                    >
                      Revision Request
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add an editorial note or inline suggestion..."
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button size="sm" variant="primary" onClick={handleAddComment} leftIcon={<Send className="h-3.5 w-3.5" />}>
                      Comment
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* SUBMISSIONS & VERSIONS TAB */}
              <TabsContent value="submissions" className="space-y-4 mt-4">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs text-muted-foreground">Version history & deliverable files</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSubmissionModalOpen(true)}
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                  >
                    Upload / Submit Assets
                  </Button>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Current Active Submission (v2.0)</span>
                    <span className="text-[11px] text-muted-foreground font-mono">Synced via Drive Service</span>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="h-5 w-5 text-emerald-500" />
                      <div>
                        <span className="font-semibold text-foreground block">
                          Autonomous_Risk_Carousel_v2_FINAL.pdf
                        </span>
                        <span className="text-muted-foreground">3.4 MB • Submitted by Maya Patel</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(post.google_drive_assets_url || '#', '_blank')}
                      className="text-xs h-7"
                    >
                      Inspect in Drive
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted/10 rounded-lg border border-border/40 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Version v1.0 (Initial Draft)</span>
                  <span>Archived in Drive Submissions folder</span>
                </div>
              </TabsContent>

              {/* TIMELINE TAB */}
              <TabsContent value="timeline" className="space-y-3 mt-4">
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/20 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-foreground block">Assigned to Creator</span>
                      <span className="text-muted-foreground">Assigned to Alex Rivera with specifications</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{formatRelativeTime(post.created_at)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-foreground block">Workflow Transition: Under Review</span>
                      <span className="text-muted-foreground">Submitted by creator, entered Manager Proofreading queue</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{formatRelativeTime(post.updated_at)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* RIGHT STICKY COLUMN: Status card, Assignees, Permissions & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Workflow Action Panel */}
          <div className="rounded-xl border border-primary-500/30 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Permitted Actions
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-foreground">
                {role}
              </span>
            </div>

            {availableTransitions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No state transitions permitted for role ({role}) at current status.
              </p>
            ) : (
              <div className="space-y-2">
                {availableTransitions.map(trans => (
                  <Button
                    key={trans.to}
                    onClick={() => {
                      if (trans.requiresNote) {
                        setTransitionDialog({
                          open: true,
                          targetStatus: trans.to,
                          actionLabel: trans.actionLabel,
                          requiresNote: true,
                        });
                      } else {
                        handleExecuteTransition(trans.to);
                      }
                    }}
                    variant={
                      trans.to === 'rejected' || trans.to === 'cancelled'
                        ? 'destructive'
                        : 'primary'
                    }
                    className="w-full justify-between"
                  >
                    <span>{trans.actionLabel}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            )}

            {(role === 'manager' || role === 'admin') && (
              <div className="pt-3 border-t border-border/60 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/review/${post.id}`)}
                  className="w-full justify-center gap-2 border-primary-500/30 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-xs font-semibold"
                >
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  <span>Open Proofreading Studio</span>
                </Button>

                {(role === 'admin' || post.status === 'ready_to_publish' || post.status === 'approved' || post.status === 'scheduled') && (
                  <Button
                    variant="outline"
                    onClick={() => setPublishingModalOpen(true)}
                    className="w-full justify-center gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold"
                  >
                    <Share2 className="h-4 w-4 text-emerald-500" />
                    <span>Open Publishing Desk</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* People & Deadlines Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Assignment & Deadlines</h3>

            <div className="space-y-3 text-xs divide-y divide-border/40">
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Target Deadline:</span>
                <DeadlineChip deadline={post.deadline} />
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-muted-foreground">Assigned Creator:</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Avatar name={post.assigned_student?.full_name || 'Creator'} src={post.assigned_student?.avatar_url} size="sm" />
                  <span>{post.assigned_student?.full_name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-muted-foreground">Managing Lead:</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Avatar name={post.assigned_manager?.full_name || 'Lead'} src={post.assigned_manager?.avatar_url} size="sm" />
                  <span>{post.assigned_manager?.full_name || 'Manager'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Status & Permissions Validation */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Drive Storage Health
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Permission OK
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Google Workspace Drive sync validated. Student creator and review manager have verified read/write access.
            </p>
          </div>
        </div>
      </div>

      {/* Media Lightbox */}
      {activeMediaAsset && (
        <MediaPreviewLightbox
          asset={activeMediaAsset}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Confirmation Dialog for Note-Required Transitions */}
      <ConfirmationDialog
        isOpen={transitionDialog.open}
        onClose={() => setTransitionDialog({ open: false })}
        onConfirm={() =>
          transitionDialog.targetStatus &&
          handleExecuteTransition(transitionDialog.targetStatus, transitionNote)
        }
        title={transitionDialog.actionLabel || 'Confirm State Transition'}
        description={
          transitionDialog.requiresNote
            ? 'A clear revision note or reason is required to proceed with this workflow transition.'
            : `Transition deliverable to "${transitionDialog.targetStatus}"?`
        }
        confirmLabel="Execute Transition"
        isDestructive={transitionDialog.targetStatus === 'rejected'}
        requireTypedText={transitionDialog.targetStatus === 'rejected' ? 'REJECT' : undefined}
      />

      {/* Student Deliverable Submission Modal */}
      {submissionModalOpen && (
        <StudentSubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => setSubmissionModalOpen(false)}
          post={post}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Manual & Auto Publishing Checklist Modal */}
      {publishingModalOpen && (
        <PublishingChecklistModal
          isOpen={publishingModalOpen}
          onClose={() => setPublishingModalOpen(false)}
          post={post}
          onPublished={() => window.location.reload()}
        />
      )}

      {/* Edit / Revise Copy Drawer (Requirement 2: Rich text preservation & version history) */}
      <Drawer
        isOpen={editTextDrawerOpen}
        onClose={() => setEditTextDrawerOpen(false)}
        title="Revise & Submit Post Copy"
        description="Write or paste ChatGPT formatted content. Bold, italics, bullet lists and emojis will be preserved."
        width="lg"
      >
        <form onSubmit={handleSaveTextRevision} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Post Title *
            </label>
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="e.g. Autonomous Risk Modeling in Global Banking"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Post Description (Rich Text Editor) *
              </label>
              <span className="text-[10px] text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded font-mono">
                HTML / Markdown Sanitized
              </span>
            </div>
            <RichTextEditor
              value={editDescriptionHtml}
              onChange={(html, plain) => {
                setEditDescriptionHtml(html);
                setEditCaptionPlain(plain);
              }}
              placeholder="Paste formatted ChatGPT text here (bold, bullet lists, emojis)..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Hashtags (Comma Separated)
            </label>
            <Input
              value={editHashtagsRaw}
              onChange={e => setEditHashtagsRaw(e.target.value)}
              placeholder="FinTech, RiskManagement, CleanTech"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setEditTextDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Text Version for Manager Review
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
