import { useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

const TABS = [
  { key: 'quickstart', label: '快速集成' },
  { key: 'api', label: 'API 参考' },
  { key: 'features', label: '功能说明' },
  { key: 'faq', label: '常见问题' }
];

const CODE_INSTALL = `# 使用 npm 安装
npm install @gray-monitor/sdk --save

# 或使用 yarn
yarn add @gray-monitor/sdk`;

const CODE_INIT = `// app.tsx
import { initGrayMonitor } from '@gray-monitor/sdk';

initGrayMonitor({
  appId: 'your-app-id',
  sampleRate: 0.1,   // 10% 采样率
  enableLaunch: true,    // 启用启动耗时采集
  enableNetwork: true,   // 启用网络错误采集
  enableWhiteScreen: true // 启用白屏检测
});`;

const CODE_VERIFY = `// [GrayMonitor] SDK initialized
// [GrayMonitor] App ID: your-app-id
// [GrayMonitor] Sample rate: 10%`;

const CODE_INIT_USAGE = `import { initGrayMonitor } from '@gray-monitor/sdk';
const sdk = initGrayMonitor(config);`;

const CODE_SET_TAG = `// 标记用户为新用户
sdk.setUserTag('isNewUser', true);

// 标记用户等级
sdk.setUserTag('vipLevel', 3);`;

const CODE_CUSTOM_EVENT = `sdk.reportCustomEvent('purchase_click', {
  productId: 'SKU_12345',
  amount: 99.00,
  page: 'product_detail'
});`;

const CODE_LAUNCH_SAMPLE = `// 采集到的数据结构示例
{
  type: 'launch',
  launchType: 'cold', // cold / warm
  duration: 847,      // 总启动耗时 ms
  fp: 423,            // 首次绘制
  fcp: 568,           // 首次内容绘制
  tti: 782,           // 可交互时间
  deviceModel: 'iPhone 14 Pro',
  region: '北京'
}`;

const ALGO_STEPS = [
  '① 在屏幕选取 7 个检测点（中心 + 四角 + 上下中点）',
  '② 周期性检测各点是否存在有意义的内容元素',
  '③ 计算页面有效内容面积占比',
  '④ 若超过阈值时间，有效内容仍低于设定标准 → 判定为白屏',
  '⑤ 立即上报并附带页面快照描述'
];

const CHECKLIST = [
  { icon: '☑️', title: 'SDK 安装', desc: '@gray-monitor/sdk 已正确安装' },
  { icon: '☑️', title: '初始化配置', desc: 'appId 与采样率配置正确' },
  { icon: '☑️', title: '启动采集', desc: 'enableLaunch: true' },
  { icon: '☑️', title: '网络采集', desc: 'enableNetwork: true' },
  { icon: '☑️', title: '白屏检测', desc: 'enableWhiteScreen: true' },
  { icon: '☑️', title: '后台联调', desc: '管理后台已收到数据上报' }
];

const API_PARAMS = [
  { name: 'appId', type: 'string', def: '-', desc: '必填，小程序应用唯一标识' },
  { name: 'sampleRate', type: 'number', def: '0.1', desc: '采样率 0-1，1 表示 100% 采集' },
  { name: 'enableLaunch', type: 'boolean', def: 'true', desc: '是否采集启动耗时指标' },
  { name: 'enableNetwork', type: 'boolean', def: 'true', desc: '是否采集网络错误指标' },
  { name: 'enableWhiteScreen', type: 'boolean', def: 'true', desc: '是否启用白屏检测' },
  { name: 'reportUrl', type: 'string', def: '-', desc: '自定义上报接口地址' },
  { name: 'batchSize', type: 'number', def: '10', desc: '批量上报的条数阈值' },
  { name: 'reportInterval', type: 'number', def: '5000', desc: '定时上报间隔（毫秒）' },
  { name: 'whiteScreenThreshold', type: 'number', def: '3000', desc: '白屏判定时间阈值（毫秒）' },
  { name: 'deviceInfo', type: 'object', def: '-', desc: '覆盖默认设备信息采集' }
];

const FEATURE_GRID = [
  { color: '#165DFF', title: '分层采样', desc: '按用户 ID hash 决定是否采样，保证同一用户始终在采样组内' },
  { color: '#FF7D00', title: '批量上报', desc: '数据先入队，达到 batchSize 条或 reportInterval 毫秒后批量发送' },
  { color: '#00B42A', title: '失败重试', desc: '上报失败自动缓存到 localStorage，下次启动补报' },
  { color: '#722ED1', title: '维度增强', desc: '每条上报自动附带设备、地区、网络类型等维度信息' }
];

const FAQS = [
  {
    q: 'SDK 会影响小程序的启动性能吗？',
    a: 'SDK 采用惰性初始化策略，核心采集逻辑异步执行，总体性能开销 < 10ms，且只在采样命中的用户设备上运行，对启动性能无显著影响。'
  },
  {
    q: '白屏检测会误判吗？如何降低误报率？',
    a: '白屏检测采用「多点采样 + 内容面积 + 时间阈值」三重判定机制，默认阈值经过大量数据训练。可通过 whiteScreenThreshold 参数根据业务实际调整。'
  },
  {
    q: '采样率设置多少合适？',
    a: '建议：DAU < 1万 → 100%（1.0）；1万~10万 → 30%（0.3）；10万~100万 → 10%（0.1）；>100万 → 1%~5%。保证每日样本量 ≥ 1万条即可获得统计意义。'
  },
  {
    q: '如何在特定页面关闭数据采集？',
    a: '调用 sdk.pause() 暂停采集，sdk.resume() 恢复采集。SDK 也提供 ignorePatterns 配置支持正则过滤不需要监控的页面路径。'
  },
  {
    q: '数据上报接口是哪个？需要开放域名白名单吗？',
    a: '默认上报到 graymonitor.com/report，小程序后台需要将该域名加入 request 合法域名列表。私有化部署通过 reportUrl 参数配置自定义地址。'
  }
];

export default function SdkDocPage() {
  const [activeTab, setActiveTab] = useState('quickstart');

  const copyToClipboard = (text: string) => {
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' })
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View>
          <Text className={styles.badge}>GrayMonitor SDK v1.0.0</Text>
          <Text
            className={styles.quickCopy}
            onClick={() => copyToClipboard('npm install @gray-monitor/sdk')}
          >
            📋 复制安装命令
          </Text>
        </View>
        <Text className={styles.title}>灰度性能监测 SDK</Text>
        <Text className={styles.desc}>
          轻量级前端埋点 SDK，为小程序提供启动耗时、网络错误、白屏检测等核心性能指标采集能力，
          支持按用户比例采样、地区与机型维度上报，与管理后台无缝对接。
        </Text>
      </View>

      <View className={styles.content}>
        <ScrollView scrollX className={styles.navTabs}>
          {TABS.map(tab => (
            <View
              key={tab.key}
              className={`${styles.navTab} ${activeTab === tab.key ? styles.navTabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </ScrollView>

        {activeTab === 'quickstart' && (
          <>
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>⚡</Text>
                快速开始
              </Text>
              <View className={styles.stepList}>
                <View className={styles.stepItem}>
                  <Text className={styles.stepTitle}>安装 SDK</Text>
                  <Text className={styles.stepDesc}>
                    通过 npm 或 yarn 将 SDK 安装到你的小程序项目中。
                  </Text>
                  <View
                    className={styles.codeBlock}
                    onClick={() => copyToClipboard('npm install @gray-monitor/sdk --save')}
                  >
                    <Text className={styles.codeText}>{CODE_INSTALL}</Text>
                  </View>
                </View>

                <View className={styles.stepItem}>
                  <Text className={styles.stepTitle}>在小程序入口初始化</Text>
                  <Text className={styles.stepDesc}>
                    在 app.tsx 中引入 SDK 并进行初始化配置。
                  </Text>
                  <View className={styles.codeBlock}>
                    <Text className={styles.codeText}>{CODE_INIT}</Text>
                  </View>
                </View>

                <View className={styles.stepItem}>
                  <Text className={styles.stepTitle}>验证集成</Text>
                  <Text className={styles.stepDesc}>
                    运行小程序，打开调试器查看 Console，若出现以下日志则说明 SDK 初始化成功：
                  </Text>
                  <View className={styles.codeBlock}>
                    <Text className={styles.codeText}>{CODE_VERIFY}</Text>
                  </View>

                  <View className={styles.tipBox}>
                    <Text className={styles.tipTitle}>💡 提示</Text>
                    <Text className={styles.tipContent}>
                      开发环境建议将 sampleRate 设置为 1，确保所有数据都能采集到，便于调试。
                      生产环境按实际用户量级调整采样率。
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>✅</Text>
                集成检查清单
              </Text>
              <View className={styles.featureGrid}>
                {CHECKLIST.map((item, i) => (
                  <View key={i} className={styles.featureCard} style={{ borderLeftColor: '#00B42A' }}>
                    <Text className={styles.featureTitle}>{item.icon} {item.title}</Text>
                    <Text className={styles.featureDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'api' && (
          <>
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📖</Text>
                初始化配置 (SDKConfig)
              </Text>

              <View className={styles.subTitle}>参数说明</View>
              <ScrollView scrollX>
                <View className={styles.apiTable}>
                  <View className={styles.tableHead}>
                    <View style={{ display: 'flex' }}>
                      <Text className={`${styles.tableCell} ${styles.tableHeaderCell}`} style={{ flex: 2 }}>参数名</Text>
                      <Text className={`${styles.tableCell} ${styles.tableHeaderCell}`} style={{ flex: 1 }}>类型</Text>
                      <Text className={`${styles.tableCell} ${styles.tableHeaderCell}`} style={{ flex: 1 }}>默认值</Text>
                      <Text className={`${styles.tableCell} ${styles.tableHeaderCell}`} style={{ flex: 3 }}>说明</Text>
                    </View>
                  </View>
                  <View>
                    {API_PARAMS.map(row => (
                      <View key={row.name} style={{ display: 'flex' }}>
                        <Text className={`${styles.tableCell} ${styles.tableBodyCell}`} style={{ flex: 2, fontWeight: 600, color: '#722ED1' }}>
                          {row.name}
                        </Text>
                        <Text className={`${styles.tableCell} ${styles.tableBodyCell}`} style={{ flex: 1, color: '#165DFF' }}>
                          {row.type}
                        </Text>
                        <Text className={`${styles.tableCell} ${styles.tableBodyCell}`} style={{ flex: 1 }}>
                          {row.def}
                        </Text>
                        <Text className={`${styles.tableCell} ${styles.tableBodyCell}`} style={{ flex: 3 }}>
                          {row.desc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>🔧</Text>
                API 方法
              </Text>

              <View className={styles.subTitle}>initGrayMonitor(config)</View>
              <Text className={styles.stepDesc}>
                初始化 SDK，在小程序入口调用一次即可。
              </Text>
              <View className={styles.codeBlock}>
                <Text className={styles.codeText}>{CODE_INIT_USAGE}</Text>
              </View>

              <View className={styles.subTitle}>sdk.setUserTag(tag, value)</View>
              <Text className={styles.stepDesc}>
                设置用户标签，用于灰度规则匹配。
              </Text>
              <View className={styles.codeBlock}>
                <Text className={styles.codeText}>{CODE_SET_TAG}</Text>
              </View>

              <View className={styles.subTitle}>sdk.reportCustomEvent(name, data)</View>
              <Text className={styles.stepDesc}>
                上报自定义业务事件。
              </Text>
              <View className={styles.codeBlock}>
                <Text className={styles.codeText}>{CODE_CUSTOM_EVENT}</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'features' && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🚀</Text>
              核心功能详解
            </Text>

            <View className={styles.subTitle}>1. 启动耗时采集</View>
            <Text className={styles.stepDesc}>
              SDK 自动区分冷启动与热启动，记录从 App onLaunch 到首屏渲染完成的完整耗时，
              同时估算 FP（首次绘制）、FCP（首次内容绘制）、TTI（可交互时间）等关键指标。
            </Text>
            <View className={styles.codeBlock}>
              <Text className={styles.codeText}>{CODE_LAUNCH_SAMPLE}</Text>
            </View>

            <View className={styles.subTitle}>2. 网络错误监控</View>
            <Text className={styles.stepDesc}>
              自动拦截 Taro.request 请求，捕获 HTTP 错误状态码（≥400）、
              请求超时、网络异常等情况，不会重复上报 SDK 自身的数据上报请求。
            </Text>

            <View className={styles.warnBox}>
              <Text className={styles.warnTitle}>⚠️ 注意事项</Text>
              <Text className={styles.tipContent}>
                网络拦截采用 Monkey Patch 方式，请确保 SDK 初始化在所有业务请求之前完成。
                建议在 app.tsx 顶部引入并初始化。
              </Text>
            </View>

            <View className={styles.subTitle}>3. 白屏检测算法</View>
            <Text className={styles.stepDesc}>
              采用「7点采样法 + DOM内容面积判定」组合算法：
            </Text>
            <View className={styles.algoBox}>
              {ALGO_STEPS.map((step, i) => (
                <Text key={i} className={styles.algoStep}>{step}</Text>
              ))}
            </View>

            <View className={styles.subTitle}>4. 采样与上报策略</View>
            <View className={styles.featureGrid}>
              {FEATURE_GRID.map((item, i) => (
                <View key={i} className={styles.featureCard} style={{ borderLeftColor: item.color }}>
                  <Text className={styles.featureTitle}>{item.title}</Text>
                  <Text className={styles.featureDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'faq' && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>❓</Text>
              常见问题 FAQ
            </Text>

            {FAQS.map((faq, idx) => (
              <View key={idx} className={styles.faqItem}>
                <Text className={styles.faqQuestion}>
                  <Text className={styles.faqIndex}>Q{idx + 1}.</Text>
                  {faq.q}
                </Text>
                <Text className={styles.faqAnswer}>{faq.a}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
