'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Rows3, Columns3, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CountUp } from '@/components/ui/CountUp';

interface ReportHeaderProps {
  fileName: string;
  format: string;
  createdAt: string;
  qualityScore: number;
  rowCount: number;
  colCount: number;
  issueCount: number;
  criticalCount: number;
}

function scoreColor(score: number) {
  if (score < 50) return '#ef4444';
  if (score < 75) return '#f59e0b';
  return '#10b981';
}

function CircularGauge({ score }: { score: number }) {
  const [mounted, setMounted] = useState(false);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 150 150" className="h-40 w-40 -rotate-90">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="#1a2235" strokeWidth="12" />
        <motion.circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: mounted ? circumference * (1 - score / 100) : circumference }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold mono" style={{ color }}>
          <CountUp value={score} />
        </span>
        <span className="text-xs text-text-muted">из 100</span>
      </div>
    </div>
  );
}

export function ReportHeader({
  fileName,
  format,
  createdAt,
  qualityScore,
  rowCount,
  colCount,
  issueCount,
  criticalCount,
}: ReportHeaderProps) {
  const date = new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg p-6 flex flex-col md:flex-row items-center gap-8"
    >
      <CircularGauge score={qualityScore} />

      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <FileText size={18} className="text-accent" />
          <span className="font-mono text-lg text-text font-medium">{fileName}</span>
          <Badge variant="accent" mono>
            {format}
          </Badge>
          <span className="text-sm text-text-muted">{date}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface2 rounded-lg p-3.5 border border-border">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
              <Rows3 size={13} /> Строк
            </div>
            <div className="text-lg font-semibold mono text-text">
              <CountUp value={rowCount} />
            </div>
          </div>
          <div className="bg-surface2 rounded-lg p-3.5 border border-border">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
              <Columns3 size={13} /> Колонок
            </div>
            <div className="text-lg font-semibold mono text-text">
              <CountUp value={colCount} />
            </div>
          </div>
          <div className="bg-surface2 rounded-lg p-3.5 border border-border">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
              <AlertTriangle size={13} /> Проблем
            </div>
            <div className="text-lg font-semibold mono text-warning">
              <CountUp value={issueCount} />
            </div>
          </div>
          <div className="bg-surface2 rounded-lg p-3.5 border border-border">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
              <ShieldAlert size={13} /> Критичных
            </div>
            <div className="text-lg font-semibold mono text-danger">
              <CountUp value={criticalCount} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
