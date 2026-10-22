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
  Share2,
  Copy,
  ExternalLink,
  CheckCircle2,
  FileText,
  Send,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Post, PostWorkflowStatus } from '@/lib/types';
import { WORKFLOW_STATUS_CONFIG, canTransition } from '@/lib/workflow-engine';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyTextActions } from '@/components/ui/copy-text-actions';
import { FormattedContent } from '@/components/ui/formatted-content';
import { PublishingChecklistModal } from '@/components/publishing/PublishingChecklistModal';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'review' | 'publish'>('board');
  const [activePublishPost, setActivePublishPost] = useState<Post | null>(null);

  // Requirement 7: Multi-Project Scoping (Managers see only their assigned projects and posts)
  const projects = useMemo(() => mockDb.getProjectsForUser(user || undefined), [user]);
  const allPosts = useMemo(() => mockDb.getPostsForUser(user || undefined), [user]);

  // Project filtering
  const filteredPosts = useMemo(() => {
    if (selectedProjectId === 'all') return allPosts;
    return allPosts.filter(p => p.project_id === selectedProjectId);
  }, [allPosts, selectedProjectId]);

  // Review Queue: deliverables needing manager proofreading
  const reviewQueue = useMemo(
    () => filteredPosts.filter(p => ['submitted', 'under_review'].includes(p.status)),
    [filteredPosts]
  );

  // Requirement 6: Dedicated "To Publish" Queue for Assigned Manager
  const toPublishQueue = useMemo(
    () => filteredPosts.filter(p => p.status === 'ready_to_publish' && (p.assigned_publisher_id === user?.id || !p.assigned_publisher_id)),
    [filteredPosts, user]
  );

  const publishedPosts = useMemo(
    () => filteredPosts.filter(p => p.status === 'published'),
    [filteredPosts]
  );

  const revisionPosts = useMemo(
    () => filteredPosts.filter(p => p.status === 'revision_required'),
    [filteredPosts]
  );

  // Kanban Columns following the Suggested Real Workflow Flow
  const kanbanColumns: { id: PostWorkflowStatus; title: string }[] = [
    { id: 'assigned', title: 'Assigned' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'submitted', title: 'Submitted' },
    { id: 'under_review', title: 'Under Review' },
    { id: 'recommended_to_admin', title: 'Recommended to Admin' },
    { id: 'ready_to_publish', title: 'Ready to Publish' },
    { id: 'published', title: 'Live Published' },
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
      window.location.reload();
    } else {
      showToast({
        type: 'warning',
        title: 'Action Not Permitted',
        message: `Workflow transition from "${post.status}" to "${targetStatus}" requires executive authorization or revision notes.`,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Campaign Editorial Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review creator copy, approve text before media unlock, and dispatch assigned publications.
          </p>
        </div>

        {/* Project Selector (Scoped to Manager's Projects) */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-56 text-xs"
          >
            <option value="all">All My Assigned Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.client?.code ? `[${p.client.code}] ` : ''}{p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Review Queue"
          value={reviewQueue.length}
          subtitle="Text & media deliverables"
          icon={<FileEdit className="h-5 w-5 text-amber-500" />}
          className={reviewQueue.length > 0 ? 'border-amber-300 dark:border-amber-900/60' : ''}
        />
        <StatCard
          title="To Publish Queue"
          value={toPublishQueue.length}
          subtitle="Assigned to you to publish"
          icon={<Share2 className="h-5 w-5 text-teal-600" />}
          className={toPublishQueue.length > 0 ? 'border-teal-300 dark:border-teal-900/60 ring-1 ring-teal-200' : ''}
        />
        <StatCard
          title="In Revision"
          value={revisionPosts.length}
          subtitle="Awaiting student updates"
          icon={<Clock className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Published Live"
          value={publishedPosts.length}
          subtitle="Live on social channels"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Main View Tabs */}
      <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="board" className="text-xs">
              <Kanban className="h-3.5 w-3.5 mr-1.5" />
              Workflow Board
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs relative">
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              Proofreading Queue
              {reviewQueue.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {reviewQueue.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="publish" className="text-xs relative">
              <Share2 className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              To Publish Queue
              {toPublishQueue.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-teal-600 text-white rounded-full text-[10px] font-bold">
                  {toPublishQueue.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: KANBAN BOARD */}
        <TabsContent value="board" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {kanbanColumns.map(col => {
              const colPosts = filteredPosts.filter(p => {
                if (col.id === 'draft') return ['draft', 'assigned', 'in_progress'].includes(p.status);
                if (col.id === 'text_submitted') return ['text_submitted', 'submitted'].includes(p.status);
                if (col.id === 'media_submitted') return ['media_submitted', 'under_review'].includes(p.status);
                return p.status === col.id;
              });

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.id)}
                  className="w-72 shrink-0 bg-muted/40 rounded-xl border border-border/60 flex flex-col max-h-[640px] snap-start"
                >
                  <div className="p-3 border-b border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                      {col.title}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-background border border-border">
                      {colPosts.length}
                    </span>
                  </div>

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
                          onClick={() => navigate(post.status === 'text_submitted' || post.status === 'media_submitted' ? `/review/${post.id}` : `/posts/${post.id}`)}
                          className="rounded-lg border border-border/80 bg-card p-3 shadow-soft cursor-grab active:cursor-grabbing hover:border-primary-500/50 hover:shadow-soft-md transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-semibold text-foreground line-clamp-2">
                              {post.title}
                            </span>
                            <PriorityBadge priority={post.priority} showIcon={false} />
                          </div>

                          <div className="text-[11px] text-muted-foreground truncate">
                            {post.project?.name}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                            <span className="truncate max-w-[120px]">
                              {post.assigned_student?.full_name || 'Creator'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/review/${post.id}`);
                              }}
                            >
                              <ArrowRight className="h-3 w-3" />
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

        {/* TAB 2: PROOFREADING QUEUE */}
        <TabsContent value="review" className="mt-4">
          <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 shadow-soft overflow-hidden">
            {reviewQueue.length === 0 ? (
              <div className="p-12 text-center">
                <CheckSquare className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-foreground">Review Queue is Clear!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  All submitted creator text and media deliverables have been reviewed.
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
                    <p className="text-xs text-muted-foreground">
                      Client Project: <span className="font-semibold text-foreground">{post.project?.name}</span> • Creator: <span className="font-semibold text-foreground">{post.assigned_student?.full_name || 'Creator'}</span>
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/review/${post.id}`)}
                    leftIcon={<FileEdit className="h-4 w-4" />}
                  >
                    Open Review Studio
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 3: TO PUBLISH QUEUE (Requirement 6) */}
        <TabsContent value="publish" className="mt-4">
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/30 p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Share2 className="h-5 w-5 text-teal-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-950 dark:text-teal-200">
                    Assigned Publishing Station
                  </h4>
                  <p className="text-teal-800 dark:text-teal-300">
                    Approved posts designated to you by the Administrator. Copy formatted text, download assets, post to target platforms, and enter the live URL.
                  </p>
                </div>
              </div>
            </div>

            {toPublishQueue.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card p-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-foreground">No Posts Pending Publication</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  When the Administrator approves posts and assigns you as publisher, they appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {toPublishQueue.map(post => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border/80 bg-card p-5 shadow-soft space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={post.status} />
                          <span className="text-[11px] font-mono bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded font-bold uppercase">
                            Assigned to You to Publish
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mt-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Client: <strong>{post.project?.client?.name}</strong> • Target Channels: <strong>{post.platforms.join(', ')}</strong>
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => setActivePublishPost(post)}
                        leftIcon={<Share2 className="h-4 w-4" />}
                      >
                        Publishing Checklist & Confirm
                      </Button>
                    </div>

                    {/* Copy Shortcuts & Formatted Text */}
                    <div className="rounded-lg bg-muted/20 border border-border/60 p-3.5 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary-600" />
                          Ready-to-Post Copy
                        </span>
                        <CopyTextActions
                          htmlContent={post.description_html}
                          plainText={post.caption}
                          size="xs"
                        />
                      </div>
                      <FormattedContent
                        html={post.description_html}
                        fallbackText={post.caption}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Publishing Modal */}
      {activePublishPost && (
        <PublishingChecklistModal
          isOpen={!!activePublishPost}
          onClose={() => setActivePublishPost(null)}
          post={activePublishPost}
          onPublished={() => {
            setActivePublishPost(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
