'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Upload as UploadIcon, History as HistoryIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ReportHeader } from '@/components/report/ReportHeader';
import { IssueSidebar, SidebarKey } from '@/components/report/IssueSidebar';
import { IssueCard } from '@/components/report/IssueCard';
import { DataTable } from '@/components/report/DataTable';
import { AINarrative } from '@/components/report/AINarrative';
import { CleaningPanel } from '@/components/report/CleaningPanel';
import { DatasetChat } from '@/components/report/DatasetChat';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Issue } from '@/types';

interface DatasetRecord {
  id: string;
  fileName: string;
  format: string;
  status: string;
  qualityScore: number | null;
  issueCount: number | null;
  criticalCount: number | null;
  rowCount: number;
  colCount: number;
  summary: string | null;
  issues: Issue[] | null;
  stats: Record<string, unknown> | null;
  createdAt: string;
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { plan } = useCurrentUser();
  const isPro = plan === 'PRO';

  const [dataset, setDataset] = useState<DatasetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSeverity, setActiveSeverity] = useState<SidebarKey>('critical');

  useEffect(() => {
    fetch(`/api/datasets/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Не удалось загрузить отчёт');
        }
        return res.json();
      })
      .then((data) => setDataset(data.dataset))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const issues = useMemo(() => dataset?.issues ?? [], [dataset]);

  const counts = useMemo(() => {
    const c: Record<SidebarKey, number> = { critical: 0, warning: 0, info: 0, ok: 0 };
    for (const issue of issues) {
      c[issue.severity] = (c[issue.severity] ?? 0) + 1;
    }
    if (issues.length === 0) c.ok = 1;
    return c;
  }, [issues]);

  useEffect(() => {
    if (issues.length > 0 && counts.critical === 0) {
      if (counts.warning > 0) setActiveSeverity('warning');
      else if (counts.info > 0) setActiveSeverity('info');
      else setActiveSeverity('ok');
    }
  }, [issues, counts]);

  const filteredIssues = useMemo(
    () => issues.filter((i) => i.severity === activeSeverity),
    [issues, activeSeverity]
  );

  const sampleData = useMemo(() => {
    if (!dataset?.stats) return [];
    const s = dataset.stats as { sample_data?: Record<string, unknown>[] };
    return s.sample_data ?? [];
  }, [dataset]);

  const readyForTraining = useMemo(() => {
    if (!dataset?.stats) return null;
    const s = dataset.stats as { ready_for_training?: boolean };
    return s.ready_for_training ?? null;
  }, [dataset]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Загрузка отчёта...</p>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-danger mb-4">{error || 'Отчёт не найден'}</p>
            <Link href="/dashboard">
              <Button variant="secondary">Вернуться в дашборд</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const criticalCount = dataset.criticalCount ?? 0;
  const verdict =
    readyForTraining === true || (readyForTraining === null && criticalCount === 0)
      ? 'ready'
      : criticalCount > 0
      ? 'not_ready'
      : 'attention';

  const verdictMeta = {
    ready: {
      label: 'ГОТОВ К ОБУЧЕНИЮ',
      icon: CheckCircle2,
      colorClass: 'text-success bg-success/10 border-success/30',
    },
    attention: {
      label: 'ТРЕБУЕТ ВНИМАНИЯ',
      icon: AlertTriangle,
      colorClass: 'text-warning bg-warning/10 border-warning/30',
    },
    not_ready: {
      label: 'НЕ ГОТОВ',
      icon: XCircle,
      colorClass: 'text-danger bg-danger-subtle border-danger/30',
    },
  }[verdict];

  const VerdictIcon = verdictMeta.icon;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <ReportHeader
            fileName={dataset.fileName}
            format={dataset.format}
            createdAt={dataset.createdAt}
            qualityScore={dataset.qualityScore ?? 0}
            rowCount={dataset.rowCount}
            colCount={dataset.colCount}
            issueCount={dataset.issueCount ?? 0}
            criticalCount={criticalCount}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`rounded-lg border p-5 flex items-start gap-4 ${verdictMeta.colorClass}`}
          >
            <VerdictIcon size={24} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-bold text-sm mb-1 tracking-wide">{verdictMeta.label}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{dataset.summary}</p>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6">
            <IssueSidebar counts={counts} active={activeSeverity} onChange={setActiveSeverity} />

            <div className="flex-1 space-y-5">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue, i) => <IssueCard key={issue.id} issue={issue} index={i} />)
              ) : (
                <div className="bg-surface border border-border rounded-lg p-10 text-center">
                  <CheckCircle2 size={36} className="text-success mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">Проблем в этой категории не найдено</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-text mb-4">Предпросмотр данных</h3>
            <div className="bg-surface border border-border rounded-lg p-5">
              <DataTable data={sampleData} issues={issues} />
            </div>
          </div>

          <AINarrative summary={dataset.summary || 'Анализ недоступен.'} />

          <DatasetChat datasetId={dataset.id} isPro={isPro} />

          <CleaningPanel datasetId={dataset.id} isPro={isPro} />

          <div className="flex flex-col sm:flex-row gap-4 pb-4">
            <Link href="/upload" className="flex-1">
              <Button fullWidth variant="secondary" size="lg">
                <UploadIcon size={18} /> Загрузить новый датасет
              </Button>
            </Link>
            <Link href="/history" className="flex-1">
              <Button fullWidth variant="secondary" size="lg">
                <HistoryIcon size={18} /> История загрузок
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
