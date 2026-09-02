'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DropZone } from '@/components/upload/DropZone';
import { FilePreview } from '@/components/upload/FilePreview';
import { SettingsPanel } from '@/components/upload/SettingsPanel';
import { LoadingScreen } from '@/components/upload/LoadingScreen';
import { PlanBadge } from '@/components/layout/PlanBadge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getAllowedFormats, getFileSizeLimit, formatBytes } from '@/lib/planGuard';
import type { TaskType } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const { plan, isAuthenticated } = useCurrentUser();
  const isPro = plan === 'PRO';

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('classification');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => setUsage({ used: d.used, limit: d.limit }))
      .catch(() => {});
  }, [isAuthenticated]);

  function handleFile(f: File) {
    setSubmitError(null);
    const sizeLimit = getFileSizeLimit(plan as 'FREE' | 'PRO');
    if (f.size > sizeLimit) {
      setSizeError(`Файл превышает допустимый размер ${formatBytes(sizeLimit)} на плане ${plan}`);
      setFile(null);
      return;
    }
    setSizeError(null);
    setFile(f);
    setTargetColumn('');
  }

  async function handleSubmit() {
    if (!file) return;
    setSubmitError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_column', targetColumn);
      formData.append('task_type', taskType);

      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setSubmitError(data.error || 'Не удалось загрузить датасет');
        return;
      }

      router.push(`/report/${data.datasetId}`);
    } catch {
      setLoading(false);
      setSubmitError('Произошла ошибка сети. Попробуйте снова.');
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto px-6"
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <h1 className="text-2xl font-semibold text-text">Загрузить датасет</h1>
            <div className="flex items-center gap-3">
              <PlanBadge plan={plan as 'FREE' | 'PRO'} />
              {!isPro && usage?.limit !== null && usage && (
                <span className="text-sm text-text-secondary">
                  осталось{' '}
                  <span className="mono text-text">
                    {Math.max(0, (usage.limit ?? 0) - usage.used)}/{usage.limit}
                  </span>{' '}
                  сегодня
                </span>
              )}
            </div>
          </div>

          <DropZone onFile={handleFile} allowedFormats={getAllowedFormats(plan as 'FREE' | 'PRO')} isPro={isPro} />

          {sizeError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2"
            >
              {sizeError}
            </motion.p>
          )}

          {file && <FilePreview file={file} onHeaders={setHeaders} />}

          {file && (
            <SettingsPanel
              headers={headers}
              targetColumn={targetColumn}
              onTargetColumnChange={setTargetColumn}
              taskType={taskType}
              onTaskTypeChange={setTaskType}
              onSubmit={handleSubmit}
            />
          )}

          {submitError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2"
            >
              {submitError}
            </motion.p>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
