import * as React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';

export type IntegrationStatus = 'connected' | 'not_connected' | 'configuration_required' | 'token_expired';

interface IntegrationStatusChipProps {
  status: IntegrationStatus;
  verified?: boolean;
  className?: string;
}

export const IntegrationStatusChip: React.FC<IntegrationStatusChipProps> = ({
  status,
  verified = false,
  className,
}) => {
  // Enforce rule: Never show a green state unless backend has verified it!
  const effectiveStatus = (status === 'connected' && !verified) ? 'configuration_required' : status;

  const configs: Record<
    IntegrationStatus,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    connected: {
      label: 'Connected & Verified',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    },
    not_connected: {
      label: 'Not Connected',
      icon: <XCircle className="h-3.5 w-3.5 text-slate-400" />,
      color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800',
    },
    configuration_required: {
      label: 'Configuration Required',
      icon: <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    },
    token_expired: {
      label: 'Token Expired / Reconnect',
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
      color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    },
  };

  const conf = configs[effectiveStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border shadow-soft-sm',
        conf.color,
        className
      )}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  );
};
