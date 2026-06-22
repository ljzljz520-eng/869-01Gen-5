import { useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { AlertService } from '@/services/alertService';
import { FilterBar, FilterItem } from '@/components/FilterBar';
import { AlertCard } from '@/components/AlertCard';
import { EmptyState } from '@/components/EmptyState';
import { formatNumber } from '@/utils/format';
import { AlertLevel, AlertStatus } from '@/types/monitor';
import styles from './index.module.scss';

const LEVEL_FILTERS: FilterItem<AlertLevel | 'all'>[] = [
  { key: 'all', label: '全部' },
  { key: 'critical', label: '严重' },
  { key: 'error', label: '错误' },
  { key: 'warning', label: '警告' },
  { key: 'info', label: '提示' }
];

const STATUS_FILTERS: FilterItem<AlertStatus | 'all'>[] = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'ignored', label: '已忽略' }
];

export default function AlertsPage() {
  const store = useMonitorStore();
  const alerts = store.alerts;
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const levelStats = useMemo(() => {
    return AlertService.getLevelStats(alerts);
  }, [alerts]);

  const statusStats = useMemo(() => {
    return AlertService.getStatusStats(alerts);
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (levelFilter !== 'all' && a.level !== levelFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      const levelOrder: Record<AlertLevel, number> = { critical: 0, error: 1, warning: 2, info: 3 };
      if (levelOrder[a.level] !== levelOrder[b.level]) return levelOrder[a.level] - levelOrder[b.level];
      const statusOrder: Record<AlertStatus, number> = { pending: 0, processing: 1, resolved: 2, ignored: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
    });
  }, [alerts, levelFilter, statusFilter]);

  const pendingAlerts = useMemo(() => filteredAlerts.filter(a => a.status === 'pending'), [filteredAlerts]);
  const processingAlerts = useMemo(() => filteredAlerts.filter(a => a.status === 'processing'), [filteredAlerts]);

  const handleStartProcess = (alertId: string) => {
    AlertService.startProcess(alertId);
    Taro.showToast({ title: '已开始处理', icon: 'success' });
  };

  const handleResolve = (alertId: string) => {
    AlertService.resolve(alertId);
    Taro.showToast({ title: '已标记解决', icon: 'success' });
  };

  const handleIgnore = (alertId: string) => {
    AlertService.ignore(alertId);
    Taro.showToast({ title: '已忽略告警', icon: 'none' });
  };

  const handleAlertDetail = (alertId: string) => {
    Taro.navigateTo({ url: `/pages/alert-detail/index?id=${alertId}` });
  };

  const handleBatchProcess = () => {
    if (pendingAlerts.length === 0) {
      Taro.showToast({ title: '无待处理告警', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '批量处理',
      content: `确定要开始处理 ${pendingAlerts.length} 条待处理告警吗？`,
      confirmText: '开始处理',
      success: (res) => {
        if (res.confirm) {
          pendingAlerts.forEach(a => AlertService.startProcess(a.id));
          Taro.showToast({ title: '批量处理成功', icon: 'success' });
        }
      }
    });
  };

  const handleBatchResolve = () => {
    const target = [...pendingAlerts, ...processingAlerts];
    if (target.length === 0) {
      Taro.showToast({ title: '无可解决告警', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '批量解决',
      content: `确定要标记 ${target.length} 条告警为已解决吗？`,
      confirmText: '全部解决',
      confirmColor: '#00B42A',
      success: (res) => {
        if (res.confirm) {
          target.forEach(a => AlertService.resolve(a.id));
          Taro.showToast({ title: '批量解决成功', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>告警中心</Text>
        <Text className={styles.headerDesc}>
          集中管理性能异常告警，及时响应灰度风险，保障版本发布质量
        </Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.statValueCritical}`}>
              {formatNumber(levelStats.critical)}
            </Text>
            <Text className={styles.statLabel}>严重</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.statValueError}`}>
              {formatNumber(levelStats.error)}
            </Text>
            <Text className={styles.statLabel}>错误</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.statValueWarning}`}>
              {formatNumber(levelStats.warning)}
            </Text>
            <Text className={styles.statLabel}>警告</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.statValueInfo}`}>
              {formatNumber(levelStats.info)}
            </Text>
            <Text className={styles.statLabel}>提示</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.summaryCards}>
          <View className={styles.summaryCard}>
            <View className={`${styles.summaryIcon} ${styles.summaryPending}`}>🔥</View>
            <View className={styles.summaryInfo}>
              <Text className={styles.summaryValue}>{formatNumber(statusStats.pending)}</Text>
              <Text className={styles.summaryLabel}>待处理</Text>
            </View>
          </View>
          <View className={styles.summaryCard}>
            <View className={`${styles.summaryIcon} ${styles.summaryProcessing}`}>⚙️</View>
            <View className={styles.summaryInfo}>
              <Text className={styles.summaryValue}>{formatNumber(statusStats.processing)}</Text>
              <Text className={styles.summaryLabel}>处理中</Text>
            </View>
          </View>
          <View className={styles.summaryCard}>
            <View className={`${styles.summaryIcon} ${styles.summaryResolved}`}>✅</View>
            <View className={styles.summaryInfo}>
              <Text className={styles.summaryValue}>{formatNumber(statusStats.resolved)}</Text>
              <Text className={styles.summaryLabel}>已解决</Text>
            </View>
          </View>
          <View className={styles.summaryCard}>
            <View className={`${styles.summaryIcon} ${styles.summaryIgnored}`}>📋</View>
            <View className={styles.summaryInfo}>
              <Text className={styles.summaryValue}>{formatNumber(statusStats.ignored)}</Text>
              <Text className={styles.summaryLabel}>已忽略</Text>
            </View>
          </View>
        </View>

        <FilterBar
          items={LEVEL_FILTERS}
          activeKey={levelFilter}
          onChange={setLevelFilter}
          style={{ marginBottom: '$spacing-md' }}
        />

        <FilterBar
          items={STATUS_FILTERS}
          activeKey={statusFilter}
          onChange={setStatusFilter}
        />

        <View className={styles.batchActions}>
          <Button className={`${styles.batchBtn} ${styles.batchProcess}`} onClick={handleBatchProcess}>
            批量开始处理 ({pendingAlerts.length})
          </Button>
          <Button className={`${styles.batchBtn} ${styles.batchResolve}`} onClick={handleBatchResolve}>
            批量解决 ({pendingAlerts.length + processingAlerts.length})
          </Button>
        </View>

        {filteredAlerts.length === 0 ? (
          <View className={styles.emptyWrap}>
            <EmptyState title="暂无告警数据" desc="当前筛选条件下没有匹配的告警" />
          </View>
        ) : (
          <View className={styles.alertList}>
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onStartProcess={handleStartProcess}
                onResolve={handleResolve}
                onIgnore={handleIgnore}
                onClick={handleAlertDetail}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
