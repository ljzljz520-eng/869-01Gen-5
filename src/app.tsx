import React, { useEffect } from 'react';
import { useDidShow, useDidHide, getSystemInfoSync } from '@tarojs/taro';
import './app.scss';
import { initGrayMonitor } from './sdk/GrayMonitor';

function App(props) {
  useEffect(() => {
    try {
      const systemInfo = getSystemInfoSync();
      initGrayMonitor({
        appId: 'gray-monitor-demo',
        appVersion: '1.0.0',
        sampleRate: 1,
        enableLaunchMonitor: true,
        enableNetworkMonitor: true,
        enableWhiteScreenMonitor: true,
        deviceInfo: {
          model: systemInfo.model,
          platform: systemInfo.platform,
          system: systemInfo.system,
          SDKVersion: systemInfo.SDKVersion
        }
      });
      console.log('[GrayMonitor] SDK initialized successfully');
    } catch (error) {
      console.error('[GrayMonitor] SDK initialization failed:', error);
    }
  }, []);

  useDidShow(() => {
    console.log('[GrayMonitor] App did show');
  });

  useDidHide(() => {
    console.log('[GrayMonitor] App did hide');
  });

  return props.children;
}

export default App;
