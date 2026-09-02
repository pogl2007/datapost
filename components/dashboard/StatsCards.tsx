'use client';

import { motion } from 'framer-motion';
import { Database, TrendingUp, AlertCircle, Tag } from 'lucide-react';
import { Card, cardVariants, staggerContainer } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import type { DashboardStats } from '@/types';

const ISSUE_TYPE_LABELS: Record<string, string> = {
  target_leakage: 'Утечка таргета',
  class_imbalance: 'Дисбаланс классов',
  missing_data: 'Пропуски',
  outliers: 'Выбросы',
  duplicates: 'Дубликаты',
  wrong_dtype: 'Некорректный тип',
  high_cardinality: 'Высокая кардинальность',
  low_variance: 'Низкая дисперсия',
  correlation: 'Корреляция',
  other: 'Другое',
};

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      icon: Database,
      label: 'Датасетов проанализировано',
      value: stats.totalDatasets,
      suffix: '',
    },
    {
      icon: TrendingUp,
      label: 'Средний скор качества',
      value: stats.avgQualityScore,
      suffix: '%',
    },
    {
      icon: AlertCircle,
      label: 'Всего найдено проблем',
      value: stats.totalIssues,
      suffix: '',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.label} custom={i} variants={cardVariants}>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-sm">{item.label}</span>
                <Icon size={18} className="text-accent" />
              </div>
              <p className="text-2xl font-bold mono text-text">
                <CountUp value={item.value} suffix={item.suffix} />
              </p>
            </Card>
          </motion.div>
        );
      })}
      <motion.div custom={3} variants={cardVariants}>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">Частая проблема</span>
            <Tag size={18} className="text-accent" />
          </div>
          <p className="text-lg font-semibold text-text">
            {stats.mostCommonIssueType
              ? ISSUE_TYPE_LABELS[stats.mostCommonIssueType] || stats.mostCommonIssueType
              : '—'}
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
