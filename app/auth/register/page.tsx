'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Введите корректный email';
    if (password.length < 8) next.password = 'Пароль должен быть не короче 8 символов';
    if (confirmPassword !== password) next.confirmPassword = 'Пароли не совпадают';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Не удалось зарегистрироваться' });
        setLoading(false);
        return;
      }

      const signInRes = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);

      if (signInRes?.error) {
        setErrors({ form: 'Регистрация прошла успешно, но вход не удался. Попробуйте войти вручную.' });
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrors({ form: 'Внутренняя ошибка. Попробуйте снова.' });
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md bg-surface2 border border-border rounded-lg p-8"
    >
      <h1 className="text-2xl font-semibold text-text mb-1">Создать аккаунт</h1>
      <p className="text-text-secondary text-sm mb-8">Начни бесплатно — без карты</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Имя"
          type="text"
          placeholder="Иван Иванов"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Пароль"
          type="password"
          placeholder="Минимум 8 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Input
          label="Подтверждение пароля"
          type="password"
          placeholder="Повторите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        {errors.form && (
          <p className="text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2">
            {errors.form}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" isLoading={loading}>
          Зарегистрироваться
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="text-accent-hover hover:underline">
          Войти
        </Link>
      </p>
    </motion.div>
  );
}
