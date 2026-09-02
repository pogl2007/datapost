'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, cardVariants, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UpgradeModal } from '@/components/layout/UpgradeModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const FREE_FEATURES = ['До 5MB на файл', '3 загрузки в день', 'Только CSV', 'История: последние 5 датасетов'];
const PRO_FEATURES = [
  'До 100MB на файл',
  'Безлимитные загрузки',
  'CSV, Excel, JSON',
  'Полная история датасетов',
  'Автоочистка данных',
  'Скачивание чистого файла',
];

export default function SubscriptionPage() {
  const { plan } = useCurrentUser();
  const isPro = plan === 'PRO';
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-lg border p-5 flex items-center gap-4 ${
              isPro ? 'bg-accent-subtle/40 border-accent/40' : 'bg-surface border-border'
            }`}
          >
            <div className="h-11 w-11 rounded-full bg-accent-subtle flex items-center justify-center shrink-0">
              <Crown size={20} className="text-accent-hover" />
            </div>
            <div>
              <p className="text-text font-medium">
                Твой текущий план: <span className="mono">{isPro ? 'PRO' : 'FREE'}</span>
              </p>
              <p className="text-text-secondary text-sm">
                {isPro
                  ? 'Спасибо за поддержку DATAPOST! Тебе доступны все возможности.'
                  : 'Обнови план, чтобы снять ограничения на загрузку и получить автоочистку.'}
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <motion.div custom={0} variants={cardVariants}>
              <Card className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-text mb-1">FREE</h3>
                <p className="text-3xl font-bold text-text mono mb-6">0 ₽</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-text">
                      <Check size={16} className="text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {!isPro && (
                  <span className="block text-center w-full bg-surface2 border border-border text-text-secondary px-5 py-3 rounded-lg font-medium">
                    Текущий план
                  </span>
                )}
              </Card>
            </motion.div>

            <motion.div custom={1} variants={cardVariants}>
              <Card className="h-full flex flex-col border-accent">
                <h3 className="text-xl font-semibold text-text mb-1">PRO</h3>
                <p className="text-3xl font-bold text-text mono mb-6">
                  199 ₽<span className="text-sm text-text-secondary font-normal"> / месяц</span>
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-text">
                      <Check size={16} className="text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {isPro ? (
                  <span className="block text-center w-full bg-success/10 border border-success/30 text-success px-5 py-3 rounded-lg font-medium">
                    Текущий план
                  </span>
                ) : (
                  <Button fullWidth size="lg" onClick={() => setModalOpen(true)}>
                    Перейти на PRO
                  </Button>
                )}
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
