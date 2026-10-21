import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  FileEdit,
  ArrowRight,
  Send,
  Eye,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Filter,
  Maximize2,
  Layers,
  FileText,
  Copy,
  ExternalLink,
  Share2,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PlatformCounters } from '@/components/posts/PlatformCounters';
import { MediaPreviewLightbox, MediaAsset } from '@/components/media/MediaPreviewLightbox';
import { PublishingChecklistModal } from '@/components/publishing/PublishingChecklistModal';
import { GoogleDocsBriefPanel } from '@/components/google-docs/GoogleDocsBriefPanel';
import { FormattedContent } from '@/components/ui/formatted-content';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { formatBytes, formatRelativeTime } from '@/lib/utils';

export const ApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [posts, setPosts] = useState<Post[]>(mockDb.getPosts());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_admin' | 'manager_approved' | 'under_review'>('all');

  // Posts waiting for executive or manager approval
  const queuePosts = useMemo(() => {
    return posts
      .filter(p =>
        ['pending_admin_approval', 'manager_approved', 'under_review', 'approved', 'ready_to_publish'].includes(p.status)
      )
      .filter(p => {
        if (statusFilter === 'pending_admin') return p.status === 'pending_admin_approval';
        if (statusFilter === 'manager_approved') return p.status === 'manager_approved';
        if (statusFilter === 'under_review') return p.status === 'under_review';
        return true;
      })
      .filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.project?.name.toLowerCase().includes(q) ||
          p.caption?.toLowerCase().includes(q)
        );
      });
  }, [posts, statusFilter, searchQuery]);

  const [selectedPostId, setSelectedPostId] = useState<string>(
    queuePosts[0]?.id || posts[0]?.id || ''
  );

  const activePost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId) || queuePosts[0] || posts[0];
  }, [posts, selectedPostId, queuePosts]);

  // Modals & Dialogs
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaAsset, setActiveMediaAsset] = useState<MediaAsset | null>(null);
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  // Publisher Choice Modal (Requirement 6: "I will publish myself" vs "Assign Manager to publish")
  const [publisherAssignModalOpen, setPublisherAssignModalOpen] = useState(false);
  const [publishingChoice, setPublishingChoice] = useState<'self' | 'manager'>('self');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('user-manager-01');

  // Dialog for Rejection & Revision
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    type: 'revision' | 'reject';
  }>({ open: false, type: 'revision' });
  const [decisionReason, setDecisionReason] = useState('');

  // Sample or Synced Media Assets for Lightbox Preview
  const mediaAssets: MediaAsset[] = useMemo(() => {
    if (activePost?.assets && activePost.assets.length > 0) {
      return activePost.assets.map(a => ({
        id: a.id,
        title: a.file_name,
        url: a.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
        type: a.file_type.includes('video') ? ('video' as const) : ('image' as const),
        sizeBytes: a.file_size_bytes,
        aspectRatio: '1:1',
      }));
    }
    return [
      {
        id: 'asset-1',
        title: 'Primary Campaign Asset (Drive)',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
        type: 'image',
        sizeBytes: 4200000,
        aspectRatio: '1:1',
      },
      {
        id: 'asset-2',
        title: 'Motion Deliverable (Drive)',
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
        type: 'image',
        sizeBytes: 8100000,
        aspectRatio: '9:16',
      },
    ];
  }, [activePost]);

  // Managers list for publishing assignment
  const managers = useMemo(() => {
    return mockDb.getUsers().filter(u => u.role === 'manager');
  }, []);

  const refreshPost = (updatedId: string, updates: Partial<Post>) => {
    mockDb.updatePost(updatedId, updates);
    setPosts([...mockDb.getPosts()]);
  };

  const handleApprove = () => {
    if (!activePost) return;
    // Open publisher assignment choice (Requirement 6)
    setSelectedManagerId(activePost.assigned_manager_id || managers[0]?.id || 'user-manager-01');
    setPublisherAssignModalOpen(true);
  };

  const handleConfirmPublisherAssignment = () => {
    if (!activePost) return;

    const publisherId = publishingChoice === 'self'
      ? (user?.id || 'user-admin-01')
      : (selectedManagerId || activePost.assigned_manager_id || 'user-manager-01');

    const publisherRole = publishingChoice === 'self' ? 'admin' : 'manager';
    const publisherUser = mockDb.getUser(publisherId);

    refreshPost(activePost.id, {
      status: 'ready_to_publish',
      assigned_publisher_id: publisherId,
      publisher_role: publisherRole,
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'ADMIN_POST_APPROVED_AND_ASSIGNED_PUBLISHER',
      entity_type: 'post',
      entity_id: activePost.id,
      details: {
        new_status: 'ready_to_publish',
        publisher_choice: publishingChoice,
        assigned_publisher_id: publisherId,
        assigned_publisher_name: publisherUser?.full_name,
      },
    });

    showToast({
      type: 'success',
      title: 'Deliverable Approved & Ready to Publish',
      message: publishingChoice === 'self'
        ? `"${activePost.title}" approved. You are designated as publisher.`
        : `"${activePost.title}" approved. Assigned to ${publisherUser?.full_name || 'Manager'} to publish.`,
    });

    setPublisherAssignModalOpen(false);
  };

  const handleReadyToPublish = () => {
    if (!activePost) return;
    refreshPost(activePost.id, { status: 'ready_to_publish' });
    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'ADMIN_POST_READY_TO_PUBLISH',
      entity_type: 'post',
      entity_id: activePost.id,
      details: { new_status: 'ready_to_publish' },
    });
    showToast({
      type: 'success',
      title: 'Marked Ready to Publish',
      message: 'Deliverable is ready for manual or scheduled dispatch.',
    });
  };

  const handleConfirmSchedule = () => {
    if (!activePost) return;
    refreshPost(activePost.id, {
      status: 'scheduled',
      scheduled_at: new Date(scheduledDateTime).toISOString(),
    });
    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'ADMIN_POST_SCHEDULED',
      entity_type: 'post',
      entity_id: activePost.id,
      details: { scheduled_at: scheduledDateTime },
    });
    showToast({
      type: 'success',
      title: 'Post Scheduled',
      message: `Content locked for release on ${new Date(scheduledDateTime).toLocaleString()}.`,
    });
    setScheduleModalOpen(false);
  };

  const handleConfirmDecision = () => {
    if (!activePost) return;
    if (decisionReason.trim().length < 10) {
      showToast({
        type: 'error',
        title: 'Feedback Required',
        message: 'Please provide at least 10 characters explaining your decision.',
      });
      return;
    }

    if (decisionModal.type === 'revision') {
      refreshPost(activePost.id, {
        status: 'revision_required',
        revision_instructions: decisionReason.trim(),
      });
      mockDb.logAudit({
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        action: 'ADMIN_POST_REVISION_REQUESTED',
        entity_type: 'post',
        entity_id: activePost.id,
        details: { instructions: decisionReason },
      });
      showToast({
        type: 'warning',
        title: 'Revision Requested',
        message: 'Task sent back to the assigned creator with instructions.',
      });
    } else {
      refreshPost(activePost.id, {
        status: 'rejected',
        rejection_reason: decisionReason.trim(),
      });
      mockDb.logAudit({
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        action: 'ADMIN_POST_REJECTED',
        entity_type: 'post',
        entity_id: activePost.id,
        details: { reason: decisionReason },
      });
      showToast({
        type: 'error',
        title: 'Deliverable Rejected',
        message: 'Post has been rejected and archived.',
      });
    }

    setDecisionModal({ open: false, type: 'revision' });
    setDecisionReason('');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        type: 'success',
        title: `${label} Copied`,
        message: 'Copied to clipboard.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy to clipboard.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary-600" />
            <span>Executive Approval Queue</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dual-pane review desk: inspect full copy, visual assets, and manager sign-offs before client release.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-900">
            {queuePosts.length} Deliverables in Queue
          </span>
        </div>
      </div>

      {queuePosts.length === 0 && !searchQuery ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center bg-card shadow-soft">
          <CheckSquare className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-90" />
          <h3 className="text-base font-semibold text-foreground">Queue is Completely Clear</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            All submitted content deliverables have been reviewed, scheduled, or released.
          </p>
        </div>
      ) : (
        /* Split view: List on left (5 cols), Full Review on right (7 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT POST LIST */}
          <div className="lg:col-span-5 rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft flex flex-col max-h-[820px]">
            {/* Search and Filters */}
            <div className="p-3.5 border-b border-border/80 bg-muted/20 space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter queue by title or project..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All ({posts.filter(p => ['pending_admin_approval', 'manager_approved', 'under_review', 'approved', 'ready_to_publish'].includes(p.status)).length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending_admin')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    statusFilter === 'pending_admin'
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Pending Admin
                </button>
                <button
                  onClick={() => setStatusFilter('manager_approved')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    statusFilter === 'manager_approved'
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Manager Approved
                </button>
              </div>
            </div>

            {/* Scrollable list items */}
            <div className="overflow-y-auto divide-y divide-border/40 flex-1">
              {queuePosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No deliverables match the selected filter.
                </div>
              ) : (
                queuePosts.map(post => {
                  const isSelected = activePost?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className={`p-4 cursor-pointer transition-all space-y-2 border-l-4 ${
                        isSelected
                          ? 'bg-primary-50/50 dark:bg-primary-950/30 border-l-primary-600 shadow-soft-sm'
                          : 'border-l-transparent hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <StatusBadge status={post.status} size="sm" />
                        <DeadlineChip deadline={post.deadline} showIcon={false} />
                      </div>

                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                        {post.title}
                      </h4>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                        <span className="truncate max-w-[140px] font-medium">
                          {post.project?.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={post.priority} showIcon={false} />
                          <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded">
                            {post.platforms.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT REVIEW PANEL */}
          {activePost ? (
            <div className="lg:col-span-7 rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {activePost.project?.client?.code} • {activePost.project?.name}
                    </span>
                    <StatusBadge status={activePost.status} size="sm" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {activePost.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/posts/${activePost.id}`)}
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                  >
                    Open Post Page
                  </Button>
                </div>
              </div>

              {/* Media Preview Thumbnail strip with Lightbox */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary-500" />
                    <span>Deliverable Visual Assets (2)</span>
                  </label>
                  <span className="text-xs text-muted-foreground font-mono">
                    Synced from Google Drive
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mediaAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setActiveMediaAsset(asset);
                        setLightboxOpen(true);
                      }}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-border/80 bg-muted/20 cursor-pointer hover:border-primary-500/60 transition-all"
                    >
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="h-6 w-6" />
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-semibold">
                        {asset.aspectRatio} • {formatBytes(asset.sizeBytes)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption & Hashtag Preview (Requirement 2 & 5: Formatted description & dual copy actions) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary-500" />
                    <span>Formatted Description & Hashtags</span>
                  </label>
                  <CopyTextActions
                    htmlContent={activePost.description_html}
                    plainText={activePost.caption}
                    size="xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-sm leading-relaxed font-sans">
                  <FormattedContent
                    html={activePost.description_html}
                    fallbackText={activePost.caption}
                  />
                </div>

                {activePost.hashtags && activePost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activePost.hashtags.map(t => (
                      <span
                        key={t}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-md border border-primary-200 dark:border-primary-900"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Platform limit checks */}
                <div className="pt-2">
                  <PlatformCounters
                    caption={activePost.caption || ''}
                    hashtags={activePost.hashtags || []}
                    platforms={activePost.platforms}
                  />
                </div>
              </div>

              {/* Sign-Off Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Assigned Creator:</span>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={activePost.assigned_student?.full_name || 'Creator'}
                      src={activePost.assigned_student?.avatar_url}
                      size="sm"
                    />
                    <div>
                      <span className="font-semibold text-foreground block">
                        {activePost.assigned_student?.full_name || 'Alex Rivera'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Student Specialist</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Manager Sign-Off:</span>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={activePost.assigned_manager?.full_name || 'Sarah Jenkins'}
                      src={activePost.assigned_manager?.avatar_url}
                      size="sm"
                    />
                    <div>
                      <span className="font-semibold text-foreground block">
                        {activePost.assigned_manager?.full_name || 'Sarah Jenkins'}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Proofreading Passed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DECISION ACTION BAR (Phase 6 Core Requirement) */}
              <div className="pt-4 border-t border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Executive Decision Actions
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Action immediately updates workflow status
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Approve */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprove}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Authorize & Approve
                  </Button>

                  {/* Ready to Publish */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReadyToPublish}
                    leftIcon={<Sparkles className="h-4 w-4 text-emerald-500" />}
                  >
                    Ready to Publish
                  </Button>

                  {/* Schedule */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleModalOpen(true)}
                    leftIcon={<Calendar className="h-4 w-4 text-sky-500" />}
                  >
                    Schedule Release
                  </Button>

                  {/* Publish Now */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPublishingModalOpen(true)}
                    leftIcon={<Share2 className="h-4 w-4 text-primary-500" />}
                  >
                    Publishing Desk
                  </Button>

                  {/* Request Revision */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDecisionModal({ open: true, type: 'revision' })}
                    leftIcon={<FileEdit className="h-4 w-4 text-amber-500" />}
                  >
                    Request Revision
                  </Button>

                  {/* Reject */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDecisionModal({ open: true, type: 'reject' })}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Reject Deliverable
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 rounded-xl border border-dashed border-border p-12 text-center bg-card">
              <span className="text-xs text-muted-foreground">
                Select a post from the left queue to inspect and authorize.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeMediaAsset && (
        <MediaPreviewLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          asset={activeMediaAsset}
        />
      )}

      {/* Publishing Modal (Manual Checklist + Auto Connectors) */}
      {activePost && (
        <PublishingChecklistModal
          isOpen={publishingModalOpen}
          onClose={() => setPublishingModalOpen(false)}
          post={activePost}
          onPublished={url => {
            refreshPost(activePost.id, {
              status: 'published',
              published_url: url,
              published_at: new Date().toISOString(),
            });
          }}
        />
      )}

      {/* Schedule Release Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Content Dispatch"
        description={`Set an automated publication window for "${activePost?.title}".`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Target Publication Date & Time (Local)
            </label>
            <Input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={e => setScheduledDateTime(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">Execution Notice</span>
            <p>
              Once scheduled, this post is transitioned to status <strong className="text-foreground">Scheduled</strong>. The publishing desk will flag notification alerts 2 hours prior to dispatch.
            </p>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSchedule}>
              Lock Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revision / Rejection Dialog with Mandatory Reason */}
      <Modal
        isOpen={decisionModal.open}
        onClose={() => setDecisionModal({ open: false, type: 'revision' })}
        title={decisionModal.type === 'revision' ? 'Request Creator Revision' : 'Reject Content Deliverable'}
        description={
          decisionModal.type === 'revision'
            ? `Please specify what changes the creator needs to implement for "${activePost?.title}".`
            : `Are you sure you want to reject "${activePost?.title}"? A formal justification is required for the audit log.`
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Reason / Feedback (Minimum 10 characters) <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {decisionReason.trim().length} chars
              </span>
            </label>
            <Textarea
              value={decisionReason}
              onChange={e => setDecisionReason(e.target.value)}
              placeholder={
                decisionModal.type === 'revision'
                  ? 'E.g., Slide 3 contrast ratio is too low for WCAG AA compliance. Update call-to-action text to match Q3 brand guidelines.'
                  : 'E.g., Client requested cancellation of this campaign angle in favor of the upcoming product launch.'
              }
              rows={4}
            />
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModal({ open: false, type: 'revision' })}
            >
              Cancel
            </Button>
            <Button
              variant={decisionModal.type === 'revision' ? 'primary' : 'destructive'}
              size="sm"
              onClick={handleConfirmDecision}
              disabled={decisionReason.trim().length < 10}
            >
              {decisionModal.type === 'revision' ? 'Send Revision Request' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Publisher Assignment Modal (Requirement 6: "I will publish myself" or "Assign Manager to publish") */}
      <Modal
        isOpen={publisherAssignModalOpen}
        onClose={() => setPublisherAssignModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Grant Executive Approval & Assign Publisher</span>
          </div>
        }
        description={`Authorizing "${activePost?.title}". Designate who will execute the social media release.`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase block">
              Publishing Responsibility *
            </label>

            {/* Option A: Self */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                publishingChoice === 'self'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                  : 'border-border/80 hover:bg-muted/30'
              }`}
            >
              <input
                type="radio"
                name="publishingChoice"
                value="self"
                checked={publishingChoice === 'self'}
                onChange={() => setPublishingChoice('self')}
                className="mt-0.5 text-primary-600 focus:ring-primary-500"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground block">
                  I will publish myself (Administrator)
                </span>
                <p className="text-xs text-muted-foreground">
                  You will handle live distribution, copy pasting, and record the verified live URL.
                </p>
              </div>
            </label>

            {/* Option B: Assign Manager */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                publishingChoice === 'manager'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                  : 'border-border/80 hover:bg-muted/30'
              }`}
            >
              <input
                type="radio"
                name="publishingChoice"
                value="manager"
                checked={publishingChoice === 'manager'}
                onChange={() => setPublishingChoice('manager')}
                className="mt-0.5 text-primary-600 focus:ring-primary-500"
              />
              <div className="space-y-1 w-full">
                <span className="text-sm font-semibold text-foreground block">
                  Assign Campaign Manager to publish
                </span>
                <p className="text-xs text-muted-foreground">
                  The designated manager will see this post in their "To Publish" queue with one-click copy buttons.
                </p>

                {publishingChoice === 'manager' && (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                      Select Manager:
                    </label>
                    <Select
                      value={selectedManagerId}
                      onChange={e => setSelectedManagerId(e.target.value)}
                      className="text-xs"
                    >
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.email})
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="p-3 bg-muted/30 rounded-xl border border-border/60 text-xs text-muted-foreground">
            Status will transition to <strong className="text-foreground">Ready to Publish</strong>. The deliverable cannot be marked Published without human confirmation of the live URL.
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPublisherAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmPublisherAssignment}>
              Approve & Assign Publisher
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
