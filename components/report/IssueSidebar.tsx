'use client';

import { motion } from 'framer-motion';
import type { IssueSeverity } from '@/types';

export type SidebarKey = IssueSeverity | 'ok';

interface IssueSidebarProps {
  counts: Record<SidebarKey, number>;
  active: SidebarKey;
  onChange: (key: SidebarKey) => void;
}

const ITEMS: { key: SidebarKey; label: string; emoji: string }[] = [
  { key: 'critical', label: 'Критичные', emoji: '🔴' },
  { key: 'warning', label: 'Предупреждения', emoji: '🟡' },
  { key: 'info', label: 'Инфо', emoji: '🔵' },
  { key: 'ok', label: 'Всё ок', emoji: '✅' },
];

export function IssueSidebar({ counts, active, onChange }: IssueSidebarProps) {
  return (
    <div className="md:w-60 shrink-0">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-lg text-sm whitespace-nowrap transition-colors text-left ${
                isActive ? 'bg-surface2 text-text' : 'text-text-secondary hover:bg-surface2/50 hover:text-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent rounded-full"
                  transition={{ duration: 0.2 }}
                />
              )}
              <span>{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              <span className="mono text-xs text-text-muted">({counts[item.key] ?? 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
