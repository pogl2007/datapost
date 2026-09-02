import type { Plan } from '@/types';

export const FREE_FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const PRO_FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB
export const FREE_DAILY_UPLOADS = 3;
export const FREE_HISTORY_LIMIT = 5;
export const CHAT_MAX_QUESTIONS_PER_DATASET = 20;

export function getFileSizeLimit(plan: Plan): number {
  return plan === 'PRO' ? PRO_FILE_SIZE_LIMIT : FREE_FILE_SIZE_LIMIT;
}

export function getAllowedFormats(plan: Plan): string[] {
  if (plan === 'PRO') return ['csv', 'xlsx', 'xls', 'json'];
  return ['csv'];
}

export function canAutoClean(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUseChat(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canDownloadCleaned(plan: Plan): boolean {
  return plan === 'PRO';
}

export function getDailyUploadLimit(plan: Plan): number | null {
  return plan === 'PRO' ? null : FREE_DAILY_UPLOADS;
}

export function getHistoryLimit(plan: Plan): number | null {
  return plan === 'PRO' ? null : FREE_HISTORY_LIMIT;
}

export function getFormatFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv') return 'CSV';
  if (ext === 'xlsx' || ext === 'xls') return 'Excel';
  if (ext === 'json') return 'JSON';
  return ext.toUpperCase();
}

export function isFormatAllowed(fileName: string, plan: Plan): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return getAllowedFormats(plan).includes(ext);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
