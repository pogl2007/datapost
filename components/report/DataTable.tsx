'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { Issue } from '@/types';

interface DataTableProps {
  data: Record<string, unknown>[];
  issues: Issue[];
}

const columnHelper = createColumnHelper<Record<string, unknown>>();

export function DataTable({ data, issues }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);

  const columnKeys = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const criticalColumns = useMemo(
    () => new Set(issues.filter((i) => i.severity === 'critical' && i.column).map((i) => i.column)),
    [issues]
  );
  const warningColumns = useMemo(
    () => new Set(issues.filter((i) => i.severity === 'warning' && i.column).map((i) => i.column)),
    [issues]
  );

  function cellClass(col: string, value: unknown) {
    const isEmpty = value === null || value === undefined || value === '';
    if (isEmpty && criticalColumns.has(col)) return 'bg-danger-subtle/60 text-danger';
    if (isEmpty && warningColumns.has(col)) return 'bg-warning/10 text-warning';
    if (warningColumns.has(col) && typeof value === 'number') return 'bg-warning/5';
    return '';
  }

  const columns = useMemo(
    () =>
      columnKeys.map((key) =>
        columnHelper.accessor((row) => row[key], {
          id: key,
          header: key,
          cell: (info) => {
            const v = info.getValue();
            return (
              <span className={`px-1.5 py-0.5 rounded ${cellClass(key, v)}`}>
                {v === null || v === undefined || v === '' ? '—' : String(v)}
              </span>
            );
          },
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnKeys, issues]
  );

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        return String(row[col] ?? '').toLowerCase().includes(val.toLowerCase());
      })
    );
  }, [data, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (data.length === 0) {
    return <p className="text-sm text-text-muted italic py-8 text-center">Нет данных для предпросмотра</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Поиск по таблице..."
            className="w-full bg-surface2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <span className="text-xs text-text-muted mono ml-auto">
          {filteredData.length.toLocaleString('ru-RU')} строк
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-surface2">
                {hg.headers.map((header) => (
                  <th key={header.id} className="text-left px-3 py-2.5 whitespace-nowrap relative">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 font-mono text-text-secondary font-medium hover:text-text"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ArrowUp size={11} />}
                        {header.column.getIsSorted() === 'desc' && <ArrowDown size={11} />}
                      </button>
                      <button
                        onClick={() =>
                          setOpenFilterCol(openFilterCol === header.id ? null : header.id)
                        }
                        className="text-text-muted hover:text-accent"
                      >
                        <Filter size={11} />
                      </button>
                    </div>
                    {openFilterCol === header.id && (
                      <div className="absolute top-full left-0 mt-1 z-20 bg-surface2 border border-border rounded-lg p-2 shadow-lg">
                        <input
                          autoFocus
                          value={columnFilters[header.id] || ''}
                          onChange={(e) =>
                            setColumnFilters((f) => ({ ...f, [header.id]: e.target.value }))
                          }
                          placeholder="Фильтр..."
                          className="bg-surface border border-border rounded px-2 py-1 text-xs text-text outline-none w-32"
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-surface2/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap mono text-text-secondary">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-text-muted">
          Страница {table.getState().pagination.pageIndex + 1} из {table.getPageCount() || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-border text-text-secondary disabled:opacity-40 hover:border-border-strong"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-border text-text-secondary disabled:opacity-40 hover:border-border-strong"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
