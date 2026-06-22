// ============================================
// 格式化工具函数
// ============================================

import dayjs from 'dayjs';
import { VersionStatus, AlertLevel, AlertStatus } from '../types/monitor';

export function formatNumber(num: number, digits: number = 0): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(digits || 1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(digits || 1) + 'k';
  }
  return num.toFixed(digits);
}

export function formatPercent(value: number, digits: number = 2): string {
  return (value * 100).toFixed(digits) + '%';
}

export function formatPercentPlain(value: number, digits: number = 1): string {
  return value.toFixed(digits) + '%';
}

export function formatTime(ms: number): string {
  if (ms < 1000) {
    return ms + 'ms';
  }
  return (ms / 1000).toFixed(2) + 's';
}

export function formatMsTime(ms: number): string {
  if (ms >= 1000) {
    return (ms / 1000).toFixed(2) + 's';
  }
  return Math.round(ms) + 'ms';
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatTimeShort(timestamp: string | Date): string {
  const d = dayjs(timestamp);
  const now = dayjs();
  if (d.isSame(now, 'day')) {
    return d.format('HH:mm');
  }
  return d.format('MM-DD HH:mm');
}

export function formatDateShort(date: string | Date): string {
  return dayjs(date).format('MM-DD HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = now.diff(target, 'day');
  if (diffDays < 7) return `${diffDays}天前`;

  return formatDateShort(date);
}

export function getVersionStatusText(status: VersionStatus): string {
  const map: Record<VersionStatus, string> = {
    pending: '待发布',
    graying: '灰度中',
    paused: '已暂停',
    completed: '已完成',
    rolled_back: '已回滚'
  };
  return map[status];
}

export function getVersionStatusColor(status: VersionStatus): string {
  const map: Record<VersionStatus, string> = {
    pending: '#86909C',
    graying: '#00B42A',
    paused: '#FF7D00',
    completed: '#165DFF',
    rolled_back: '#F53F3F'
  };
  return map[status];
}

export function getAlertLevelText(level: AlertLevel): string {
  const map: Record<AlertLevel, string> = {
    info: '提示',
    warning: '警告',
    error: '错误',
    critical: '严重'
  };
  return map[level];
}

export function getAlertLevelColor(level: AlertLevel): string {
  const map: Record<AlertLevel, string> = {
    info: '#165DFF',
    warning: '#FF7D00',
    error: '#F53F3F',
    critical: '#722ED1'
  };
  return map[level];
}

export function getAlertStatusText(status: AlertStatus): string {
  const map: Record<AlertStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    ignored: '已忽略'
  };
  return map[status];
}

export function getAlertStatusColor(status: AlertStatus): string {
  const map: Record<AlertStatus, string> = {
    pending: '#F53F3F',
    processing: '#FF7D00',
    resolved: '#00B42A',
    ignored: '#86909C'
  };
  return map[status];
}

export function generateGradientColor(index: number, total: number): string {
  const startHue = 210;
  const endHue = 260;
  const hue = startHue + ((endHue - startHue) * index) / Math.max(total - 1, 1);
  return `hsl(${hue}, 70%, 55%)`;
}

export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}分${remainSeconds}秒`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}时${remainMinutes}分`;
}
