import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials } from '../../lib/utils';

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  name?: string;
  fallback?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  default: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base font-semibold',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  fallback,
  size = 'default',
  className,
  ...props
}) => {
  const displayFallback = fallback || (name ? getInitials(name) : '??');

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-border/60 shadow-soft-sm bg-muted/60 select-none items-center justify-center font-medium',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={name || 'Avatar'}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-semibold">
        {displayFallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
};

export const AvatarGroup: React.FC<{
  users: { name: string; avatarUrl?: string }[];
  limit?: number;
  size?: 'sm' | 'default';
}> = ({ users, limit = 3, size = 'sm' }) => {
  const visible = users.slice(0, limit);
  const remaining = users.length - limit;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.avatarUrl} size={size} className="ring-2 ring-background" />
      ))}
      {remaining > 0 && (
        <span
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background font-medium text-[10px]',
            size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
          )}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};
