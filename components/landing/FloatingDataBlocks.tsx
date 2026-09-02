'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface BlockDef {
  id: number;
  type: 'bar' | 'line' | 'donut' | 'text' | 'grid';
  x: string;
  y: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  label?: string;
}

const BLOCKS: BlockDef[] = [
  { id: 1, type: 'bar', x: '8%', y: '15%', size: 70, opacity: 0.09, duration: 7, delay: 0, drift: 20 },
  { id: 2, type: 'line', x: '85%', y: '20%', size: 90, opacity: 0.1, duration: 9, delay: 0.5, drift: -25 },
  { id: 3, type: 'donut', x: '15%', y: '65%', size: 60, opacity: 0.08, duration: 8, delay: 1, drift: 15 },
  { id: 4, type: 'text', x: '75%', y: '12%', size: 20, opacity: 0.12, duration: 6, delay: 0.2, drift: 10, label: '94.2%' },
  { id: 5, type: 'text', x: '5%', y: '40%', size: 16, opacity: 0.1, duration: 10, delay: 1.5, drift: -15, label: '↑ 12k rows' },
  { id: 6, type: 'grid', x: '90%', y: '55%', size: 40, opacity: 0.07, duration: 7.5, delay: 0.8, drift: 18 },
  { id: 7, type: 'text', x: '45%', y: '8%', size: 14, opacity: 0.1, duration: 8.5, delay: 0.3, drift: -12, label: 'NaN: 0.3%' },
  { id: 8, type: 'bar', x: '55%', y: '75%', size: 55, opacity: 0.09, duration: 6.5, delay: 1.2, drift: 22 },
  { id: 9, type: 'line', x: '25%', y: '85%', size: 75, opacity: 0.08, duration: 9.5, delay: 0.6, drift: -18 },
  { id: 10, type: 'donut', x: '65%', y: '45%', size: 50, opacity: 0.1, duration: 7, delay: 1.8, drift: 14 },
  { id: 11, type: 'grid', x: '35%', y: '30%', size: 36, opacity: 0.06, duration: 8, delay: 0.9, drift: -20 },
  { id: 12, type: 'text', x: '92%', y: '80%', size: 15, opacity: 0.11, duration: 6.8, delay: 1.4, drift: 16, label: 'σ = 2.4' },
  { id: 13, type: 'bar', x: '20%', y: '5%', size: 45, opacity: 0.08, duration: 9, delay: 0.4, drift: -14 },
  { id: 14, type: 'text', x: '60%', y: '90%', size: 14, opacity: 0.1, duration: 7.2, delay: 1.1, drift: 20, label: 'ROC-AUC 0.91' },
  { id: 15, type: 'line', x: '48%', y: '50%', size: 65, opacity: 0.07, duration: 10, delay: 0.7, drift: -16 },
];

function BlockShape({ block }: { block: BlockDef }) {
  const stroke = '#3b82f6';
  switch (block.type) {
    case 'bar':
      return (
        <svg width={block.size} height={block.size} viewBox="0 0 60 60" fill="none">
          <rect x="6" y="30" width="8" height="24" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="20" y="18" width="8" height="36" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="34" y="8" width="8" height="46" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="48" y="24" width="8" height="30" rx="2" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'line':
      return (
        <svg width={block.size} height={block.size * 0.6} viewBox="0 0 90 54" fill="none">
          <path
            d="M2 44 L20 30 L38 36 L56 12 L74 20 L88 4"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'donut':
      return (
        <svg width={block.size} height={block.size} viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke={stroke} strokeWidth="3" strokeDasharray="60 90" />
          <circle cx="30" cy="30" r="24" stroke={stroke} strokeWidth="3" strokeOpacity="0.4" strokeDasharray="30 120" strokeDashoffset="-60" />
        </svg>
      );
    case 'grid':
      return (
        <svg width={block.size} height={block.size} viewBox="0 0 36 36" fill="none">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <circle key={`${row}-${col}`} cx={6 + col * 12} cy={6 + row * 12} r="2" fill={stroke} />
            ))
          )}
        </svg>
      );
    case 'text':
      return (
        <span
          className="font-mono font-semibold whitespace-nowrap"
          style={{ color: stroke, fontSize: block.size }}
        >
          {block.label}
        </span>
      );
    default:
      return null;
  }
}

export function FloatingDataBlocks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);

  return (
    <motion.div
      ref={containerRef}
      style={{ y }}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      {BLOCKS.map((block) => (
        <motion.div
          key={block.id}
          className="absolute"
          style={{ left: block.x, top: block.y, opacity: block.opacity }}
          animate={{
            y: [0, block.drift, 0],
            x: [0, block.drift / 2, 0],
          }}
          transition={{
            duration: block.duration,
            delay: block.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <BlockShape block={block} />
        </motion.div>
      ))}
    </motion.div>
  );
}
