'use client';

import { motion } from 'framer-motion';
import { UploadCloud, ScanSearch, FileCheck2 } from 'lucide-react';

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Загрузи датасет',
    description: 'Перетащи CSV, Excel или JSON файл — до 100MB на плане PRO.',
  },
  {
    icon: ScanSearch,
    title: 'AI анализирует',
    description: 'Модель ищет утечки, дисбаланс, пропуски, выбросы и дубликаты за секунды.',
  },
  {
    icon: FileCheck2,
    title: 'Получи отчёт',
    description: 'Подробный отчёт с объяснением каждой проблемы и готовым кодом для исправления.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold text-center text-text mb-16"
        >
          Как это работает
        </motion.h2>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="hidden md:block absolute top-8 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 h-16 w-16 rounded-full bg-surface2 border border-accent/40 flex items-center justify-center mb-5">
                  <Icon size={26} className="text-accent-hover" />
                </div>
                <span className="text-xs font-mono text-accent mb-2">Шаг {i + 1}</span>
                <h3 className="text-lg font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
