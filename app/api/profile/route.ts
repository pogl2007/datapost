import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const body = await req.json();
  const { name, password } = body as { name?: string; password?: string };

  const data: { name?: string; passwordHash?: string } = {};

  if (typeof name === 'string' && name.trim().length > 0) {
    data.name = name.trim();
  }

  if (typeof password === 'string' && password.length > 0) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ success: true, name: user.name });
}
