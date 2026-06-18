import { differenceInDays, formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`;
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN });
}

export function formatDate(dateStr: string, pattern: string = 'yyyy-MM-dd'): string {
  return format(new Date(dateStr), pattern, { locale: zhCN });
}

export function getDaysSince(dateStr: string): number {
  return differenceInDays(new Date(), new Date(dateStr));
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
