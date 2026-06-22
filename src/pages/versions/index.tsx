import { useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { VersionService } from '@/services/versionService';
import { FilterBar, FilterItem } from '@/components/FilterBar';
import { VersionCard } from '@/components/VersionCard';
import { EmptyState } from '@/components/EmptyState';
import { formatNumber } from '@/utils/format';
import { VersionStatus } from '@/types/monitor';
import styles from './index.module.scss';

const STATUS_FILTERS: FilterItem<VersionStatus | 'all'>[] = [
  { key: 'all', label: '全部' },
  { key: 'graying', label: '灰度中' },
  { key: 'paused', label: '已暂停' },
  { key: 'pending', label: '待发布' },
  { key: 'completed', label: '已完成' },
  { key: 'rolledback', label: '已回滚' }
];

export default function VersionsPage() {
  const store = useMonitorStore();
  const versions = store.versions;
  const [activeFilter, setActiveFilter] = useState<VersionStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const stats = useMemo(() => {
    return {
      total: versions.length,
      graying: versions.filter(v => v.status === 'graying').length,
      paused: versions.filter(v => v.status === 'paused').length,
      pending: versions.filter(v => v.status === 'pending').length
    };
  }, [versions]);

  const filteredVersions = useMemo(() => {
    if (activeFilter === 'all') return versions;
    return versions.filter(v => v.status === activeFilter);
  }, [versions, activeFilter]);

  const groupedVersions = useMemo(() => {
    const graying = filteredVersions.filter(v => v.status === 'graying');
    const paused = filteredVersions.filter(v => v.status === 'paused');
    const pending = filteredVersions.filter(v => v.status === 'pending');
    const completed = filteredVersions.filter(v => v.status === 'completed' || v.status === 'rolledback');
    return { graying, paused, pending, completed };
  }, [filteredVersions]);

  const handleFilterChange = (key: VersionStatus | 'all') => {
    setActiveFilter(key);
  };

  const handleCreateVersion = () => {
    Taro.navigateTo({ url: '/pages/version-create/index' });
  };

  const handlePauseVersion = (versionId: string) => {
    VersionService.pauseVersion(versionId);
    Taro.showToast({ title: '已暂停灰度', icon: 'success' });
  };

  const handleResumeVersion = (versionId: string) => {
    VersionService.resumeVersion(versionId);
    Taro.showToast({ title: '已恢复灰度', icon: 'success' });
  };

  const handleVersionDetail = (versionId: string) => {
    store.setSelectedVersion(versionId);
    Taro.navigateTo({ url: `/pages/version-detail/index?id=${versionId}` });
  };

  const renderSection = (title: string, list: typeof versions, showBadge = true) => {
    if (list.length === 0) return null;
    return (
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {title}
            {showBadge && <Text className={styles.sectionBadge}>{list.length}</Text>}
          </Text>
        </View>
        <View className={styles.versionList}>
          {list.map(version => (
            <VersionCard
              key={version.id}
              version={version}
              onPause={handlePauseVersion}
              onResume={handleResumeVersion}
              onClick={handleVersionDetail}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>版本管理</Text>
        <Text className={styles.headerDesc}>管理灰度版本发布进度，监控各版本性能表现</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatNumber(stats.total)}</Text>
            <Text className={styles.statLabel}>总版本数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatNumber(stats.graying)}</Text>
            <Text className={styles.statLabel}>灰度中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatNumber(stats.paused)}</Text>
            <Text className={styles.statLabel}>已暂停</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatNumber(stats.pending)}</Text>
            <Text className={styles.statLabel}>待发布</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <Button className={styles.createBtn} onClick={handleCreateVersion}>
          <Text className={styles.createBtnIcon}>+</Text>
          新建灰度版本
        </Button>

        <FilterBar
          items={STATUS_FILTERS}
          activeKey={activeFilter}
          onChange={handleFilterChange}
          scrollable
        />

        {filteredVersions.length === 0 ? (
          <View className={styles.emptyWrap}>
            <EmptyState title="暂无版本数据" desc="点击上方按钮创建第一个灰度版本" />
          </View>
        ) : (
          <>
            {renderSection('灰度进行中', groupedVersions.graying)}
            {renderSection('已暂停', groupedVersions.paused)}
            {renderSection('等待发布', groupedVersions.pending)}
            {renderSection('历史版本', groupedVersions.completed)}
          </>
        )}
      </View>
    </View>
  );
}
