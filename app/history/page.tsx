'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Download, FileText } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, cardVariants, staggerContainer } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatBytes } from '@/lib/planGuard';
import type { DatasetSummary } from '@/types';

const ISSUE_TYPE_LABELS: Record<string, string> = {
  target_leakage: 'Утечка таргета',
  class_imbalance: 'Дисбаланс',
  missing_data: 'Пропуски',
  outliers: 'Выбросы',
  duplicates: 'Дубликаты',
  wrong_dtype: 'Тип данных',
  high_cardinality: 'Кардинальность',
  low_variance: 'Дисперсия',
  correlation: 'Корреляция',
  other: 'Другое',
};

function scoreColorClass(score: number | null) {
  if (score === null) return 'text-text-muted';
  if (score < 50) return 'text-danger';
  if (score < 75) return 'text-warning';
  return 'text-success';
}

export default function HistoryPage() {
  const { plan } = useCurrentUser();
  const isPro = plan === 'PRO';

  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('Все');
  const [scoreFilter, setScoreFilter] = useState('Все');

  useEffect(() => {
    fetch('/api/datasets')
      .then((r) => r.json())
      .then((d) => setDatasets(d.datasets || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(id: string) {
    const res = await fetch(`/api/datasets/${id}/clean`, { method: 'POST' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_dataset';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    return datasets.filter((d) => {
      if (search && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false;
      if (formatFilter !== 'Все' && d.format !== formatFilter) return false;
      if (scoreFilter === 'good' && (d.qualityScore ?? 0) <= 75) return false;
      if (scoreFilter === 'bad' && (d.qualityScore ?? 100) >= 50) return false;
      return true;
    });
  }, [datasets, search, formatFilter, scoreFilter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-semibold text-text"
          >
            История загрузок
          </motion.h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени файла..."
                className="w-full bg-surface2 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option>Все</option>
              <option value="CSV">CSV</option>
              <option value="Excel">Excel</option>
              <option value="JSON">JSON</option>
            </select>

            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="Все">Все скоры</option>
              <option value="good">Хорошие &gt;75</option>
              <option value="bad">Проблемные &lt;50</option>
            </select>
          </div>

          {loading ? (
            <p className="text-text-secondary text-sm">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-10 text-center">
              <p className="text-text-secondary text-sm">Ничего не найдено</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((d, i) => {
                const topIssueTypes = Array.from(
                  new Set((d.issues || []).map((issue) => issue.type))
                ).slice(0, 3);
                return (
                  <motion.div key={d.id} custom={i} variants={cardVariants}>
                    <Card hover className="h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <FileText size={16} className="text-accent" />
                        <span className="font-mono text-sm text-text truncate">{d.fileName}</span>
                        <Badge mono variant="muted">
                          {d.format}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mb-4">
                        {new Date(d.createdAt).toLocaleDateString('ru-RU')} · {formatBytes(d.fileSize)}
                      </p>

                      <p className={`text-3xl font-bold mono mb-4 ${scoreColorClass(d.qualityScore)}`}>
                        {d.qualityScore ?? '—'}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5 flex-1">
                        {topIssueTypes.length > 0 ? (
                          topIssueTypes.map((t) => (
                            <Badge key={t} variant="muted">
                              {ISSUE_TYPE_LABELS[t] || t}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="success">Без проблем</Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/report/${d.id}`} className="flex-1">
                          <Button size="sm" fullWidth variant="secondary">
                            Отчёт
                          </Button>
                        </Link>
                        {isPro ? (
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(d.id)}>
                            <Download size={14} />
                          </Button>
                        ) : (
                          <Link href="/subscription">
                            <Button size="sm" variant="ghost" disabled>
                              <Download size={14} />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
