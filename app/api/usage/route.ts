import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDailyUploadLimit, todayKey } from '@/lib/planGuard';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const limit = getDailyUploadLimit(session.user.plan);
  const date = todayKey();

  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  const used = usage?.uploads ?? 0;

  return NextResponse.json({
    plan: session.user.plan,
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
  });
}
