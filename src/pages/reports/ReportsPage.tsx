import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Layers,
  Filter,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { mockDb } from '@/lib/mock-db';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { useNotifications } from '@/context/NotificationContext';

export const ReportsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const rawPosts = mockDb.getPosts();
  const rawProjects = mockDb.getProjects();
  const rawUsers = mockDb.getUsers().filter(u => u.role === 'student');

  // Filters: Date Range, Project, User
  const [dateRange, setDateRange] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return rawPosts.filter(p => {
      if (selectedProjectId !== 'all' && p.project_id !== selectedProjectId) {
        return false;
      }
      if (selectedStudentId !== 'all' && p.assigned_student_id !== selectedStudentId) {
        return false;
      }
      if (dateRange !== 'all') {
        const postTime = new Date(p.created_at).getTime();
        const now = Date.now();
        const dayMs = 86400000;
        if (dateRange === '30d' && now - postTime > 30 * dayMs) return false;
        if (dateRange === '60d' && now - postTime > 60 * dayMs) return false;
        if (dateRange === '90d' && now - postTime > 90 * dayMs) return false;
      }
      return true;
    });
  }, [rawPosts, selectedProjectId, selectedStudentId, dateRange]);

  // Chart 1: Project Progress / Stage Distribution
  const projectProgressData = useMemo(() => {
    return rawProjects.map(proj => {
      const projPosts = filteredPosts.filter(p => p.project_id === proj.id);
      return {
        name: proj.name.length > 16 ? proj.name.substring(0, 15) + '...' : proj.name,
        completed: projPosts.filter(p => ['approved', 'published', 'ready_to_publish'].includes(p.status)).length,
        inReview: projPosts.filter(p => ['under_review', 'manager_approved', 'pending_admin_approval'].includes(p.status)).length,
        production: projPosts.filter(p => ['draft', 'assigned', 'in_progress', 'revision_required'].includes(p.status)).length,
      };
    });
  }, [rawProjects, filteredPosts]);

  // Chart 2: Student Workload & Capacity Allocation
  const studentWorkloadData = useMemo(() => {
    return rawUsers.map(u => {
      const uPosts = filteredPosts.filter(p => p.assigned_student_id === u.id);
      return {
        name: u.full_name.split(' ')[0],
        assigned: uPosts.length,
        completed: uPosts.filter(p => ['approved', 'published'].includes(p.status)).length,
        revisions: uPosts.filter(p => p.status === 'revision_required').length,
      };
    });
  }, [rawUsers, filteredPosts]);

  // Chart 3: Review Turnaround Velocity (Days to sign-off over weeks)
  const turnaroundVelocityData = [
    { week: 'Wk 38', target: 2.0, actual: 2.4 },
    { week: 'Wk 39', target: 2.0, actual: 2.1 },
    { week: 'Wk 40', target: 2.0, actual: 1.9 },
    { week: 'Wk 41', target: 2.0, actual: 1.6 },
    { week: 'Wk 42', target: 2.0, actual: 1.8 },
  ];

  // Chart 4: Content Pipeline & Approvals Funnel
  const pipelineFunnelData = useMemo(() => {
    return [
      {
        stage: 'In Creation',
        count: filteredPosts.filter(p => ['draft', 'assigned', 'in_progress'].includes(p.status)).length,
        fill: '#6366F1',
      },
      {
        stage: 'Under Review',
        count: filteredPosts.filter(p => ['submitted', 'under_review', 'revision_required'].includes(p.status)).length,
        fill: '#F59E0B',
      },
      {
        stage: 'Pending Exec Approval',
        count: filteredPosts.filter(p => ['manager_approved', 'pending_admin_approval'].includes(p.status)).length,
        fill: '#8B5CF6',
      },
      {
        stage: 'Approved & Scheduled',
        count: filteredPosts.filter(p => ['approved', 'ready_to_publish', 'scheduled'].includes(p.status)).length,
        fill: '#10B981',
      },
      {
        stage: 'Published',
        count: filteredPosts.filter(p => p.status === 'published').length,
        fill: '#059669',
      },
    ];
  }, [filteredPosts]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Title,Project,Client,Status,Priority,Platforms,AssignedStudent,Deadline,TargetPublishDate,PublishedUrl']
        .concat(
          filteredPosts.map(
            p =>
              `"${p.id}","${p.title}","${p.project?.name || ''}","${p.project?.client?.code || ''}","${p.status}","${p.priority}","${p.platforms.join(';')}","${p.assigned_student?.full_name || ''}","${p.deadline || ''}","${p.target_publish_date || ''}","${p.published_url || ''}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amplifi_executive_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Report Exported Successfully',
      message: `${filteredPosts.length} deliverables exported to CSV summary.`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            <span>Executive Performance & Velocity Reports</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turnaround velocity, creator capacity allocations, pipeline stage distribution, and CSV export.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export CSV Summary
        </Button>
      </div>

      {/* Filter Bar (Date Range, Project, User) */}
      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Date Range Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Date Horizon
            </label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Campaign History</option>
              <option value="30d">Last 30 Days</option>
              <option value="60d">Last 60 Days</option>
              <option value="90d">Last 90 Days (Quarter to Date)</option>
            </select>
          </div>

          {/* Project Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Filter by Project
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Active Projects ({rawProjects.length})</option>
              {rawProjects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.client?.code})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Filter by Creator
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Student Creators ({rawUsers.length})</option>
              {rawUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Aggregating data for <strong className="text-foreground">{filteredPosts.length}</strong> filtered deliverables
          </span>
          {(dateRange !== 'all' || selectedProjectId !== 'all' || selectedStudentId !== 'all') && (
            <button
              onClick={() => {
                setDateRange('all');
                setSelectedProjectId('all');
                setSelectedStudentId('all');
              }}
              className="text-primary-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Turnaround"
          value="1.8 Days"
          subtitle="Brief to Manager Sign-Off"
          icon={<Clock className="h-5 w-5 text-sky-500" />}
        />
        <StatCard
          title="First-Pass Sign-Off"
          value="82%"
          subtitle="Zero Revisions Required"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="On-Time Delivery Rate"
          value="94.6%"
          subtitle="Pre-Deadline Submission"
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
        />
        <StatCard
          title="Deliverables in Scope"
          value={filteredPosts.length}
          subtitle="Across Target Channels"
          icon={<Layers className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Grid of 4 Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: PROJECT PROGRESS BREAKDOWN */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Project Delivery Status Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">Deliverables per project stage</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Stacked</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="completed" name="Approved / Published" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inReview" name="Under Review" stackId="a" fill="#F59E0B" />
                <Bar dataKey="production" name="In Production" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: STUDENT WORKLOAD DISTRIBUTION */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Student Creator Workload & Capacity
              </h3>
              <p className="text-xs text-muted-foreground">Assigned tasks vs completed output</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Capacity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="assigned" name="Assigned Tasks" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revisions" name="Revisions Required" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: REVIEW TURNAROUND VELOCITY */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Review Turnaround Velocity (Days)
              </h3>
              <p className="text-xs text-muted-foreground">Actual review cycle vs 2.0-day SLA</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-bold">Passing SLA</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={turnaroundVelocityData}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="week" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} unit="d" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="actual" name="Actual Turnaround" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#velocityGrad)" />
                <Line type="monotone" dataKey="target" name="Target SLA" stroke="#10B981" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: CONTENT PIPELINE & APPROVALS FUNNEL */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Content Pipeline & Approval Funnel
              </h3>
              <p className="text-xs text-muted-foreground">Live volume across governance stages</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Volume</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" stroke="#888888" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" stroke="#888888" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Deliverables" radius={[0, 4, 4, 0]}>
                  {pipelineFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
