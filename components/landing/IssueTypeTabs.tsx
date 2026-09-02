'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';

const TABS = [
  {
    key: 'critical',
    label: 'Критичные',
    dot: '🔴',
    example: {
      title: 'Утечка целевой переменной',
      column: 'cancellation_date',
      description:
        'Колонка напрямую раскрывает таргет — модель покажет идеальные метрики на трейне и провалится в проде.',
      variant: 'danger' as const,
    },
  },
  {
    key: 'warning',
    label: 'Предупреждения',
    dot: '🟡',
    example: {
      title: 'Дисбаланс классов',
      column: 'churn',
      description: 'Положительный класс составляет всего 12% выборки — рассмотрите балансировку.',
      variant: 'warning' as const,
    },
  },
  {
    key: 'info',
    label: 'Инфо',
    dot: '🔵',
    example: {
      title: 'Выбросы в числовой колонке',
      column: 'tenure_months',
      description: 'Обнаружено 23 значения за пределами 3 сигм — стоит проверить вручную.',
      variant: 'accent' as const,
    },
  },
];

export function IssueTypeTabs() {
  const [active, setActive] = useState(TABS[0].key);
  const activeTab = TABS.find((t) => t.key === active)!;

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold text-center text-text mb-4"
        >
          Типы проблем, которые мы находим
        </motion.h2>
        <p className="text-center text-text-secondary mb-10">
          Каждая проблема классифицируется по критичности для обучения модели
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === tab.key
                  ? 'text-text'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {active === tab.key && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-surface2 border border-border rounded-lg"
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {tab.dot} {tab.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-lg font-semibold text-text">{activeTab.example.title}</h3>
              <Badge variant={activeTab.example.variant}>{activeTab.label}</Badge>
              <Badge mono variant="muted">
                {activeTab.example.column}
              </Badge>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              {activeTab.example.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
