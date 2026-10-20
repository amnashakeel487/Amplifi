import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Mail,
  Globe,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  FolderKanban,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { Client } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Drawer } from '@/components/ui/drawer';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';

const clientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code max 10 characters').toUpperCase(),
  industry: z.string().min(2, 'Industry is required'),
  timezone: z.string().min(2, 'Timezone is required'),
  primary_contact_name: z.string().min(2, 'Contact name required'),
  primary_contact_email: z.string().email('Valid email required'),
  status: z.enum(['active', 'inactive', 'onboarding']),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientsPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { showToast } = useNotifications();

  const [clients, setClients] = useState<Client[]>(() => mockDb.getClients());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    client?: Client;
  }>({ open: false });

  const projects = mockDb.getProjects();
  const posts = mockDb.getPosts();

  const refreshList = () => {
    setClients(mockDb.getClients());
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      code: '',
      industry: 'FinTech & Banking',
      timezone: 'America/New_York',
      primary_contact_name: '',
      primary_contact_email: '',
      status: 'active',
      notes: '',
    },
  });

  const openCreateDrawer = () => {
    setEditingClient(null);
    reset({
      name: '',
      code: '',
      industry: '',
      timezone: 'UTC',
      primary_contact_name: '',
      primary_contact_email: '',
      status: 'active',
      notes: '',
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = (client: Client) => {
    setEditingClient(client);
    setValue('name', client.name);
    setValue('code', client.code);
    setValue('industry', client.industry || '');
    setValue('timezone', client.timezone || 'UTC');
    setValue('primary_contact_name', client.primary_contact_name || '');
    setValue('primary_contact_email', client.primary_contact_email || '');
    setValue('status', client.status);
    setValue('notes', client.notes || '');
    setDrawerOpen(true);
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      mockDb.updateClient(editingClient.id, data);
      showToast({
        type: 'success',
        title: 'Client Updated',
        message: `${data.name} details have been saved.`,
      });
    } else {
      mockDb.createClient({
        name: data.name,
        code: data.code,
        industry: data.industry,
        timezone: data.timezone,
        primary_contact_name: data.primary_contact_name,
        primary_contact_email: data.primary_contact_email,
        status: data.status,
        notes: data.notes,
      });
      showToast({
        type: 'success',
        title: 'Client Created',
        message: `${data.name} has been added to workspace accounts.`,
      });
    }
    setDrawerOpen(false);
    refreshList();
  };

  const handleDeleteClient = () => {
    if (!deleteConfirmDialog.client) return;
    mockDb.deleteClient(deleteConfirmDialog.client.id);
    showToast({
      type: 'info',
      title: 'Client Archived',
      message: `${deleteConfirmDialog.client.name} and associated project records removed.`,
    });
    setDeleteConfirmDialog({ open: false });
    refreshList();
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const columns: ColumnDef<Client>[] = [
    {
      id: 'name',
      header: 'Client Name',
      cell: row => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center font-bold font-mono text-xs text-primary-600">
            {row.code}
          </div>
          <div>
            <span className="font-semibold text-foreground block">{row.name}</span>
            <span className="text-xs text-muted-foreground">{row.industry}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'contact',
      header: 'Primary Contact',
      cell: row => (
        <div className="text-xs">
          <span className="font-medium text-foreground block">{row.primary_contact_name || '—'}</span>
          <span className="text-muted-foreground">{row.primary_contact_email}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: row => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : row.status === 'onboarding'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'timezone',
      header: 'Timezone',
      cell: row => (
        <span className="text-xs text-muted-foreground font-mono">{row.timezone}</span>
      ),
    },
    {
      id: 'projects',
      header: 'Active Projects',
      cell: row => {
        const count = projects.filter(p => p.client_id === row.id).length;
        return <span className="font-semibold text-xs text-foreground">{count} campaigns</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: row => (
        <div className="flex items-center justify-end gap-1">
          {(isAdmin || isManager) && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEditDrawer(row)}
              title="Edit Client"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteConfirmDialog({ open: true, client: row })}
              title="Archive Client"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
            Client Accounts & Portfolios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage enterprise brand workspaces, compliance guidelines, and primary stakeholder contacts.
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button
            onClick={openCreateDrawer}
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Client Brand
          </Button>
        )}
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Client Accounts"
          value={clients.filter(c => c.status === 'active').length}
          subtitle="Enterprise tier accounts"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          subtitle="Live campaigns in production"
          icon={<FolderKanban className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Total Deliverables"
          value={posts.length}
          subtitle="Managed content units"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Controls Bar: Search, Status Filter, Grid/Table Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-soft">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, industry..."
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
            <option value="onboarding">Onboarding</option>
            <option value="inactive">Inactive</option>
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
            title="Card Grid View"
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

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map(client => {
            const clientProjects = projects.filter(p => p.client_id === client.id);
            const clientPosts = posts.filter(p => p.project?.client_id === client.id);

            return (
              <div
                key={client.id}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-soft hover:shadow-soft-md transition-all space-y-4 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center font-mono font-bold text-sm text-primary-600">
                      {client.code}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">{client.industry}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      client.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : client.status === 'onboarding'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                {client.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    {client.notes}
                  </p>
                )}

                {/* Primary Contact */}
                <div className="space-y-1 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span className="font-medium text-foreground">{client.primary_contact_name || 'Primary Contact'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span>{client.primary_contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span className="font-mono">{client.timezone}</span>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span><strong>{clientProjects.length}</strong> Projects</span>
                    <span>•</span>
                    <span><strong>{clientPosts.length}</strong> Posts</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(isAdmin || isManager) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDrawer(client)}
                        title="Edit Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteConfirmDialog({ open: true, client })}
                        className="text-red-500 hover:text-red-600"
                        title="Archive Client"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable data={filteredClients} columns={columns} searchKey="name" pageSize={8} />
      )}

      {/* Create / Edit Client Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingClient ? `Edit ${editingClient.name}` : 'Create Client Workspace'}
        description="Brand identity, code identifier, primary contact, and timezone specs."
        width="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Client Brand Name *
            </label>
            <Input {...register('name')} placeholder="e.g. Acme FinTech Global" error={errors.name?.message} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Brand Code *
              </label>
              <Input {...register('code')} placeholder="e.g. ACME" error={errors.code?.message} className="mt-1 font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Status *
              </label>
              <Select {...register('status')} className="mt-1 text-xs">
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Industry Domain *
            </label>
            <Input {...register('industry')} placeholder="e.g. Renewable CleanTech" error={errors.industry?.message} className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Primary Timezone *
            </label>
            <Select {...register('timezone')} className="mt-1 text-xs font-mono">
              <option value="America/New_York">America/New_York (EST / EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
              <option value="America/Chicago">America/Chicago (CST / CDT)</option>
              <option value="Europe/London">Europe/London (GMT / BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET / CEST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="UTC">Universal Coordinated Time (UTC)</option>
            </Select>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border border-border/60 space-y-3">
            <span className="text-xs font-semibold text-foreground block">Client Stakeholder Contact</span>
            <div>
              <label className="text-xs text-muted-foreground">Contact Name *</label>
              <Input {...register('primary_contact_name')} placeholder="e.g. Elena Rostova" error={errors.primary_contact_name?.message} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Contact Email *</label>
              <Input {...register('primary_contact_email')} type="email" placeholder="elena@acmefintech.io" error={errors.primary_contact_email?.message} className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Compliance & Brand Guidelines Notes
            </label>
            <Textarea {...register('notes')} placeholder="e.g. Requires 48-hour compliance review window." className="mt-1 text-xs" />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingClient ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false })}
        onConfirm={handleDeleteClient}
        title="Archive Client Workspace"
        description={`Are you sure you want to archive ${deleteConfirmDialog.client?.name}? All associated campaigns and posts will be removed from active production.`}
        confirmLabel="Archive Client"
        isDestructive={true}
        requireTypedText={deleteConfirmDialog.client?.code}
      />
    </div>
  );
};
