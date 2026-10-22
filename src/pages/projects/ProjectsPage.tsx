import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FolderKanban,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Calendar,
  Users,
  Eye,
  CheckCircle2,
  Trash2,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { Project, PriorityLevel } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Drawer } from '@/components/ui/drawer';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { CircularProgress } from '@/components/ui/progress';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';

// Requirement 1: Form keeps title, description, status, priority, deadline, assigned Manager, assigned Students.
// REMOVED single Google Drive Asset Binding.
const projectSchema = z.object({
  name: z.string().min(2, 'Project title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  deadline: z.string().min(1, 'Target deadline required'),
  assigned_manager_id: z.string().min(1, 'Please select an assigned Manager'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  // Scoped project retrieval (Requirement 7: Managers see only their projects, students see only their assigned projects)
  const [projects, setProjects] = useState<Project[]>(() => mockDb.getProjectsForUser(user || undefined));
  const posts = mockDb.getPostsForUser(user || undefined);
  const allUsers = mockDb.getUsers();

  const activeManagers = useMemo(() => allUsers.filter(u => u.role === 'manager'), [allUsers]);
  const activeStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    project?: Project;
  }>({ open: false });

  const refreshList = () => {
    setProjects(mockDb.getProjectsForUser(user || undefined));
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      assigned_manager_id: activeManagers[0]?.id || '',
    },
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const onSubmit = (data: ProjectFormData) => {
    if (!isAdmin) {
      showToast({ type: 'error', title: 'Unauthorized', message: 'Only Administrators can create campaign projects.' });
      return;
    }

    const newProj = mockDb.createProject({
      name: data.name,
      description: data.description || '',
      status: data.status,
      priority: data.priority as PriorityLevel,
      deadline: data.deadline,
      assigned_manager_id: data.assigned_manager_id,
      created_by: user?.id,
    });

    // Add manager as project member
    mockDb.addProjectMember(newProj.id, data.assigned_manager_id, 'manager');

    // Add assigned students as project members
    selectedStudentIds.forEach(studentId => {
      mockDb.addProjectMember(newProj.id, studentId, 'student');
    });

    mockDb.logAudit({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action: 'ADMIN_PROJECT_CREATED',
      entity_type: 'project',
      entity_id: newProj.id,
      details: {
        title: data.name,
        manager_id: data.assigned_manager_id,
        students_count: selectedStudentIds.length,
      },
    });

    showToast({
      type: 'success',
      title: 'Project Initiated',
      message: `"${data.name}" created with assigned Manager and ${selectedStudentIds.length} student(s). Configure Drive folders next.`,
    });

    setDrawerOpen(false);
    reset();
    setSelectedStudentIds([]);
    refreshList();
    navigate(`/projects/${newProj.id}`);
  };

  const handleDeleteProject = () => {
    if (!deleteConfirmDialog.project) return;
    mockDb.deleteProject(deleteConfirmDialog.project.id);
    showToast({
      type: 'info',
      title: 'Project Archived',
      message: `"${deleteConfirmDialog.project.name}" has been removed.`,
    });
    setDeleteConfirmDialog({ open: false });
    refreshList();
  };

  // Filtered
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  // Table Columns
  const columns: ColumnDef<Project>[] = [
    {
      id: 'name',
      header: 'Campaign Project',
      cell: row => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground hover:text-primary-600 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${row.id}`)}>
            {row.name}
          </span>
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
            {row.description || 'No specific instructions from Admin.'}
          </p>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'manager',
      header: 'Assigned Manager',
      cell: row => (
        <span className="text-xs font-medium text-foreground">
          {row.assigned_manager?.full_name || 'Unassigned'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: row => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize bg-muted text-foreground">
          {row.status.replace(/_/g, ' ')}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'priority',
      header: 'Priority',
      cell: row => <PriorityBadge priority={row.priority} />,
      sortable: true,
    },
    {
      id: 'deadline',
      header: 'Deadline',
      cell: row => <DeadlineChip deadline={row.deadline} />,
      sortable: true,
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: row => {
        const projPosts = posts.filter(p => p.project_id === row.id);
        const completed = projPosts.filter(p => ['approved', 'published'].includes(p.status)).length;
        const pct = projPosts.length > 0 ? Math.round((completed / projPosts.length) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <CircularProgress value={pct} size={30} strokeWidth={4} />
            <span className="text-xs text-muted-foreground font-medium">{completed}/{projPosts.length} posts</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: row => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${row.id}`)}
            leftIcon={<Eye className="h-3.5 w-3.5" />}
          >
            Open
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={e => {
                e.stopPropagation();
                setDeleteConfirmDialog({ open: true, project: row });
              }}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Campaign Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production projects scoped with assigned Managers, Creators, and dedicated Drive storage folders.
          </p>
        </div>
        {/* Only Admin creates projects (Requirement 1) */}
        {isAdmin && (
          <Button
            onClick={() => {
              reset({
                name: '',
                description: '',
                status: 'active',
                priority: 'medium',
                deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                assigned_manager_id: activeManagers[0]?.id || '',
              });
              setSelectedStudentIds([]);
              setDrawerOpen(true);
            }}
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Initiate Project
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          subtitle="Currently running"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          title="Deliverables"
          value={posts.length}
          subtitle="Across assigned scopes"
          icon={<Calendar className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Completed Content"
          value={posts.filter(p => ['approved', 'published'].includes(p.status)).length}
          subtitle="Signed off & live"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-soft">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects or briefs..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto border border-border/60 rounded-lg p-0.5 bg-muted/40">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid or Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10 text-muted-foreground" />}
          title="No Campaign Projects Found"
          description={
            isAdmin
              ? 'No projects exist yet. Initiate your first campaign project to assign a Manager and configure student Drive folders.'
              : 'You have not been assigned to any active campaign projects yet.'
          }
          action={
            isAdmin ? (
              <Button
                variant="primary"
                onClick={() => {
                  reset();
                  setDrawerOpen(true);
                }}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Initiate First Project
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(p => {
            const projPosts = posts.filter(post => post.project_id === p.id);
            const completed = projPosts.filter(post => ['approved', 'published'].includes(post.status)).length;
            const pct = projPosts.length > 0 ? (completed / projPosts.length) * 100 : 0;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-soft hover:shadow-soft-md hover:border-primary-500/40 cursor-pointer transition-all space-y-4 group relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono">
                    {p.status}
                  </span>
                  <PriorityBadge priority={p.priority} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {p.description || 'No specific instructions from Admin.'}
                  </p>
                </div>

                {/* Progress Ring & Deadline */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <CircularProgress value={pct} size={40} strokeWidth={4.5} />
                    <div className="text-xs">
                      <span className="font-semibold text-foreground block">{Math.round(pct)}% Complete</span>
                      <span className="text-muted-foreground">{completed} of {projPosts.length} posts</span>
                    </div>
                  </div>
                  <DeadlineChip deadline={p.deadline} showIcon={false} />
                </div>

                {/* Footer: Manager and Students count */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" title="Assigned Manager">
                    <UserCheck className="h-3.5 w-3.5 text-primary-500" />
                    <span className="truncate max-w-[130px]">{p.assigned_manager?.full_name || 'No Manager'}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Assigned Students">
                    <Users className="h-3.5 w-3.5" />
                    <span>{p.assigned_students?.length || 0} students</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          data={filteredProjects}
          columns={columns}
          searchKey="name"
          pageSize={8}
          onRowClick={row => navigate(`/projects/${row.id}`)}
        />
      )}

      {/* Admin Initiate Project Drawer (Requirement 1) */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Initiate New Campaign Project"
        description="Admin defines the campaign, specifies optional brief for the Manager, and assigns team."
        width="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Project Title *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g. Q4 Global Brand Awareness"
              error={errors.name?.message}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Manager Brief / Instructions
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">Optional</span>
            </div>
            <Textarea
              {...register('description')}
              placeholder="Brief for the Manager (what to do in this project). If left empty, Manager will see 'No specific instructions from Admin'..."
              className="mt-1 text-xs"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Status *
              </label>
              <Select {...register('status')} className="mt-1 text-xs">
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="on_hold">On Hold</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Priority *
              </label>
              <Select {...register('priority')} className="mt-1 text-xs">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Target Deadline *
            </label>
            <Input
              type="date"
              {...register('deadline')}
              error={errors.deadline?.message}
              className="mt-1 text-xs"
            />
          </div>

          {/* Assigned Manager (Requirement 1: 1 assigned Manager) */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-primary-600" />
              <span>Assigned Campaign Manager *</span>
            </label>
            {activeManagers.length === 0 ? (
              <div className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                No active Manager accounts found. Create a Manager in User Management first.
              </div>
            ) : (
              <Select {...register('assigned_manager_id')} className="text-xs">
                <option value="">Select an active Manager...</option>
                {activeManagers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.email})
                  </option>
                ))}
              </Select>
            )}
            {errors.assigned_manager_id && (
              <p className="text-xs text-red-500">{errors.assigned_manager_id.message}</p>
            )}
          </div>

          {/* Assigned Students (Requirement 1: multiple assigned Students) */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary-600" />
                <span>Assigned Students</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {selectedStudentIds.length} selected
              </span>
            </div>

            {activeStudents.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 bg-background rounded-lg border border-border/50">
                No active student accounts yet. You can assign students later in User Management.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
                {activeStudents.map(s => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20'
                          : 'border-border/60 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudentSelection(s.id)}
                          className="rounded border-border text-primary-600 focus:ring-primary-500"
                        />
                        <span className="font-medium text-foreground">{s.full_name}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{s.email}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              After creating the project, you will set separate Video and Image Drive folders for each student on the Team & Folders tab.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Initiate Project
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false })}
        onConfirm={handleDeleteProject}
        title="Archive Campaign Project"
        description={`Are you sure you want to archive "${deleteConfirmDialog.project?.name}"?`}
        confirmLabel="Archive Project"
        isDestructive={true}
      />
    </div>
  );
};
