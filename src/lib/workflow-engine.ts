import { PostWorkflowStatus, UserRole } from './types';

export interface StatusMeta {
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const WORKFLOW_STATUS_CONFIG: Record<PostWorkflowStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    description: 'Post idea initiated, awaiting assignment or drafting',
  },
  assigned: {
    label: 'Assigned',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900',
    description: 'Manager assigned post topic and media type to student',
  },
  student_created: {
    label: 'Student Created',
    dotColor: 'bg-violet-500',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/40',
    badgeText: 'text-violet-700 dark:text-violet-300',
    badgeBorder: 'border-violet-200 dark:border-violet-900',
    description: 'Post initiated independently by assigned student',
  },
  in_progress: {
    label: 'In Progress',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900',
    description: 'Student drafting copy and uploading media into assigned folder',
  },
  submitted: {
    label: 'Submitted',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900',
    description: 'Deliverable submitted with title, description, and Drive media link',
  },
  under_review: {
    label: 'Under Review',
    dotColor: 'bg-yellow-500',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-900',
    description: 'Manager proofreading copy and verifying Drive media deliverable',
  },
  revision_required: {
    label: 'Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Changes requested by Manager or Admin with feedback comments',
  },
  manager_approved: {
    label: 'Manager Approved',
    dotColor: 'bg-teal-500',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-900',
    description: 'Proofread and endorsed by Campaign Manager',
  },
  recommended_to_admin: {
    label: 'Recommended to Admin',
    dotColor: 'bg-purple-600',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-900',
    description: 'Recommended by Manager with rationale note for executive sign-off',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-600',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-900',
    description: 'Executive approval granted by Administrator',
  },
  ready_to_publish: {
    label: 'Ready to Publish',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-900',
    description: 'Deliverable approved, publisher assigned (Admin or Manager queue)',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-green-600',
    badgeBg: 'bg-green-50 dark:bg-green-950/40',
    badgeText: 'text-green-700 dark:text-green-300',
    badgeBorder: 'border-green-200 dark:border-green-900',
    description: 'Live distribution confirmed with verified public URL',
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-blue-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900',
    description: 'Scheduled for queued automated release',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-900',
    description: 'Deliverable rejected by Administrator with reason',
  },
  cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    description: 'Post revoked or decommissioned',
  },
  failed_publishing: {
    label: 'Failed Publishing',
    dotColor: 'bg-red-600',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-900',
    description: 'Publishing distribution error; requires intervention',
  },
  // Compatibility aliases
  text_submitted: {
    label: 'Text Submitted',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900',
    description: 'Submitted for review',
  },
  text_revision_required: {
    label: 'Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Revision requested',
  },
  text_approved: {
    label: 'Text Approved',
    dotColor: 'bg-blue-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900',
    description: 'Copy approved',
  },
  media_in_progress: {
    label: 'In Progress',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-900',
    description: 'Media in progress',
  },
  media_submitted: {
    label: 'Submitted',
    dotColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-900',
    description: 'Media submitted',
  },
  media_revision_required: {
    label: 'Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Media revision needed',
  },
  pending_admin_approval: {
    label: 'Recommended to Admin',
    dotColor: 'bg-purple-600',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-900',
    description: 'Awaiting Admin decision',
  },
};

export const ALLOWED_TRANSITIONS: Record<
  PostWorkflowStatus,
  { to: PostWorkflowStatus; roles: UserRole[]; requiresNote?: boolean; actionLabel: string }[]
> = {
  draft: [
    { to: 'assigned', roles: ['admin', 'manager'], actionLabel: 'Assign to Student' },
    { to: 'student_created', roles: ['student'], actionLabel: 'Create Student Post' },
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Start Working' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel Post' },
  ],
  assigned: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Start Working' },
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit for Review' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  student_created: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Start Working' },
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit for Review' },
    { to: 'cancelled', roles: ['admin', 'manager', 'student'], actionLabel: 'Cancel' },
  ],
  in_progress: [
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Deliverable' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  submitted: [
    { to: 'under_review', roles: ['admin', 'manager'], actionLabel: 'Begin Proofreading' },
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Post' },
    { to: 'recommended_to_admin', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Recommend to Admin' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
  ],
  under_review: [
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Post' },
    { to: 'recommended_to_admin', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Recommend to Admin' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
  ],
  revision_required: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Resume Work' },
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit for Review' },
  ],
  manager_approved: [
    { to: 'recommended_to_admin', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Recommend to Admin' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Return for Revision' },
  ],
  recommended_to_admin: [
    { to: 'approved', roles: ['admin'], actionLabel: 'Grant Executive Approval' },
    { to: 'ready_to_publish', roles: ['admin'], actionLabel: 'Approve & Assign Publisher' },
    { to: 'rejected', roles: ['admin'], requiresNote: true, actionLabel: 'Reject Deliverable' },
    { to: 'revision_required', roles: ['admin'], requiresNote: true, actionLabel: 'Require Revision' },
  ],
  approved: [
    { to: 'ready_to_publish', roles: ['admin'], actionLabel: 'Assign Publisher & Proceed' },
  ],
  ready_to_publish: [
    { to: 'published', roles: ['admin', 'manager'], actionLabel: 'Confirm Live Publishing' },
    { to: 'failed_publishing', roles: ['admin', 'manager'], actionLabel: 'Flag Failure' },
  ],
  scheduled: [
    { to: 'published', roles: ['admin', 'manager'], actionLabel: 'Confirm Published' },
    { to: 'ready_to_publish', roles: ['admin', 'manager'], actionLabel: 'Unschedule' },
  ],
  failed_publishing: [
    { to: 'ready_to_publish', roles: ['admin', 'manager'], actionLabel: 'Retry Publishing' },
  ],
  published: [
    { to: 'cancelled', roles: ['admin'], requiresNote: true, actionLabel: 'Take Down' },
  ],
  rejected: [
    { to: 'draft', roles: ['admin', 'manager'], actionLabel: 'Reopen as Draft' },
  ],
  cancelled: [
    { to: 'draft', roles: ['admin'], actionLabel: 'Restore to Draft' },
  ],
  // Compatibility aliases
  text_submitted: [
    { to: 'under_review', roles: ['admin', 'manager'], actionLabel: 'Review' },
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Approve' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
    { to: 'recommended_to_admin', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Recommend to Admin' },
  ],
  text_revision_required: [
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit' },
  ],
  text_approved: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'In Progress' },
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Deliverable' },
  ],
  media_in_progress: [
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Deliverable' },
  ],
  media_submitted: [
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Approve' },
    { to: 'recommended_to_admin', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Recommend to Admin' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
  ],
  media_revision_required: [
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit' },
  ],
  pending_admin_approval: [
    { to: 'approved', roles: ['admin'], actionLabel: 'Grant Executive Approval' },
    { to: 'ready_to_publish', roles: ['admin'], actionLabel: 'Approve & Assign Publisher' },
    { to: 'rejected', roles: ['admin'], requiresNote: true, actionLabel: 'Reject Post' },
    { to: 'revision_required', roles: ['admin'], requiresNote: true, actionLabel: 'Require Revision' },
  ],
};

export function getAvailableTransitions(currentStatus: PostWorkflowStatus, role: UserRole) {
  const transitions = ALLOWED_TRANSITIONS[currentStatus] || [];
  return transitions.filter(t => t.roles.includes(role));
}

export function canTransition(currentStatus: PostWorkflowStatus, targetStatus: PostWorkflowStatus, role: UserRole): boolean {
  const allowed = getAvailableTransitions(currentStatus, role);
  return allowed.some(t => t.to === targetStatus);
}
