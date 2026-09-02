'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TaskType } from '@/types';

interface SettingsPanelProps {
  headers: string[];
  targetColumn: string;
  onTargetColumnChange: (v: string) => void;
  taskType: TaskType;
  onTaskTypeChange: (v: TaskType) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: 'classification', label: 'Классификация' },
  { key: 'regression', label: 'Регрессия' },
  { key: 'ranking', label: 'Ранжирование' },
];

export function SettingsPanel({
  headers,
  targetColumn,
  onTargetColumnChange,
  taskType,
  onTaskTypeChange,
  onSubmit,
  disabled,
}: SettingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-6 bg-surface border border-border rounded-lg p-6"
    >
      <h3 className="text-base font-semibold text-text mb-5">Настройки анализа</h3>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Целевая колонка (target)</label>
          <select
            value={targetColumn}
            onChange={(e) => onTargetColumnChange(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">Не выбрано</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Тип задачи</label>
          <div className="grid grid-cols-3 gap-2">
            {TASK_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onTaskTypeChange(t.key)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  taskType === t.key
                    ? 'bg-accent-subtle border-accent text-accent-hover'
                    : 'bg-surface2 border-border text-text-secondary hover:border-border-strong'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={onSubmit} disabled={disabled}>
          Запустить анализ <ArrowRight size={18} />
        </Button>
      </div>
    </motion.div>
  );
}
