'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ChartType, Issue } from '@/types';

interface MiniChartProps {
  chartType?: ChartType;
  issue: Issue;
}

const COLORS = ['#3b82f6', '#1e3a5f', '#60a5fa', '#2d5a8e'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateBarData(seed: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: 6 }, (_, i) => ({
    name: `Гр. ${i + 1}`,
    value: Math.round(20 + rand() * 80),
  }));
}

function generateDonutData(seed: number) {
  const rand = seededRandom(seed);
  const a = Math.round(10 + rand() * 20);
  return [
    { name: 'Класс 0', value: 100 - a },
    { name: 'Класс 1', value: a },
  ];
}

function generateScatterData(seed: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: 30 }, (_, i) => ({
    x: i,
    y: rand() * 50 + (i % 7 === 0 ? rand() * 120 : 0),
  }));
}

function generateHistogramData(seed: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: 8 }, (_, i) => ({
    name: `${i * 10}-${i * 10 + 10}`,
    value: Math.round(rand() * 60 + 5),
  }));
}

export function MiniChart({ chartType, issue }: MiniChartProps) {
  const seed = issue.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;

  if (!chartType || chartType === 'none') return null;

  return (
    <div className="h-40 w-full bg-surface2/50 rounded-lg p-3 border border-border">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={generateBarData(seed)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <Tooltip
              contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === 'histogram' ? (
          <BarChart data={generateHistogramData(seed)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <Tooltip
              contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === 'donut' ? (
          <PieChart>
            <Pie
              data={generateDonutData(seed)}
              dataKey="value"
              nameKey="name"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
            >
              {generateDonutData(seed).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        ) : chartType === 'scatter' ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <YAxis dataKey="y" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1e3a5f' }} />
            <Tooltip
              contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontSize: 12 }}
            />
            <Scatter data={generateScatterData(seed)} fill="#3b82f6" />
          </ScatterChart>
        ) : (
          <BarChart data={generateBarData(seed)}>
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
