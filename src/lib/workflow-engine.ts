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
    description: 'Post idea initiated, not yet assigned for production',
  },
  assigned: {
    label: 'Assigned',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900',
    description: 'Assigned to a student creator with brief and deadline',
  },
  in_progress: {
    label: 'In Progress',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-900',
    description: 'Creator actively drafting copy and visual assets',
  },
  submitted: {
    label: 'Submitted',
    dotColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-900',
    description: 'Delivered by creator; waiting for manager review queue',
  },
  under_review: {
    label: 'Under Review',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900',
    description: 'Under review and proofreading by content manager',
  },
  revision_required: {
    label: 'Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Sent back to student with proofreading feedback',
  },
  manager_approved: {
    label: 'Manager Approved',
    dotColor: 'bg-lime-500',
    badgeBg: 'bg-lime-50 dark:bg-lime-950/40',
    badgeText: 'text-lime-700 dark:text-lime-300',
    badgeBorder: 'border-lime-200 dark:border-lime-900',
    description: 'Manager signed off, ready for final admin authorization',
  },
  pending_admin_approval: {
    label: 'Pending Admin Approval',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-900',
    description: 'Awaiting executive sign-off in Admin Approval Queue',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-900',
    description: 'Fully approved by Admin and Stakeholders',
  },
  ready_to_publish: {
    label: 'Ready to Publish',
    dotColor: 'bg-teal-500',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-900',
    description: 'Packaged with assets and copy ready for distribution',
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900',
    description: 'Scheduled with platform queue or calendar',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-emerald-600',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    description: 'Live on client social channels with verified URL',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-red-500',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-900',
    description: 'Rejected by management or client compliance',
  },
  cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/50',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-300 dark:border-slate-800',
    description: 'Post archived or campaign withdrawn',
  },
  failed_publishing: {
    label: 'Failed Publishing',
    dotColor: 'bg-rose-600',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-900',
    description: 'API publishing attempt failed or link inaccessible',
  },
};

export const ALLOWED_TRANSITIONS: Record<
  PostWorkflowStatus,
  { to: PostWorkflowStatus; roles: UserRole[]; requiresNote?: boolean; actionLabel: string }[]
> = {
  draft: [
    { to: 'assigned', roles: ['admin', 'manager'], actionLabel: 'Assign to Creator' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel Post' },
  ],
  assigned: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Start Working' },
    { to: 'draft', roles: ['admin', 'manager'], actionLabel: 'Revert to Draft' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel Post' },
  ],
  in_progress: [
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit for Review' },
    { to: 'assigned', roles: ['admin', 'manager'], actionLabel: 'Reassign' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  submitted: [
    { to: 'under_review', roles: ['admin', 'manager'], actionLabel: 'Begin Proofreading' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Directly' },
    { to: 'pending_admin_approval', roles: ['admin', 'manager'], actionLabel: 'Forward to Admin' },
  ],
  under_review: [
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Manager Sign-off' },
    { to: 'pending_admin_approval', roles: ['admin', 'manager'], actionLabel: 'Escalate to Admin Approval' },
    { to: 'approved', roles: ['admin'], actionLabel: 'Approve (Admin Override)' },
  ],
  revision_required: [
    { to: 'in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Resume Edits' },
    { to: 'submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit Revised Assets' },
  ],
  manager_approved: [
    { to: 'pending_admin_approval', roles: ['admin', 'manager'], actionLabel: 'Queue for Admin Approval' },
    { to: 'approved', roles: ['admin'], actionLabel: 'Final Approve' },
    { to: 'revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Return for Edits' },
  ],
  pending_admin_approval: [
    { to: 'approved', roles: ['admin'], actionLabel: 'Grant Final Approval' },
    { to: 'revision_required', roles: ['admin'], requiresNote: true, actionLabel: 'Require Revision' },
    { to: 'rejected', roles: ['admin'], requiresNote: true, actionLabel: 'Reject Post' },
  ],
  approved: [
    { to: 'ready_to_publish', roles: ['admin', 'manager'], actionLabel: 'Mark Ready to Publish' },
    { to: 'scheduled', roles: ['admin', 'manager'], actionLabel: 'Schedule Publication' },
    { to: 'published', roles: ['admin', 'manager'], actionLabel: 'Publish Now' },
  ],
  ready_to_publish: [
    { to: 'scheduled', roles: ['admin', 'manager'], actionLabel: 'Set Scheduled Time' },
    { to: 'published', roles: ['admin', 'manager'], actionLabel: 'Complete Manual Publishing' },
    { to: 'failed_publishing', roles: ['admin', 'manager'], actionLabel: 'Mark Publishing Failed' },
  ],
  scheduled: [
    { to: 'published', roles: ['admin', 'manager'], actionLabel: 'Confirm Published' },
    { to: 'ready_to_publish', roles: ['admin', 'manager'], actionLabel: 'Unschedule' },
    { to: 'failed_publishing', roles: ['admin', 'manager'], actionLabel: 'Flag Failure' },
  ],
  failed_publishing: [
    { to: 'ready_to_publish', roles: ['admin', 'manager'], actionLabel: 'Retry Publishing' },
    { to: 'scheduled', roles: ['admin', 'manager'], actionLabel: 'Reschedule' },
  ],
  published: [
    { to: 'cancelled', roles: ['admin'], requiresNote: true, actionLabel: 'Take Down / Retract' },
  ],
  rejected: [
    { to: 'draft', roles: ['admin', 'manager'], actionLabel: 'Reopen as New Draft' },
  ],
  cancelled: [
    { to: 'draft', roles: ['admin'], actionLabel: 'Restore to Draft' },
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
