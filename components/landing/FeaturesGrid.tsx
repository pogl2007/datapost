'use client';

import { motion } from 'framer-motion';
import { Card, cardVariants, staggerContainer } from '@/components/ui/Card';

const FEATURES = [
  {
    emoji: '🔍',
    title: 'Target Leakage',
    description: 'Находит колонки, которые напрямую раскрывают целевую переменную и портят метрики модели.',
  },
  {
    emoji: '📊',
    title: 'Дисбаланс классов',
    description: 'Определяет перекос классов и подсказывает стратегии балансировки — от весов до SMOTE.',
  },
  {
    emoji: '🕳️',
    title: 'Пропущенные данные',
    description: 'Анализирует паттерны пропусков по каждой колонке и предлагает оптимальную стратегию заполнения.',
  },
  {
    emoji: '📈',
    title: 'Выбросы',
    description: 'Обнаруживает аномальные значения через IQR и Z-score, визуализирует их расположение.',
  },
  {
    emoji: '🔄',
    title: 'Дубликаты',
    description: 'Ищет полные и частичные дубликаты строк, которые искажают распределение данных.',
  },
  {
    emoji: '✨',
    title: 'Авточистка',
    description: 'Одним кликом применяет все рекомендованные исправления и отдаёт готовый чистый файл.',
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 bg-surface/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold text-center text-text mb-16"
        >
          Что находит DATAPOST
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feature, i) => (
            <motion.div key={feature.title} custom={i} variants={cardVariants}>
              <Card hover className="h-full">
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="text-base font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
