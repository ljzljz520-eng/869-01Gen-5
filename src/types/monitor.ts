// ============================================
// 灰度监测系统 - 类型定义
// ============================================

export type VersionStatus = 'pending' | 'graying' | 'paused' | 'completed' | 'rolledback' | 'rolled_back';

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export type GrayRuleType = 'percentage' | 'region' | 'device' | 'user_tag';

export interface DeviceInfo {
  model: string;
  platform: string;
  system: string;
  SDKVersion: string;
}

export interface GrayRule {
  id: string;
  name: string;
  type: GrayRuleType;
  value?: number | string[];
  description: string;
  config?: Record<string, unknown>;
  enabled: boolean;
  priority?: number;
}

export interface GrayVersion {
  id: string;
  versionCode: string;
  versionName: string;
  description: string;
  status: VersionStatus;
  grayPercentage: number;
  targetPercentage: number;
  publishTime: string;
  createTime: string;
  updateTime: string;
  creator: string;
  rules: GrayRule[];
  allowedRegions: string[];
  blockedDevices: string[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    launchCount: number;
    avgLaunchTime: number;
    errorCount: number;
    whiteScreenCount: number;
  };
}

export interface LaunchMetric {
  id: string;
  versionId: string;
  versionCode: string;
  timestamp: string;
  userId: string;
  deviceModel: string;
  region: string;
  launchType: 'cold' | 'hot';
  launchTime: number;
  firstPaintTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
}

export interface NetworkError {
  id: string;
  versionId: string;
  versionCode: string;
  timestamp: string;
  userId: string;
  deviceModel: string;
  region: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  statusCode: number;
  errorMessage: string;
  requestParams: string;
  responseBody: string;
  duration: number;
}

export interface WhiteScreenReport {
  id: string;
  versionId: string;
  versionCode: string;
  timestamp: string;
  userId: string;
  deviceModel: string;
  region: string;
  pageUrl: string;
  duration: number;
  screenShotUrl?: string;
  userAgent: string;
}

export interface Alert {
  id: string;
  versionId: string;
  relatedVersionId?: string;
  versionCode: string;
  title: string;
  message?: string;
  level: AlertLevel;
  status: AlertStatus;
  type: 'device' | 'region' | 'performance' | 'error_rate' | 'white_screen';
  description: string;
  affectedDevices?: string[];
  affectedRegions?: string[];
  affectedUsers?: number;
  metricValue: number;
  metricName?: string;
  metricUnit?: string;
  actualValue?: number;
  threshold: number;
  thresholdValue?: number;
  triggerTime: string;
  durationMinutes?: number;
  createTime?: string;
  updateTime?: string;
  assignee?: string;
  handleTime?: string;
  handleNote?: string;
}

export interface PerformanceTrend {
  timestamp: string;
  launchTimeP50?: number;
  launchTimeP90?: number;
  launchTimeP99?: number;
  avgLaunchTime: number;
  p95LaunchTime?: number;
  errorRate?: number;
  whiteScreenRate?: number;
  networkErrors: number;
  whiteScreens: number;
  activeUsers?: number;
}

export interface RegionStats {
  region: string;
  userCount: number;
  avgLaunchTime: number;
  errorRate: number;
  whiteScreenRate: number;
}

export interface DeviceStats {
  model: string;
  userCount: number;
  avgLaunchTime: number;
  errorRate: number;
  errorCount?: number;
  whiteScreenRate: number;
  isAbnormal: boolean;
}

export interface TopErrorApi {
  url: string;
  path?: string;
  method: string;
  errorCount: number;
  errorRate: number;
  avgDuration?: number;
  affectedUsers?: number;
}

export interface SDKConfig {
  appId: string;
  appVersion: string;
  sampleRate: number;
  enableLaunchMonitor: boolean;
  enableNetworkMonitor: boolean;
  enableWhiteScreenMonitor: boolean;
  deviceInfo?: DeviceInfo;
  reportUrl?: string;
  maxCacheSize?: number;
  reportInterval?: number;
}

export interface ReportData {
  type: 'launch' | 'network_error' | 'white_screen' | 'custom';
  data: LaunchMetric | NetworkError | WhiteScreenReport | Record<string, unknown>;
  timestamp: number;
  appId: string;
  appVersion: string;
  deviceInfo: DeviceInfo;
}
