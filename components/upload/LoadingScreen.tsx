'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

const STEPS = [
  '📂 Читаем файл...',
  '🔍 Анализируем структуру данных...',
  '🧮 Считаем статистику по колонкам...',
  '🤖 AI ищет аномалии и проблемы...',
  '✨ Генерируем отчёт...',
];

export function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 1500);

    const percentInterval = setInterval(() => {
      setPercent((p) => (p >= 96 ? 96 : p + Math.random() * 4));
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(percentInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8 text-accent"
      >
        <Database size={64} strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-xl font-semibold text-text mb-2">DATAPOST анализирует твой датасет</h2>

      <div className="w-full max-w-[600px] mt-8 mb-4">
        <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      <p className="text-sm text-text-muted mono mb-6">{Math.round(percent)}%</p>

      <motion.p
        key={stepIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-text-secondary text-sm min-h-[20px]"
      >
        {STEPS[stepIndex]}
      </motion.p>

      <p className="text-xs text-text-muted mt-8">Обычно занимает 5-15 секунд</p>
    </div>
  );
}
