import { useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { MonitorService } from '@/services/monitorService';
import { VersionService } from '@/services/versionService';
import { FilterBar, FilterItem } from '@/components/FilterBar';
import { StatCard } from '@/components/StatCard';
import { LineChart, ChartSeries } from '@/components/LineChart';
import { BarChart, BarChartItem } from '@/components/BarChart';
import { StatusTag } from '@/components/StatusTag';
import { EmptyState } from '@/components/EmptyState';
import {
  formatNumber,
  formatMsTime,
  formatPercent,
  formatTimeShort
} from '@/utils/format';
import { buildSmoothLinePath } from '@/utils/chart';
import type { GrayVersion, DeviceStats } from '@/types/monitor';
import styles from './index.module.scss';

const TIME_FILTERS: FilterItem<string>[] = [
  { key: '1h', label: '1小时' },
  { key: '24h', label: '24小时' },
  { key: '7d', label: '7天' },
  { key: '30d', label: '30天' }
];

const TREND_SERIES: ChartSeries[] = [
  { key: 'avgLaunchTime', label: '平均启动', color: '#165DFF', unit: 'ms' },
  { key: 'p95LaunchTime', label: 'P95启动', color: '#722ED1', unit: 'ms' }
];

export default function MonitorPage() {
  const store = useMonitorStore();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const activeVersions = useMemo(() => store.getActiveVersions(), [store]);
  const performanceTrend = store.performanceTrend;
  const regionStats = store.regionStats;
  const deviceStats = store.deviceStats;
  const topErrorApis = store.topErrorApis;

  const summary = useMemo(() => {
    return MonitorService.getSummaryStats(performanceTrend);
  }, [performanceTrend]);

  const trendChartData = useMemo(() => {
    return {
      labels: performanceTrend.map(p => formatTimeShort(p.timestamp)),
      series: TREND_SERIES,
      datasets: {
        avgLaunchTime: performanceTrend.map(p => p.avgLaunchTime),
        p95LaunchTime: performanceTrend.map(p => p.p95LaunchTime)
      }
    };
  }, [performanceTrend]);

  const errorChartData = useMemo(() => {
    return {
      labels: performanceTrend.map(p => formatTimeShort(p.timestamp)),
      series: [
        { key: 'networkErrors', label: '网络错误', color: '#FF7D00', unit: '次' },
        { key: 'whiteScreens', label: '白屏次数', color: '#F53F3F', unit: '次' }
      ],
      datasets: {
        networkErrors: performanceTrend.map(p => p.networkErrors),
        whiteScreens: performanceTrend.map(p => p.whiteScreens)
      }
    };
  }, [performanceTrend]);

  const regionBarData: BarChartItem[] = useMemo(() => {
    return regionStats
      .slice(0, 8)
      .map(r => ({
        label: r.region,
        value: r.avgLaunchTime,
        unit: 'ms'
      }));
  }, [regionStats]);

  const abnormalDevices = useMemo(() => {
    return deviceStats.filter(d => d.isAbnormal);
  }, [deviceStats]);

  const sortedDevices = useMemo(() => {
    return [...deviceStats].sort((a, b) => {
      if (a.isAbnormal !== b.isAbnormal) return a.isAbnormal ? -1 : 1;
      return b.avgLaunchTime - a.avgLaunchTime;
    });
  }, [deviceStats]);

  const handlePauseDevice = (versionId: string, device: DeviceStats) => {
    Taro.showModal({
      title: '暂停该机型灰度',
      content: `确定要暂停版本 [${versionId}] 在「${device.model}」上的灰度发布吗？该机型用户将暂时无法使用新版本。`,
      confirmText: '暂停',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          VersionService.pauseDevice(versionId, device.model);
          Taro.showToast({ title: '已暂停该机型', icon: 'success' });
        }
      }
    });
  };

  const handleResumeDevice = (versionId: string, device: DeviceStats) => {
    VersionService.resumeDevice(versionId, device.model);
    Taro.showToast({ title: '已恢复该机型', icon: 'success' });
  };

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return styles.rankBadge1;
    if (index === 1) return styles.rankBadge2;
    if (index === 2) return styles.rankBadge3;
    return styles.rankBadgeDefault;
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>性能监控</Text>
        <Text className={styles.headerDesc}>
          实时监控启动耗时、网络错误与白屏率，按地区和机型维度深度分析
        </Text>
      </View>

      <View className={styles.content}>
        <View className={styles.versionSelector}>
          <View
            className={`${styles.versionChip} ${!selectedVersionId ? styles.versionChipActive : ''}`}
            onClick={() => setSelectedVersionId(null)}
          >
            全部版本
          </View>
          {activeVersions.map(v => (
            <View
              key={v.id}
              className={`${styles.versionChip} ${selectedVersionId === v.id ? styles.versionChipActive : ''}`}
              onClick={() => setSelectedVersionId(v.id)}
            >
              v{v.versionCode}
            </View>
          ))}
        </View>

        <FilterBar
          items={TIME_FILTERS}
          activeKey={timeRange}
          onChange={(k) => setTimeRange(k)}
        />

        <View className={styles.statGrid}>
          <StatCard
            title="平均启动耗时"
            value={formatMsTime(summary.avgLaunchTime)}
            trend={summary.launchTimeTrend}
            theme="blue"
            icon="⏱"
          />
          <StatCard
            title="P95启动耗时"
            value={formatMsTime(summary.p95LaunchTime)}
            trend={summary.p95Trend}
            theme="purple"
            icon="📊"
          />
          <StatCard
            title="网络错误"
            value={formatNumber(summary.totalNetworkErrors)}
            trend={summary.errorTrend}
            theme="orange"
            icon="⚠️"
          />
          <StatCard
            title="白屏次数"
            value={formatNumber(summary.totalWhiteScreens)}
            trend={summary.whiteScreenTrend}
            theme="red"
            icon="📵"
          />
        </View>

        {abnormalDevices.length > 0 && (
          <View className={styles.card}>
            <View className={styles.cardHeader}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardTitleDot} style={{ background: '#F53F3F' }}></Text>
                异常机型告警
              </Text>
              <Text className={`${styles.cardTag} ${styles.errorTag}`}>
                {abnormalDevices.length} 个异常
              </Text>
            </View>
            <View className={styles.rankList}>
              {abnormalDevices.map((device, idx) => (
                <View
                  key={device.model}
                  className={styles.rankItem}
                  onClick={() => {
                    const activeVer = activeVersions[0];
                    if (activeVer) {
                      if (device.isAbnormal) {
                        handleResumeDevice(activeVer.id, device);
                      } else {
                        handlePauseDevice(activeVer.id, device);
                      }
                    }
                  }}
                >
                  <Text className={`${styles.rankBadge} ${getRankBadgeClass(idx)}`}>{idx + 1}</Text>
                  <View className={styles.rankContent}>
                    <Text className={styles.rankName}>
                      {device.model}
                      <Text className={styles.abnormalBadge}>异常</Text>
                    </Text>
                    <Text className={styles.rankSub}>
                      <Text>错误率 {formatPercent(device.errorRate)}</Text>
                      <Text>·</Text>
                      <Text>白屏率 {formatPercent(device.whiteScreenRate)}</Text>
                    </Text>
                  </View>
                  <View className={styles.rankValue}>
                    <Text className={`${styles.rankMainValue} ${styles.rankMainValueAbnormal}`}>
                      {formatMsTime(device.avgLaunchTime)}
                    </Text>
                    <Text className={styles.rankSubValue}>{formatNumber(device.userCount)} 用户</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleDot}></Text>
              启动耗时趋势
            </Text>
            <Text className={styles.cardTag}>最近{timeRange}</Text>
          </View>
          <View className={styles.chartWrap}>
            <LineChart
              labels={trendChartData.labels}
              series={trendChartData.series}
              datasets={trendChartData.datasets}
              height={360}
              showArea
              smooth
            />
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleDot} style={{ background: '#FF7D00' }}></Text>
              错误趋势
            </Text>
            <Text className={`${styles.cardTag} ${styles.warningTag}`}>网络 + 白屏</Text>
          </View>
          <View className={styles.chartWrap}>
            <LineChart
              labels={errorChartData.labels}
              series={errorChartData.series}
              datasets={errorChartData.datasets}
              height={360}
              showArea
              smooth
            />
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleDot} style={{ background: '#00B42A' }}></Text>
              地区启动耗时排行
            </Text>
            <Text className={styles.cardTag}>TOP{regionBarData.length}</Text>
          </View>
          <View className={styles.chartWrap}>
            <BarChart
              data={regionBarData}
              height={360}
              color="#165DFF"
              horizontal
            />
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleDot} style={{ background: '#722ED1' }}></Text>
              机型性能排行
            </Text>
            <Text className={styles.cardTag}>共{sortedDevices.length}款</Text>
          </View>
          {sortedDevices.length === 0 ? (
            <EmptyState title="暂无机型数据" desc="等待用户数据上报" compact />
          ) : (
            <View className={styles.rankList}>
              {sortedDevices.map((device, idx) => (
                <View
                  key={device.model}
                  className={styles.rankItem}
                >
                  <Text className={`${styles.rankBadge} ${getRankBadgeClass(idx)}`}>{idx + 1}</Text>
                  <View className={styles.rankContent}>
                    <Text className={styles.rankName}>
                      {device.model}
                      {device.isAbnormal && <Text className={styles.abnormalBadge}>异常</Text>}
                    </Text>
                    <Text className={styles.rankSub}>
                      <Text>错误率 {formatPercent(device.errorRate)}</Text>
                      <Text>·</Text>
                      <Text>白屏率 {formatPercent(device.whiteScreenRate)}</Text>
                    </Text>
                  </View>
                  <View className={styles.rankValue}>
                    <Text
                      className={`${styles.rankMainValue} ${device.isAbnormal ? styles.rankMainValueAbnormal : ''}`}
                    >
                      {formatMsTime(device.avgLaunchTime)}
                    </Text>
                    <Text className={styles.rankSubValue}>{formatNumber(device.userCount)} 用户</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleDot} style={{ background: '#F53F3F' }}></Text>
              Top 错误接口
            </Text>
            <Text className={`${styles.cardTag} ${styles.errorTag}`}>高风险</Text>
          </View>
          {topErrorApis.length === 0 ? (
            <EmptyState title="暂无错误接口" desc="系统运行良好" compact />
          ) : (
            <View className={styles.errorApiList}>
              {topErrorApis.map((api, idx) => (
                <View key={idx} className={styles.errorApiItem}>
                  <View className={styles.errorApiTop}>
                    <Text className={styles.errorApiName}>{api.path}</Text>
                    <Text className={styles.errorApiCount}>{formatNumber(api.errorCount)}</Text>
                  </View>
                  <View className={styles.errorApiMeta}>
                    <View>
                      <Text className={styles.errorApiMethod}>{api.method}</Text>
                      <Text>错误率 {formatPercent(api.errorRate)}</Text>
                    </View>
                    <Text>影响 {formatNumber(api.affectedUsers)} 用户</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
