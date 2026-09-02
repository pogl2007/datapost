import { ReactNode } from 'react';
import { Database } from 'lucide-react';
import { FloatingDataBlocks } from '@/components/landing/FloatingDataBlocks';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden border-r border-border">
        <FloatingDataBlocks />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Database size={48} className="text-accent" />
          <span className="text-3xl font-semibold text-text tracking-tight">DATAPOST</span>
          <span className="text-text-secondary text-sm">AI-аудитор датасетов</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
