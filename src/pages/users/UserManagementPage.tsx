import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  KeyRound,
  Check,
  X,
  Search,
  Users,
  Shield,
  Edit2,
  Trash2,
  Lock,
  Phone,
  FileText,
  UserCheck,
  UserX,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { UserProfile, UserRole, UserStatus } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { StatCard } from '@/components/ui/stat-card';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  role: z.enum(['admin', 'manager', 'student', 'client']),
  status: z.enum(['active', 'inactive', 'suspended']),
  title: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  assigned_drive_folder_id: z.string().optional(),
  assigned_drive_folder_url: z.string().optional(),
  must_change_password: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [users, setUsers] = useState<UserProfile[]>(() => mockDb.getUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user?: UserProfile;
    action?: 'deactivate' | 'activate' | 'reset_password' | 'delete';
  }>({ open: false });

  const refreshList = () => {
    setUsers(mockDb.getUsers());
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'student',
      status: 'active',
      title: '',
      phone: '',
      bio: '',
      must_change_password: true,
    },
  });

  const openCreateDrawer = () => {
    setEditingUser(null);
    reset({
      full_name: '',
      email: '',
      role: 'student',
      status: 'active',
      title: '',
      phone: '',
      bio: '',
      must_change_password: true,
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = (u: UserProfile) => {
    setEditingUser(u);
    setValue('full_name', u.full_name);
    setValue('email', u.email);
    setValue('role', u.role);
    setValue('status', u.status);
    setValue('title', u.title || '');
    setValue('phone', u.phone || '');
    setValue('bio', u.bio || '');
    setValue('assigned_drive_folder_id', u.assigned_drive_folder_id || '');
    setValue('assigned_drive_folder_url', u.assigned_drive_folder_url || '');
    setValue('must_change_password', !!u.must_change_password);
    setDrawerOpen(true);
  };

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      mockDb.updateUser(editingUser.id, data);
      showToast({
        type: 'success',
        title: 'User Profile Updated',
        message: `${data.full_name}'s permissions, Drive folder, and profile updated.`,
      });
    } else {
      mockDb.createUser({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        status: data.status,
        title: data.title,
        phone: data.phone,
        bio: data.bio,
        assigned_drive_folder_id: data.assigned_drive_folder_id,
        assigned_drive_folder_url: data.assigned_drive_folder_url,
        must_change_password: data.must_change_password,
      });
      showToast({
        type: 'success',
        title: 'User Account Created',
        message: `${data.full_name} added. A forced password change on first login has been flagged.`,
      });
    }
    setDrawerOpen(false);
    refreshList();
  };

  const handleActionConfirm = () => {
    const target = confirmDialog.user;
    if (!target) return;

    if (confirmDialog.action === 'deactivate') {
      mockDb.updateUser(target.id, { status: 'inactive' });
      showToast({
        type: 'warning',
        title: 'Account Deactivated',
        message: `${target.full_name}'s access has been disabled.`,
      });
    } else if (confirmDialog.action === 'activate') {
      mockDb.updateUser(target.id, { status: 'active' });
      showToast({
        type: 'success',
        title: 'Account Activated',
        message: `${target.full_name}'s access has been restored.`,
      });
    } else if (confirmDialog.action === 'reset_password') {
      mockDb.updateUser(target.id, { must_change_password: true });
      showToast({
        type: 'info',
        title: 'Password Reset Enforced',
        message: `${target.full_name} will be required to choose a new password upon signing in.`,
      });
    } else if (confirmDialog.action === 'delete') {
      mockDb.deleteUser(target.id);
      showToast({
        type: 'info',
        title: 'User Removed',
        message: `${target.full_name} has been removed from the platform.`,
      });
    }

    setConfirmDialog({ open: false });
    refreshList();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.title || '').toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const columns: ColumnDef<UserProfile>[] = [
    {
      id: 'member',
      header: 'Workspace Member',
      cell: row => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} src={row.avatar_url} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{row.full_name}</span>
              {row.id === currentUser?.id && (
                <span className="text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold px-1.5 rounded">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground block">{row.email}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'role',
      header: 'System Role',
      cell: row => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
            row.role === 'admin'
              ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
              : row.role === 'manager'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
              : row.role === 'student'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {row.role}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Account Status',
      cell: row => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : row.status === 'suspended'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300'
              : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400'
          }`}
        >
          {row.status === 'active' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'title',
      header: 'Title / Specialty',
      cell: row => <span className="text-xs text-muted-foreground">{row.title || '—'}</span>,
    },
    {
      id: 'security',
      header: 'Security Flags',
      cell: row =>
        row.must_change_password ? (
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-fit">
            <Lock className="h-3 w-3" /> Reset on login
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-500" /> Compliant
          </span>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: row => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEditDrawer(row)}
            title="Edit User"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setConfirmDialog({
                open: true,
                user: row,
                action: 'reset_password',
              })
            }
            title="Force Password Reset"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>

          {row.status === 'active' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  user: row,
                  action: 'deactivate',
                })
              }
              title="Deactivate Account"
              className="text-amber-600 hover:text-amber-700"
            >
              <UserX className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  user: row,
                  action: 'activate',
                })
              }
              title="Activate Account"
              className="text-emerald-600 hover:text-emerald-700"
            >
              <UserCheck className="h-3.5 w-3.5" />
            </Button>
          )}

          {row.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  user: row,
                  action: 'delete',
                })
              }
              className="text-red-500 hover:text-red-600"
              title="Remove User"
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
            User Directory & Access Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage creator permissions, administrator roles, and forced credential rotations.
          </p>
        </div>
        <Button
          onClick={openCreateDrawer}
          variant="primary"
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Provision User
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.length}
          subtitle="Provisioned accounts"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Active Creators"
          value={users.filter(u => u.role === 'student' && u.status === 'active').length}
          subtitle="Student content specialists"
          icon={<UserCheck className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Campaign Managers"
          value={users.filter(u => u.role === 'manager').length}
          subtitle="Editorial sign-offs"
          icon={<Shield className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="System Admins"
          value={users.filter(u => u.role === 'admin').length}
          subtitle="Root authority"
          icon={<Lock className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-soft">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, specialty..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="student">Student</option>
            <option value="client">Client</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <DataTable data={filteredUsers} columns={columns} searchKey="full_name" pageSize={8} />

      {/* Create / Edit User Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingUser ? `Edit ${editingUser.full_name}` : 'Provision New Workspace User'}
        description="Configure role, permissions, contact information, and credential parameters."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Full Name *
            </label>
            <Input
              {...register('full_name')}
              placeholder="e.g. Jordan Smith"
              error={errors.full_name?.message}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Email Address *
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="jordan@amplifi.io"
              error={errors.email?.message}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                System Role *
              </label>
              <Select {...register('role')} className="mt-1 text-xs">
                <option value="student">Student (Content Creator)</option>
                <option value="manager">Campaign Manager</option>
                <option value="admin">Administrator</option>
                <option value="client">Client Observer</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Status *
              </label>
              <Select {...register('status')} className="mt-1 text-xs">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Job Title / Focus Area
            </label>
            <Input
              {...register('title')}
              placeholder="e.g. Motion & Graphics Specialist"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Phone Number
            </label>
            <Input
              {...register('phone')}
              placeholder="+1 (555) 019-2834"
              className="mt-1 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Bio / Expertise Notes
            </label>
            <Textarea
              {...register('bio')}
              placeholder="Background in vertical video editing and brand storytelling..."
              className="mt-1 text-xs"
            />
          </div>

          {/* Assigned Google Drive Folder (Requirement 3: Per-Creator Drive Folder) */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Assigned Google Drive Folder
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">
                Admin Shared
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Admin shares this folder with the creator with least-privilege editor access. The app verifies that submitted media resides in this folder.
            </p>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Drive Folder ID
              </label>
              <Input
                {...register('assigned_drive_folder_id')}
                placeholder="e.g. 1AbC_dRiVe_Folder_ID"
                className="mt-0.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Drive Folder URL
              </label>
              <Input
                {...register('assigned_drive_folder_url')}
                placeholder="https://drive.google.com/drive/folders/..."
                className="mt-0.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                {...register('must_change_password')}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span>Require password update on next sign-in</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingUser ? 'Save Updates' : 'Provision User'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirmation Dialogs for Deactivate, Reset, Delete */}
      <ConfirmationDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={handleActionConfirm}
        title={
          confirmDialog.action === 'deactivate'
            ? 'Deactivate User Account'
            : confirmDialog.action === 'activate'
            ? 'Re-activate Account'
            : confirmDialog.action === 'reset_password'
            ? 'Require Credential Reset'
            : 'Delete User Permanently'
        }
        description={
          confirmDialog.action === 'deactivate'
            ? `Are you sure you want to disable ${confirmDialog.user?.full_name}'s access? They will no longer be able to log in or access deliverables.`
            : confirmDialog.action === 'reset_password'
            ? `Require ${confirmDialog.user?.full_name} to reset their password with strength verification upon their next login?`
            : confirmDialog.action === 'delete'
            ? `Are you sure you want to permanently remove ${confirmDialog.user?.full_name}? This action cannot be undone.`
            : `Restore workspace access for ${confirmDialog.user?.full_name}?`
        }
        confirmLabel={
          confirmDialog.action === 'deactivate'
            ? 'Deactivate'
            : confirmDialog.action === 'delete'
            ? 'Delete User'
            : 'Confirm'
        }
        isDestructive={confirmDialog.action === 'deactivate' || confirmDialog.action === 'delete'}
        requireTypedText={confirmDialog.action === 'delete' ? 'DELETE' : undefined}
      />
    </div>
  );
};
