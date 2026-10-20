import * as React from 'react';
import { PriorityLevel } from '../../lib/types';
import { ArrowDown, Minus, ArrowUp, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  showIcon?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true, className }) => {
  const configs = {
    low: {
      label: 'Low',
      icon: <ArrowDown className="h-3 w-3 text-slate-500" />,
      color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
    },
    medium: {
      label: 'Medium',
      icon: <Minus className="h-3 w-3 text-blue-500" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    },
    high: {
      label: 'High',
      icon: <ArrowUp className="h-3 w-3 text-amber-500" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    },
    urgent: {
      label: 'Urgent',
      icon: <Flame className="h-3.5 w-3.5 text-rose-600 animate-pulse" />,
      color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 font-semibold',
    },
  };

  const conf = configs[priority] || configs.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs border shadow-soft-sm',
        conf.color,
        className
      )}
    >
      {showIcon && conf.icon}
      <span>{conf.label}</span>
    </span>
  );
};
