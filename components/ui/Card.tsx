'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}

export function Card({ children, hover = false, className, ...props }: CardProps) {
  return (
    <motion.div
      className={clsx(
        'bg-surface border border-border rounded-lg p-5',
        hover && 'cursor-pointer transition-shadow duration-200',
        className
      )}
      whileHover={
        hover
          ? { scale: 1.02, y: -2, boxShadow: '0 0 0 1px #3b82f6' }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};
