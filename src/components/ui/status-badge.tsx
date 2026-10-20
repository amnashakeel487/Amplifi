import * as React from 'react';
import { PostWorkflowStatus } from '../../lib/types';
import { WORKFLOW_STATUS_CONFIG } from '../../lib/workflow-engine';
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: PostWorkflowStatus;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default', className }) => {
  const config = WORKFLOW_STATUS_CONFIG[status] || {
    label: status,
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    description: status,
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    default: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-soft-sm tracking-tight select-none',
        config.badgeBg,
        config.badgeText,
        config.badgeBorder,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      {/* Icon or Status Dot */}
      {status === 'published' ? (
        <Check className="h-3 w-3 stroke-[2.5] text-emerald-700 dark:text-emerald-300" />
      ) : status === 'failed_publishing' ? (
        <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
