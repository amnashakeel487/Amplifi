import * as React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PostWorkflowStatus } from '../../lib/types';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'rejected' | 'revision';
  timestamp?: string;
  actor?: string;
  notes?: string;
}

export const WORKFLOW_STAGE_ORDER: PostWorkflowStatus[] = [
  'draft',
  'assigned',
  'in_progress',
  'submitted',
  'under_review',
  'manager_approved',
  'pending_admin_approval',
  'approved',
  'ready_to_publish',
  'published',
];

export const WorkflowStepper: React.FC<{
  currentStatus: PostWorkflowStatus;
  className?: string;
}> = ({ currentStatus, className }) => {
  const getStepState = (stage: PostWorkflowStatus) => {
    const currentIndex = WORKFLOW_STAGE_ORDER.indexOf(currentStatus);
    const stageIndex = WORKFLOW_STAGE_ORDER.indexOf(stage);

    if (currentStatus === 'rejected') {
      return stage === 'under_review' || stage === 'pending_admin_approval' ? 'rejected' : 'upcoming';
    }
    if (currentStatus === 'revision_required') {
      return stage === 'in_progress' ? 'revision' : stageIndex < 4 ? 'completed' : 'upcoming';
    }

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const simplifiedStages: { key: PostWorkflowStatus; label: string }[] = [
    { key: 'draft', label: 'Draft' },
    { key: 'in_progress', label: 'Production' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'published', label: 'Published' },
  ];

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-muted z-0" />
        {simplifiedStages.map((stage) => {
          const state = getStepState(stage.key);

          const circleClasses = {
            completed: 'bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/60',
            current: 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950/60 animate-pulse',
            revision: 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-950/60',
            rejected: 'bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-950/60',
            upcoming: 'bg-card text-muted-foreground border-2 border-border/80',
          }[state];

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 group">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-soft-sm transition-all',
                  circleClasses
                )}
              >
                {state === 'completed' && <Check className="h-4 w-4 stroke-[2.5]" />}
                {state === 'current' && <Clock className="h-4 w-4" />}
                {state === 'revision' && <AlertCircle className="h-4 w-4" />}
                {state === 'rejected' && <AlertCircle className="h-4 w-4" />}
                {state === 'upcoming' && <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium tracking-tight text-center',
                  state === 'current' ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
