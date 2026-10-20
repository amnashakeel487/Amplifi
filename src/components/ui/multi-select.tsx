import * as React from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(item => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeOne = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== val));
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[40px] w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm flex flex-wrap gap-1.5 items-center cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 transition-all duration-150"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm pl-1">{placeholder}</span>
        ) : (
          selected.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-md bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs px-2 py-0.5 font-medium"
              >
                {opt?.icon}
                {opt?.label || val}
                <button
                  type="button"
                  onClick={e => removeOne(val, e)}
                  className="hover:text-primary-900 rounded focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-soft-lg max-h-56 overflow-y-auto p-1.5 animate-in fade-in-0 zoom-in-95">
          {options.map(option => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-2 rounded-md text-sm cursor-pointer hover:bg-accent transition-colors',
                  isSelected && 'bg-accent/70 font-medium'
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
