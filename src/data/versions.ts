// ============================================
// 版本管理 Mock 数据
// ============================================

import { GrayVersion } from '../types/monitor';

export const mockVersions: GrayVersion[] = [
  {
    id: 'ver_001',
    versionCode: '2.5.0',
    versionName: '首页大改版',
    description: '全新首页布局，优化信息流加载性能，修复iOS 16兼容性问题',
    status: 'graying',
    grayPercentage: 35,
    targetPercentage: 100,
    publishTime: '2026-06-19T10:00:00.000Z',
    createTime: '2026-06-18T16:00:00.000Z',
    updateTime: '2026-06-21T08:30:00.000Z',
    creator: '产品经理A',
    rules: [
      { id: 'r1', type: 'percentage', value: 35, description: '35%用户比例放量', enabled: true },
      { id: 'r2', type: 'region', value: ['北京', '上海', '广州', '深圳'], description: '一线地区优先', enabled: true },
      { id: 'r3', type: 'device', value: ['iPhone 14', 'iPhone 15'], description: '高端机型测试', enabled: false }
    ],
    allowedRegions: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
    blockedDevices: [],
    stats: {
      totalUsers: 1250000,
      activeUsers: 437500,
      launchCount: 1250000,
      avgLaunchTime: 680,
      errorCount: 3120,
      whiteScreenCount: 86
    }
  },
  {
    id: 'ver_002',
    versionCode: '2.4.8',
    versionName: '搜索优化',
    description: '搜索算法升级，增加联想词功能，优化搜索响应速度',
    status: 'graying',
    grayPercentage: 80,
    targetPercentage: 100,
    publishTime: '2026-06-15T14:00:00.000Z',
    createTime: '2026-06-14T09:00:00.000Z',
    updateTime: '2026-06-20T16:00:00.000Z',
    creator: '产品经理B',
    rules: [
      { id: 'r1', type: 'percentage', value: 80, description: '80%用户', enabled: true },
      { id: 'r2', type: 'region', value: [], description: '全国放量', enabled: true }
    ],
    allowedRegions: [],
    blockedDevices: ['iPhone 8', 'iPhone 8 Plus'],
    stats: {
      totalUsers: 2800000,
      activeUsers: 2240000,
      launchCount: 6720000,
      avgLaunchTime: 720,
      errorCount: 18900,
      whiteScreenCount: 520
    }
  },
  {
    id: 'ver_003',
    versionCode: '2.4.7',
    versionName: '支付流程优化',
    description: '简化支付步骤，增加多种支付方式，修复部分用户下单失败问题',
    status: 'completed',
    grayPercentage: 100,
    targetPercentage: 100,
    publishTime: '2026-06-10T09:00:00.000Z',
    createTime: '2026-06-08T15:00:00.000Z',
    updateTime: '2026-06-14T12:00:00.000Z',
    creator: '产品经理A',
    rules: [
      { id: 'r1', type: 'percentage', value: 100, description: '全量发布', enabled: true }
    ],
    allowedRegions: [],
    blockedDevices: [],
    stats: {
      totalUsers: 3500000,
      activeUsers: 3500000,
      launchCount: 10500000,
      avgLaunchTime: 650,
      errorCount: 8900,
      whiteScreenCount: 230
    }
  },
  {
    id: 'ver_004',
    versionCode: '2.5.1-beta',
    versionName: '会员体系内测',
    description: '新增会员等级体系，会员专属权益，内测版本',
    status: 'paused',
    grayPercentage: 10,
    targetPercentage: 30,
    publishTime: '2026-06-20T11:00:00.000Z',
    createTime: '2026-06-19T10:00:00.000Z',
    updateTime: '2026-06-21T06:00:00.000Z',
    creator: '产品经理C',
    rules: [
      { id: 'r1', type: 'percentage', value: 10, description: '10%内测用户', enabled: true },
      { id: 'r2', type: 'user_tag', value: ['vip_user', 'beta_tester'], description: '特定用户标签', enabled: true }
    ],
    allowedRegions: ['北京', '上海', '深圳'],
    blockedDevices: [],
    stats: {
      totalUsers: 350000,
      activeUsers: 35000,
      launchCount: 98000,
      avgLaunchTime: 890,
      errorCount: 1250,
      whiteScreenCount: 145
    }
  },
  {
    id: 'ver_005',
    versionCode: '2.4.5',
    versionName: '紧急bug修复',
    description: '修复2.4.4版本中导致Android机型崩溃的严重问题',
    status: 'rolled_back',
    grayPercentage: 0,
    targetPercentage: 50,
    publishTime: '2026-06-05T08:00:00.000Z',
    createTime: '2026-06-04T14:00:00.000Z',
    updateTime: '2026-06-05T15:30:00.000Z',
    creator: '产品经理B',
    rules: [
      { id: 'r1', type: 'percentage', value: 50, description: '50%用户', enabled: true }
    ],
    allowedRegions: [],
    blockedDevices: [],
    stats: {
      totalUsers: 1750000,
      activeUsers: 875000,
      launchCount: 2100000,
      avgLaunchTime: 1200,
      errorCount: 28900,
      whiteScreenCount: 1850
    }
  },
  {
    id: 'ver_006',
    versionCode: '2.6.0-alpha',
    versionName: 'AI智能助手',
    description: '新增AI智能推荐，个性化内容推送，语音交互功能',
    status: 'pending',
    grayPercentage: 0,
    targetPercentage: 5,
    publishTime: '',
    createTime: '2026-06-20T18:00:00.000Z',
    updateTime: '2026-06-20T18:00:00.000Z',
    creator: '产品经理D',
    rules: [
      { id: 'r1', type: 'percentage', value: 5, description: '小范围alpha测试', enabled: true }
    ],
    allowedRegions: ['北京', '上海', '杭州'],
    blockedDevices: [],
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      launchCount: 0,
      avgLaunchTime: 0,
      errorCount: 0,
      whiteScreenCount: 0
    }
  }
];
