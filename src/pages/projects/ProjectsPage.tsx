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
  Clock,
  HardDrive,
  Users,
  Eye,
  CheckCircle2,
  Trash2,
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

const projectSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  start_date: z.string().optional(),
  deadline: z.string().min(1, 'Target deadline required'),
  google_drive_folder_id: z.string().min(2, 'Drive folder identifier required'),
  google_drive_folder_url: z.string().url('Valid Drive URL required').optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useNotifications();

  // Scoped project retrieval (Requirement 7: Managers see only their projects)
  const [projects, setProjects] = useState<Project[]>(() => mockDb.getProjectsForUser(user || undefined));
  const clients = mockDb.getClients();
  const posts = mockDb.getPostsForUser(user || undefined);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
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
      client_id: clients[0]?.id || '',
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      deadline: '2026-11-30',
      google_drive_folder_id: 'drive-folder-' + Date.now().toString().slice(-6),
      google_drive_folder_url: 'https://drive.google.com/drive/folders/new-campaign',
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    const newProj = mockDb.createProject({
      client_id: data.client_id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority as PriorityLevel,
      deadline: data.deadline,
      google_drive_folder_id: data.google_drive_folder_id,
      google_drive_folder_url: data.google_drive_folder_url,
      google_drive_folder_status: 'connected',
    });

    showToast({
      type: 'success',
      title: 'Project Initiated',
      message: `${data.name} created and linked to Drive folder.`,
    });

    setDrawerOpen(false);
    reset();
    refreshList();
    navigate(`/projects/${newProj.id}`);
  };

  const handleDeleteProject = () => {
    if (!deleteConfirmDialog.project) return;
    mockDb.deleteProject(deleteConfirmDialog.project.id);
    showToast({
      type: 'info',
      title: 'Project Removed',
      message: `${deleteConfirmDialog.project.name} has been archived.`,
    });
    setDeleteConfirmDialog({ open: false });
    refreshList();
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.client?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchClient = clientFilter === 'all' || p.client_id === clientFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchClient && matchStatus;
    });
  }, [projects, search, clientFilter, statusFilter]);

  const columns: ColumnDef<Project>[] = [
    {
      id: 'name',
      header: 'Project Campaign',
      cell: row => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground block">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.client?.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: row => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : row.status === 'planning'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {row.status}
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
            <CircularProgress value={pct} size={32} strokeWidth={4} />
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
            Client Campaign Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track multi-platform campaign deliverables, deadlines, and Google Drive assets.
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button
            onClick={() => {
              reset();
              setDrawerOpen(true);
            }}
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Project
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          subtitle="Currently in production"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          title="Total Deliverables"
          value={posts.length}
          subtitle="Across all client workspaces"
          icon={<Calendar className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Completed Content"
          value={posts.filter(p => ['approved', 'published'].includes(p.status)).length}
          subtitle="Signed off & live"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Toolbar: Search, Filters, Grid/Table Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-soft">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>
          <Select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="w-44 h-9 text-xs"
          >
            <option value="all">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-soft-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-card text-foreground shadow-soft-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Table View"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
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
                    {p.client?.code || 'BRAND'}
                  </span>
                  <PriorityBadge priority={p.priority} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {p.description || 'Campaign deliverables and media assets.'}
                  </p>
                </div>

                {/* Progress Ring & Deadline */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <CircularProgress value={pct} size={42} strokeWidth={5} />
                    <div className="text-xs">
                      <span className="font-semibold text-foreground block">{Math.round(pct)}% Complete</span>
                      <span className="text-muted-foreground">{completed} of {projPosts.length} posts</span>
                    </div>
                  </div>
                  <DeadlineChip deadline={p.deadline} showIcon={false} />
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>{p.members_count || 3} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-mono text-[10px]">{p.google_drive_folder_id}</span>
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

      {/* Create Project Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Initiate New Campaign Project"
        description="Bind deliverables to a client brand, schedule milestones, and link Drive folder."
        width="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Client Brand *
            </label>
            <Select {...register('client_id')} className="mt-1 text-xs">
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Project Campaign Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g. Q1 Global Product Reveal"
              error={errors.name?.message}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Strategic Description
            </label>
            <Textarea
              {...register('description')}
              placeholder="Key campaign pillars, channels, and visual goals..."
              className="mt-1 text-xs"
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
                Priority Level *
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

          {/* Drive mapping */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/60 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary-600" />
              Google Drive Asset Binding
            </span>
            <div>
              <label className="text-xs text-muted-foreground">Folder Identifier *</label>
              <Input
                {...register('google_drive_folder_id')}
                placeholder="e.g. drive-folder-q1-launch"
                error={errors.google_drive_folder_id?.message}
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Drive Folder URL</label>
              <Input
                {...register('google_drive_folder_url')}
                placeholder="https://drive.google.com/drive/folders/..."
                error={errors.google_drive_folder_url?.message}
                className="mt-1 text-xs"
              />
            </div>
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

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false })}
        onConfirm={handleDeleteProject}
        title="Archive Campaign Project"
        description={`Are you sure you want to archive "${deleteConfirmDialog.project?.name}"? All assigned deliverables will be archived.`}
        confirmLabel="Archive Project"
        isDestructive={true}
      />
    </div>
  );
};
