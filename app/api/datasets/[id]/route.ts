import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
