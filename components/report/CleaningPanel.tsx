'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CleaningPanelProps {
  datasetId: string;
  isPro: boolean;
}

const CHECKLIST = [
  'Заполнить пропуски',
  'Удалить дубликаты',
  'Исправить типы',
  'Обработать выбросы',
];

export function CleaningPanel({ datasetId, isPro }: CleaningPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/datasets/${datasetId}/clean`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось очистить датасет');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const fileName = match ? match[1] : 'cleaned_dataset';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при очистке');
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative bg-surface border border-border rounded-lg p-6 overflow-hidden"
      >
        <div className="blur-sm pointer-events-none select-none">
          <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Автоочистка датасета
          </h3>
          <ul className="space-y-2 mb-6">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={16} className="text-success" /> {item}
              </li>
            ))}
          </ul>
          <div className="h-11 w-full bg-accent rounded-lg" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] gap-3">
          <Lock size={28} className="text-accent" />
          <p className="text-sm text-text font-medium">Автоочистка доступна в PRO</p>
          <Link href="/subscription">
            <Button size="sm">Разблокировать в PRO</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg p-6"
    >
      <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-accent" /> Автоочистка датасета
      </h3>
      <ul className="space-y-2 mb-6">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
            <CheckCircle2 size={16} className="text-success" /> {item}
          </li>
        ))}
      </ul>

      {error && (
        <p className="mb-4 text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button fullWidth size="lg" onClick={handleDownload} isLoading={loading}>
        <Download size={18} /> Скачать очищенный датасет
      </Button>
    </motion.div>
  );
}
