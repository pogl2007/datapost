import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callClean } from '@/lib/api';
import { canAutoClean } from '@/lib/planGuard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  if (!canAutoClean(session.user.plan)) {
    return NextResponse.json(
      { error: 'Автоочистка доступна только на плане PRO' },
      { status: 403 }
    );
  }

  const dataset = await prisma.dataset.findUnique({ where: { id: params.id } });
  if (!dataset) {
    return NextResponse.json({ error: 'Датасет не найден' }, { status: 404 });
  }
  if (dataset.userId !== session.user.id) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    let changesMade: unknown[] = [];

    if (!dataset.originalFile) {
      return NextResponse.json(
        { error: 'Исходный файл недоступен для очистки. Загрузите датасет заново.' },
        { status: 422 }
      );
    }

    const sourceBase64 = Buffer.from(dataset.originalFile).toString('base64');

    const result = await callClean({
      fileContentBase64: sourceBase64,
      fileName: dataset.fileName,
      issues: (dataset.issues as unknown[]) || [],
    });

    changesMade = result.changes_made || [];
    const cleanedFileBase64: string = result.cleaned_file_base64;
    const buffer = Buffer.from(cleanedFileBase64, 'base64');

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { cleanedFile: buffer },
    });

    // Strip characters that could break out of the quoted filename parameter
    // (or inject header syntax) in Content-Disposition.
    const safeFileName = dataset.fileName.replace(/[^\w.\- ]/g, '_');
    const cleanedName = safeFileName.replace(/(\.[^.]+)$/, '_cleaned$1');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${cleanedName}"`,
        'X-Changes-Made': encodeURIComponent(JSON.stringify(changesMade)),
      },
    });
  } catch (err) {
    console.error('Clean error:', err);
    return NextResponse.json({ error: 'Не удалось очистить датасет' }, { status: 502 });
  }
}
