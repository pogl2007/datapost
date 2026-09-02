'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

export function QuickUpload() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => router.push('/upload')}
      className="cursor-pointer bg-surface border-2 border-dashed border-border hover:border-accent rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-accent mb-3"
      >
        <UploadCloud size={36} strokeWidth={1.5} />
      </motion.div>
      <p className="text-sm font-medium text-text mb-1">Загрузить новый датасет</p>
      <p className="text-xs text-text-muted">Нажми чтобы перейти к загрузке</p>
    </motion.div>
  );
}
