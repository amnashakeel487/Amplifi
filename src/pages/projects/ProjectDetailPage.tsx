import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  HardDrive,
  Users,
  Plus,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Video,
  Image as ImageIcon,
  Columns3,
  ListFilter,
  Send,
  MessageSquare,
  HelpCircle,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { ProjectMember, Post, ProjectStudentFolder, FolderMediaType, FolderVerificationStatus } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { CircularProgress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Drawer } from '@/components/ui/drawer';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { FormattedContent } from '@/components/ui/formatted-content';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { googleDriveService } from '@/lib/google-drive';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useNotifications();

  const projectId = id || '';
  const [project, setProject] = useState(() => mockDb.getProject(projectId));
  const [posts, setPosts] = useState<Post[]>(() =>
    mockDb.getPosts().filter(p => p.project_id === projectId)
  );
  const [members, setMembers] = useState<ProjectMember[]>(() =>
    mockDb.getProjectMembers(projectId)
  );
  const [studentFolders, setStudentFolders] = useState<ProjectStudentFolder[]>(() =>
    mockDb.getStudentFolders(projectId)
  );

  const allUsers = mockDb.getUsers();
  const activeStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  // View mode for posts: list vs side-by-side comparison
  const [postsViewMode, setPostsViewMode] = useState<'list' | 'compare'>('list');

  // Quick Create Post Drawer (Manager or Admin)
  const [createPostDrawerOpen, setCreatePostDrawerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContentType, setPostContentType] = useState<'video' | 'image'>('video');
  const [postNotes, setPostNotes] = useState('');
  const [postDeadline, setPostDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [postStudentId, setPostStudentId] = useState('');

  // Add Member Drawer (Admin only)
  const [addMemberDrawerOpen, setAddMemberDrawerOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

  // Recommendation Modal (Requirement 5: Manager recommends post to Admin with note)
  const [recommendModal, setRecommendModal] = useState<{ open: boolean; post?: Post }>({ open: false });
  const [recommendationNote, setRecommendationNote] = useState('');

  // Revision Request Modal
  const [revisionModal, setRevisionModal] = useState<{ open: boolean; post?: Post }>({ open: false });
  const [revisionComments, setRevisionComments] = useState('');

  // Verification in-progress map
  const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

  const reloadData = () => {
    setProject(mockDb.getProject(projectId));
    setPosts(mockDb.getPosts().filter(p => p.project_id === projectId));
    setMembers(mockDb.getProjectMembers(projectId));
    setStudentFolders(mockDb.getStudentFolders(projectId));
  };

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested campaign project does not exist.</p>
        <Button onClick={() => navigate('/projects')} variant="primary">
          Back to Projects
        </Button>
      </div>
    );
  }

  const assignedStudents = members.filter(m => m.role_in_project === 'student' && m.user);
  const completedPosts = posts.filter(p => ['approved', 'published'].includes(p.status)).length;
  const progressPercent = posts.length > 0 ? (completedPosts / posts.length) * 100 : 0;

  // Submitted posts available for comparison
  const submittedPosts = posts.filter(p =>
    ['submitted', 'under_review', 'manager_approved', 'recommended_to_admin'].includes(p.status)
  );

  // Requirement 2: Handle saving & verifying folder IDs for a student
  const handleSaveAndVerifyFolder = async (
    studentId: string,
    mediaType: FolderMediaType,
    folderIdInput: string
  ) => {
    if (!isAdmin) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Admins can configure student Drive folders.' });
      return;
    }

    const cleanFolderId = googleDriveService.extractFolderId(folderIdInput);

    try {
      // 1. Save folder (distinct check enforced)
      const folderRecord = mockDb.setStudentFolder(
        projectId,
        studentId,
        mediaType,
        cleanFolderId
      );

      reloadData();

      // 2. Trigger Verification via Drive API
      const key = `${studentId}-${mediaType}`;
      setVerifyingMap(prev => ({ ...prev, [key]: true }));

      const studentUser = mockDb.getUser(studentId);
      const studentEmail = studentUser?.google_email || studentUser?.email;

      const verificationResult = await googleDriveService.verifyStudentFolderAccess(
        cleanFolderId,
        studentEmail
      );

      mockDb.updateFolderVerification(folderRecord.id, {
        status: verificationResult.status,
        verified: verificationResult.verified,
        error: verificationResult.error,
      });

      reloadData();
      setVerifyingMap(prev => ({ ...prev, [key]: false }));

      if (verificationResult.verified) {
        showToast({
          type: 'success',
          title: `${mediaType.toUpperCase()} Folder Verified`,
          message: `Verified access for ${studentUser?.full_name}.`,
        });
      } else {
        showToast({
          type: 'warning',
          title: `Verification: ${verificationResult.status.replace(/_/g, ' ')}`,
          message: verificationResult.error || 'Folder verification returned a warning.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Folder Configuration Error',
        message: err.message || 'Failed to save or verify folder.',
      });
    }
  };

  // Create Topic-wise Post (Requirement 3: Manager creates topic-wise posts)
  const handleCreateTopicPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      showToast({ type: 'error', title: 'Title required', message: 'Please provide a topic or title.' });
      return;
    }

    const newPost = mockDb.createPost({
      project_id: projectId,
      title: postTitle,
      caption: postNotes,
      content_type: postContentType,
      origin: 'manager_assigned',
      status: postStudentId ? 'assigned' : 'draft',
      priority: 'medium',
      deadline: postDeadline,
      assigned_student_id: postStudentId || undefined,
      assigned_manager_id: project.assigned_manager_id || user?.id,
      platforms: ['linkedin', 'instagram'],
      hashtags: ['#CampaignDeliverable'],
      created_by: user?.id,
    });

    showToast({
      type: 'success',
      title: 'Deliverable Assigned',
      message: `"${postTitle}" created as ${postContentType.toUpperCase()} deliverable.`,
    });

    setCreatePostDrawerOpen(false);
    setPostTitle('');
    setPostNotes('');
    reloadData();
  };

  // Manager Recommends to Admin (Requirement 5)
  const handleConfirmRecommend = () => {
    if (!recommendModal.post) return;
    if (!recommendationNote.trim()) {
      showToast({ type: 'error', title: 'Note Required', message: 'Please write a short note explaining why you recommend this post.' });
      return;
    }

    mockDb.recommendToAdmin(recommendModal.post.id, recommendationNote.trim());
    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'MANAGER_RECOMMENDED_POST_TO_ADMIN',
      entity_type: 'post',
      entity_id: recommendModal.post.id,
      details: { note: recommendationNote.trim() },
    });

    showToast({
      type: 'success',
      title: 'Recommended to Admin',
      message: `"${recommendModal.post.title}" has been escalated for Admin executive approval.`,
    });

    setRecommendModal({ open: false });
    setRecommendationNote('');
    reloadData();
  };

  // Manager Requests Revision
  const handleConfirmRevision = () => {
    if (!revisionModal.post) return;
    if (!revisionComments.trim()) {
      showToast({ type: 'error', title: 'Comments Required', message: 'Please specify the revision instructions.' });
      return;
    }

    mockDb.updatePost(revisionModal.post.id, {
      status: 'revision_required',
      revision_instructions: revisionComments.trim(),
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'REVISION_REQUESTED',
      entity_type: 'post',
      entity_id: revisionModal.post.id,
      details: { comments: revisionComments.trim() },
    });

    showToast({
      type: 'info',
      title: 'Revision Requested',
      message: `Post returned to student with your feedback.`,
    });

    setRevisionModal({ open: false });
    setRevisionComments('');
    reloadData();
  };

  // Add Student to Project
  const handleAddStudentToProject = () => {
    if (!selectedStudentToAdd) return;
    mockDb.addProjectMember(projectId, selectedStudentToAdd, 'student');
    showToast({
      type: 'success',
      title: 'Student Assigned',
      message: 'Student assigned to campaign. Set their Video and Image folders below.',
    });
    setAddMemberDrawerOpen(false);
    setSelectedStudentToAdd('');
    reloadData();
  };

  const renderFolderStatusBadge = (status: FolderVerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
        );
      case 'no_access':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
            <XCircle className="h-3 w-3" /> No Access
          </span>
        );
      case 'not_a_folder':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Not a Folder
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
            <AlertTriangle className="h-3 w-3" /> Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
            <HelpCircle className="h-3 w-3" /> Not Set
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/projects')}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Campaign Project
              </span>
              <PriorityBadge priority={project.priority} />
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-muted text-foreground">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isManager) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPostStudentId(assignedStudents[0]?.user?.id || '');
                setCreatePostDrawerOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Assign Topic Deliverable
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Meta Strip */}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-soft flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-muted-foreground">Manager:</span>
            <strong className="text-foreground">
              {project.assigned_manager?.full_name || 'Not assigned'}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Students:</span>
            <strong className="text-foreground">{assignedStudents.length} assigned</strong>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deadline:</span>
            <DeadlineChip deadline={project.deadline} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-semibold text-foreground block">{Math.round(progressPercent)}% Complete</span>
            <span className="text-[11px] text-muted-foreground">{completedPosts} of {posts.length} posts finished</span>
          </div>
          <CircularProgress value={progressPercent} size={36} strokeWidth={4} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview & Brief</TabsTrigger>
          <TabsTrigger value="posts">
            Posts ({posts.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team-folders" className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-primary-500" />
              <span>Team & Folders ({assignedStudents.length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: OVERVIEW & MANAGER BRIEF (Requirement 3) */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Manager Brief Box */}
            <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Manager Creative Brief / Instructions
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">From Admin</span>
              </div>

              {/* Requirement 3: If empty, show "No specific instructions from Admin" */}
              <div className="p-4 bg-muted/20 rounded-xl border border-border/50 text-sm leading-relaxed text-foreground">
                {project.description && project.description.trim() !== '' ? (
                  <p className="whitespace-pre-wrap">{project.description}</p>
                ) : (
                  <p className="italic text-muted-foreground">
                    No specific instructions from Admin.
                  </p>
                )}
              </div>
            </div>

            {/* Content Summary Card */}
            <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Deliverables Pipeline</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Assigned / In Progress:</span>
                  <span className="font-semibold">{posts.filter(p => ['assigned', 'student_created', 'in_progress', 'draft'].includes(p.status)).length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Submitted (Proofreading):</span>
                  <span className="font-semibold text-amber-600">{posts.filter(p => ['submitted', 'under_review'].includes(p.status)).length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Revision Required:</span>
                  <span className="font-semibold text-orange-600">{posts.filter(p => p.status === 'revision_required').length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Recommended to Admin:</span>
                  <span className="font-semibold text-purple-600">{posts.filter(p => p.status === 'recommended_to_admin').length}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Live Published:</span>
                  <span className="font-semibold text-emerald-600">{posts.filter(p => p.status === 'published').length}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: POSTS & COMPARISON (Requirement 5: Side-by-side comparison) */}
        <TabsContent value="posts" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Project Deliverables</h2>
              <p className="text-xs text-muted-foreground">
                All topic-wise and student-created deliverables in this campaign
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle List vs Comparison View */}
              <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/40">
                <Button
                  variant={postsViewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsViewMode('list')}
                  leftIcon={<ListFilter className="h-3.5 w-3.5" />}
                  className="text-xs h-7 px-2.5"
                >
                  List
                </Button>
                <Button
                  variant={postsViewMode === 'compare' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsViewMode('compare')}
                  leftIcon={<Columns3 className="h-3.5 w-3.5" />}
                  className="text-xs h-7 px-2.5"
                >
                  Comparison Grid ({submittedPosts.length})
                </Button>
              </div>

              {(isAdmin || isManager) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setPostStudentId(assignedStudents[0]?.user?.id || '');
                    setCreatePostDrawerOpen(true);
                  }}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  New Topic Post
                </Button>
              )}
            </div>
          </div>

          {/* VIEW A: Side-by-Side Comparison Grid (Requirement 5) */}
          {postsViewMode === 'compare' ? (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span>
                  <strong>Manager Comparison View</strong>: Review submitted deliverables side-by-side, request revisions, and use <strong>"Recommend to Admin"</strong> on the chosen post with a note.
                </span>
                <span className="font-mono text-[11px] font-bold">
                  {submittedPosts.length} submitted
                </span>
              </div>

              {submittedPosts.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-xl border border-border/80">
                  No submitted posts to compare yet. Once students submit their deliverables, they will appear here side-by-side.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {submittedPosts.map(p => {
                    const student = p.assigned_student;
                    const latestAsset = p.assets?.[p.assets.length - 1];

                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border p-5 shadow-soft flex flex-col justify-between space-y-4 bg-card transition-all ${
                          p.status === 'recommended_to_admin'
                            ? 'border-purple-500 ring-1 ring-purple-500/50 bg-purple-50/10'
                            : 'border-border/80 hover:border-primary-500/40'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Student Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar name={student?.full_name || 'Student'} size="sm" />
                              <div>
                                <span className="text-xs font-semibold text-foreground block">
                                  {student?.full_name || 'Creator'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {p.origin === 'student_created' ? 'Independent Post' : 'Assigned Topic'}
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-muted text-foreground">
                              {p.content_type === 'video' ? <Video className="h-3 w-3 text-indigo-500" /> : <ImageIcon className="h-3 w-3 text-emerald-500" />}
                              {p.content_type}
                            </span>
                          </div>

                          {/* Title & Status */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={p.status} size="sm" />
                              <DeadlineChip deadline={p.deadline} showIcon={false} />
                            </div>
                            <h4 className="text-sm font-bold text-foreground line-clamp-2">
                              {p.title}
                            </h4>
                          </div>

                          {/* Media Preview Link */}
                          {latestAsset ? (
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/60 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground truncate max-w-[170px]">
                                  {latestAsset.file_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  v{latestAsset.version_number}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(latestAsset.drive_file_url, '_blank')}
                                rightIcon={<ExternalLink className="h-3 w-3" />}
                                className="w-full text-xs h-7"
                              >
                                View Deliverable in Drive
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                              No media deliverable uploaded yet.
                            </div>
                          )}

                          {/* Formatted Text Preview */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Text Copy
                              </span>
                              <CopyTextActions
                                htmlContent={p.description_html}
                                plainText={p.caption}
                                size="sm"
                              />
                            </div>
                            <div className="max-h-36 overflow-y-auto p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs">
                              <FormattedContent content={p.description_html || p.caption || ''} />
                            </div>
                          </div>

                          {/* Hashtags */}
                          {p.hashtags && p.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {p.hashtags.map((h, i) => (
                                <span key={i} className="text-[10px] font-mono text-primary-600 bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 rounded">
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Existing recommendation note if already recommended */}
                          {p.manager_recommendation_note && (
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200">
                              <span className="font-semibold block mb-0.5">Manager Recommendation Note:</span>
                              <p className="italic">"{p.manager_recommendation_note}"</p>
                            </div>
                          )}
                        </div>

                        {/* Actions for Manager (Requirement 5) */}
                        <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
                          {p.status !== 'recommended_to_admin' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRevisionModal({ open: true, post: p })}
                                leftIcon={<RotateCcw className="h-3 w-3 text-orange-500" />}
                                className="w-1/2 text-xs"
                              >
                                Revise
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setRecommendationNote('');
                                  setRecommendModal({ open: true, post: p });
                                }}
                                leftIcon={<Sparkles className="h-3 w-3" />}
                                className="w-1/2 text-xs bg-purple-600 hover:bg-purple-700"
                              >
                                Recommend
                              </Button>
                            </div>
                          ) : (
                            <span className="text-center text-xs font-semibold text-purple-700 dark:text-purple-300 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                              ✓ Recommended to Admin
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/posts/${p.id}`)}
                            className="w-full text-xs text-muted-foreground"
                          >
                            Open Detailed Post Page
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: Standard List View */
            <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 shadow-soft overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No deliverables created for this project yet.
                </div>
              ) : (
                posts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/posts/${p.id}`)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} size="sm" />
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded font-bold">
                          {p.content_type === 'video' ? <Video className="h-3 w-3 text-indigo-500" /> : <ImageIcon className="h-3 w-3 text-emerald-500" />}
                          {p.content_type}
                        </span>
                        <DeadlineChip deadline={p.deadline} />
                        <PriorityBadge priority={p.priority} />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Assigned: {p.assigned_student?.full_name || 'Unassigned'} • {p.origin === 'student_created' ? 'Student Created' : 'Manager Assigned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {p.status === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setRecommendationNote('');
                            setRecommendModal({ open: true, post: p });
                          }}
                          className="text-xs h-7 text-purple-600 hover:text-purple-700"
                        >
                          Recommend
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/posts/${p.id}`);
                        }}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: TEAM & FOLDERS (Requirement 2: Admin Only) */}
        {isAdmin && (
          <TabsContent value="team-folders" className="space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary-600" />
                  <span>Student Drive Folder Configuration</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set separate VIDEO and IMAGE Drive folders for each student. Video and image folders must be different.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddMemberDrawerOpen(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Assign Student to Campaign
              </Button>
            </div>

            {assignedStudents.length === 0 ? (
              <div className="p-8 text-center bg-card rounded-xl border border-border/80 text-xs text-muted-foreground space-y-3">
                <p>No students assigned to this project yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddMemberDrawerOpen(true)}
                >
                  Assign First Student
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedStudents.map(member => {
                  const student = member.user!;
                  const videoFolder = studentFolders.find(
                    f => f.student_id === student.id && f.media_type === 'video'
                  );
                  const imageFolder = studentFolders.find(
                    f => f.student_id === student.id && f.media_type === 'image'
                  );

                  return (
                    <StudentFolderConfigCard
                      key={student.id}
                      student={student}
                      videoFolder={videoFolder}
                      imageFolder={imageFolder}
                      isVerifyingVideo={!!verifyingMap[`${student.id}-video`]}
                      isVerifyingImage={!!verifyingMap[`${student.id}-image`]}
                      onSaveAndVerify={handleSaveAndVerifyFolder}
                      renderStatusBadge={renderFolderStatusBadge}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Recommend to Admin Modal (Requirement 5) */}
      <Modal
        isOpen={recommendModal.open}
        onClose={() => setRecommendModal({ open: false })}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Recommend Post to Administrator</span>
          </div>
        }
        description={`Endorse "${recommendModal.post?.title}" for final executive approval & release.`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Recommendation Rationale Note *
            </label>
            <Textarea
              value={recommendationNote}
              onChange={e => setRecommendationNote(e.target.value)}
              placeholder="Why is this post the best deliverable? Highlight copywriting strength, visual quality, and compliance check..."
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-300">
            Status will advance to <strong className="text-foreground">Recommended to Admin</strong>. The Administrator will review this rationale note along with the Drive deliverables before authorizing publication.
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRecommendModal({ open: false })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRecommend}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Confirm Recommendation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revision Modal */}
      <Modal
        isOpen={revisionModal.open}
        onClose={() => setRevisionModal({ open: false })}
        title="Request Deliverable Revision"
        description={`Return "${revisionModal.post?.title}" to student with feedback.`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Revision Instructions / Feedback *
            </label>
            <Textarea
              value={revisionComments}
              onChange={e => setRevisionComments(e.target.value)}
              placeholder="Describe what needs to be changed in the text copy or visual asset..."
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRevisionModal({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmRevision}>
              Send Revision Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Topic-wise Post Drawer (Requirement 3: Manager creates topic-wise posts) */}
      <Drawer
        isOpen={createPostDrawerOpen}
        onClose={() => setCreatePostDrawerOpen(false)}
        title="Assign Topic Deliverable"
        description="Manager creates topic-wise posts with content type (Video or Image) and assigns to a student."
        width="md"
      >
        <form onSubmit={handleCreateTopicPost} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Topic / Post Title *
            </label>
            <Input
              value={postTitle}
              onChange={e => setPostTitle(e.target.value)}
              placeholder="e.g. 5 Principles of High-Frequency Risk Modeling"
              className="mt-1"
              required
            />
          </div>

          {/* Content Type (Requirement 3: Video or Image) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase block">
              Required Content Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  postContentType === 'video'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-border/80 hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="contentType"
                  value="video"
                  checked={postContentType === 'video'}
                  onChange={() => setPostContentType('video')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <Video className="h-4 w-4 text-indigo-500" />
                <span>Video Deliverable</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  postContentType === 'image'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-border/80 hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="contentType"
                  value="image"
                  checked={postContentType === 'image'}
                  onChange={() => setPostContentType('image')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <span>Image Deliverable</span>
              </label>
            </div>
          </div>

          {/* Assigned Student */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Assigned Student *
            </label>
            <Select
              value={postStudentId}
              onChange={e => setPostStudentId(e.target.value)}
              className="mt-1 text-xs"
              required
            >
              <option value="">Select an assigned student...</option>
              {assignedStudents.map(m => (
                <option key={m.user?.id} value={m.user?.id}>
                  {m.user?.full_name} ({m.user?.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Guidance Notes for Student (Optional)
            </label>
            <Textarea
              value={postNotes}
              onChange={e => setPostNotes(e.target.value)}
              placeholder="Key angles, tone of voice, visual hooks to include..."
              className="mt-1 text-xs"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Target Submission Deadline *
            </label>
            <Input
              type="date"
              value={postDeadline}
              onChange={e => setPostDeadline(e.target.value)}
              className="mt-1 text-xs"
              required
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreatePostDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Deliverable
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Add Student to Project Drawer (Admin only) */}
      <Drawer
        isOpen={addMemberDrawerOpen}
        onClose={() => setAddMemberDrawerOpen(false)}
        title="Assign Student to Campaign"
        description="Select a registered student to add to this project team."
        width="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Select Student *
            </label>
            <Select
              value={selectedStudentToAdd}
              onChange={e => setSelectedStudentToAdd(e.target.value)}
              className="mt-1 text-xs"
            >
              <option value="">Select a student...</option>
              {activeStudents
                .filter(s => !assignedStudents.some(m => m.user?.id === s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.email})
                  </option>
                ))}
            </Select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddMemberDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedStudentToAdd}
              onClick={handleAddStudentToProject}
            >
              Add Student
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

// Sub-component: Student Folder Configuration Card (Requirement 2)
interface StudentFolderConfigCardProps {
  student: any;
  videoFolder?: ProjectStudentFolder;
  imageFolder?: ProjectStudentFolder;
  isVerifyingVideo: boolean;
  isVerifyingImage: boolean;
  onSaveAndVerify: (studentId: string, mediaType: FolderMediaType, folderId: string) => void;
  renderStatusBadge: (status: FolderVerificationStatus) => React.ReactNode;
}

const StudentFolderConfigCard: React.FC<StudentFolderConfigCardProps> = ({
  student,
  videoFolder,
  imageFolder,
  isVerifyingVideo,
  isVerifyingImage,
  onSaveAndVerify,
  renderStatusBadge,
}) => {
  const [videoInput, setVideoInput] = useState(videoFolder?.drive_folder_id || '');
  const [imageInput, setImageInput] = useState(imageFolder?.drive_folder_id || '');

  const isDuplicate =
    videoInput.trim() !== '' &&
    imageInput.trim() !== '' &&
    videoInput.trim().toLowerCase() === imageInput.trim().toLowerCase();

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
      {/* Student Profile Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={student.full_name} size="md" />
          <div>
            <h4 className="text-sm font-bold text-foreground">{student.full_name}</h4>
            <span className="text-xs text-muted-foreground font-mono">{student.email}</span>
            {student.google_email && student.google_email !== student.email && (
              <span className="text-[11px] text-blue-600 block">
                Google Account: {student.google_email}
              </span>
            )}
          </div>
        </div>
      </div>

      {isDuplicate && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Folder Conflict:</strong> The Video folder and Image folder for {student.full_name} must be different.
          </span>
        </div>
      )}

      {/* Two Folders Grid: VIDEO and IMAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. VIDEO FOLDER */}
        <div className="p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 uppercase">
              <Video className="h-4 w-4 text-indigo-600" />
              <span>Video Deliverables Folder</span>
            </span>
            {renderStatusBadge(videoFolder?.verification_status || 'not_set')}
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Google Drive Folder ID or URL *
            </label>
            <Input
              value={videoInput}
              onChange={e => setVideoInput(e.target.value)}
              placeholder="e.g. 1aB2cD3eF4gH_VideoFolder..."
              className="text-xs font-mono h-8 bg-background"
            />
          </div>

          {videoFolder?.verified_error && (
            <p className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
              {videoFolder.verified_error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {videoFolder?.drive_folder_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(videoFolder.drive_folder_url, '_blank')}
                className="text-xs h-7 px-2"
                rightIcon={<ExternalLink className="h-3 w-3" />}
              >
                Drive
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!videoInput.trim() || isVerifyingVideo || isDuplicate}
              isLoading={isVerifyingVideo}
              onClick={() => onSaveAndVerify(student.id, 'video', videoInput)}
              className="text-xs h-7"
            >
              Verify Video Folder
            </Button>
          </div>
        </div>

        {/* 2. IMAGE FOLDER */}
        <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 uppercase">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              <span>Image Deliverables Folder</span>
            </span>
            {renderStatusBadge(imageFolder?.verification_status || 'not_set')}
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Google Drive Folder ID or URL *
            </label>
            <Input
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              placeholder="e.g. 1xY2zA3bC4dE_ImageFolder..."
              className="text-xs font-mono h-8 bg-background"
            />
          </div>

          {imageFolder?.verified_error && (
            <p className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
              {imageFolder.verified_error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {imageFolder?.drive_folder_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(imageFolder.drive_folder_url, '_blank')}
                className="text-xs h-7 px-2"
                rightIcon={<ExternalLink className="h-3 w-3" />}
              >
                Drive
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!imageInput.trim() || isVerifyingImage || isDuplicate}
              isLoading={isVerifyingImage}
              onClick={() => onSaveAndVerify(student.id, 'image', imageInput)}
              className="text-xs h-7"
            >
              Verify Image Folder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
