import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban,
  CheckSquare,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  FileEdit,
  Sparkles,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { Post, PostWorkflowStatus } from '@/lib/types';
import { WORKFLOW_STATUS_CONFIG, canTransition } from '@/lib/workflow-engine';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'queue'>('board');

  const allPosts = mockDb.getPosts();
  const projects = mockDb.getProjects();

  const filteredPosts = useMemo(() => {
    if (selectedProjectId === 'all') return allPosts;
    return allPosts.filter(p => p.project_id === selectedProjectId);
  }, [allPosts, selectedProjectId]);

  // Review Queue: Posts that need manager attention
  const reviewQueue = useMemo(
    () => filteredPosts.filter(p => ['submitted', 'under_review'].includes(p.status)),
    [filteredPosts]
  );

  const revisionPosts = useMemo(
    () => filteredPosts.filter(p => p.status === 'revision_required'),
    [filteredPosts]
  );

  const readyToPublish = useMemo(
    () => filteredPosts.filter(p => ['approved', 'ready_to_publish'].includes(p.status)),
    [filteredPosts]
  );

  const overdueAlerts = useMemo(() => {
    const now = new Date();
    return filteredPosts.filter(
      p =>
        p.deadline &&
        new Date(p.deadline) < now &&
        !['published', 'cancelled'].includes(p.status)
    );
  }, [filteredPosts]);

  // Kanban Columns
  const kanbanColumns: { id: PostWorkflowStatus; title: string }[] = [
    { id: 'draft', title: 'Drafts' },
    { id: 'assigned', title: 'Assigned' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'submitted', title: 'Submitted' },
    { id: 'under_review', title: 'Under Review' },
    { id: 'revision_required', title: 'Revisions' },
    { id: 'manager_approved', title: 'Manager Approved' },
    { id: 'ready_to_publish', title: 'Ready to Publish' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PostWorkflowStatus) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain');
    const post = mockDb.getPost(postId);
    if (!post) return;

    if (canTransition(post.status, targetStatus, 'manager')) {
      mockDb.updatePost(postId, { status: targetStatus });
      mockDb.logAudit({
        user_id: user?.id,
        user_email: user?.email,
        user_role: user?.role,
        action: 'KANBAN_STATUS_CHANGE',
        entity_type: 'post',
        entity_id: postId,
        details: { from: post.status, to: targetStatus },
      });
      // Force refresh
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Manager Control Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proofreading queues, Kanban workflow transitions, and creator workload management.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-56 h-9"
          >
            <option value="all">All Client Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => navigate('/posts')}
            variant="primary"
            size="sm"
          >
            New Post
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Review Queue"
          value={reviewQueue.length}
          subtitle="Waiting for manager review"
          icon={<CheckSquare className="h-5 w-5 text-amber-500" />}
          className={reviewQueue.length > 0 ? 'border-amber-300 dark:border-amber-900/60' : ''}
        />
        <StatCard
          title="In Revision"
          value={revisionPosts.length}
          subtitle="Students revising assets"
          icon={<FileEdit className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title="Ready to Publish"
          value={readyToPublish.length}
          subtitle="Approved content ready"
          icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueAlerts.length}
          subtitle="Critical deadline breaches"
          icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
          className={overdueAlerts.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : ''}
        />
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                {overdueAlerts.length} Posts Require Immediate Intervention
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Creators have exceeded target delivery milestones. Check student assignment queues.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setViewMode('queue')}
          >
            Inspect Queue
          </Button>
        </div>
      )}

      {/* Main Board vs Queue View Tabs */}
      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <TabsList>
            <TabsTrigger value="board">Kanban Board</TabsTrigger>
            <TabsTrigger value="queue">
              Proofreading Queue ({reviewQueue.length})
            </TabsTrigger>
          </TabsList>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {viewMode === 'board' ? 'Drag cards between allowed workflow states' : 'Review submitted assets'}
          </span>
        </div>

        {/* Tab 1: Interactive Kanban Board */}
        <TabsContent value="board" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
            {kanbanColumns.map(col => {
              const colPosts = filteredPosts.filter(p => p.status === col.id);
              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.id)}
                  className="w-72 shrink-0 rounded-xl bg-muted/40 border border-border/80 flex flex-col max-h-[70vh] shadow-soft-sm"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-border/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {col.title}
                    </span>
                    <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {colPosts.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                    {colPosts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                        No posts
                      </div>
                    ) : (
                      colPosts.map(post => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('text/plain', post.id);
                          }}
                          onClick={() => navigate(`/posts/${post.id}`)}
                          className="rounded-lg border border-border/80 bg-card p-3 shadow-soft cursor-grab active:cursor-grabbing hover:border-primary-500/50 hover:shadow-soft-md transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-semibold text-foreground line-clamp-2">
                              {post.title}
                            </span>
                            <PriorityBadge priority={post.priority} showIcon={false} />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                            <span className="truncate max-w-[120px] font-medium">
                              {post.project?.name || 'Project'}
                            </span>
                            <DeadlineChip deadline={post.deadline} showIcon={false} />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <Avatar
                                name={post.assigned_student?.full_name || 'Creator'}
                                src={post.assigned_student?.avatar_url}
                                size="sm"
                              />
                              <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                                {post.assigned_student?.full_name || 'Unassigned'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/posts/${post.id}`);
                              }}
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Proofreading Queue List */}
        <TabsContent value="queue" className="mt-4">
          <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 shadow-soft overflow-hidden">
            {reviewQueue.length === 0 ? (
              <div className="p-12 text-center">
                <CheckSquare className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-foreground">Review Queue is Clear!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  All submitted creator posts have been proofread and processed.
                </p>
              </div>
            ) : (
              reviewQueue.map(post => (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} size="sm" />
                      <PriorityBadge priority={post.priority} />
                      <DeadlineChip deadline={post.deadline} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {post.caption || 'No caption draft submitted yet.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>Project: <strong className="text-foreground">{post.project?.name}</strong></span>
                      <span>Assigned to: <strong className="text-foreground">{post.assigned_student?.full_name}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      Inspect Brief
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/review/${post.id}`)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Start Proofreading
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
