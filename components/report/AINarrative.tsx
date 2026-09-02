'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function AINarrative({ summary }: { summary: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bot size={20} className="text-accent" />
        <h3 className="text-base font-semibold text-text">🤖 Анализ от DATAPOST AI</h3>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{summary}</p>
    </motion.div>
  );
}
