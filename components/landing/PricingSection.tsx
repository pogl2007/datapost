'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Card, cardVariants, staggerContainer } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const FREE_FEATURES = [
  { text: 'До 5MB на файл', included: true },
  { text: '3 загрузки в день', included: true },
  { text: 'Только CSV', included: true },
  { text: 'История: последние 5 датасетов', included: true },
  { text: 'Автоочистка данных', included: false },
  { text: 'Скачивание чистого файла', included: false },
];

const PRO_FEATURES = [
  { text: 'До 100MB на файл', included: true },
  { text: 'Безлимитные загрузки', included: true },
  { text: 'CSV, Excel, JSON', included: true },
  { text: 'Полная история датасетов', included: true },
  { text: 'Автоочистка данных', included: true },
  { text: 'Скачивание чистого файла', included: true },
];

export function PricingSection() {
  const { isAuthenticated, plan } = useCurrentUser();
  const isPro = isAuthenticated && plan === 'PRO';

  return (
    <section id="pricing" className="py-24 bg-surface/30 border-y border-border">
      <div className="max-w-4xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold text-center text-text mb-16"
        >
          Тарифы
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <motion.div custom={0} variants={cardVariants}>
            <Card className="h-full flex flex-col">
              <h3 className="text-xl font-semibold text-text mb-1">FREE</h3>
              <p className="text-3xl font-bold text-text mono mb-6">
                0 ₽<span className="text-sm text-text-secondary font-normal"> / навсегда</span>
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <Check size={16} className="text-success shrink-0" />
                    ) : (
                      <X size={16} className="text-text-muted shrink-0" />
                    )}
                    <span className={f.included ? 'text-text' : 'text-text-muted'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register">
                <span className="block text-center w-full bg-surface2 border border-border hover:border-border-strong text-text px-5 py-3 rounded-lg font-medium transition-colors">
                  Начать бесплатно
                </span>
              </Link>
            </Card>
          </motion.div>

          <motion.div custom={1} variants={cardVariants}>
            <Card className="h-full flex flex-col border-accent relative overflow-visible">
              <Badge variant="accent" className="absolute -top-3 left-6">
                Популярный
              </Badge>
              <h3 className="text-xl font-semibold text-text mb-1">PRO</h3>
              <p className="text-3xl font-bold text-text mono mb-6">
                199 ₽<span className="text-sm text-text-secondary font-normal"> / месяц</span>
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    <Check size={16} className="text-success shrink-0" />
                    <span className="text-text">{f.text}</span>
                  </li>
                ))}
              </ul>
              {isPro ? (
                <span className="block text-center w-full bg-success/10 border border-success/30 text-success px-5 py-3 rounded-lg font-medium">
                  PRO уже есть
                </span>
              ) : (
                <Link href="/subscription">
                  <span className="block text-center w-full bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded-lg font-medium transition-colors">
                    Перейти на PRO
                  </span>
                </Link>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
