'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
  trackClassName?: string;
  height?: number;
  animateOnView?: boolean;
  delay?: number;
}

export function ProgressBar({
  value,
  max = 100,
  colorClass = 'bg-accent',
  trackClassName,
  height = 8,
  animateOnView = true,
  delay = 0,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={clsx('w-full bg-surface2 rounded-full overflow-hidden', trackClassName)}
      style={{ height }}
    >
      <motion.div
        className={clsx('h-full rounded-full', colorClass)}
        initial={{ width: 0 }}
        {...(animateOnView
          ? { whileInView: { width: `${pct}%` }, viewport: { once: true } }
          : { animate: { width: `${pct}%` } })}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      />
    </div>
  );
}
