import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StudentSubmissionModal } from '@/components/submissions/StudentSubmissionModal';
import { Post } from '@/lib/types';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissionModalPost, setSubmissionModalPost] = useState<Post | null>(null);

  const allPosts = mockDb.getPosts();

  // Filter tasks assigned to current student (or fallback to student-01 in demo)
  const myTasks = useMemo(() => {
    const studentId = user?.id || 'user-student-01';
    return allPosts
      .filter(p => p.assigned_student_id === studentId || p.assigned_student?.email === user?.email)
      .sort((a, b) => {
        // Due-soon first
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [allPosts, user]);

  const revisionNeededTasks = useMemo(
    () => myTasks.filter(p => p.status === 'revision_required'),
    [myTasks]
  );

  const inProgressTasks = useMemo(
    () => myTasks.filter(p => ['assigned', 'in_progress'].includes(p.status)),
    [myTasks]
  );

  const completedTasks = useMemo(
    () => myTasks.filter(p => ['submitted', 'under_review', 'manager_approved', 'approved', 'published'].includes(p.status)),
    [myTasks]
  );

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Creative Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Focus on due-soon assignments, clear submission requirements, and manager feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/drive')}
            variant="outline"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            Google Drive Assets
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Revisions Requested"
          value={revisionNeededTasks.length}
          subtitle="Priority feedback to address"
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          className={revisionNeededTasks.length > 0 ? 'border-orange-300 dark:border-orange-900/60' : ''}
        />
        <StatCard
          title="Active Assignments"
          value={inProgressTasks.length}
          subtitle="In production / drafting"
          icon={<Clock className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Submitted / Approved"
          value={completedTasks.length}
          subtitle="Signed off or in review"
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
                Action Required: Manager Feedback on {revisionNeededTasks.length} Post(s)
              </h4>
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                Your campaign manager has annotated your submissions with specific proofreading notes or asset adjustments.
                Please review the feedback before submitting final revisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task List (Due-Soon First) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Assigned Content Work</h2>
          <span className="text-xs text-muted-foreground">{myTasks.length} total tasks</span>
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            title="No Active Assignments"
            description="You are currently caught up with all assigned posts. New creative briefs from managers will appear here."
            actionLabel="View Client Projects"
            onAction={() => navigate('/projects')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myTasks.map(post => {
              const isRevision = post.status === 'revision_required';
              const canSubmit = ['assigned', 'in_progress', 'revision_required'].includes(post.status);

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
                      {canSubmit ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSubmissionModalPost(post)}
                          rightIcon={<UploadCloud className="h-4 w-4" />}
                        >
                          Upload / Submit
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/posts/${post.id}`)}
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          View Post
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Creative Specifications & Required Formats Checklist */}
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                      <span>Creative Specs & Formats</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {post.creative_specs || 'Follow brand guidelines in Google Docs brief.'}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.platforms.map(p => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-medium uppercase text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prominent Revision Banner if revision_required */}
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

                  {/* Submission Links & Call to Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {post.google_docs_brief_url && (
                        <a
                          href={post.google_docs_brief_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary-600 underline font-medium"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Google Docs Brief</span>
                        </a>
                      )}
                      {post.google_drive_assets_url && (
                        <a
                          href={post.google_drive_assets_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary-600 underline font-medium"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Drive Asset Folder</span>
                        </a>
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

      {/* Student Submission Modal */}
      {submissionModalPost && (
        <StudentSubmissionModal
          isOpen={!!submissionModalPost}
          onClose={() => setSubmissionModalPost(null)}
          post={submissionModalPost}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};
