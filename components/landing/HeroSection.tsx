'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { FloatingDataBlocks } from './FloatingDataBlocks';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <FloatingDataBlocks />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent-subtle/40 text-accent-hover text-xs font-medium mb-6"
        >
          <Sparkles size={14} /> AI-powered dataset auditor
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-tight text-text mb-6"
        >
          Найди проблемы в данных до того как они найдут тебя
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-lg text-text-secondary max-w-2xl mx-auto mb-10"
        >
          Загрузи датасет — AI найдёт утечки, пропуски, дисбаланс и выбросы. Почистит и объяснит
          каждую проблему.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link href="/upload">
            <motion.span
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-7 py-3.5 rounded-lg font-medium transition-colors"
            >
              Загрузить датасет <ArrowRight size={18} />
            </motion.span>
          </Link>
          <a href="#how-it-works">
            <motion.span
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 bg-surface2 border border-border hover:border-border-strong text-text px-7 py-3.5 rounded-lg font-medium transition-colors"
            >
              <PlayCircle size={18} /> Смотреть демо
            </motion.span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-xs text-text-muted uppercase tracking-wider">Работает с</span>
          <div className="flex items-center gap-6 text-text-secondary font-mono text-sm">
            <span>pandas</span>
            <span className="text-border-strong">·</span>
            <span>scikit-learn</span>
            <span className="text-border-strong">·</span>
            <span>numpy</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
