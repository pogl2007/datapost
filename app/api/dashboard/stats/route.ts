import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Issue } from '@/types';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const datasets = await prisma.dataset.findMany({
    where: { userId: session.user.id, status: 'COMPLETED' },
  });

  const totalDatasets = datasets.length;
  const avgQualityScore =
    totalDatasets > 0
      ? Math.round(
          datasets.reduce((sum, d) => sum + (d.qualityScore ?? 0), 0) / totalDatasets
        )
      : 0;

  const totalIssues = datasets.reduce((sum, d) => sum + (d.issueCount ?? 0), 0);

  const typeCounts: Record<string, number> = {};
  for (const d of datasets) {
    const issues = (d.issues as unknown as Issue[]) || [];
    for (const issue of issues) {
      typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
    }
  }

  const topIssues = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const mostCommonIssueType = topIssues[0]?.type ?? null;

  return NextResponse.json({
    totalDatasets,
    avgQualityScore,
    totalIssues,
    mostCommonIssueType,
    topIssues,
  });
}
