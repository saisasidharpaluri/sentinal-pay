import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-cyan-500/20 text-cyan-300',
    secondary: 'border-transparent bg-slate-800 text-slate-200',
    destructive: 'border-transparent bg-rose-500/20 text-rose-300',
    outline: 'border-white/10 text-zinc-300',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors focus:outline-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
