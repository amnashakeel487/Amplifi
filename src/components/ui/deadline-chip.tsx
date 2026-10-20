import * as React from 'react';
import { differenceInHours, differenceInDays, parseISO, isPast } from 'date-fns';
import { Clock, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

interface DeadlineChipProps {
  deadline?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const DeadlineChip: React.FC<DeadlineChipProps> = ({ deadline, className, showIcon = true }) => {
  if (!deadline) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const target = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  const isOverdue = isPast(target);
  const hoursLeft = differenceInHours(target, now);
  const daysOverdue = Math.max(1, differenceInDays(now, target));

  // Determine variant
  if (isOverdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
          className
        )}
      >
        {showIcon && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
        <span>Overdue by {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}</span>
      </span>
    );
  }

  if (hoursLeft <= 48 && hoursLeft >= 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
          className
        )}
      >
        {showIcon && <Clock className="h-3.5 w-3.5 shrink-0" />}
        <span>Due in {hoursLeft}h ({formatDate(target, 'MMM d')})</span>
      </span>
    );
  }

  // Far deadline (neutral)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border/80',
        className
      )}
    >
      {showIcon && <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      <span>{formatDate(target, 'MMM d, yyyy')}</span>
    </span>
  );
};
