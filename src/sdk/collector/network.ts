// ============================================
// 接口错误采集器
// ============================================

import { NetworkError } from '../../types/monitor';

interface NetworkCollectorOptions {
  onNetworkError: (error: Omit<NetworkError, 'id' | 'versionId' | 'versionCode' | 'timestamp' | 'userId' | 'deviceModel' | 'region'>) => void;
}

export function createNetworkCollector(options: NetworkCollectorOptions) {
  const { onNetworkError } = options;
  let started = false;
  let originalRequest: any = null;

  const isErrorStatusCode = (statusCode: number): boolean => {
    return statusCode >= 400 || statusCode === 0;
  };

  const shouldReportError = (url: string): boolean => {
    const ignoredPatterns = [
      '/gray/report',
      '/monitor/',
      '/log/',
      'log.aliyuncs',
      'track'
    ];
    return !ignoredPatterns.some(pattern => url.includes(pattern));
  };

  const reportError = (params: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    statusCode: number;
    errorMessage: string;
    requestParams?: string;
    responseBody?: string;
    duration: number;
  }) => {
    if (!shouldReportError(params.url)) return;

    onNetworkError({
      url: params.url,
      method: params.method,
      statusCode: params.statusCode,
      errorMessage: params.errorMessage,
      requestParams: params.requestParams || '{}',
      responseBody: params.responseBody || '',
      duration: params.duration
    });
  };

  const interceptRequest = () => {
    try {
      if (typeof Taro === 'undefined' || !Taro.request) {
        console.warn('[GrayMonitor] Taro.request not available, network monitoring limited');
        return;
      }

      originalRequest = Taro.request.bind(Taro);

      (Taro as any).request = (options: any) => {
        const startTime = Date.now();
        const method = (options.method || 'GET').toUpperCase();
        const url = options.url || '';

        return new Promise((resolve, reject) => {
          originalRequest({
            ...options,
            success: (res: any) => {
              const duration = Date.now() - startTime;
              if (isErrorStatusCode(res.statusCode)) {
                reportError({
                  url,
                  method,
                  statusCode: res.statusCode,
                  errorMessage: `HTTP ${res.statusCode}`,
                  requestParams: typeof options.data === 'string' ? options.data : JSON.stringify(options.data || {}),
                  responseBody: typeof res.data === 'string' ? res.data.substring(0, 500) : JSON.stringify(res.data || {}).substring(0, 500),
                  duration
                });
              }
              if (options.success) options.success(res);
              resolve(res);
            },
            fail: (err: any) => {
              const duration = Date.now() - startTime;
              reportError({
                url,
                method,
                statusCode: 0,
                errorMessage: err.errMsg || err.message || 'Network Error',
                requestParams: typeof options.data === 'string' ? options.data : JSON.stringify(options.data || {}),
                responseBody: '',
                duration
              });
              if (options.fail) options.fail(err);
              reject(err);
            },
            complete: options.complete
          });
        });
      };

      console.log('[GrayMonitor] Network interceptor installed');
    } catch (error) {
      console.error('[GrayMonitor] Network interceptor setup failed:', error);
    }
  };

  const start = () => {
    if (started) return;
    started = true;
    interceptRequest();
    console.log('[GrayMonitor] Network collector started');
  };

  const stop = () => {
    if (!started) return;
    started = false;

    if (originalRequest && typeof Taro !== 'undefined') {
      (Taro as any).request = originalRequest;
    }
    console.log('[GrayMonitor] Network collector stopped');
  };

  const manualReportError = (params: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    statusCode: number;
    errorMessage: string;
    requestParams?: Record<string, unknown> | string;
    responseBody?: Record<string, unknown> | string;
    duration?: number;
  }) => {
    reportError({
      ...params,
      requestParams: typeof params.requestParams === 'string' ? params.requestParams : JSON.stringify(params.requestParams || {}),
      responseBody: typeof params.responseBody === 'string' ? params.responseBody : JSON.stringify(params.responseBody || {}),
      duration: params.duration || 0
    });
  };

  return {
    start,
    stop,
    manualReportError
  };
}
