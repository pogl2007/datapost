import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callChat, type ChatMessage } from '@/lib/api';
import { canUseChat, CHAT_MAX_QUESTIONS_PER_DATASET } from '@/lib/planGuard';

const MAX_QUESTION_LENGTH = 500;
// Chat history is stored compactly: only role+content are kept (no timestamps/ids),
// and each message is truncated so a long-running chat never bloats the row.
const MAX_STORED_MESSAGE_LENGTH = 800;
const MAX_STORED_MESSAGES = CHAT_MAX_QUESTIONS_PER_DATASET * 2;

function compress(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .slice(-MAX_STORED_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.length > MAX_STORED_MESSAGE_LENGTH
        ? m.content.slice(0, MAX_STORED_MESSAGE_LENGTH) + '…'
        : m.content,
    }));
}

async function loadOwnedDataset(id: string, userId: string) {
  const dataset = await prisma.dataset.findUnique({ where: { id } });
  if (!dataset) return { error: NextResponse.json({ error: 'Датасет не найден' }, { status: 404 }) };
  if (dataset.userId !== userId) {
    return { error: NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 }) };
  }
  return { dataset };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { dataset, error } = await loadOwnedDataset(params.id, session.user.id);
  if (error) return error;

  const history = ((dataset!.chatHistory as unknown as ChatMessage[]) || []) as ChatMessage[];
  const questionsUsed = history.filter((m) => m.role === 'user').length;

  return NextResponse.json({
    history,
    questionsUsed,
    questionsLimit: CHAT_MAX_QUESTIONS_PER_DATASET,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  if (!canUseChat(session.user.plan)) {
    return NextResponse.json(
      { error: 'AI-чат по датасету доступен только на плане PRO' },
      { status: 403 }
    );
  }

  const { dataset, error } = await loadOwnedDataset(params.id, session.user.id);
  if (error) return error;

  let question = '';
  try {
    const body = await req.json();
    question = typeof body?.question === 'string' ? body.question.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: 'Вопрос не может быть пустым' }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Вопрос слишком длинный (максимум ${MAX_QUESTION_LENGTH} символов)` },
      { status: 400 }
    );
  }

  const history = ((dataset!.chatHistory as unknown as ChatMessage[]) || []) as ChatMessage[];
  const questionsUsed = history.filter((m) => m.role === 'user').length;

  if (questionsUsed >= CHAT_MAX_QUESTIONS_PER_DATASET) {
    return NextResponse.json(
      { error: `Достигнут лимит вопросов по этому датасету (${CHAT_MAX_QUESTIONS_PER_DATASET})` },
      { status: 429 }
    );
  }

  try {
    const result = await callChat({
      summary: dataset!.summary ?? '',
      qualityScore: dataset!.qualityScore,
      rowCount: dataset!.rowCount,
      colCount: dataset!.colCount,
      issues: (dataset!.issues as unknown as unknown[]) || [],
      stats: dataset!.stats,
      history,
      question,
    });

    const updatedHistory = compress([
      ...history,
      { role: 'user', content: question },
      { role: 'assistant', content: result.answer },
    ]);

    await prisma.dataset.update({
      where: { id: dataset!.id },
      data: { chatHistory: updatedHistory as unknown as object },
    });

    return NextResponse.json({
      answer: result.answer,
      questionsUsed: questionsUsed + 1,
      questionsLimit: CHAT_MAX_QUESTIONS_PER_DATASET,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Не удалось получить ответ от AI' }, { status: 502 });
  }
}
