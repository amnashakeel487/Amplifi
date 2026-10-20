import React from 'react';
import { SocialPlatform } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PLATFORM_LIMITS: Record<
  SocialPlatform,
  { name: string; maxChars: number; maxHashtags?: number; color: string }
> = {
  twitter: { name: 'Twitter / X', maxChars: 280, maxHashtags: 10, color: 'text-sky-500' },
  instagram: { name: 'Instagram', maxChars: 2200, maxHashtags: 30, color: 'text-pink-500' },
  linkedin: { name: 'LinkedIn', maxChars: 3000, color: 'text-blue-600' },
  tiktok: { name: 'TikTok', maxChars: 2200, color: 'text-cyan-400' },
  facebook: { name: 'Facebook', maxChars: 63206, color: 'text-indigo-600' },
  youtube: { name: 'YouTube Description', maxChars: 5000, maxHashtags: 15, color: 'text-red-500' },
};

interface PlatformCountersProps {
  caption: string;
  hashtags: string[];
  platforms: SocialPlatform[];
  className?: string;
}

export const PlatformCounters: React.FC<PlatformCountersProps> = ({
  caption = '',
  hashtags = [],
  platforms = [],
  className,
}) => {
  const charCount = caption.length;
  const tagCount = hashtags.length;

  if (platforms.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3', className)}>
      {platforms.map(platform => {
        const spec = PLATFORM_LIMITS[platform] || {
          name: platform,
          maxChars: 2000,
          color: 'text-muted-foreground',
        };

        const charsLeft = spec.maxChars - charCount;
        const isCharsOver = charsLeft < 0;
        const isCharsNear = charsLeft <= 50 && !isCharsOver;

        const hasTagLimit = typeof spec.maxHashtags === 'number';
        const isTagsOver = hasTagLimit && tagCount > spec.maxHashtags!;

        return (
          <div
            key={platform}
            className={cn(
              'rounded-xl border p-3.5 bg-card shadow-soft-sm transition-all space-y-2',
              isCharsOver || isTagsOver
                ? 'border-red-300 bg-red-50/20 dark:border-red-900/60 dark:bg-red-950/20'
                : 'border-border/80'
            )}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={cn('font-semibold uppercase tracking-wider', spec.color)}>
                {spec.name}
              </span>
              {isCharsOver || isTagsOver ? (
                <span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5" /> Exceeds Limit
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                </span>
              )}
            </div>

            {/* Character counter */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-muted-foreground">Characters:</span>
                <span
                  className={cn(
                    'font-mono tabular-nums font-semibold',
                    isCharsOver
                      ? 'text-red-600 dark:text-red-400'
                      : isCharsNear
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                  )}
                >
                  {charCount} / {spec.maxChars}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-200',
                    isCharsOver
                      ? 'bg-red-500'
                      : isCharsNear
                      ? 'bg-amber-500'
                      : 'bg-primary-600 dark:bg-primary-500'
                  )}
                  style={{ width: `${Math.min(100, (charCount / spec.maxChars) * 100)}%` }}
                />
              </div>
            </div>

            {/* Hashtag counter */}
            {hasTagLimit && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
                <span>Hashtags:</span>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    isTagsOver ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                  )}
                >
                  {tagCount} / {spec.maxHashtags} max
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
