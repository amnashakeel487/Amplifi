import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search, Filter, Calendar } from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { Post, SocialPlatform, PostWorkflowStatus } from '@/lib/types';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CreatePostDrawer } from '@/components/posts/CreatePostDrawer';
import { useAuth } from '@/context/AuthContext';

export const PostsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [posts, setPosts] = useState<Post[]>(() => mockDb.getPostsForUser(user || undefined));
  const projects = mockDb.getProjectsForUser(user || undefined);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const refreshList = () => {
    setPosts(mockDb.getPostsForUser(user || undefined));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.caption || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.project?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchProj = projectFilter === 'all' || p.project_id === projectFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchPlatform =
        platformFilter === 'all' || p.platforms.includes(platformFilter as SocialPlatform);
      return matchSearch && matchProj && matchStatus && matchPlatform;
    });
  }, [posts, search, projectFilter, statusFilter, platformFilter]);

  const columns: ColumnDef<Post>[] = [
    {
      id: 'title',
      header: 'Post Title & Campaign',
      cell: row => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground block max-w-xs truncate">{row.title}</span>
          <span className="text-[11px] text-muted-foreground">{row.project?.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Workflow Stage',
      cell: row => <StatusBadge status={row.status} size="sm" />,
      sortable: true,
    },
    {
      id: 'platforms',
      header: 'Channels',
      cell: row => (
        <div className="flex gap-1">
          {row.platforms.map(plat => (
            <span
              key={plat}
              className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-mono font-semibold text-muted-foreground"
            >
              {plat.slice(0, 2)}
            </span>
          ))}
        </div>
      ),
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
      id: 'creator',
      header: 'Creator',
      cell: row => (
        <div className="flex items-center gap-2">
          <Avatar
            name={row.assigned_student?.full_name || 'Creator'}
            src={row.assigned_student?.avatar_url}
            size="sm"
          />
          <span className="text-xs truncate max-w-[100px]">
            {row.assigned_student?.full_name || 'Unassigned'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: row => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/posts/${row.id}`)}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
        >
          Inspect
        </Button>
      ),
      sortable: false,
      hideable: false,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content Deliverables Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, filter, and track status across all cross-platform deliverables.
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button
            onClick={() => setCreateDrawerOpen(true)}
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Post
          </Button>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-soft">
        <div className="w-full sm:w-64">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            leftIcon={<Search className="h-4 w-4" />}
            className="h-9 text-xs"
          />
        </div>
        <Select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="w-44 h-9 text-xs"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-40 h-9 text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="assigned">Assigned</option>
          <option value="student_created">Student Created</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="revision_required">Revision Required</option>
          <option value="manager_approved">Manager Approved</option>
          <option value="recommended_to_admin">Recommended to Admin</option>
          <option value="approved">Approved</option>
          <option value="ready_to_publish">Ready to Publish</option>
          <option value="published">Published</option>
        </Select>
        <Select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="w-36 h-9 text-xs"
        >
          <option value="all">All Channels</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">Twitter / X</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </Select>
      </div>

      <DataTable
        data={filteredPosts}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Filter..."
        pageSize={8}
        onRowClick={row => navigate(`/posts/${row.id}`)}
      />

      {/* Post Creation Wizard Drawer */}
      <CreatePostDrawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onPostCreated={refreshList}
      />
    </div>
  );
};
