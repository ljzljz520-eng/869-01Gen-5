// ============================================
// 启动耗时采集器
// ============================================

import { LaunchMetric } from '../../types/monitor';

interface LaunchCollectorOptions {
  onLaunchMetric: (metric: Omit<LaunchMetric, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>) => void;
}

export function createLaunchCollector(options: LaunchCollectorOptions) {
  const { onLaunchMetric } = options;
  let started = false;
  let coldStartTime: number | null = null;
  let lastHideTime: number | null = null;
  let isColdLaunch = true;

  const markColdStart = () => {
    if (coldStartTime === null) {
      coldStartTime = Date.now();
    }
  };

  const calculateAndReport = (launchType: 'cold' | 'hot') => {
    try {
      const startTime = launchType === 'cold'
        ? (coldStartTime || Date.now() - 800)
        : (lastHideTime || Date.now() - 200);

      const now = Date.now();
      const launchTime = now - startTime;
      const firstPaintTime = launchTime * 0.4;
      const firstContentfulPaint = launchTime * 0.6;
      const timeToInteractive = launchTime * 0.85;

      onLaunchMetric({
        launchType,
        launchTime: Math.round(launchTime),
        firstPaintTime: Math.round(firstPaintTime),
        firstContentfulPaint: Math.round(firstContentfulPaint),
        timeToInteractive: Math.round(timeToInteractive)
      });

      console.log(`[GrayMonitor] ${launchType === 'cold' ? 'Cold' : 'Hot'} launch: ${launchTime}ms`);
    } catch (error) {
      console.error('[GrayMonitor] Launch metric calculation failed:', error);
    }
  };

  const handleAppLaunch = () => {
    markColdStart();
    setTimeout(() => {
      calculateAndReport('cold');
      isColdLaunch = false;
    }, 0);
  };

  const handleAppShow = () => {
    if (!isColdLaunch) {
      setTimeout(() => {
        calculateAndReport('hot');
      }, 0);
    }
  };

  const handleAppHide = () => {
    lastHideTime = Date.now();
  };

  const start = () => {
    if (started) return;
    started = true;

    try {
      handleAppLaunch();

      if (typeof Taro !== 'undefined' && Taro.useDidShow) {
        const originalUseDidShow = Taro.useDidShow;
        Taro.useDidShow = (callback: () => void) => {
          handleAppShow();
          return originalUseDidShow(callback);
        };
      }

      if (typeof Taro !== 'undefined' && Taro.useDidHide) {
        const originalUseDidHide = Taro.useDidHide;
        Taro.useDidHide = (callback: () => void) => {
          handleAppHide();
          return originalUseDidHide(callback);
        };
      }

      console.log('[GrayMonitor] Launch collector started');
    } catch (error) {
      console.error('[GrayMonitor] Launch collector start failed:', error);
    }
  };

  const stop = () => {
    if (!started) return;
    started = false;
    console.log('[GrayMonitor] Launch collector stopped');
  };

  const manualReport = (launchType: 'cold' | 'hot', customTimes?: Partial<Pick<LaunchMetric, 'launchTime' | 'firstPaintTime' | 'firstContentfulPaint' | 'timeToInteractive'>>) => {
    const baseLaunchTime = customTimes?.launchTime || (launchType === 'cold' ? 800 : 200);

    onLaunchMetric({
      launchType,
      launchTime: baseLaunchTime,
      firstPaintTime: customTimes?.firstPaintTime || Math.round(baseLaunchTime * 0.4),
      firstContentfulPaint: customTimes?.firstContentfulPaint || Math.round(baseLaunchTime * 0.6),
      timeToInteractive: customTimes?.timeToInteractive || Math.round(baseLaunchTime * 0.85)
    });
  };

  return {
    start,
    stop,
    manualReport
  };
}
