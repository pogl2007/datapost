'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Lock, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DatasetChatProps {
  datasetId: string;
  isPro: boolean;
}

export function DatasetChat({ datasetId, isPro }: DatasetChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [questionsLimit, setQuestionsLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isPro);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPro) return;
    (async () => {
      try {
        const res = await fetch(`/api/datasets/${datasetId}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.history || []);
          setQuestionsUsed(data.questionsUsed ?? 0);
          setQuestionsLimit(data.questionsLimit ?? 20);
        }
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [datasetId, isPro]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const remaining = Math.max(0, questionsLimit - questionsUsed);
  const canAsk = remaining > 0 && !loading && input.trim().length > 0;

  async function handleSend() {
    const question = input.trim();
    if (!question || loading || remaining <= 0) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/datasets/${datasetId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось получить ответ');
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      setQuestionsUsed(data.questionsUsed ?? questionsUsed + 1);
      setQuestionsLimit(data.questionsLimit ?? questionsLimit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка чата');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative bg-surface border border-border rounded-lg p-6 overflow-hidden"
      >
        <div className="blur-sm pointer-events-none select-none">
          <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Спроси AI про этот датасет
          </h3>
          <div className="space-y-3 mb-4">
            <div className="h-10 w-2/3 bg-surface2 rounded-lg" />
            <div className="h-10 w-3/4 ml-auto bg-accent-subtle rounded-lg" />
          </div>
          <div className="h-11 w-full bg-surface2 rounded-lg" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] gap-3">
          <Lock size={28} className="text-accent" />
          <p className="text-sm text-text font-medium">AI-чат по датасету доступен в PRO</p>
          <Link href="/subscription">
            <Button size="sm">Разблокировать в PRO</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text flex items-center gap-2">
          <Sparkles size={18} className="text-accent" /> Спроси AI про этот датасет
        </h3>
        <span className="text-xs text-text-muted mono">
          {remaining}/{questionsLimit} вопросов осталось
        </span>
      </div>

      <div ref={scrollRef} className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
        {initialLoading ? (
          <p className="text-sm text-text-secondary">Загрузка истории...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Спроси что-нибудь про этот датасет — например, «какая проблема самая критичная?»
            или «как лучше обработать выбросы в этой колонке?»
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                  m.role === 'user' ? 'bg-accent-subtle text-accent' : 'bg-surface2 text-text-secondary'
                }`}
              >
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`rounded-lg px-3.5 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-accent-subtle text-text'
                    : 'bg-surface2 border border-border text-text'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-2 items-start">
            <div className="shrink-0 h-7 w-7 rounded-full bg-surface2 text-text-secondary flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="rounded-lg px-3.5 py-2.5 text-sm bg-surface2 border border-border text-text-muted">
              Думаю...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {remaining <= 0 ? (
        <p className="text-sm text-text-muted bg-surface2 border border-border rounded-lg px-3 py-2.5">
          Лимит вопросов по этому датасету исчерпан ({questionsLimit}).
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Спроси про этот датасет..."
            disabled={loading}
            maxLength={500}
            className="flex-1 bg-surface2 border border-border focus:border-accent rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors"
          />
          <Button onClick={handleSend} disabled={!canAsk} isLoading={loading}>
            <Send size={16} />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
