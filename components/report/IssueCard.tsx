'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MiniChart } from '@/components/report/MiniChart';
import type { Issue } from '@/types';

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const SEVERITY_META = {
  critical: { label: 'Критично', variant: 'danger' as const, border: 'border-l-danger' },
  warning: { label: 'Предупреждение', variant: 'warning' as const, border: 'border-l-warning' },
  info: { label: 'Инфо', variant: 'accent' as const, border: 'border-l-accent' },
};

export function IssueCard({ issue, index }: IssueCardProps) {
  const [copied, setCopied] = useState(false);
  const meta = SEVERITY_META[issue.severity];

  function handleCopy() {
    navigator.clipboard.writeText(issue.fix_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`bg-surface border border-border border-l-4 ${meta.border} rounded-lg p-5`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-base font-semibold text-text">{issue.title}</h4>
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {issue.column && (
            <Badge mono variant="muted">
              {issue.column}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 leading-relaxed">{issue.description}</p>

      {issue.chartType && issue.chartType !== 'none' && (
        <div className="mb-4">
          <MiniChart chartType={issue.chartType} issue={issue} />
        </div>
      )}

      <div className="relative bg-background border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface2 border-b border-border">
          <span className="text-xs text-text-muted mono">fix.py</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-success" /> Скопировано
              </>
            ) : (
              <>
                <Copy size={13} /> Копировать
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 text-xs text-text-secondary mono overflow-x-auto whitespace-pre-wrap">
          {issue.fix_code}
        </pre>
      </div>
    </motion.div>
  );
}
