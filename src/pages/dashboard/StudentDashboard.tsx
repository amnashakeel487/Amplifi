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
  Video,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { Post, PriorityLevel } from '@/lib/types';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StudentSubmissionModal } from '@/components/submissions/StudentSubmissionModal';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { FormattedContent } from '@/components/ui/formatted-content';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useNotifications } from '@/context/NotificationContext';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [submissionModalPost, setSubmissionModalPost] = useState<Post | null>(null);

  // Student Creates Own Post Drawer (Requirement 4)
  const [createPostDrawerOpen, setCreatePostDrawerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newContentType, setNewContentType] = useState<'video' | 'image'>('video');
  const [newDescriptionHtml, setNewDescriptionHtml] = useState('');
  const [newHashtags, setNewHashtags] = useState('');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  // Scoped queries: student sees ONLY their assigned projects and posts (Requirement 4 & 7)
  const myProjects = useMemo(() => mockDb.getProjectsForUser(user || undefined), [user]);
  const myTasks = useMemo(() => {
    return mockDb.getPostsForUser(user || undefined).sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [user]);

  const myFolders = useMemo(() => {
    if (!user) return [];
    return mockDb.getStudentFolders(undefined, user.id);
  }, [user]);

  const revisionTasks = useMemo(
    () => myTasks.filter(p => p.status === 'revision_required'),
    [myTasks]
  );

  const activeDraftingTasks = useMemo(
    () => myTasks.filter(p => ['assigned', 'student_created', 'in_progress', 'draft'].includes(p.status)),
    [myTasks]
  );

  const inReviewTasks = useMemo(
    () => myTasks.filter(p => ['submitted', 'under_review', 'manager_approved', 'recommended_to_admin'].includes(p.status)),
    [myTasks]
  );

  const completedTasks = useMemo(
    () => myTasks.filter(p => ['approved', 'ready_to_publish', 'published'].includes(p.status)),
    [myTasks]
  );

  // Handle student creating own post (Requirement 4: origin = 'student_created')
  const handleStudentCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast({ type: 'error', message: 'Please provide a title.' });
      return;
    }
    if (!newProjectId) {
      showToast({ type: 'error', message: 'Please select a campaign project.' });
      return;
    }

    const selectedProj = mockDb.getProject(newProjectId);

    const parsedHashtags = newHashtags
      .split(/[,\s]+/)
      .map(h => (h.startsWith('#') ? h : `#${h}`))
      .filter(h => h.length > 1);

    const created = mockDb.createPost({
      project_id: newProjectId,
      title: newTitle.trim(),
      description_html: newDescriptionHtml,
      caption: newDescriptionHtml.replace(/<[^>]*>/g, '').trim(),
      content_type: newContentType,
      origin: 'student_created',
      status: 'student_created',
      priority: 'medium',
      deadline: newDeadline,
      assigned_student_id: user?.id,
      assigned_manager_id: selectedProj?.assigned_manager_id,
      platforms: ['linkedin', 'instagram'],
      hashtags: parsedHashtags,
      created_by: user?.id,
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: 'student',
      action: 'STUDENT_CREATED_POST',
      entity_type: 'post',
      entity_id: created.id,
      details: { title: newTitle.trim(), content_type: newContentType },
    });

    showToast({
      type: 'success',
      title: 'Post Created',
      message: `"${newTitle}" created in ${selectedProj?.name}. You can now submit your media deliverable.`,
    });

    setCreatePostDrawerOpen(false);
    setNewTitle('');
    setNewDescriptionHtml('');
    setNewHashtags('');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Student Creative Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write ChatGPT-formatted copy and upload deliverables into your assigned Video and Image folders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myProjects.length > 0 && (
            <Button
              variant="primary"
              onClick={() => {
                setNewProjectId(myProjects[0]?.id || '');
                setCreatePostDrawerOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create My Own Post
            </Button>
          )}
        </div>
      </div>

      {/* Assigned Folders Banner (Requirement 2 & 4: distinct video & image folders) */}
      {myFolders.length > 0 && (
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary-500" />
              <span>Your Assigned Cloud Storage Folders</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Configured by Administrator • Least Privilege
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {myFolders.map(folder => (
              <div
                key={folder.id}
                className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1 uppercase text-[10px]">
                    {folder.media_type === 'video' ? (
                      <Video className="h-3.5 w-3.5 text-indigo-500" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {folder.media_type} Folder
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {folder.verification_status === 'verified' ? '✓ Verified' : folder.verification_status}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground truncate">
                  {folder.drive_folder_id || 'Not set'}
                </p>
                {folder.drive_folder_url && (
                  <a
                    href={folder.drive_folder_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 pt-0.5"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Deliverables"
          value={activeDraftingTasks.length}
          subtitle="Assigned to draft"
          icon={<Clock className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Revisions Needed"
          value={revisionTasks.length}
          subtitle="Feedback from manager"
          icon={<RotateCcw className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title="In Review"
          value={inReviewTasks.length}
          subtitle="Awaiting manager or admin"
          icon={<Sparkles className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title="Completed Content"
          value={completedTasks.length}
          subtitle="Approved or live"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Action Required: Revisions */}
      {revisionTasks.length > 0 && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wide">
              Revisions Requested by Manager ({revisionTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {revisionTasks.map(p => (
              <div
                key={p.id}
                className="p-3.5 rounded-lg border border-orange-200 dark:border-orange-900 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{p.title}</h4>
                  <p className="text-orange-700 dark:text-orange-300 mt-0.5">
                    <strong>Manager Note:</strong> {p.revision_instructions || 'Please review feedback comments.'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSubmissionModalPost(p)}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  Resubmit Deliverable
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Deliverables Section */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">My Deliverables</h2>
            <p className="text-xs text-muted-foreground">
              Posts assigned to you or created by you in your campaign projects
            </p>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-muted-foreground" />}
            title="No Deliverables Yet"
            description={
              myProjects.length > 0
                ? "You have no active deliverables assigned yet. Use the 'Create My Own Post' button above to draft a post in your campaign project."
                : "You have not been assigned to any campaign projects yet. An Administrator must assign you to a project first."
            }
          />
        ) : (
          <div className="divide-y divide-border/60">
            {myTasks.map(p => {
              const isReadyForSubmission = ['assigned', 'student_created', 'in_progress', 'draft', 'revision_required'].includes(p.status);

              return (
                <div
                  key={p.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} size="sm" />
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded font-bold">
                        {p.content_type === 'video' ? (
                          <Video className="h-3 w-3 text-indigo-500" />
                        ) : (
                          <ImageIcon className="h-3 w-3 text-emerald-500" />
                        )}
                        {p.content_type}
                      </span>
                      <DeadlineChip deadline={p.deadline} />
                      <PriorityBadge priority={p.priority} />
                    </div>

                    <h3 className="text-sm font-bold text-foreground">{p.title}</h3>

                    {/* Formatted Content Preview */}
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-xs">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Copy Preview
                        </span>
                        <CopyTextActions
                          htmlContent={p.description_html}
                          plainText={p.caption}
                          size="sm"
                        />
                      </div>
                      <FormattedContent content={p.description_html || p.caption || ''} />
                    </div>

                    {/* Hashtags */}
                    {p.hashtags && p.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.hashtags.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-primary-600 bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    {isReadyForSubmission && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSubmissionModalPost(p)}
                        leftIcon={<UploadCloud className="h-4 w-4" />}
                      >
                        Submit {p.content_type.toUpperCase()}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/posts/${p.id}`)}
                      className="text-xs text-muted-foreground"
                    >
                      View Details
                    </Button>
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

      {/* Student Create Own Post Drawer (Requirement 4) */}
      <Drawer
        isOpen={createPostDrawerOpen}
        onClose={() => setCreatePostDrawerOpen(false)}
        title="Create Student Deliverable Post"
        description="Initiate your own post within an assigned project. Upload deliverables into your dedicated folders."
        width="md"
      >
        <form onSubmit={handleStudentCreatePost} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Campaign Project *
            </label>
            <Select
              value={newProjectId}
              onChange={e => setNewProjectId(e.target.value)}
              className="mt-1 text-xs"
              required
            >
              <option value="">Select project...</option>
              {myProjects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Topic / Post Title *
            </label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. 5 Principles of High-Frequency Risk Modeling"
              className="mt-1"
              required
            />
          </div>

          {/* Content Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase block">
              Deliverable Media Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  newContentType === 'video'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-border/80 hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="studentContentType"
                  value="video"
                  checked={newContentType === 'video'}
                  onChange={() => setNewContentType('video')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <Video className="h-4 w-4 text-indigo-500" />
                <span>Video Deliverable</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  newContentType === 'image'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-border/80 hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="studentContentType"
                  value="image"
                  checked={newContentType === 'image'}
                  onChange={() => setNewContentType('image')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <span>Image Deliverable</span>
              </label>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Copy / Caption *
              </label>
              <span className="text-[11px] text-muted-foreground">Preserves ChatGPT formatting</span>
            </div>
            <RichTextEditor
              content={newDescriptionHtml}
              onChange={html => setNewDescriptionHtml(html)}
              placeholder="Paste or write your post copy..."
              minHeight="120px"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Hashtags
            </label>
            <Input
              value={newHashtags}
              onChange={e => setNewHashtags(e.target.value)}
              placeholder="#FinTech #Innovation #Leadership"
              className="mt-1 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Target Deadline
            </label>
            <Input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreatePostDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Draft Post
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
