import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const dataset = await prisma.dataset.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
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
      stats: true,
      createdAt: true,
      completedAt: true,
      // originalFile/cleanedFile deliberately excluded — the report page never
      // needs raw file bytes, and Buffers serialize to JSON at ~3-4x their size.
      // Download goes through the dedicated /clean endpoint instead.
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Датасет не найден' }, { status: 404 });
  }
  if (dataset.userId !== session.user.id) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  return NextResponse.json({ dataset });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const dataset = await prisma.dataset.findUnique({ where: { id: params.id } });
  if (!dataset) {
    return NextResponse.json({ error: 'Датасет не найден' }, { status: 404 });
  }
  if (dataset.userId !== session.user.id) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  await prisma.dataset.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
