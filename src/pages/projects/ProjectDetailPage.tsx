import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  HardDrive,
  Users,
  FolderKanban,
  FileText,
  Plus,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  Save,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { ProjectMember, Post } from '@/lib/types';
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
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { formatRelativeTime } from '@/lib/utils';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useNotifications();

  const projectId = id || 'proj-01';
  const project = mockDb.getProject(projectId);
  const posts = mockDb.getPosts().filter(p => p.project_id === projectId);
  const [members, setMembers] = useState<ProjectMember[]>(() =>
    mockDb.getProjectMembers(projectId)
  );
  const allUsers = mockDb.getUsers();

  const [strategyNotes, setStrategyNotes] = useState(
    project?.description || 'Campaign deliverables, tone of voice, and regulatory guidelines.'
  );

  // Add Member Drawer
  const [addMemberDrawerOpen, setAddMemberDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(allUsers[0]?.id || '');
  const [selectedRoleInProject, setSelectedRoleInProject] = useState<
    ProjectMember['role_in_project']
  >('student');

  // Quick Create Post Drawer
  const [createPostDrawerOpen, setCreatePostDrawerOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostDeadline, setNewPostDeadline] = useState('2026-11-20');
  const [newPostStudentId, setNewPostStudentId] = useState(
    allUsers.find(u => u.role === 'student')?.id || ''
  );

  // Remove member confirmation
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    open: boolean;
    member?: ProjectMember;
  }>({ open: false });

  if (!project) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const completedPosts = posts.filter(p => ['approved', 'published'].includes(p.status)).length;
  const progressPercent = posts.length > 0 ? (completedPosts / posts.length) * 100 : 0;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Administrators can assign team members to projects.' });
      return;
    }
    if (!selectedUserId) return;
    const newMember = mockDb.addProjectMember(projectId, selectedUserId, selectedRoleInProject);
    setMembers(mockDb.getProjectMembers(projectId));
    showToast({
      type: 'success',
      title: 'Team Member Assigned',
      message: `${newMember.user?.full_name} added to project with role: ${selectedRoleInProject}.`,
    });
    setAddMemberDrawerOpen(false);
  };

  const handleRemoveMember = () => {
    if (!isAdmin) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Administrators can remove team members from projects.' });
      return;
    }
    if (!removeMemberDialog.member) return;
    mockDb.removeProjectMember(removeMemberDialog.member.id);
    setMembers(mockDb.getProjectMembers(projectId));
    showToast({
      type: 'info',
      title: 'Member Removed',
      message: `${removeMemberDialog.member.user?.full_name} unassigned from project.`,
    });
    setRemoveMemberDialog({ open: false });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle) return;

    const created = mockDb.createPost({
      project_id: projectId,
      title: newPostTitle,
      caption: newPostCaption,
      hashtags: ['Marketing', 'BrandLaunch'],
      platforms: ['instagram', 'linkedin'],
      status: 'assigned',
      priority: 'medium',
      deadline: newPostDeadline,
      assigned_student_id: newPostStudentId,
      assigned_manager_id: user?.id,
    });

    showToast({
      type: 'success',
      title: 'Post Deliverable Created',
      message: `"${created.title}" has been assigned for production.`,
    });

    setCreatePostDrawerOpen(false);
    setNewPostTitle('');
    setNewPostCaption('');
    // refresh
    window.location.reload();
  };

  const handleSaveNotes = () => {
    mockDb.updateProject(projectId, { description: strategyNotes });
    showToast({
      type: 'success',
      title: 'Notes Saved',
      message: 'Campaign strategy notes updated.',
    });
  };

  const projectAuditLogs = mockDb
    .getAuditLogs()
    .filter(l => l.entity_id === projectId || posts.some(p => p.id === l.entity_id));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Top Breadcrumb Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/projects')}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
      >
        All Projects
      </Button>

      {/* Project Header Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono tracking-wider">
                {project.client?.name} ({project.client?.code})
              </span>
              <PriorityBadge priority={project.priority} />
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {project.description || 'Campaign deliverables, media assets, and approval workflow.'}
            </p>
          </div>

          {/* Progress Ring Card */}
          <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/60 shrink-0">
            <CircularProgress value={progressPercent} size={68} strokeWidth={6} />
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Deliverable Completion
              </span>
              <span className="text-sm font-bold text-foreground">
                {completedPosts} of {posts.length} Completed
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {Math.round(progressPercent)}% workflow progress
              </span>
            </div>
          </div>
        </div>

        {/* Header Metadata Bar */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Target Deadline: <strong className="text-foreground">{project.deadline}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-emerald-500" />
            <span>Drive Folder: <strong className="text-foreground font-mono">{project.google_drive_folder_id}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary-600" />
            <span>Assigned Team: <strong className="text-foreground">{members.length} members</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Tabs: Overview, Posts, Team, Drive, Activity, Notes */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts & Deliverables ({posts.length})</TabsTrigger>
          <TabsTrigger value="team">Team & Members ({members.length})</TabsTrigger>
          <TabsTrigger value="drive">Drive Folder</TabsTrigger>
          <TabsTrigger value="activity">Activity ({projectAuditLogs.length})</TabsTrigger>
          <TabsTrigger value="notes">Strategy Notes</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Deliverables summary */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Content Velocity</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Drafts / In Production:</span>
                  <span className="font-semibold">{posts.filter(p => ['draft', 'assigned', 'in_progress'].includes(p.status)).length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Review / Revision:</span>
                  <span className="font-semibold text-amber-600">{posts.filter(p => ['submitted', 'under_review', 'revision_required'].includes(p.status)).length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Approved / Published:</span>
                  <span className="font-semibold text-emerald-600">{completedPosts}</span>
                </div>
              </div>
            </div>

            {/* Client info */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Client Stakeholder</h3>
              <div className="text-xs space-y-1.5">
                <span className="font-semibold text-foreground block">{project.client?.name}</span>
                <p className="text-muted-foreground">{project.client?.primary_contact_name}</p>
                <p className="text-muted-foreground">{project.client?.primary_contact_email}</p>
                <p className="text-muted-foreground font-mono text-[11px] pt-1">{project.client?.timezone}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-primary-500/30 bg-primary-50/20 dark:bg-primary-950/20 p-5 shadow-soft space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Campaign Actions</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add deliverables or assign creators to production briefs.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCreatePostDrawerOpen(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="w-full"
                >
                  Create Deliverable
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMemberDrawerOpen(true)}
                    leftIcon={<UserPlus className="h-4 w-4" />}
                    className="w-full"
                  >
                    Assign Member
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: POSTS */}
        <TabsContent value="posts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Project Deliverables</h2>
              <p className="text-xs text-muted-foreground">All content assets linked to this campaign</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreatePostDrawerOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Deliverable
            </Button>
          </div>

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
                      <DeadlineChip deadline={p.deadline} />
                      <PriorityBadge priority={p.priority} />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                    <div className="flex gap-1.5 pt-0.5">
                      {p.platforms.map(plat => (
                        <span key={plat} className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {plat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={p.assigned_student?.full_name || 'Creator'} size="sm" />
                      <span>{p.assigned_student?.full_name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 3: TEAM MEMBERS */}
        <TabsContent value="team" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Project Team Roster</h2>
              <p className="text-xs text-muted-foreground">Assigned campaign managers, student creators, and reviewers</p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddMemberDrawerOpen(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Add Member
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <div
                key={member.id}
                className="rounded-xl border border-border/80 bg-card p-4 shadow-soft flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.user?.full_name || 'Member'} src={member.user?.avatar_url} />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{member.user?.full_name}</h4>
                    <span className="text-xs text-muted-foreground block">{member.user?.email}</span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200">
                      {member.role_in_project.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setRemoveMemberDialog({ open: true, member })}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Remove from project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: GOOGLE DRIVE */}
        <TabsContent value="drive" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Google Drive Asset Mapping</h3>
                  <p className="text-xs text-muted-foreground">Dedicated cloud folder for project raw assets</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Permissions Validated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block mb-1">Folder ID</span>
                <span className="font-mono font-semibold text-foreground">{project.google_drive_folder_id}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block mb-1">Root Association</span>
                <span className="font-semibold text-foreground">Amplifi Master Marketing Directory</span>
              </div>
            </div>

            {project.google_drive_folder_url && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => window.open(project.google_drive_folder_url, '_blank')}
                  rightIcon={<ExternalLink className="h-4 w-4" />}
                >
                  Open in Google Drive
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 5: ACTIVITY */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-600" />
              Project Audit Log & Milestone Stream
            </h3>

            <div className="divide-y divide-border/40 text-xs">
              {projectAuditLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No audit log entries recorded yet.
                </div>
              ) : (
                projectAuditLogs.map(l => (
                  <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-semibold font-mono text-primary-600 block">{l.action}</span>
                      <span className="text-muted-foreground">by {l.user_email || 'System'}</span>
                    </div>
                    <span className="text-muted-foreground">{formatRelativeTime(l.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: STRATEGY NOTES */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Strategy, Tone & Guidelines</h3>
                <p className="text-xs text-muted-foreground">Live notes accessible to assigned managers and creators</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNotes}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Notes
              </Button>
            </div>

            <Textarea
              value={strategyNotes}
              onChange={e => setStrategyNotes(e.target.value)}
              className="min-h-[200px] text-sm leading-relaxed"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Team Member Drawer */}
      <Drawer
        isOpen={addMemberDrawerOpen}
        onClose={() => setAddMemberDrawerOpen(false)}
        title="Assign Member to Project"
        description="Select a user and define their responsibilities for this campaign."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Select Workspace Member *
            </label>
            <Select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="mt-1"
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role}) - {u.email}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Role in Project *
            </label>
            <Select
              value={selectedRoleInProject}
              onChange={e =>
                setSelectedRoleInProject(e.target.value as ProjectMember['role_in_project'])
              }
              className="mt-1"
            >
              <option value="student">Content Creator / Student</option>
              <option value="manager">Campaign Manager</option>
              <option value="reviewer">Compliance Reviewer</option>
              <option value="client_observer">Client Observer</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setAddMemberDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign to Project
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Quick Create Post Drawer */}
      <Drawer
        isOpen={createPostDrawerOpen}
        onClose={() => setCreatePostDrawerOpen(false)}
        title="New Deliverable Brief"
        description={`Add a post deliverable to ${project.name}`}
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Deliverable Title *
            </label>
            <Input
              value={newPostTitle}
              onChange={e => setNewPostTitle(e.target.value)}
              placeholder="e.g. Clean Energy Microgrid Explainer"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Caption Draft / Brief Outline
            </label>
            <Textarea
              value={newPostCaption}
              onChange={e => setNewPostCaption(e.target.value)}
              placeholder="Core messaging and hooks..."
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Assign Student Creator
            </label>
            <Select
              value={newPostStudentId}
              onChange={e => setNewPostStudentId(e.target.value)}
              className="mt-1 text-xs"
            >
              {allUsers
                .filter(u => u.role === 'student')
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.email})
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Target Deadline *
            </label>
            <Input
              type="date"
              value={newPostDeadline}
              onChange={e => setNewPostDeadline(e.target.value)}
              required
              className="mt-1 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreatePostDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Deliverable
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={removeMemberDialog.open}
        onClose={() => setRemoveMemberDialog({ open: false })}
        onConfirm={handleRemoveMember}
        title="Remove Project Member"
        description={`Are you sure you want to remove ${removeMemberDialog.member?.user?.full_name} from this project?`}
        confirmLabel="Remove Member"
        isDestructive={true}
      />
    </div>
  );
};
