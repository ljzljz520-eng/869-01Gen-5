// ============================================
// 数据上报器
// ============================================

import { ReportData } from '../../types/monitor';

interface ReporterOptions {
  reportUrl: string;
  maxCacheSize: number;
  reportInterval: number;
  onBatchReport: (batch: ReportData[]) => boolean;
}

export function createReporter(options: ReporterOptions) {
  const { reportUrl, maxCacheSize, reportInterval, onBatchReport } = options;
  let queue: ReportData[] = [];
  let timer: any = null;
  let destroyed = false;

  const saveToLocal = () => {
    try {
      if (queue.length > 0 && typeof localStorage !== 'undefined') {
        localStorage.setItem('gray_monitor_cache', JSON.stringify(queue));
      }
    } catch (error) {
      console.warn('[GrayMonitor] Save to local failed:', error);
    }
  };

  const loadFromLocal = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('gray_monitor_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            queue = [...parsed, ...queue];
            localStorage.removeItem('gray_monitor_cache');
          }
        }
      }
    } catch (error) {
      console.warn('[GrayMonitor] Load from local failed:', error);
    }
  };

  const sendBatch = async (batch: ReportData[]): Promise<boolean> => {
    if (batch.length === 0) return true;

    try {
      const callbackSuccess = onBatchReport(batch);
      if (!callbackSuccess) {
        console.warn('[GrayMonitor] Batch report callback returned false');
        return false;
      }

      if (typeof Taro !== 'undefined' && Taro.request) {
        try {
          await Taro.request({
            url: reportUrl,
            method: 'POST',
            data: { batch },
            timeout: 10000,
            header: {
              'Content-Type': 'application/json'
            }
          });
          console.log(`[GrayMonitor] Sent ${batch.length} records to server`);
        } catch (requestError) {
          console.warn('[GrayMonitor] Network report failed, keeping in queue:', requestError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[GrayMonitor] Send batch error:', error);
      return false;
    }
  };

  const flush = async () => {
    if (queue.length === 0) return;

    const batch = [...queue];
    queue = [];

    const success = await sendBatch(batch);
    if (!success) {
      queue = [...batch, ...queue];
      if (queue.length > maxCacheSize * 2) {
        queue = queue.slice(0, maxCacheSize);
      }
      saveToLocal();
    }
  };

  const enqueue = (data: ReportData) => {
    if (destroyed) return;

    queue.push(data);

    if (queue.length >= maxCacheSize) {
      flush();
    }
  };

  const startTimer = () => {
    if (timer || destroyed) return;

    timer = setInterval(() => {
      if (destroyed) return;
      flush();
    }, reportInterval);
  };

  const destroy = () => {
    destroyed = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    saveToLocal();
    console.log(`[GrayMonitor] Reporter destroyed, ${queue.length} records cached`);
  };

  loadFromLocal();
  startTimer();

  return {
    enqueue,
    flush,
    destroy,
    getQueueSize: () => queue.length
  };
}
