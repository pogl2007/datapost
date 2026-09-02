'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/planGuard';
import type { DatasetSummary } from '@/types';

interface DatasetHistoryProps {
  datasets: DatasetSummary[];
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 10;

function scoreVariant(score: number | null) {
  if (score === null) return 'muted' as const;
  if (score < 50) return 'danger' as const;
  if (score < 75) return 'warning' as const;
  return 'success' as const;
}

export function DatasetHistory({ datasets, onDelete }: DatasetHistoryProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(datasets.length / PAGE_SIZE));
  const visible = datasets.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (datasets.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-10 text-center">
        <p className="text-text-secondary text-sm">У тебя пока нет загруженных датасетов</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface2 text-text-secondary text-xs">
              <th className="text-left px-4 py-3 font-medium">Файл</th>
              <th className="text-left px-4 py-3 font-medium">Формат</th>
              <th className="text-left px-4 py-3 font-medium">Строки</th>
              <th className="text-left px-4 py-3 font-medium">Скор</th>
              <th className="text-left px-4 py-3 font-medium">Проблем</th>
              <th className="text-left px-4 py-3 font-medium">Дата</th>
              <th className="text-left px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr
                key={d.id}
                onClick={() => router.push(`/report/${d.id}`)}
                className="border-t border-border hover:bg-surface2/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-mono text-text">{d.fileName}</div>
                  <div className="text-xs text-text-muted">{formatBytes(d.fileSize)}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge mono variant="muted">
                    {d.format}
                  </Badge>
                </td>
                <td className="px-4 py-3 mono text-text-secondary">
                  {d.rowCount.toLocaleString('ru-RU')}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={scoreVariant(d.qualityScore)} mono>
                    {d.qualityScore ?? '—'}
                  </Badge>
                </td>
                <td className="px-4 py-3 mono text-text-secondary">{d.issueCount ?? '—'}</td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {new Date(d.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/report/${d.id}`)}>
                      Смотреть отчёт
                    </Button>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                      aria-label="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-text-muted">
            Страница {page + 1} из {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-border text-text-secondary disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-border text-text-secondary disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
