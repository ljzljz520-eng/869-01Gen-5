// ============================================
// 白屏检测采集器
// ============================================

import { WhiteScreenReport } from '../../types/monitor';

interface WhiteScreenCollectorOptions {
  onWhiteScreen: (ws: Omit<WhiteScreenReport, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>) => void;
}

export function createWhiteScreenCollector(options: WhiteScreenCollectorOptions) {
  const { onWhiteScreen } = options;
  let started = false;
  let checkInterval: any = null;
  let detectedCount = 0;
  const MAX_DETECTED_COUNT = 3;

  const getCurrentPageUrl = (): string => {
    try {
      if (typeof Taro !== 'undefined' && Taro.getCurrentPages) {
        const pages = Taro.getCurrentPages();
        const current = pages[pages.length - 1];
        return current ? (current.route || current.$taroPath || 'unknown') : 'unknown';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const getUserAgent = (): string => {
    try {
      if (typeof Taro !== 'undefined' && Taro.getSystemInfoSync) {
        const info = Taro.getSystemInfoSync();
        return `${info.platform}/${info.system}/${info.model}/${info.SDKVersion}`;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const checkWhiteScreen = (): boolean => {
    try {
      if (typeof document === 'undefined') {
        return Math.random() < 0.001;
      }

      const body = document.body;
      if (!body) return false;

      const children = body.children;
      if (children.length === 0) return true;

      let totalVisibleArea = 0;
      const viewportWidth = window.innerWidth || 375;
      const viewportHeight = window.innerHeight || 667;
      const viewportArea = viewportWidth * viewportHeight;

      const samplePoints = [
        { x: viewportWidth * 0.1, y: viewportHeight * 0.1 },
        { x: viewportWidth * 0.5, y: viewportHeight * 0.3 },
        { x: viewportWidth * 0.9, y: viewportHeight * 0.1 },
        { x: viewportWidth * 0.5, y: viewportHeight * 0.5 },
        { x: viewportWidth * 0.1, y: viewportHeight * 0.9 },
        { x: viewportWidth * 0.5, y: viewportHeight * 0.9 },
        { x: viewportWidth * 0.9, y: viewportHeight * 0.9 }
      ];

      let emptyPoints = 0;
      for (const point of samplePoints) {
        const element = document.elementFromPoint(point.x, point.y);
        if (!element || element === document.body || element === document.documentElement) {
          emptyPoints++;
        }
      }

      if (emptyPoints >= samplePoints.length * 0.7) {
        return true;
      }

      const checkElements = (elements: HTMLCollection): number => {
        let area = 0;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || el.offsetHeight === 0) {
            continue;
          }
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK' || el.tagName === 'META') {
            continue;
          }

          const rect = el.getBoundingClientRect();
          const isInViewport = (
            rect.top < viewportHeight &&
            rect.bottom > 0 &&
            rect.left < viewportWidth &&
            rect.right > 0
          );

          if (isInViewport && el.children.length === 0) {
            area += Math.min(rect.width, viewportWidth) * Math.min(rect.height, viewportHeight);
          }

          if (el.children.length > 0) {
            area += checkElements(el.children);
          }
        }
        return area;
      };

      totalVisibleArea = checkElements(children);
      const contentRatio = totalVisibleArea / viewportArea;

      return contentRatio < 0.02;
    } catch (error) {
      console.error('[GrayMonitor] White screen check error:', error);
      return false;
    }
  };

  const reportWhiteScreen = (duration: number) => {
    detectedCount++;
    if (detectedCount > MAX_DETECTED_COUNT) return;

    onWhiteScreen({
      pageUrl: getCurrentPageUrl(),
      duration,
      userAgent: getUserAgent()
    });

    console.warn(`[GrayMonitor] White screen detected on page: ${getCurrentPageUrl()}, duration: ${duration}ms`);
  };

  const start = () => {
    if (started) return;
    started = true;
    detectedCount = 0;

    try {
      const initialCheckDelay = 3000;
      let firstCheckTime = Date.now();

      setTimeout(() => {
        if (!started) return;
        if (checkWhiteScreen()) {
          reportWhiteScreen(Date.now() - firstCheckTime);
        }
      }, initialCheckDelay);

      const CHECK_INTERVAL = 5000;
      checkInterval = setInterval(() => {
        if (!started) return;
        const checkStart = Date.now();

        if (checkWhiteScreen()) {
          reportWhiteScreen(CHECK_INTERVAL);
        }

        void checkStart;
      }, CHECK_INTERVAL);

      console.log('[GrayMonitor] White screen collector started');
    } catch (error) {
      console.error('[GrayMonitor] White screen collector start failed:', error);
    }
  };

  const stop = () => {
    if (!started) return;
    started = false;

    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }

    console.log('[GrayMonitor] White screen collector stopped');
  };

  const manualReport = (pageUrl?: string, duration?: number) => {
    reportWhiteScreen(duration || 2000);
    void pageUrl;
  };

  return {
    start,
    stop,
    manualReport
  };
}
