import * as React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    period?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border/80 bg-card p-5 shadow-soft transition-all duration-200',
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-soft-md hover:border-primary-500/40' : '',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && (
          <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center text-xs font-semibold',
              trend.value === 0
                ? 'text-muted-foreground'
                : trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {trend.value === 0 ? (
              <Minus className="h-3 w-3 mr-0.5" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {(subtitle || trend?.period) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {subtitle || `vs last ${trend?.period || 'month'}`}
        </p>
      )}
    </div>
  );
};
