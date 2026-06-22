import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatCard from '../../components/StatCard';
import VersionCard from '../../components/VersionCard';
import AlertCard from '../../components/AlertCard';
import LineChart from '../../components/LineChart';
import PieChart from '../../components/PieChart';
import { useMonitorStore } from '../../store/monitorStore';
import { getVersionSummary, pauseVersion, resumeVersion } from '../../services/versionService';
import { getPerformanceSummary, getPerformanceTrend, getRegionStats } from '../../services/monitorService';
import { getAlertSummary, getPendingAlertCount, startProcessingAlert, resolveAlert, ignoreAlert } from '../../services/alertService';
import { formatNumber, formatPercent, formatTime, formatPercentPlain } from '../../utils/format';

const DashboardPage: React.FC = () => {
  const versions = useMonitorStore((state) => state.versions);
  const alerts = useMonitorStore((state) => state.alerts);
  const trend = useMonitorStore((state) => state.performanceTrend);

  useDidShow(() => {
    console.log('[Dashboard] Page did show');
  });

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  });

  const versionSummary = useMemo(() => getVersionSummary(), [versions]);
  const perfSummary = useMemo(() => getPerformanceSummary(), [trend]);
  const alertSummary = useMemo(() => getAlertSummary(), [alerts]);
  const pendingAlertCount = useMemo(() => getPendingAlertCount(), [alerts]);

  const activeVersions = useMemo(() =>
    versions.filter(v => v.status === 'graying' || v.status === 'paused').slice(0, 3),
    [versions]
  );

  const pendingAlerts = useMemo(() =>
    alerts.filter(a => a.status === 'pending').slice(0, 2),
    [alerts]
  );

  const launchChartData = useMemo(() => {
    const labels = trend.map(t => t.timestamp);
    return {
      labels,
      data: [
        { label: 'P50', values: trend.map(t => t.launchTimeP50), color: '#165DFF' },
        { label: 'P90', values: trend.map(t => t.launchTimeP90), color: '#722ED1' },
        { label: 'P99', values: trend.map(t => t.launchTimeP99), color: '#FF7D00' }
      ]
    };
  }, [trend]);

  const regionPieData = useMemo(() => {
    const regions = getRegionStats().slice(0, 6);
    return regions.map(r => ({
      label: r.region,
      value: r.userCount
    }));
  }, [versions]);

  const handlePause = (versionId: string) => {
    pauseVersion(versionId);
    Taro.showToast({ title: '已暂停灰度', icon: 'success' });
  };

  const handleResume = (versionId: string) => {
    resumeVersion(versionId);
    Taro.showToast({ title: '已恢复灰度', icon: 'success' });
  };

  const handleAlertAction = (alertId: string, action: 'resolve' | 'ignore' | 'process') => {
    if (action === 'resolve') resolveAlert(alertId, '仪表盘快速处理');
    else if (action === 'ignore') ignoreAlert(alertId);
    else startProcessingAlert(alertId);
    Taro.showToast({ title: '操作成功', icon: 'success' });
  };

  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/version-create/index' });
  };

  const goToSdkDoc = () => {
    Taro.navigateTo({ url: '/pages/sdk-doc/index' });
  };

  const goToVersions = () => {
    Taro.switchTab({ url: '/pages/versions/index' });
  };

  const goToMonitor = () => {
    Taro.switchTab({ url: '/pages/monitor/index' });
  };

  const goToAlerts = () => {
    Taro.switchTab({ url: '/pages/alerts/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.greeting}>
            <Text className={styles.greetingTitle}>灰度监测中心</Text>
            <Text className={styles.greetingSubtitle}>实时监控小程序性能与灰度发布</Text>
          </View>
          <Button className={styles.docBtn} onClick={goToSdkDoc}>SDK文档</Button>
        </View>

        <View className={styles.summaryCards}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>灰度中版本</Text>
            <Text className={styles.summaryValue}>{versionSummary.active}</Text>
            <Text className={styles.summaryUnit}>个版本进行中</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>待处理告警</Text>
            <Text className={styles.summaryValue}>{pendingAlertCount}</Text>
            <Text className={styles.summaryUnit}>条告警需关注</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>覆盖活跃用户</Text>
            <Text className={styles.summaryValue}>{formatNumber(versionSummary.totalActiveUsers)}</Text>
            <Text className={styles.summaryUnit}>用户</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>平均启动耗时</Text>
            <Text className={styles.summaryValue}>{formatTime(perfSummary.average.launchP50)}</Text>
            <Text className={styles.summaryUnit}>P50 中位耗时</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📈</Text>
              启动耗时趋势
            </Text>
            <Text className={styles.sectionAction} onClick={goToMonitor}>查看详情 →</Text>
          </View>
          <LineChart
            data={launchChartData.data}
            labels={launchChartData.labels}
            maxValue={1500}
            yAxisUnit="ms"
          />
        </View>

        <View className={styles.statGrid}>
          <StatCard
            title="错误率"
            value={formatPercentPlain(perfSummary.current.errorRate * 100, 2)}
            unit="%"
            trend={perfSummary.trend.errorTrend > 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(perfSummary.trend.errorTrend * 100).toFixed(1)}%`}
            theme={perfSummary.current.errorRate > 0.3 ? 'warning' : 'success'}
            onClick={goToMonitor}
          />
          <StatCard
            title="白屏率"
            value={formatPercentPlain(perfSummary.current.whiteScreenRate * 100, 3)}
            unit="%"
            trend={perfSummary.trend.whiteScreenTrend > 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(perfSummary.trend.whiteScreenTrend * 100).toFixed(1)}%`}
            theme={perfSummary.current.whiteScreenRate > 0.01 ? 'error' : 'success'}
            onClick={goToMonitor}
          />
          <StatCard
            title="异常机型"
            value={perfSummary.abnormalDeviceCount}
            unit="个"
            theme="error"
            onClick={goToMonitor}
          />
          <StatCard
            title="活跃用户"
            value={formatNumber(perfSummary.current.activeUsers)}
            trend={perfSummary.trend.userTrend > 0 ? 'up' : perfSummary.trend.userTrend < 0 ? 'down' : 'flat'}
            trendValue={`${Math.abs(perfSummary.trend.userTrend * 100).toFixed(1)}%`}
            theme="primary"
          />
        </View>

        <View className={styles.section}>
          <View className={styles.versionListHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🚀</Text>
              活跃版本
            </Text>
            <Button className={styles.createBtn} onClick={goToCreate}>
              <Text>+ 新建版本</Text>
            </Button>
          </View>

          {activeVersions.length === 0 ? (
            <View style={{ padding: '40rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '24rpx', color: '#86909C' }}>暂无活跃版本，点击上方按钮创建</Text>
            </View>
          ) : (
            activeVersions.map(v => (
              <VersionCard
                key={v.id}
                version={v}
                compact
                onPause={() => handlePause(v.id)}
                onResume={() => handleResume(v.id)}
              />
            ))
          )}
          {versions.length > activeVersions.length && (
            <Text
              className={styles.sectionAction}
              style={{ textAlign: 'center', display: 'block', padding: '16rpx 0' }}
              onClick={goToVersions}
            >
              查看全部 {versions.length} 个版本 →
            </Text>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🔔</Text>
              待处理告警
              {pendingAlertCount > 0 && (
                <Text className={styles.alertBadge}>{pendingAlertCount}</Text>
              )}
            </Text>
            <Text className={styles.sectionAction} onClick={goToAlerts}>全部告警 →</Text>
          </View>

          {pendingAlerts.length === 0 ? (
            <View style={{ padding: '40rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '60rpx' }}>✅</Text>
              <Text style={{ display: 'block', marginTop: '16rpx', fontSize: '24rpx', color: '#00B42A' }}>
                暂无待处理告警
              </Text>
            </View>
          ) : (
            pendingAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onQuickAction={(action) => handleAlertAction(alert.id, action)}
              />
            ))
          )}
        </View>

        <View className={styles.chartSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🗺️</Text>
              用户地区分布
            </Text>
          </View>
          <PieChart
            size={360}
            data={regionPieData}
            centerContent={{
              title: '总用户',
              value: formatNumber(versionSummary.totalActiveUsers)
            }}
            unit="人"
          />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>⚡</Text>
              快捷操作
            </Text>
          </View>
          <View className={styles.quickActions}>
            <View className={styles.quickAction} onClick={goToCreate}>
              <View className={`${styles.actionIcon} ${styles.actionIconBlue}`}>📦</View>
              <Text className={styles.actionLabel}>新建版本</Text>
            </View>
            <View className={styles.quickAction} onClick={goToVersions}>
              <View className={`${styles.actionIcon} ${styles.actionIconGreen}`}>📊</View>
              <Text className={styles.actionLabel}>版本管理</Text>
            </View>
            <View className={styles.quickAction} onClick={goToMonitor}>
              <View className={`${styles.actionIcon} ${styles.actionIconOrange}`}>📈</View>
              <Text className={styles.actionLabel}>性能监控</Text>
            </View>
            <View className={styles.quickAction} onClick={goToAlerts}>
              <View className={`${styles.actionIcon} ${styles.actionIconPurple}`}>🔔</View>
              <Text className={styles.actionLabel}>告警中心</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </View>
  );
};

export default DashboardPage;
