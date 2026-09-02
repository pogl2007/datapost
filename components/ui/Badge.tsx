import { ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  mono?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface2 text-text-secondary border-border',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger-subtle text-danger border-danger/30',
  accent: 'bg-accent-subtle text-accent-hover border-accent/30',
  muted: 'bg-transparent text-text-muted border-border',
};

export function Badge({ children, variant = 'default', className, mono }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium',
        variantClasses[variant],
        mono && 'font-mono',
        className
      )}
    >
      {children}
    </span>
  );
}
