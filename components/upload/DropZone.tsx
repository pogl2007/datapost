'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Lock } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';

interface DropZoneProps {
  onFile: (file: File) => void;
  allowedFormats: string[];
  isPro: boolean;
}

export function DropZone({ onFile, allowedFormats, isPro }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowedFormats.includes(ext)) {
        setError(
          isPro
            ? `Формат .${ext} не поддерживается`
            : `Формат .${ext} доступен только в PRO — на FREE доступен только CSV`
        );
        return;
      }
      setError(null);
      onFile(file);
    },
    [allowedFormats, isPro, onFile]
  );

  const { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop } = useDragDrop({
    onFile: handleFile,
  });

  return (
    <div>
      <motion.div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-20 px-6 text-center ${
          isDragging
            ? 'border-accent bg-accent-subtle/30 scale-[1.01]'
            : 'border-border hover:border-border-strong bg-surface'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={allowedFormats.map((f) => `.${f}`).join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        <motion.div
          animate={
            isDragging
              ? { y: [0, -8, 0], scale: 1.15 }
              : { scale: [1, 1.08, 1] }
          }
          transition={{
            duration: isDragging ? 0.6 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-5 text-accent"
        >
          <UploadCloud size={56} strokeWidth={1.5} />
        </motion.div>

        {isDragging ? (
          <p className="text-lg font-medium text-accent-hover">Отпусти файл</p>
        ) : (
          <>
            <p className="text-lg font-medium text-text mb-1">Перетащи файл сюда</p>
            <p className="text-sm text-text-secondary">
              или нажми чтобы выбрать · {allowedFormats.map((f) => f.toUpperCase()).join(', ')}
            </p>
          </>
        )}

        {!isPro && (
          <div className="mt-6 flex items-center gap-1.5 text-xs text-text-muted">
            <Lock size={12} /> Excel и JSON доступны в PRO
          </div>
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <Lock size={14} /> {error}
        </motion.p>
      )}
    </div>
  );
}
