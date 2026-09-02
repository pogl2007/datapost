'use client';

import { motion } from 'framer-motion';
import { CountUp } from '@/components/ui/CountUp';

const STATS = [
  { value: 2847, suffix: '', label: 'датасетов проверено' },
  { value: 94, suffix: '%', label: 'проблем найдено автоматически' },
  { value: 12, suffix: '', label: 'типов ошибок детектируется' },
  { value: 3, suffix: ' сек', label: 'среднее время анализа' },
];

export function StatsSection() {
  return (
    <section className="py-20 border-y border-border bg-surface/30">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <div className="text-3xl sm:text-4xl font-bold text-accent-hover mono mb-2">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
