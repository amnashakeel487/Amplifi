import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  FileText,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Video,
  Image as ImageIcon,
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
import { Drawer } from '@/components/ui/drawer';
import { Modal } from '@/components/ui/modal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { FormattedContent } from '@/components/ui/formatted-content';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { formatBytes } from '@/lib/utils';

export const ProofreadingReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isManager, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const postId = id || '';
  const [post, setPost] = useState<Post | undefined>(() => mockDb.getPost(postId));

  // Decision Modals
  const [revisionDrawerOpen, setRevisionDrawerOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionError, setRevisionError] = useState('');

  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [recommendationNote, setRecommendationNote] = useState('');

  if (!post) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Deliverable Not Found</h2>
        <Button onClick={() => navigate('/projects')} variant="primary">
          Back to Projects
        </Button>
      </div>
    );
  }

  const latestAsset = post.assets?.[post.assets.length - 1];

  const handleApprove = () => {
    const updated = mockDb.updatePost(post.id, {
      status: 'manager_approved',
      updated_at: new Date().toISOString(),
    });
    setPost(updated);

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'MANAGER_APPROVED_POST',
      entity_type: 'post',
      entity_id: post.id,
      details: { decision: 'Manager approved deliverable' },
    });

    showToast({
      type: 'success',
      title: 'Deliverable Approved by Manager',
      message: `"${post.title}" marked as Manager Approved. You can now Recommend it to the Admin.`,
    });
  };

  const handleRecommendToAdmin = () => {
    if (!recommendationNote.trim()) {
      showToast({ type: 'error', title: 'Note Required', message: 'Please provide a rationale note for the Administrator.' });
      return;
    }

    const updated = mockDb.recommendToAdmin(post.id, recommendationNote.trim());
    setPost(updated);

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'MANAGER_RECOMMENDED_TO_ADMIN',
      entity_type: 'post',
      entity_id: post.id,
      details: { note: recommendationNote.trim() },
    });

    showToast({
      type: 'success',
      title: 'Recommended to Admin',
      message: `"${post.title}" forwarded for Admin executive approval.`,
    });

    setRecommendModalOpen(false);
    navigate(`/projects/${post.project_id}`);
  };

  const handleExecuteRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (revisionNotes.trim().length < 5) {
      setRevisionError('Please provide a specific feedback explanation.');
      return;
    }
    setRevisionError('');

    const updated = mockDb.updatePost(post.id, {
      status: 'revision_required',
      revision_instructions: revisionNotes.trim(),
      updated_at: new Date().toISOString(),
    });
    setPost(updated);

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'REVISION_REQUESTED',
      entity_type: 'post',
      entity_id: post.id,
      details: { instructions: revisionNotes.trim() },
    });

    showToast({
      type: 'warning',
      title: 'Revision Dispatched',
      message: 'Returned to student with your specific feedback notes.',
    });

    setRevisionDrawerOpen(false);
    navigate(`/projects/${post.project_id}`);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${post.project_id}`)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Project
          </Button>
          <div className="h-4 w-px bg-border/80 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                {post.project?.name}
              </span>
              <StatusBadge status={post.status} size="sm" />
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded font-bold">
                {post.content_type === 'video' ? <Video className="h-3 w-3 text-indigo-500" /> : <ImageIcon className="h-3 w-3 text-emerald-500" />}
                {post.content_type}
              </span>
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

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Media Preview & Copy (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Media Deliverable Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600" />
                Submitted {post.content_type.toUpperCase()} Deliverable
              </span>
              {latestAsset && (
                <span className="text-xs font-mono text-muted-foreground">
                  Version {latestAsset.version_number}
                </span>
              )}
            </div>

            {latestAsset ? (
              <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{latestAsset.file_name}</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      {latestAsset.file_type} • {formatBytes(latestAsset.file_size_bytes)}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.open(latestAsset.drive_file_url, '_blank')}
                    rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    Open Deliverable in Drive
                  </Button>
                </div>

                {latestAsset.submission_notes && (
                  <div className="p-3 rounded-lg bg-background border border-border/60 text-xs">
                    <span className="font-semibold text-foreground block mb-0.5">Student Notes:</span>
                    <p className="text-muted-foreground">{latestAsset.submission_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                No visual media deliverable submitted yet.
              </div>
            )}
          </div>

          {/* Copy Preview Card (Formatted Text with Copy Buttons) */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" />
                Post Copy & Formatting
              </span>
              <CopyTextActions
                htmlContent={post.description_html}
                plainText={post.caption}
                size="sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-sm">
              <FormattedContent content={post.description_html || post.caption || ''} />
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Hashtags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Author, Notes, History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Creator Profile */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">Submitted By</h3>
            <div className="flex items-center gap-3">
              <Avatar name={post.assigned_student?.full_name || 'Creator'} size="md" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {post.assigned_student?.full_name || 'Assigned Student'}
                </h4>
                <p className="text-xs text-muted-foreground">{post.assigned_student?.email}</p>
                <span className="inline-block text-[10px] uppercase font-mono mt-0.5 px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {post.origin === 'student_created' ? 'Independent Post' : 'Topic Assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Manager Recommendation Note (if already recommended) */}
          {post.manager_recommendation_note && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 p-5 shadow-soft space-y-2">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Manager Recommendation Note
              </span>
              <p className="text-xs text-purple-800 dark:text-purple-300 italic">
                "{post.manager_recommendation_note}"
              </p>
            </div>
          )}

          {/* Text Revision History */}
          {post.text_versions && post.text_versions.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Copy Version History ({post.text_versions.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {post.text_versions.map(ver => (
                  <div key={ver.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">v{ver.version_number}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(ver.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="line-clamp-2 text-muted-foreground">{ver.caption_plain}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Manager Decision Bar (Requirement 5) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 border-t border-border bg-background/95 backdrop-blur shadow-soft-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary-500" />
            <span>
              <strong>Campaign Manager Review</strong>: Proofread copy and verify visual deliverable. Managers can recommend to Admin, but cannot give final approval.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevisionDrawerOpen(true)}
              leftIcon={<RotateCcw className="h-3.5 w-3.5 text-orange-500" />}
            >
              Request Revision
            </Button>

            {post.status !== 'manager_approved' && post.status !== 'recommended_to_admin' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleApprove}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />}
              >
                Manager Approve
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setRecommendationNote(post.manager_recommendation_note || '');
                setRecommendModalOpen(true);
              }}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Recommend to Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Recommend to Admin Modal (Requirement 5) */}
      <Modal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Recommend Deliverable to Admin</span>
          </div>
        }
        description={`Endorse "${post.title}" with a rationale note explaining why this deliverable should be approved for release.`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Manager Rationale Note *
            </label>
            <Textarea
              value={recommendationNote}
              onChange={e => setRecommendationNote(e.target.value)}
              placeholder="Explain why this post is ready for public release. Mention copywriting impact, visual deliverable quality, and messaging..."
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-300">
            This deliverable will move to <strong className="text-foreground">Recommended to Admin</strong>. The Administrator will review this recommendation and decide whether to publish personally or allow you to execute publication.
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRecommendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRecommendToAdmin}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Confirm Recommendation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revision Drawer */}
      <Drawer
        isOpen={revisionDrawerOpen}
        onClose={() => setRevisionDrawerOpen(false)}
        title="Request Deliverable Revisions"
        description="Provide actionable proofreading notes for the student."
        width="md"
      >
        <form onSubmit={handleExecuteRevision} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Revision Feedback & Specific Directions *
            </label>
            <Textarea
              value={revisionNotes}
              onChange={e => {
                setRevisionNotes(e.target.value);
                if (revisionError) setRevisionError('');
              }}
              placeholder="e.g. 1. Rephrase opening hook to be more engaging. 2. Verify that video end card includes call to action..."
              rows={5}
              className="text-xs"
            />
            {revisionError && <p className="text-xs text-red-500 font-medium mt-1">{revisionError}</p>}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setRevisionDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="submit">
              Dispatch Revision to Student
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
