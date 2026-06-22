// ============================================
// 版本管理服务（对象形式导出）
// ============================================

import { useMonitorStore } from '../store/monitorStore';
import { GrayVersion, VersionStatus } from '../types/monitor';

export interface CreateVersionParams {
  versionCode: string;
  versionName: string;
  description: string;
  targetPercentage: number;
  allowedRegions?: string[];
  creator?: string;
  rules?: GrayVersion['rules'];
  blockedDevices?: string[];
}

function createVersion(params: CreateVersionParams): GrayVersion {
  return useMonitorStore.getState().createVersion(params);
}

function publish(versionId: string): void {
  const store = useMonitorStore.getState();
  store.updateVersionStatus(versionId, 'graying');
  store.updateGrayPercentage(versionId, 5);
}

function pauseVersion(versionId: string): void {
  useMonitorStore.getState().pauseVersionGray(versionId);
}

function resumeVersion(versionId: string): void {
  useMonitorStore.getState().resumeVersionGray(versionId);
}

function complete(versionId: string): void {
  const store = useMonitorStore.getState();
  store.updateVersionStatus(versionId, 'completed');
  store.updateGrayPercentage(versionId, 100);
}

function rollback(versionId: string): void {
  const store = useMonitorStore.getState();
  store.updateVersionStatus(versionId, 'rolledback');
  store.updateGrayPercentage(versionId, 0);
}

function updateGrayPercentage(versionId: string, percentage: number): void {
  useMonitorStore.getState().updateGrayPercentage(versionId, percentage);
}

function pauseDevice(versionId: string, deviceModel: string): void {
  useMonitorStore.getState().pauseDeviceGray(versionId, deviceModel);
}

function resumeDevice(versionId: string, deviceModel: string): void {
  useMonitorStore.getState().resumeDeviceGray(versionId, deviceModel);
}

function list(): GrayVersion[] {
  return useMonitorStore.getState().versions;
}

function getActive(): GrayVersion[] {
  return useMonitorStore.getState().getActiveVersions();
}

function getById(versionId: string): GrayVersion | undefined {
  return useMonitorStore.getState().getVersionById(versionId);
}

function filterByStatus(status?: VersionStatus): GrayVersion[] {
  const versions = list();
  if (!status) return versions;
  return versions.filter((v) => v.status === status || (status === 'rolledback' && v.status === 'rolled_back'));
}

function getSummary() {
  const versions = list();
  const active = versions.filter((v) => v.status === 'graying' || v.status === 'paused');
  const completed = versions.filter((v) => v.status === 'completed');
  const pending = versions.filter((v) => v.status === 'pending');
  const rolledBack = versions.filter((v) => v.status === 'rolledback' || v.status === 'rolled_back');

  const totalActiveUsers = versions.reduce((sum, v) => sum + v.stats.activeUsers, 0);
  const totalErrors = versions.reduce((sum, v) => sum + v.stats.errorCount, 0);

  return {
    total: versions.length,
    active: active.length,
    completed: completed.length,
    pending: pending.length,
    rolledBack: rolledBack.length,
    totalActiveUsers,
    totalErrors
  };
}

export const VersionService = {
  createVersion,
  publish,
  pauseVersion,
  resumeVersion,
  complete,
  rollback,
  updateGrayPercentage,
  pauseDevice,
  resumeDevice,
  list,
  getActive,
  getById,
  filterByStatus,
  getSummary
};

export default VersionService;

export function getVersionSummary() {
  return VersionService.getSummary();
}

export { pauseVersion, resumeVersion };
