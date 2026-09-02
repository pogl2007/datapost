'use client';

import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';

const ISSUE_TYPE_LABELS: Record<string, string> = {
  target_leakage: 'Утечка таргета',
  class_imbalance: 'Дисбаланс классов',
  missing_data: 'Пропущенные данные',
  outliers: 'Выбросы',
  duplicates: 'Дубликаты',
  wrong_dtype: 'Некорректный тип',
  high_cardinality: 'Высокая кардинальность',
  low_variance: 'Низкая дисперсия',
  correlation: 'Корреляция',
  other: 'Другое',
};

interface TopIssuesChartProps {
  topIssues: { type: string; count: number }[];
}

export function TopIssuesChart({ topIssues }: TopIssuesChartProps) {
  const max = Math.max(1, ...topIssues.map((i) => i.count));

  if (topIssues.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text mb-2">Топ проблем</h3>
        <p className="text-sm text-text-muted italic py-6 text-center">Пока нет данных</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg p-6"
    >
      <h3 className="text-base font-semibold text-text mb-5">Топ проблем</h3>
      <div className="space-y-4">
        {topIssues.map((issue, i) => (
          <div key={issue.type}>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-text-secondary">
                {ISSUE_TYPE_LABELS[issue.type] || issue.type}
              </span>
              <span className="mono text-text-muted">{issue.count}</span>
            </div>
            <ProgressBar value={issue.count} max={max} delay={i * 0.08} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
