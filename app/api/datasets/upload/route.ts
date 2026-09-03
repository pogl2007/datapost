import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callAnalyze } from '@/lib/api';
import {
  getFileSizeLimit,
  getDailyUploadLimit,
  isFormatAllowed,
  getFormatFromFileName,
  todayKey,
} from '@/lib/planGuard';
import type { AnalyzeResult } from '@/types';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userId = session.user.id;
  const plan = session.user.plan;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const targetColumn = (formData.get('target_column') as string) || '';
  const taskType = (formData.get('task_type') as string) || 'classification';

  if (!file) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
  }

  if (!isFormatAllowed(file.name, plan)) {
    return NextResponse.json(
      { error: 'Данный формат файла доступен только на плане PRO' },
      { status: 403 }
    );
  }

  const sizeLimit = getFileSizeLimit(plan);
  if (file.size > sizeLimit) {
    return NextResponse.json(
      { error: `Файл превышает допустимый размер (${Math.round(sizeLimit / 1024 / 1024)}MB)` },
      { status: 413 }
    );
  }

  const dailyLimit = getDailyUploadLimit(plan);
  const usageDate = todayKey();
  if (dailyLimit !== null) {
    // Reserve a slot atomically (increment-or-create) before doing any work,
    // then check the post-increment count. This closes the race where two
    // concurrent uploads both read "under limit" and both proceed.
    const usage = await prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date: usageDate } },
      create: { userId, date: usageDate, uploads: 1 },
      update: { uploads: { increment: 1 } },
    });
    if (usage.uploads > dailyLimit) {
      await prisma.dailyUsage.update({
        where: { userId_date: { userId, date: usageDate } },
        data: { uploads: { decrement: 1 } },
      });
      return NextResponse.json(
        { error: `Достигнут дневной лимит загрузок (${dailyLimit}/день) на плане FREE` },
        { status: 429 }
      );
    }
  }

  const dataset = await prisma.dataset.create({
    data: {
      userId,
      fileName: file.name,
      fileSize: file.size,
      rowCount: 0,
      colCount: 0,
      format: getFormatFromFileName(file.name),
      status: 'PROCESSING',
    },
  });

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const result = (await callAnalyze({
      file,
      fileName: file.name,
      targetColumn,
      taskType,
      userId,
      plan,
    })) as AnalyzeResult;

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        originalFile: fileBuffer,
        status: 'COMPLETED',
        rowCount: result.row_count,
        colCount: result.col_count,
        qualityScore: Math.round(result.quality_score),
        issueCount: result.issues?.length ?? 0,
        criticalCount: result.critical_count,
        summary: result.summary,
        issues: result.issues as unknown as object,
        stats: {
          ...(result.stats as object),
          sample_data: result.sample_data,
          ready_for_training: result.ready_for_training,
        } as unknown as object,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ datasetId: dataset.id });
  } catch (err) {
    console.error('Analyze error:', err);
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { status: 'FAILED' },
    });
    if (dailyLimit !== null) {
      // Release the reserved slot — a failed analysis shouldn't count against
      // the daily limit.
      await prisma.dailyUsage.update({
        where: { userId_date: { userId, date: usageDate } },
        data: { uploads: { decrement: 1 } },
      });
    }
    return NextResponse.json(
      { error: 'Не удалось проанализировать датасет. Попробуйте снова.' },
      { status: 502 }
    );
  }
}
