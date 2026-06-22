// ============================================
// 性能监测服务（对象形式导出）
// ============================================

import { useMonitorStore } from '../store/monitorStore';
import { PerformanceTrend, RegionStats, DeviceStats, TopErrorApi } from '../types/monitor';

function getTrend(): PerformanceTrend[] {
  return useMonitorStore.getState().performanceTrend;
}

function getRegions(): RegionStats[] {
  return useMonitorStore.getState().regionStats;
}

function getDevices(): DeviceStats[] {
  return useMonitorStore.getState().deviceStats;
}

function getTopErrorApis(limit: number = 10): TopErrorApi[] {
  return useMonitorStore.getState().topErrorApis.slice(0, limit);
}

function getAbnormalDevices(): DeviceStats[] {
  return getDevices().filter((d) => d.isAbnormal);
}

interface SummaryStats {
  avgLaunchTime: number;
  p95LaunchTime: number;
  launchTimeTrend: number;
  p95Trend: number;
  totalNetworkErrors: number;
  totalWhiteScreens: number;
  errorTrend: number;
  whiteScreenTrend: number;
}

function getSummaryStats(trend?: PerformanceTrend[]): SummaryStats {
  const data = trend || getTrend();
  if (data.length === 0) {
    return {
      avgLaunchTime: 0,
      p95LaunchTime: 0,
      launchTimeTrend: 0,
      p95Trend: 0,
      totalNetworkErrors: 0,
      totalWhiteScreens: 0,
      errorTrend: 0,
      whiteScreenTrend: 0
    };
  }

  const half = Math.max(1, Math.floor(data.length / 2));
  const firstHalf = data.slice(0, half);
  const secondHalf = data.slice(half);

  const avg = (arr: PerformanceTrend[], key: 'avgLaunchTime' | 'networkErrors' | 'whiteScreens') => {
    if (arr.length === 0) return 0;
    return arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length;
  };

  const avgFirst = avg(firstHalf, 'avgLaunchTime');
  const avgSecond = avg(secondHalf, 'avgLaunchTime');
  const errFirst = avg(firstHalf, 'networkErrors');
  const errSecond = avg(secondHalf, 'networkErrors');
  const wsFirst = avg(firstHalf, 'whiteScreens');
  const wsSecond = avg(secondHalf, 'whiteScreens');

  const trendCalc = (cur: number, prev: number) => {
    if (prev === 0) return 0;
    return (cur - prev) / prev;
  };

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  return {
    avgLaunchTime: Math.round(avg(data, 'avgLaunchTime') || latest.avgLaunchTime || 0),
    p95LaunchTime: Math.round((latest as any).p95LaunchTime || latest.avgLaunchTime * 1.5 || 0),
    launchTimeTrend: trendCalc(avgSecond, avgFirst),
    p95Trend: trendCalc((latest as any).p95LaunchTime || latest.avgLaunchTime * 1.5, (prev as any).p95LaunchTime || prev.avgLaunchTime * 1.5),
    totalNetworkErrors: data.reduce((s, d) => s + (d.networkErrors || 0), 0),
    totalWhiteScreens: data.reduce((s, d) => s + (d.whiteScreens || 0), 0),
    errorTrend: trendCalc(errSecond, errFirst),
    whiteScreenTrend: trendCalc(wsSecond, wsFirst)
  };
}

function getPerformanceSummary() {
  const trend = getTrend();
  const devices = getDevices();
  const apis = getTopErrorApis();

  const latest = trend[trend.length - 1];
  const previous = trend[trend.length - 2] || latest;

  const avgLaunchP50 = Math.round(trend.reduce((sum, t) => sum + (t.launchTimeP50 || t.avgLaunchTime * 0.8), 0) / Math.max(trend.length, 1));
  const avgLaunchP90 = Math.round(trend.reduce((sum, t) => sum + (t.launchTimeP90 || t.avgLaunchTime * 1.4), 0) / Math.max(trend.length, 1));
  const avgErrorRate = trend.reduce((sum, t) => sum + (t.errorRate || t.networkErrors / 1000), 0) / Math.max(trend.length, 1);
  const avgWhiteScreenRate = trend.reduce((sum, t) => sum + (t.whiteScreenRate || t.whiteScreens / 10000), 0) / Math.max(trend.length, 1);
  const avgActiveUsers = Math.round(trend.reduce((sum, t) => sum + (t.activeUsers || 0), 0) / Math.max(trend.length, 1));

  const totalErrorCount = apis.reduce((sum, api) => sum + api.errorCount, 0);
  const abnormalDeviceCount = devices.filter((d) => d.isAbnormal).length;

  return {
    current: {
      launchP50: latest?.launchTimeP50 || latest?.avgLaunchTime * 0.8 || 0,
      launchP90: latest?.launchTimeP90 || latest?.avgLaunchTime * 1.4 || 0,
      launchP99: (latest as any)?.launchTimeP99 || latest?.avgLaunchTime * 2 || 0,
      errorRate: latest?.errorRate || 0,
      whiteScreenRate: latest?.whiteScreenRate || 0,
      activeUsers: latest?.activeUsers || 0
    },
    trend: {
      launchTrend: ((latest?.launchTimeP50 || latest?.avgLaunchTime || 0) - (previous?.launchTimeP50 || previous?.avgLaunchTime || 0)) / Math.max((previous?.launchTimeP50 || previous?.avgLaunchTime || 1), 1),
      errorTrend: ((latest?.errorRate || 0) - (previous?.errorRate || 0)) / Math.max((previous?.errorRate || 1), 1),
      whiteScreenTrend: ((latest?.whiteScreenRate || 0) - (previous?.whiteScreenRate || 0)) / Math.max((previous?.whiteScreenRate || 1), 1),
      userTrend: ((latest?.activeUsers || 0) - (previous?.activeUsers || 0)) / Math.max((previous?.activeUsers || 1), 1)
    },
    average: {
      launchP50: avgLaunchP50,
      launchP90: avgLaunchP90,
      errorRate: avgErrorRate,
      whiteScreenRate: avgWhiteScreenRate,
      activeUsers: avgActiveUsers
    },
    totalErrorCount,
    abnormalDeviceCount,
    period: trend.length
  };
}

function filterRegionsByUserCount(minUsers: number = 0): RegionStats[] {
  return getRegions()
    .filter((r) => r.userCount >= minUsers)
    .sort((a, b) => b.userCount - a.userCount);
}

function sortDevices(sortBy: 'userCount' | 'avgLaunchTime' | 'errorRate' | 'whiteScreenRate' = 'userCount'): DeviceStats[] {
  const devices = [...getDevices()];
  return devices.sort((a, b) => {
    if (sortBy === 'userCount') return b.userCount - a.userCount;
    if (sortBy === 'avgLaunchTime') return b.avgLaunchTime - a.avgLaunchTime;
    if (sortBy === 'errorRate') return b.errorRate - a.errorRate;
    return b.whiteScreenRate - a.whiteScreenRate;
  });
}

export const MonitorService = {
  getTrend,
  getRegions,
  getDevices,
  getTopErrorApis,
  getAbnormalDevices,
  getSummaryStats,
  getPerformanceSummary,
  filterRegionsByUserCount,
  sortDevices
};

export default MonitorService;

export { getPerformanceSummary };

export function getPerformanceTrend() {
  return MonitorService.getTrend();
}

export function getRegionStats() {
  return MonitorService.getRegions();
}
