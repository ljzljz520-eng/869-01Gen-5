// ============================================
// 告警数据 Mock
// ============================================

import { Alert } from '../types/monitor';

export const mockAlerts: Alert[] = [
  {
    id: 'alert_001',
    versionId: 'ver_004',
    versionCode: '2.5.1-beta',
    title: 'iPhone 11 启动耗时异常',
    level: 'error',
    status: 'pending',
    type: 'device',
    description: 'iPhone 11 机型 P90 启动耗时超过阈值（1500ms），当前值为 1890ms，建议排查该机型兼容性问题',
    affectedDevices: ['iPhone 11'],
    metricValue: 1890,
    threshold: 1500,
    triggerTime: '2026-06-21T06:32:00.000Z',
    assignee: undefined
  },
  {
    id: 'alert_002',
    versionId: 'ver_002',
    versionCode: '2.4.8',
    title: '支付接口错误率飙升',
    level: 'critical',
    status: 'processing',
    type: 'error_rate',
    description: 'POST /api/payment/submit 接口错误率已达 4.28%，超过阈值 2%，影响用户下单流程',
    affectedRegions: ['成都', '西安', '重庆'],
    metricValue: 4.28,
    threshold: 2.0,
    triggerTime: '2026-06-21T05:15:00.000Z',
    assignee: '开发工程师A'
  },
  {
    id: 'alert_003',
    versionId: 'ver_001',
    versionCode: '2.5.0',
    title: '成都地区白屏率偏高',
    level: 'warning',
    status: 'pending',
    type: 'white_screen',
    description: '成都地区白屏率达 1.1%，高于全国平均水平 0.7%，建议检查 CDN 节点分布',
    affectedRegions: ['成都'],
    metricValue: 1.1,
    threshold: 0.8,
    triggerTime: '2026-06-21T04:48:00.000Z'
  },
  {
    id: 'alert_004',
    versionId: 'ver_002',
    versionCode: '2.4.8',
    title: 'iPhone 8 系列异常',
    level: 'critical',
    status: 'resolved',
    type: 'device',
    description: 'iPhone 8/8 Plus 机型错误率高达 0.85%，白屏率 0.068%，已执行暂停该机型灰度策略',
    affectedDevices: ['iPhone 8', 'iPhone 8 Plus'],
    metricValue: 0.85,
    threshold: 0.3,
    triggerTime: '2026-06-20T18:22:00.000Z',
    assignee: '开发工程师B',
    handleTime: '2026-06-20T19:05:00.000Z',
    handleNote: '已将 iPhone 8/8 Plus 加入机型黑名单，暂停该机型灰度放量，问题定位为 Metal 渲染兼容性问题，将在后续版本修复'
  },
  {
    id: 'alert_005',
    versionId: 'ver_004',
    versionCode: '2.5.1-beta',
    title: '整体错误率偏高',
    level: 'warning',
    status: 'processing',
    type: 'performance',
    description: '会员体系内测版本整体错误率 1.28%，高于常规版本 0.2%，仍在内测可接受范围内，持续观察',
    metricValue: 1.28,
    threshold: 1.0,
    triggerTime: '2026-06-21T02:10:00.000Z',
    assignee: '测试工程师A'
  },
  {
    id: 'alert_006',
    versionId: 'ver_001',
    versionCode: '2.5.0',
    title: '搜索接口延迟升高',
    level: 'info',
    status: 'resolved',
    type: 'error_rate',
    description: 'POST /api/search/query 接口平均响应时间 520ms，P95 达 1.2s，已通过扩容解决',
    metricValue: 1.2,
    threshold: 1.0,
    triggerTime: '2026-06-20T22:30:00.000Z',
    assignee: '运维工程师A',
    handleTime: '2026-06-20T23:45:00.000Z',
    handleNote: '搜索服务节点已从 8 个扩容至 16 个，目前响应时间已恢复至正常水平'
  },
  {
    id: 'alert_007',
    versionId: 'ver_002',
    versionCode: '2.4.8',
    title: '西安地区性能下降',
    level: 'warning',
    status: 'pending',
    type: 'region',
    description: '西安地区平均启动耗时 720ms，错误率 0.22%，均高于其他地区，建议检查西安节点服务器状态',
    affectedRegions: ['西安'],
    metricValue: 720,
    threshold: 680,
    triggerTime: '2026-06-21T03:55:00.000Z'
  },
  {
    id: 'alert_008',
    versionId: 'ver_004',
    versionCode: '2.5.1-beta',
    title: '白屏率超过阈值',
    level: 'error',
    status: 'pending',
    type: 'white_screen',
    description: '会员内测版本白屏率 1.48%，超过阈值 1%，受影响主要为低端 Android 机型',
    affectedDevices: ['红米 Note 10', 'realme Q3'],
    metricValue: 1.48,
    threshold: 1.0,
    triggerTime: '2026-06-21T01:20:00.000Z'
  }
];
