'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const { update } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await fetch('/api/subscription/activate', { method: 'POST' });
      await update({ plan: 'PRO' });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/upload');
        router.refresh();
      }, 2000);
    } catch {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setSuccess(false);
      setCard('');
      setExpiry('');
      setCvv('');
      setName('');
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={success ? undefined : 'Оформление подписки'}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-6"
          >
            <CheckCircle2 size={56} className="text-success mb-4" />
            <p className="text-xl font-semibold text-text">✓ PRO активирован!</p>
            <p className="text-text-secondary text-sm mt-2">Перенаправляем на загрузку датасета...</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handlePay}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <p className="text-3xl font-bold text-text mono">199 ₽</p>
              <p className="text-text-secondary text-sm">/ месяц</p>
            </div>
            <Input
              label="Номер карты"
              placeholder="0000 0000 0000 0000"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              required
              maxLength={19}
            />
            <div className="flex gap-3">
              <Input
                label="MM/YY"
                placeholder="12/28"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                maxLength={5}
              />
              <Input
                label="CVV"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
                maxLength={3}
                type="password"
              />
            </div>
            <Input
              label="Имя на карте"
              placeholder="IVAN IVANOV"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button type="submit" fullWidth isLoading={loading} size="lg">
              {loading ? 'Обработка платежа...' : 'Оплатить 199 ₽'}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted pt-1">
              <ShieldCheck size={13} /> Тестовый режим · Реальные платежи не проводятся
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
