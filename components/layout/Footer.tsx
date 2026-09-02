import { Database } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Database size={18} className="text-accent" />
          <span className="font-semibold text-text">DATAPOST</span>
          <span className="text-text-muted">· 2025 · AI Dataset Auditor</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <span>Работает с pandas / sklearn / numpy</span>
        </div>
      </div>
    </footer>
  );
}
