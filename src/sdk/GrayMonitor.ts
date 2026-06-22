// ============================================
// 灰度监测 SDK - 核心类
// ============================================

import { SDKConfig, ReportData, DeviceInfo, LaunchMetric, NetworkError, WhiteScreenReport } from '../types/monitor';
import { createLaunchCollector } from './collector/launch';
import { createNetworkCollector } from './collector/network';
import { createWhiteScreenCollector } from './collector/whitescreen';
import { createReporter } from './reporter';

class GrayMonitorSDK {
  private config: SDKConfig | null = null;
  private initialized = false;
  private launchCollector: ReturnType<typeof createLaunchCollector> | null = null;
  private networkCollector: ReturnType<typeof createNetworkCollector> | null = null;
  private whiteScreenCollector: ReturnType<typeof createWhiteScreenCollector> | null = null;
  private reporter: ReturnType<typeof createReporter> | null = null;
  private reportQueue: ReportData[] = [];
  private deviceInfo: DeviceInfo = {
    model: 'unknown',
    platform: 'unknown',
    system: 'unknown',
    SDKVersion: 'unknown'
  };

  public init(config: SDKConfig): void {
    if (this.initialized) {
      console.warn('[GrayMonitor] SDK already initialized');
      return;
    }

    try {
      this.config = {
        maxCacheSize: 100,
        reportInterval: 10000,
        reportUrl: '/api/gray/report',
        ...config
      };

      if (config.deviceInfo) {
        this.deviceInfo = config.deviceInfo;
      }

      this.reporter = createReporter({
        reportUrl: this.config.reportUrl!,
        maxCacheSize: this.config.maxCacheSize!,
        reportInterval: this.config.reportInterval!,
        onBatchReport: this.handleBatchReport.bind(this)
      });

      if (this.config.enableLaunchMonitor) {
        this.launchCollector = createLaunchCollector({
          onLaunchMetric: this.handleLaunchMetric.bind(this)
        });
        this.launchCollector.start();
        console.log('[GrayMonitor] Launch monitor enabled');
      }

      if (this.config.enableNetworkMonitor) {
        this.networkCollector = createNetworkCollector({
          onNetworkError: this.handleNetworkError.bind(this)
        });
        this.networkCollector.start();
        console.log('[GrayMonitor] Network monitor enabled');
      }

      if (this.config.enableWhiteScreenMonitor) {
        this.whiteScreenCollector = createWhiteScreenCollector({
          onWhiteScreen: this.handleWhiteScreen.bind(this)
        });
        this.whiteScreenCollector.start();
        console.log('[GrayMonitor] White screen monitor enabled');
      }

      this.initialized = true;
      console.log('[GrayMonitor] SDK initialized', {
        appId: this.config.appId,
        appVersion: this.config.appVersion,
        sampleRate: this.config.sampleRate
      });
    } catch (error) {
      console.error('[GrayMonitor] Init failed:', error);
      throw error;
    }
  }

  private shouldSample(): boolean {
    if (!this.config) return false;
    return Math.random() < this.config.sampleRate;
  }

  private generateId(): string {
    return `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string {
    try {
      const cached = localStorage.getItem('gray_monitor_uid');
      if (cached) return cached;
      const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('gray_monitor_uid', uid);
      return uid;
    } catch {
      return `anon_${Date.now()}`;
    }
  }

  private getRegion(): string {
    const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private handleLaunchMetric(metric: Omit<LaunchMetric, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>): void {
    if (!this.initialized || !this.config || !this.shouldSample()) return;

    const fullMetric: LaunchMetric = {
      id: this.generateId(),
      versionId: 'default',
      versionCode: this.config.appVersion,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      deviceModel: this.deviceInfo.model,
      region: this.getRegion(),
      ...metric
    };

    this.report('launch', fullMetric);
    console.log('[GrayMonitor] Launch metric collected:', fullMetric.launchTime, 'ms');
  }

  private handleNetworkError(error: Omit<NetworkError, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>): void {
    if (!this.initialized || !this.config || !this.shouldSample()) return;

    const fullError: NetworkError = {
      id: this.generateId(),
      versionId: 'default',
      versionCode: this.config.appVersion,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      deviceModel: this.deviceInfo.model,
      region: this.getRegion(),
      ...error
    };

    this.report('network_error', fullError);
    console.warn('[GrayMonitor] Network error collected:', fullError.url, fullError.statusCode);
  }

  private handleWhiteScreen(ws: Omit<WhiteScreenReport, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>): void {
    if (!this.initialized || !this.config || !this.shouldSample()) return;

    const fullReport: WhiteScreenReport = {
      id: this.generateId(),
      versionId: 'default',
      versionCode: this.config.appVersion,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      deviceModel: this.deviceInfo.model,
      region: this.getRegion(),
      ...ws
    };

    this.report('white_screen', fullReport);
    console.error('[GrayMonitor] White screen detected:', fullReport.pageUrl);
  }

  private report(type: ReportData['type'], data: ReportData['data']): void {
    if (!this.config || !this.reporter) return;

    const reportData: ReportData = {
      type,
      data,
      timestamp: Date.now(),
      appId: this.config.appId,
      appVersion: this.config.appVersion,
      deviceInfo: this.deviceInfo
    };

    this.reportQueue.push(reportData);
    this.reporter.enqueue(reportData);
  }

  private handleBatchReport(batch: ReportData[]): boolean {
    console.log(`[GrayMonitor] Reporting ${batch.length} records...`);
    return true;
  }

  public reportCustomEvent(eventName: string, data: Record<string, unknown>): void {
    if (!this.initialized || !this.config) return;
    this.report('custom', { eventName, ...data });
  }

  public destroy(): void {
    if (this.launchCollector) {
      this.launchCollector.stop();
      this.launchCollector = null;
    }
    if (this.networkCollector) {
      this.networkCollector.stop();
      this.networkCollector = null;
    }
    if (this.whiteScreenCollector) {
      this.whiteScreenCollector.stop();
      this.whiteScreenCollector = null;
    }
    if (this.reporter) {
      this.reporter.flush();
      this.reporter.destroy();
      this.reporter = null;
    }
    this.initialized = false;
    this.config = null;
    console.log('[GrayMonitor] SDK destroyed');
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getConfig(): SDKConfig | null {
    return this.config ? { ...this.config } : null;
  }
}

export const grayMonitor = new GrayMonitorSDK();

export function initGrayMonitor(config: SDKConfig): void {
  grayMonitor.init(config);
}

export function getGrayMonitor(): GrayMonitorSDK {
  return grayMonitor;
}

export function reportGrayEvent(eventName: string, data: Record<string, unknown>): void {
  grayMonitor.reportCustomEvent(eventName, data);
}
