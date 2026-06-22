// ============================================
// 状态管理 - Zustand Store
// ============================================

import { create } from 'zustand';
import {
  GrayVersion,
  Alert,
  PerformanceTrend,
  RegionStats,
  DeviceStats,
  TopErrorApi,
  VersionStatus,
  AlertStatus
} from '../types/monitor';
import {
  mockVersions,
  mockPerformanceTrend,
  mockRegionStats,
  mockDeviceStats,
  mockTopErrorApis,
  mockAlerts
} from '../data';

interface MonitorStore {
  versions: GrayVersion[];
  alerts: Alert[];
  performanceTrend: PerformanceTrend[];
  regionStats: RegionStats[];
  deviceStats: DeviceStats[];
  topErrorApis: TopErrorApi[];

  selectedVersionId: string | null;
  filterTimeRange: '1h' | '24h' | '7d' | '30d';
  filterRegion: string | null;
  filterDevice: string | null;

  setSelectedVersion: (id: string | null) => void;
  setFilterTimeRange: (range: '1h' | '24h' | '7d' | '30d') => void;
  setFilterRegion: (region: string | null) => void;
  setFilterDevice: (device: string | null) => void;

  createVersion: (data: Partial<GrayVersion>) => GrayVersion;
  updateVersionStatus: (id: string, status: VersionStatus) => void;
  updateGrayPercentage: (id: string, percentage: number) => void;
  pauseVersionGray: (id: string) => void;
  resumeVersionGray: (id: string) => void;
  pauseDeviceGray: (versionId: string, deviceModel: string) => void;
  resumeDeviceGray: (versionId: string, deviceModel: string) => void;

  updateAlertStatus: (id: string, status: AlertStatus, note?: string) => void;
  getPendingAlertCount: () => number;
  getActiveVersions: () => GrayVersion[];
  getVersionById: (id: string) => GrayVersion | undefined;
  getAlertById: (id: string) => Alert | undefined;
}

export const useMonitorStore = create<MonitorStore>((set, get) => ({
  versions: mockVersions,
  alerts: mockAlerts,
  performanceTrend: mockPerformanceTrend,
  regionStats: mockRegionStats,
  deviceStats: mockDeviceStats,
  topErrorApis: mockTopErrorApis,

  selectedVersionId: null,
  filterTimeRange: '24h',
  filterRegion: null,
  filterDevice: null,

  setSelectedVersion: (id) => set({ selectedVersionId: id }),
  setFilterTimeRange: (range) => set({ filterTimeRange: range }),
  setFilterRegion: (region) => set({ filterRegion: region }),
  setFilterDevice: (device) => set({ filterDevice: device }),

  createVersion: (data) => {
    const now = new Date().toISOString();
    const newVersion: GrayVersion = {
      id: `ver_${Date.now()}`,
      versionCode: data.versionCode || '1.0.0',
      versionName: data.versionName || '新版本',
      description: data.description || '',
      status: 'pending',
      grayPercentage: 0,
      targetPercentage: data.targetPercentage || 100,
      publishTime: now,
      createTime: now,
      updateTime: now,
      creator: data.creator || '当前用户',
      rules: data.rules || [],
      allowedRegions: data.allowedRegions || [],
      blockedDevices: data.blockedDevices || [],
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        launchCount: 0,
        avgLaunchTime: 0,
        errorCount: 0,
        whiteScreenCount: 0
      }
    };

    set((state) => ({
      versions: [newVersion, ...state.versions]
    }));

    return newVersion;
  },

  updateVersionStatus: (id, status) => set((state) => ({
    versions: state.versions.map((v) =>
      v.id === id ? { ...v, status, updateTime: new Date().toISOString() } : v
    )
  })),

  updateGrayPercentage: (id, percentage) => set((state) => ({
    versions: state.versions.map((v) =>
      v.id === id ? {
        ...v,
        grayPercentage: Math.min(percentage, v.targetPercentage),
        updateTime: new Date().toISOString()
      } : v
    )
  })),

  pauseVersionGray: (id) => set((state) => ({
    versions: state.versions.map((v) =>
      v.id === id ? { ...v, status: 'paused' as VersionStatus, updateTime: new Date().toISOString() } : v
    )
  })),

  resumeVersionGray: (id) => set((state) => ({
    versions: state.versions.map((v) =>
      v.id === id ? { ...v, status: 'graying' as VersionStatus, updateTime: new Date().toISOString() } : v
    )
  })),

  pauseDeviceGray: (versionId, deviceModel) => set((state) => ({
    versions: state.versions.map((v) => {
      if (v.id !== versionId) return v;
      const blocked = v.blockedDevices.includes(deviceModel)
        ? v.blockedDevices
        : [...v.blockedDevices, deviceModel];
      return { ...v, blockedDevices: blocked, updateTime: new Date().toISOString() };
    }),
    deviceStats: state.deviceStats.map((d) =>
      d.model === deviceModel ? { ...d, isAbnormal: true } : d
    )
  })),

  resumeDeviceGray: (versionId, deviceModel) => set((state) => ({
    versions: state.versions.map((v) => {
      if (v.id !== versionId) return v;
      return {
        ...v,
        blockedDevices: v.blockedDevices.filter((d) => d !== deviceModel),
        updateTime: new Date().toISOString()
      };
    }),
    deviceStats: state.deviceStats.map((d) =>
      d.model === deviceModel ? { ...d, isAbnormal: false } : d
    )
  })),

  updateAlertStatus: (id, status, note) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a.id === id ? {
        ...a,
        status,
        handleTime: new Date().toISOString(),
        handleNote: note || a.handleNote
      } : a
    )
  })),

  getPendingAlertCount: () => {
    return get().alerts.filter((a) => a.status === 'pending' || a.status === 'processing').length;
  },

  getActiveVersions: () => {
    return get().versions.filter((v) => v.status === 'graying' || v.status === 'paused');
  },

  getVersionById: (id) => {
    return get().versions.find((v) => v.id === id);
  },

  getAlertById: (id) => {
    return get().alerts.find((a) => a.id === id);
  }
}));
