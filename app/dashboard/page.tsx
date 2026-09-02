'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PlanBadge } from '@/components/layout/PlanBadge';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TopIssuesChart } from '@/components/dashboard/TopIssuesChart';
import { DatasetHistory } from '@/components/dashboard/DatasetHistory';
import { QuickUpload } from '@/components/dashboard/QuickUpload';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { DashboardStats, DatasetSummary } from '@/types';

export default function DashboardPage() {
  const { user, plan } = useCurrentUser();
  const isPro = plan === 'PRO';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [statsRes, datasetsRes, usageRes] = await Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/datasets').then((r) => r.json()),
      fetch('/api/usage').then((r) => r.json()),
    ]);
    setStats(statsRes);
    setDatasets(datasetsRes.datasets || []);
    setUsage({ used: usageRes.used, limit: usageRes.limit });
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Удалить этот датасет?')) return;
    await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between flex-wrap gap-3"
          >
            <div>
              <h1 className="text-2xl font-semibold text-text mb-1">
                Привет, {user?.name || 'друг'} 👋
              </h1>
              <div className="flex items-center gap-3">
                <PlanBadge plan={plan as 'FREE' | 'PRO'} />
                {!isPro && usage?.limit !== null && usage && (
                  <span className="text-sm text-text-secondary">
                    осталось{' '}
                    <span className="mono text-text">
                      {Math.max(0, (usage.limit ?? 0) - usage.used)}/{usage.limit}
                    </span>{' '}
                    загрузок сегодня
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {loading ? (
            <p className="text-text-secondary text-sm">Загрузка дашборда...</p>
          ) : (
            <>
              {stats && <StatsCards stats={stats} />}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {stats && <TopIssuesChart topIssues={stats.topIssues} />}
                </div>
                <QuickUpload />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text mb-4">История датасетов</h2>
                <DatasetHistory datasets={datasets} onDelete={handleDelete} />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
