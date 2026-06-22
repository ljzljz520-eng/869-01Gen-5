// ============================================
// 性能数据 Mock
// ============================================

import { PerformanceTrend, RegionStats, DeviceStats, TopErrorApi } from '../types/monitor';

function generateTimeLabels(hours: number = 24): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(`${time.getHours().toString().padStart(2, '0')}:00`);
  }
  return labels;
}

const timeLabels = generateTimeLabels(24);

export const mockPerformanceTrend: PerformanceTrend[] = timeLabels.map((label, index) => {
  const baseLoad = 650 + Math.sin(index / 3) * 50;
  const randomFactor = 1 + (Math.random() - 0.5) * 0.15;
  const userBaseFactor = index > 18 ? 1.3 : index < 6 ? 0.6 : 1;

  return {
    timestamp: label,
    launchTimeP50: Math.round(baseLoad * randomFactor),
    launchTimeP90: Math.round((baseLoad + 200) * randomFactor * userBaseFactor),
    launchTimeP99: Math.round((baseLoad + 450) * randomFactor * userBaseFactor),
    errorRate: Number((0.15 + Math.sin(index / 4) * 0.08 + Math.random() * 0.05).toFixed(3)),
    whiteScreenRate: Number((0.008 + Math.random() * 0.006).toFixed(4)),
    activeUsers: Math.round((18000 + Math.sin(index / 5) * 5000 + Math.random() * 2000) * userBaseFactor)
  };
});

export const mockRegionStats: RegionStats[] = [
  { region: '北京', userCount: 450000, avgLaunchTime: 620, errorRate: 0.12, whiteScreenRate: 0.006 },
  { region: '上海', userCount: 420000, avgLaunchTime: 640, errorRate: 0.14, whiteScreenRate: 0.007 },
  { region: '广州', userCount: 310000, avgLaunchTime: 680, errorRate: 0.18, whiteScreenRate: 0.009 },
  { region: '深圳', userCount: 380000, avgLaunchTime: 660, errorRate: 0.15, whiteScreenRate: 0.008 },
  { region: '杭州', userCount: 240000, avgLaunchTime: 650, errorRate: 0.13, whiteScreenRate: 0.007 },
  { region: '成都', userCount: 195000, avgLaunchTime: 710, errorRate: 0.21, whiteScreenRate: 0.011 },
  { region: '武汉', userCount: 168000, avgLaunchTime: 690, errorRate: 0.19, whiteScreenRate: 0.010 },
  { region: '南京', userCount: 142000, avgLaunchTime: 670, errorRate: 0.16, whiteScreenRate: 0.008 },
  { region: '西安', userCount: 128000, avgLaunchTime: 720, errorRate: 0.22, whiteScreenRate: 0.012 },
  { region: '重庆', userCount: 156000, avgLaunchTime: 700, errorRate: 0.20, whiteScreenRate: 0.010 }
];

export const mockDeviceStats: DeviceStats[] = [
  { model: 'iPhone 15 Pro Max', userCount: 85000, avgLaunchTime: 520, errorRate: 0.08, whiteScreenRate: 0.003, isAbnormal: false },
  { model: 'iPhone 15 Pro', userCount: 72000, avgLaunchTime: 510, errorRate: 0.07, whiteScreenRate: 0.003, isAbnormal: false },
  { model: 'iPhone 15', userCount: 128000, avgLaunchTime: 540, errorRate: 0.09, whiteScreenRate: 0.004, isAbnormal: false },
  { model: 'iPhone 14 Pro Max', userCount: 95000, avgLaunchTime: 560, errorRate: 0.10, whiteScreenRate: 0.005, isAbnormal: false },
  { model: 'iPhone 14', userCount: 156000, avgLaunchTime: 590, errorRate: 0.11, whiteScreenRate: 0.005, isAbnormal: false },
  { model: 'iPhone 13', userCount: 189000, avgLaunchTime: 640, errorRate: 0.14, whiteScreenRate: 0.007, isAbnormal: false },
  { model: 'iPhone 12', userCount: 145000, avgLaunchTime: 710, errorRate: 0.19, whiteScreenRate: 0.010, isAbnormal: false },
  { model: 'iPhone 11', userCount: 98000, avgLaunchTime: 780, errorRate: 0.25, whiteScreenRate: 0.015, isAbnormal: true },
  { model: 'iPhone 8 Plus', userCount: 42000, avgLaunchTime: 1050, errorRate: 0.85, whiteScreenRate: 0.068, isAbnormal: true },
  { model: '华为 Mate 60 Pro', userCount: 68000, avgLaunchTime: 580, errorRate: 0.10, whiteScreenRate: 0.005, isAbnormal: false },
  { model: '小米 14 Ultra', userCount: 52000, avgLaunchTime: 600, errorRate: 0.12, whiteScreenRate: 0.006, isAbnormal: false },
  { model: 'OPPO Find X7', userCount: 38000, avgLaunchTime: 620, errorRate: 0.13, whiteScreenRate: 0.007, isAbnormal: false },
  { model: 'vivo X100 Pro', userCount: 45000, avgLaunchTime: 610, errorRate: 0.11, whiteScreenRate: 0.006, isAbnormal: false },
  { model: '三星 Galaxy S24', userCount: 25000, avgLaunchTime: 650, errorRate: 0.16, whiteScreenRate: 0.008, isAbnormal: false }
];

export const mockTopErrorApis: TopErrorApi[] = [
  { url: '/api/user/profile', method: 'GET', errorCount: 1250, errorRate: 2.35, avgDuration: 320 },
  { url: '/api/feed/list', method: 'GET', errorCount: 980, errorRate: 1.84, avgDuration: 450 },
  { url: '/api/order/create', method: 'POST', errorCount: 856, errorRate: 3.12, avgDuration: 680 },
  { url: '/api/search/query', method: 'POST', errorCount: 742, errorRate: 1.56, avgDuration: 520 },
  { url: '/api/payment/submit', method: 'POST', errorCount: 628, errorRate: 4.28, avgDuration: 890 },
  { url: '/api/message/list', method: 'GET', errorCount: 545, errorRate: 1.12, avgDuration: 280 },
  { url: '/api/product/detail', method: 'GET', errorCount: 478, errorRate: 0.89, avgDuration: 240 },
  { url: '/api/cart/update', method: 'POST', errorCount: 412, errorRate: 1.68, avgDuration: 310 }
];
