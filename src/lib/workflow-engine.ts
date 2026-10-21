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
    description: 'Post idea initiated, awaiting Creator text drafting',
  },
  text_submitted: {
    label: 'Text Submitted',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900',
    description: 'Creator submitted copy, title and hashtags for Manager review',
  },
  text_revision_required: {
    label: 'Text Revision Required',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900',
    description: 'Manager requested edits on description, copy, or hashtags',
  },
  text_approved: {
    label: 'Text Approved',
    dotColor: 'bg-blue-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-900',
    description: 'Copy approved by Manager; media production stage is unlocked',
  },
  media_in_progress: {
    label: 'Media In Progress',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-900',
    description: 'Creator creating video/image in assigned Drive folder',
  },
  media_submitted: {
    label: 'Media Submitted',
    dotColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-900',
    description: 'Media uploaded to assigned folder, ready for proofreading',
  },
  media_revision_required: {
    label: 'Media Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Manager requested revisions on video or visual asset',
  },
  manager_approved: {
    label: 'Manager Approved',
    dotColor: 'bg-lime-500',
    badgeBg: 'bg-lime-50 dark:bg-lime-950/40',
    badgeText: 'text-lime-700 dark:text-lime-300',
    badgeBorder: 'border-lime-200 dark:border-lime-900',
    description: 'Manager verified text and media; sent to Admin for final authorization',
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
    description: 'Granted final approval by Admin; ready for publisher assignment',
  },
  ready_to_publish: {
    label: 'Ready to Publish',
    dotColor: 'bg-teal-500',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-900',
    description: 'Publisher assigned (Admin or Manager); awaiting live publishing',
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
    description: 'Live on client social channels with verified live URL',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-red-500',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-900',
    description: 'Rejected by Administrator with reason',
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
    description: 'Publishing attempt failed or URL inaccessible',
  },
  // Legacy aliases
  assigned: {
    label: 'Draft (Assigned)',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    description: 'Assigned to creator for text drafting',
  },
  in_progress: {
    label: 'Drafting Copy',
    dotColor: 'bg-slate-500',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    description: 'Creator drafting text',
  },
  submitted: {
    label: 'Text Submitted',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900',
    description: 'Submitted for review',
  },
  under_review: {
    label: 'Under Review',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900',
    description: 'Under review by manager',
  },
  revision_required: {
    label: 'Revision Required',
    dotColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-900',
    description: 'Revision requested',
  },
};

export const ALLOWED_TRANSITIONS: Record<
  PostWorkflowStatus,
  { to: PostWorkflowStatus; roles: UserRole[]; requiresNote?: boolean; actionLabel: string }[]
> = {
  draft: [
    { to: 'text_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Text for Review' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel Post' },
  ],
  text_submitted: [
    { to: 'text_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Text' },
    { to: 'text_revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Text Revision' },
  ],
  text_revision_required: [
    { to: 'text_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit Revised Text' },
  ],
  text_approved: [
    { to: 'media_in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Start Media Production' },
    { to: 'media_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Media Asset' },
  ],
  media_in_progress: [
    { to: 'media_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Media Asset' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  media_submitted: [
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Manager Sign-off' },
    { to: 'pending_admin_approval', roles: ['admin', 'manager'], actionLabel: 'Send to Admin for Final Approval' },
    { to: 'media_revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Media Revision' },
  ],
  media_revision_required: [
    { to: 'media_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit Revised Media' },
    { to: 'media_in_progress', roles: ['admin', 'manager', 'student'], actionLabel: 'Resume Media Editing' },
  ],
  manager_approved: [
    { to: 'pending_admin_approval', roles: ['admin', 'manager'], actionLabel: 'Send to Admin for Final Approval' },
    { to: 'media_revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Return for Edits' },
  ],
  pending_admin_approval: [
    { to: 'approved', roles: ['admin'], actionLabel: 'Grant Executive Approval' },
    { to: 'ready_to_publish', roles: ['admin'], actionLabel: 'Approve & Assign Publisher' },
    { to: 'rejected', roles: ['admin'], requiresNote: true, actionLabel: 'Reject Post' },
    { to: 'media_revision_required', roles: ['admin'], requiresNote: true, actionLabel: 'Require Media Revision' },
    { to: 'text_revision_required', roles: ['admin'], requiresNote: true, actionLabel: 'Require Text Revision' },
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
    { to: 'cancelled', roles: ['admin'], requiresNote: true, actionLabel: 'Take Down / Retract' },
  ],
  rejected: [
    { to: 'draft', roles: ['admin', 'manager'], actionLabel: 'Reopen as New Draft' },
  ],
  cancelled: [
    { to: 'draft', roles: ['admin'], actionLabel: 'Restore to Draft' },
  ],
  // Legacy aliases
  assigned: [
    { to: 'text_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Text' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  in_progress: [
    { to: 'text_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Submit Text for Review' },
    { to: 'cancelled', roles: ['admin', 'manager'], actionLabel: 'Cancel' },
  ],
  submitted: [
    { to: 'text_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Text' },
    { to: 'text_revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
  ],
  under_review: [
    { to: 'text_approved', roles: ['admin', 'manager'], actionLabel: 'Approve Text' },
    { to: 'text_revision_required', roles: ['admin', 'manager'], requiresNote: true, actionLabel: 'Request Revision' },
    { to: 'manager_approved', roles: ['admin', 'manager'], actionLabel: 'Sign-off' },
  ],
  revision_required: [
    { to: 'text_submitted', roles: ['admin', 'manager', 'student'], actionLabel: 'Resubmit Revised Text' },
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
