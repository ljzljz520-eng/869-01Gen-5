// ============================================
// 告警服务（对象形式导出）
// ============================================

import { useMonitorStore } from '../store/monitorStore';
import { Alert, AlertStatus, AlertLevel } from '../types/monitor';

function list(): Alert[] {
  return useMonitorStore.getState().alerts;
}

function getById(alertId: string): Alert | undefined {
  return useMonitorStore.getState().getAlertById(alertId);
}

function getPending(): Alert[] {
  return list().filter((a) => a.status === 'pending');
}

function getProcessing(): Alert[] {
  return list().filter((a) => a.status === 'processing');
}

function getResolved(): Alert[] {
  return list().filter((a) => a.status === 'resolved' || a.status === 'ignored');
}

function updateStatus(alertId: string, status: AlertStatus, note?: string): void {
  useMonitorStore.getState().updateAlertStatus(alertId, status, note);
}

function resolve(alertId: string, note?: string): void {
  updateStatus(alertId, 'resolved', note);
}

function ignore(alertId: string, note?: string): void {
  updateStatus(alertId, 'ignored', note || '误报告警，已忽略');
}

function startProcess(alertId: string, note?: string): void {
  updateStatus(alertId, 'processing', note);
}

function getPendingCount(): number {
  return useMonitorStore.getState().getPendingAlertCount();
}

function filterList(params: {
  level?: AlertLevel;
  status?: AlertStatus;
  versionId?: string;
  type?: Alert['type'];
}): Alert[] {
  let alerts = list();

  if (params.level) {
    alerts = alerts.filter((a) => a.level === params.level);
  }
  if (params.status) {
    alerts = alerts.filter((a) => a.status === params.status);
  }
  if (params.versionId) {
    alerts = alerts.filter((a) => a.versionId === params.versionId || a.relatedVersionId === params.versionId);
  }
  if (params.type) {
    alerts = alerts.filter((a) => a.type === params.type);
  }

  return alerts;
}

interface LevelStats {
  critical: number;
  error: number;
  warning: number;
  info: number;
}

function getLevelStats(alerts?: Alert[]): LevelStats {
  const data = alerts || list();
  return {
    critical: data.filter((a) => a.level === 'critical').length,
    error: data.filter((a) => a.level === 'error').length,
    warning: data.filter((a) => a.level === 'warning').length,
    info: data.filter((a) => a.level === 'info').length
  };
}

interface StatusStats {
  pending: number;
  processing: number;
  resolved: number;
  ignored: number;
}

function getStatusStats(alerts?: Alert[]): StatusStats {
  const data = alerts || list();
  return {
    pending: data.filter((a) => a.status === 'pending').length,
    processing: data.filter((a) => a.status === 'processing').length,
    resolved: data.filter((a) => a.status === 'resolved').length,
    ignored: data.filter((a) => a.status === 'ignored').length
  };
}

function getSummary() {
  const alerts = list();
  const level = getLevelStats(alerts);
  const status = getStatusStats(alerts);

  return {
    total: alerts.length,
    byLevel: level,
    byStatus: status,
    unhandled: status.pending + status.processing,
    resolutionRate: alerts.length > 0
      ? (status.resolved + status.ignored) / alerts.length
      : 0
  };
}

function getByDevice(deviceModel: string): Alert[] {
  return list().filter(
    (a) => a.affectedDevices && a.affectedDevices.includes(deviceModel)
  );
}

function getByRegion(region: string): Alert[] {
  return list().filter(
    (a) => a.affectedRegions && a.affectedRegions.includes(region)
  );
}

export const AlertService = {
  list,
  getById,
  getPending,
  getProcessing,
  getResolved,
  updateStatus,
  resolve,
  ignore,
  startProcess,
  getPendingCount,
  filterList,
  getLevelStats,
  getStatusStats,
  getSummary,
  getByDevice,
  getByRegion
};

export default AlertService;

export function getAlertSummary() {
  return AlertService.getSummary();
}

export function getPendingAlertCount() {
  return AlertService.getPendingCount();
}

export function startProcessingAlert(alertId: string, note?: string) {
  return AlertService.startProcess(alertId, note);
}

export function resolveAlert(alertId: string, resolutionNote?: string) {
  return AlertService.resolve(alertId, resolutionNote);
}

export function ignoreAlert(alertId: string, reason?: string) {
  return AlertService.ignore(alertId, reason);
}
