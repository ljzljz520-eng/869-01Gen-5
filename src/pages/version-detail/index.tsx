import { useMemo, useState } from 'react';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { View, Text, Button, Slider, Switch } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { VersionService } from '@/services/versionService';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusTag } from '@/components/StatusTag';
import { LineChart, ChartSeries } from '@/components/LineChart';
import {
  formatNumber,
  formatMsTime,
  formatPercent,
  formatDateTime,
  formatTimeShort
} from '@/utils/format';
import { GrayVersion, VersionStatus } from '@/types/monitor';
import styles from './index.module.scss';

const LAUNCH_SERIES: ChartSeries[] = [
  { key: 'avg', label: '平均启动', color: '#165DFF', unit: 'ms' },
  { key: 'p95', label: 'P95启动', color: '#722ED1', unit: 'ms' }
];

export default function VersionDetailPage() {
  const router = useRouter();
  const store = useMonitorStore();
  const versionId = router.params.id || store.selectedVersionId;

  const version: GrayVersion | undefined = useMemo(() => {
    if (versionId) return store.getVersionById(versionId);
    return store.versions[0];
  }, [store, versionId]);

  const performanceTrend = store.performanceTrend;
  const deviceStats = store.deviceStats;

  const [grayPercent, setGrayPercent] = useState(version?.grayPercentage || 0);

  useDidShow(() => {
    if (version) {
      setGrayPercent(version.grayPercentage);
    }
  });

  const launchChartData = useMemo(() => {
    const trend = performanceTrend.slice(0, 12);
    return {
      labels: trend.map(p => formatTimeShort(p.timestamp)),
      series: LAUNCH_SERIES,
      datasets: {
        avg: trend.map(p => p.avgLaunchTime),
        p95: trend.map(p => p.p95LaunchTime)
      }
    };
  }, [performanceTrend]);

  if (!version) {
    return (
      <View className={styles.container}>
        <View className={styles.content} style={{ marginTop: 0, paddingTop: '$spacing-lg' }}>
          <View className={styles.emptyBlock}>版本不存在或已被删除</View>
          <Button className={styles.actionBtn} onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </View>
    );
  }

  const canAdjustGray = version.status === 'graying' || version.status === 'paused';

  const handleSliderChange = (e: any) => {
    const value = e.detail.value;
    setGrayPercent(value);
  };

  const handleSliderChangeComplete = (e: any) => {
    const value = e.detail.value;
    if (versionId) {
      VersionService.updateGrayPercentage(versionId, value);
      Taro.showToast({ title: `灰度比例已调整为 ${value}%`, icon: 'none' });
    }
  };

  const handlePauseVersion = () => {
    Taro.showModal({
      title: '暂停灰度',
      content: '确定暂停该版本的灰度发布吗？暂停期间不会有新用户进入灰度。',
      confirmText: '暂停',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm && versionId) {
          VersionService.pauseVersion(versionId);
          Taro.showToast({ title: '已暂停灰度', icon: 'success' });
        }
      }
    });
  };

  const handleResumeVersion = () => {
    if (versionId) {
      VersionService.resumeVersion(versionId);
      Taro.showToast({ title: '已恢复灰度', icon: 'success' });
    }
  };

  const handleRollback = () => {
    Taro.showModal({
      title: '回滚版本',
      content: '确定要回滚该版本吗？所有灰度用户将退回到上一个稳定版本。',
      confirmText: '确认回滚',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm && versionId) {
          VersionService.rollback(versionId);
          Taro.showToast({ title: '已触发回滚', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      }
    });
  };

  const handleComplete = () => {
    Taro.showModal({
      title: '完成发布',
      content: '确定该版本灰度发布已完成，全量推送给所有用户？',
      confirmText: '确认完成',
      confirmColor: '#00B42A',
      success: (res) => {
        if (res.confirm && versionId) {
          VersionService.complete(versionId);
          Taro.showToast({ title: '已完成发布', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      }
    });
  };

  const handleToggleDeviceBlock = (deviceModel: string, isBlocked: boolean) => {
    if (!versionId) return;
    if (isBlocked) {
      VersionService.resumeDevice(versionId, deviceModel);
      Taro.showToast({ title: '已恢复该机型', icon: 'success' });
    } else {
      Taro.showModal({
        title: '封禁机型',
        content: `确定封禁「${deviceModel}」吗？该机型用户将退出灰度版本。`,
        confirmText: '封禁',
        confirmColor: '#F53F3F',
        success: (res) => {
          if (res.confirm) {
            VersionService.pauseDevice(versionId, deviceModel);
            Taro.showToast({ title: '已封禁该机型', icon: 'success' });
          }
        }
      });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <Text className={styles.versionCode}>v{version.versionCode}</Text>
          <StatusTag type="versionStatus" status={version.status} size="large" />
        </View>
        <Text className={styles.versionName}>{version.versionName}</Text>
        <View className={styles.versionMeta}>
          <Text>创建人: {version.creator}</Text>
          <Text>·</Text>
          <Text>发布: {formatDateTime(version.publishTime)}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot}></Text>
            灰度进度
          </Text>
          <ProgressBar
            percentage={version.grayPercentage}
            targetPercentage={version.targetPercentage}
            showLabel
            size="large"
          />
          {canAdjustGray && (
            <>
              <View className={styles.sliderRow}>
                <Text className={styles.sectionLabel}>调整灰度比例:</Text>
                <Text className={styles.sliderValue}>{grayPercent}%</Text>
              </View>
              <Slider
                min={0}
                max={version.targetPercentage}
                step={1}
                value={grayPercent}
                activeColor="#165DFF"
                backgroundColor="#E5E6EB"
                blockColor="#165DFF"
                blockSize={24}
                onChange={handleSliderChange}
                onChanging={handleSliderChange}
                onComplete={handleSliderChangeComplete}
              />
              <Text className={styles.sliderHint}>
                目标灰度: {version.targetPercentage}% | 拖动滑块实时调整灰度放量比例
              </Text>
            </>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot} style={{ background: '#00B42A' }}></Text>
            核心数据
          </Text>
          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{formatNumber(version.stats.activeUsers)}</Text>
              <Text className={styles.statsLabel}>灰度用户</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{formatMsTime(version.stats.avgLaunchTime)}</Text>
              <Text className={styles.statsLabel}>平均启动</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{formatNumber(version.stats.launchCount)}</Text>
              <Text className={styles.statsLabel}>启动次数</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#FF7D00' }}>
                {formatNumber(version.stats.errorCount)}
              </Text>
              <Text className={styles.statsLabel}>网络错误</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#F53F3F' }}>
                {formatNumber(version.stats.whiteScreenCount)}
              </Text>
              <Text className={styles.statsLabel}>白屏次数</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#722ED1' }}>
                {formatPercent(version.blockedDevices.length / 10)}
              </Text>
              <Text className={styles.statsLabel}>机型封禁</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot} style={{ background: '#722ED1' }}></Text>
            启动耗时趋势
          </Text>
          <View className={styles.chartWrap}>
            <LineChart
              labels={launchChartData.labels}
              series={launchChartData.series}
              datasets={launchChartData.datasets}
              height={320}
              showArea
              smooth
            />
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot} style={{ background: '#FF7D00' }}></Text>
            灰度规则
          </Text>
          {version.rules.length === 0 ? (
            <View className={styles.emptyBlock}>暂无灰度规则配置</View>
          ) : (
            <View className={styles.ruleList}>
              {version.rules.map((rule, idx) => (
                <View key={idx} className={styles.ruleItem}>
                  <View className={styles.ruleIcon}>📋</View>
                  <View className={styles.ruleContent}>
                    <Text className={styles.ruleName}>{rule.name}</Text>
                    <Text className={styles.ruleDesc}>{rule.description}</Text>
                  </View>
                  <View className={styles.ruleStatus}>
                    <StatusTag
                      type="default"
                      color={rule.enabled ? 'success' : 'tertiary'}
                      text={rule.enabled ? '已启用' : '已禁用'}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot} style={{ background: '#00B42A' }}></Text>
            定向地区
          </Text>
          {version.allowedRegions.length === 0 ? (
            <View className={styles.emptyBlock}>所有地区均可参与灰度</View>
          ) : (
            <View className={styles.regionTags}>
              {version.allowedRegions.map((region, idx) => (
                <Text key={idx} className={styles.regionTag}>{region}</Text>
              ))}
            </View>
          )}
        </View>

        <View className={styles.card}>
          <View className={styles.cardTitle} style={{ justifyContent: 'space-between' }}>
            <Text style={{ display: 'flex', alignItems: 'center' }}>
              <Text className={styles.cardTitleDot} style={{ background: '#F53F3F' }}></Text>
              机型封禁管理
            </Text>
            <Text style={{ fontSize: '$spacing-xs', color: '$color-text-tertiary', fontWeight: 400 }}>
              已封禁 {version.blockedDevices.length} 款机型
            </Text>
          </View>
          <Text className={styles.sectionLabel}>
            当某机型出现性能异常时，可单独封禁该机型的灰度发布而不影响其他用户。封禁后该机型用户将回退到稳定版本。
          </Text>
          <View className={styles.deviceList}>
            {deviceStats.slice(0, 8).map((device, idx) => {
              const isBlocked = version.blockedDevices.includes(device.model);
              return (
                <View key={device.model} className={styles.deviceItem}>
                  <View className={styles.deviceInfo}>
                    <Text className={styles.deviceName}>
                      {device.model}
                      {device.isAbnormal && (
                        <Text className={`${styles.deviceBadge} ${styles.deviceBadgeBlocked}`} style={{ marginLeft: '$spacing-xs' }}>
                          异常
                        </Text>
                      )}
                      {isBlocked && (
                        <Text className={`${styles.deviceBadge} ${styles.deviceBadgeBlocked}`} style={{ marginLeft: '$spacing-xs' }}>
                          已封禁
                        </Text>
                      )}
                    </Text>
                    <View className={styles.deviceMeta}>
                      <Text>{formatNumber(device.userCount)} 用户</Text>
                      <Text>启动: {formatMsTime(device.avgLaunchTime)}</Text>
                      <Text>错误率: {formatPercent(device.errorRate)}</Text>
                    </View>
                  </View>
                  <Switch
                    className={styles.deviceSwitch}
                    checked={isBlocked}
                    color="#F53F3F"
                    onChange={() => handleToggleDeviceBlock(device.model, isBlocked)}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleDot}></Text>
            版本信息
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>版本号</Text>
              <Text className={styles.infoValue}>{version.versionCode}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>创建人</Text>
              <Text className={styles.infoValue}>{version.creator}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(version.createTime)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>更新时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(version.updateTime)}</Text>
            </View>
            <View className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <Text className={styles.infoLabel}>版本描述</Text>
              <Text className={styles.infoValue} style={{ fontWeight: 400, fontSize: '$font-size-sm', lineHeight: 1.7 }}>
                {version.description || '暂无描述'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        {version.status === 'graying' && (
          <>
            <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleRollback}>
              回滚
            </Button>
            <Button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={handlePauseVersion}>
              暂停灰度
            </Button>
            <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleComplete}>
              完成发布
            </Button>
          </>
        )}
        {version.status === 'paused' && (
          <>
            <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleRollback}>
              回滚
            </Button>
            <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleResumeVersion}>
              恢复灰度
            </Button>
          </>
        )}
        {(version.status === 'pending' || version.status === 'completed' || version.status === 'rolledback') && (
          <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => Taro.navigateBack()}>
            返回列表
          </Button>
        )}
      </View>
    </View>
  );
}
