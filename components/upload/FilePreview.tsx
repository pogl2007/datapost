'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { FileText, Rows3, Columns3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatBytes, getFormatFromFileName } from '@/lib/planGuard';

interface FilePreviewProps {
  file: File;
  onHeaders: (headers: string[]) => void;
}

export function FilePreview({ file, onHeaders }: FilePreviewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const format = getFormatFromFileName(file.name);

  useEffect(() => {
    setHeaders([]);
    setRows([]);
    setRowCount(null);
    setUnsupported(false);

    if (format !== 'CSV') {
      setUnsupported(true);
      onHeaders([]);
      return;
    }

    Papa.parse(file, {
      complete: (result) => {
        const data = result.data as string[][];
        const filtered = data.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
        const [head, ...body] = filtered;
        setHeaders(head || []);
        setRows(body.slice(0, 5));
        setRowCount(body.length);
        onHeaders(head || []);
      },
      skipEmptyLines: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4 }}
      className="mt-6 bg-surface border border-border rounded-lg p-6"
    >
      <div className="flex items-center flex-wrap gap-3 mb-5">
        <FileText size={20} className="text-accent" />
        <span className="font-mono text-text font-medium">{file.name}</span>
        <Badge variant="accent" mono>
          {format}
        </Badge>
        <span className="text-text-secondary text-sm">{formatBytes(file.size)}</span>
        {rowCount !== null && (
          <div className="flex items-center gap-4 ml-auto text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Rows3 size={14} /> {rowCount.toLocaleString('ru-RU')} строк
            </span>
            <span className="flex items-center gap-1.5">
              <Columns3 size={14} /> {headers.length} колонок
            </span>
          </div>
        )}
      </div>

      {unsupported ? (
        <p className="text-sm text-text-muted italic py-6 text-center">
          Предпросмотр недоступен для этого формата
        </p>
      ) : headers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface2">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-mono text-text-secondary font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-text-secondary whitespace-nowrap mono">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-text-muted italic py-6 text-center">Разбор файла...</p>
      )}
    </motion.div>
  );
}
