import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  HardDrive,
  Lock,
  Plus,
  Copy,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { Post } from '@/lib/types';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StudentSubmissionModal } from '@/components/submissions/StudentSubmissionModal';
import { CreatePostDrawer } from '@/components/posts/CreatePostDrawer';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { FormattedContent } from '@/components/ui/formatted-content';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissionModalPost, setSubmissionModalPost] = useState<Post | null>(null);
  const [createPostDrawerOpen, setCreatePostDrawerOpen] = useState(false);

  // Scoped posts for current student creator (Requirement 7)
  const myTasks = useMemo(() => {
    return mockDb.getPostsForUser(user || undefined).sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [user]);

  const assignedFolderId = user?.assigned_drive_folder_id || '1AbC_dRiVe_AlexRivera_Folder2026';
  const assignedFolderUrl = user?.assigned_drive_folder_url || `https://drive.google.com/drive/folders/${assignedFolderId}`;

  const revisionNeededTasks = useMemo(
    () => myTasks.filter(p => ['text_revision_required', 'media_revision_required', 'revision_required'].includes(p.status)),
    [myTasks]
  );

  const mediaReadyTasks = useMemo(
    () => myTasks.filter(p => ['text_approved', 'media_in_progress'].includes(p.status)),
    [myTasks]
  );

  const textDraftingTasks = useMemo(
    () => myTasks.filter(p => ['draft', 'text_submitted', 'assigned', 'in_progress'].includes(p.status)),
    [myTasks]
  );

  const submittedTasks = useMemo(
    () => myTasks.filter(p => ['media_submitted', 'manager_approved', 'pending_admin_approval', 'approved', 'ready_to_publish', 'published'].includes(p.status)),
    [myTasks]
  );

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Creator Creative Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write copy, preserve ChatGPT formatting, and deliver media into your assigned Drive folder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setCreatePostDrawerOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Draft New Post
          </Button>
          <a
            href={assignedFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <HardDrive className="h-4 w-4 text-primary-600" />
            <span>Open Assigned Drive</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Prominent Assigned Drive Folder Notice (Requirement 3) */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                Your Assigned Google Drive Folder (Admin Shared)
              </h3>
              <span className="text-[10px] font-mono bg-blue-200/70 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">
                Least Privilege Verified
              </span>
            </div>
            <p className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5">
              Folder ID: <code className="font-mono font-semibold">{assignedFolderId}</code>. Once text is approved, all images and videos must be uploaded into this folder.
            </p>
          </div>
        </div>
        <a
          href={assignedFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/60 border border-blue-300 dark:border-blue-800 px-3 py-1.5 rounded-lg hover:shadow-sm"
        >
          View Folder <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Revisions Requested"
          value={revisionNeededTasks.length}
          subtitle="Feedback to address"
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          className={revisionNeededTasks.length > 0 ? 'border-orange-300 dark:border-orange-900/60' : ''}
        />
        <StatCard
          title="Media Stage Unlocked"
          value={mediaReadyTasks.length}
          subtitle="Text approved; ready for Drive upload"
          icon={<HardDrive className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Text Stage"
          value={textDraftingTasks.length}
          subtitle="Under review or drafting"
          icon={<Clock className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Delivered / Approved"
          value={submittedTasks.length}
          subtitle="Signed off by management"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Revision Alerts Banner */}
      {revisionNeededTasks.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900/60 dark:bg-orange-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                Action Required: Feedback on {revisionNeededTasks.length} Post(s)
              </h4>
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                Your campaign manager has returned copy or media adjustments. Please review the feedback and resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task List (Due-Soon First) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">My Post Deliverables</h2>
          <span className="text-xs text-muted-foreground">{myTasks.length} assigned</span>
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            title="No Active Assignments"
            description="You currently have no assigned tasks. Click 'Draft New Post' to initiate your first social post."
            actionLabel="Draft New Post"
            onAction={() => setCreatePostDrawerOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myTasks.map(post => {
              const isTextApproved = ['text_approved', 'media_in_progress', 'media_submitted', 'media_revision_required'].includes(post.status);
              const isRevision = ['text_revision_required', 'media_revision_required', 'revision_required'].includes(post.status);

              return (
                <div
                  key={post.id}
                  className={`rounded-xl border bg-card p-5 shadow-soft transition-all duration-150 space-y-4 ${
                    isRevision
                      ? 'border-orange-300 dark:border-orange-900/60 ring-1 ring-orange-200/50'
                      : 'border-border/80 hover:border-primary-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={post.status} />
                        <PriorityBadge priority={post.priority} />
                        <DeadlineChip deadline={post.deadline} />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mt-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Client Project: <span className="font-semibold text-foreground">{post.project?.name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {isTextApproved ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSubmissionModalPost(post)}
                          rightIcon={<UploadCloud className="h-4 w-4" />}
                        >
                          Submit Media (Drive)
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200">
                            <Lock className="h-3 w-3" /> Media Locked Until Text Approved
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/posts/${post.id}`)}
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                          >
                            Edit Text
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formatted Description Preview with Copy Actions (Requirement 2) */}
                  <div className="rounded-lg bg-muted/20 border border-border/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary-600" />
                        Formatted Description & Copy
                      </span>
                      <CopyTextActions
                        htmlContent={post.description_html}
                        plainText={post.caption}
                        size="xs"
                      />
                    </div>
                    <FormattedContent
                      html={post.description_html}
                      fallbackText={post.caption}
                    />

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {post.hashtags.map(t => (
                          <span
                            key={t}
                            className="text-[11px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-900"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revision Feedback Banner */}
                  {isRevision && post.revision_instructions && (
                    <div className="bg-orange-50 dark:bg-orange-950/40 rounded-lg p-3 border border-orange-200 dark:border-orange-900 text-xs space-y-1">
                      <span className="font-semibold text-orange-900 dark:text-orange-200">
                        Manager Instructions:
                      </span>
                      <p className="text-orange-800 dark:text-orange-300 leading-relaxed">
                        {post.revision_instructions}
                      </p>
                    </div>
                  )}

                  {/* Submission Links & Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <a
                        href={assignedFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary-600 underline font-medium"
                      >
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>Assigned Drive Folder</span>
                      </a>
                      {post.assets && post.assets.length > 0 && (
                        <span className="text-[11px] font-mono text-emerald-600 font-medium">
                          ✓ Media v{post.assets.length} Submitted
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      Manager: <strong className="text-foreground">{post.assigned_manager?.full_name || 'Sarah Jenkins'}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {submissionModalPost && (
        <StudentSubmissionModal
          isOpen={!!submissionModalPost}
          onClose={() => setSubmissionModalPost(null)}
          post={submissionModalPost}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Create / Draft Post Drawer */}
      <CreatePostDrawer
        isOpen={createPostDrawerOpen}
        onClose={() => setCreatePostDrawerOpen(false)}
        onPostCreated={() => window.location.reload()}
      />
    </div>
  );
};
