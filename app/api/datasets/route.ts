import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getHistoryLimit } from '@/lib/planGuard';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const limit = getHistoryLimit(session.user.plan);

  const datasets = await prisma.dataset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit ?? undefined,
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      rowCount: true,
      colCount: true,
      format: true,
      status: true,
      qualityScore: true,
      issueCount: true,
      criticalCount: true,
      summary: true,
      issues: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({ datasets });
}
