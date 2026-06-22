import { useMemo, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { View, Text, Button, Textarea } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { AlertService } from '@/services/alertService';
import { StatusTag } from '@/components/StatusTag';
import { BarChart, BarChartItem } from '@/components/BarChart';
import { LineChart, ChartSeries } from '@/components/LineChart';
import {
  formatNumber,
  formatMsTime,
  formatPercent,
  formatDateTime,
  formatTimeShort
} from '@/utils/format';
import { Alert, AlertLevel } from '@/types/monitor';
import styles from './index.module.scss';

const HEADER_CLASS_MAP: Record<AlertLevel, string> = {
  critical: styles.headerCritical,
  error: styles.headerError,
  warning: styles.headerWarning,
  info: styles.headerInfo
};

const SUGGESTIONS = [
  '已联系开发排查',
  '机型兼容性问题，暂停该机型灰度',
  '属于偶发波动，持续观察',
  '问题已定位，预计下个版本修复',
  '网络运营商问题，非代码bug'
];

export default function AlertDetailPage() {
  const router = useRouter();
  const store = useMonitorStore();
  const alertId = router.params.id;

  const alert: Alert | undefined = useMemo(() => {
    if (alertId) return store.getAlertById(alertId);
    return store.alerts[0];
  }, [store, alertId]);

  const performanceTrend = store.performanceTrend;
  const deviceStats = store.deviceStats;

  const [handleNote, setHandleNote] = useState('');

  const alertTrendChart = useMemo(() => {
    const trend = performanceTrend.slice(-10);
    return {
      labels: trend.map(p => formatTimeShort(p.timestamp)),
      series: [
        { key: 'value', label: alert?.metricName || '指标值', color: '#F53F3F', unit: alert?.metricUnit || '' }
      ] as ChartSeries[],
      datasets: {
        value: trend.map((_, idx) => {
          const base = alert?.thresholdValue || 100;
          if (idx >= 6) return base * (1 + Math.random() * 0.5);
          return base * (0.5 + Math.random() * 0.3);
        })
      }
    };
  }, [performanceTrend, alert]);

  const affectedDevices: BarChartItem[] = useMemo(() => {
    const abnormal = deviceStats.filter(d => d.isAbnormal).slice(0, 6);
    if (abnormal.length === 0) {
      return deviceStats.slice(0, 6).map(d => ({
        label: d.model,
        value: d.errorCount,
        unit: '次'
      }));
    }
    return abnormal.map(d => ({
      label: d.model,
      value: d.errorCount,
      unit: '次'
    }));
  }, [deviceStats]);

  const timelineItems = useMemo(() => {
    if (!alert) return [];
    const items: { type: string; time: string; title: string; desc: string; operator?: string }[] = [
      {
        type: 'error',
        time: alert.createTime,
        title: '告警触发',
        desc: `系统检测到「${alert.metricName}」指标异常，当前值 ${alert.actualValue}${alert.metricUnit} 超过阈值 ${alert.thresholdValue}${alert.metricUnit}，自动触发告警。`
      }
    ];
    if (alert.status === 'processing' || alert.status === 'resolved') {
      items.push({
        type: 'warning',
        time: alert.handleTime || alert.createTime,
        title: '开始处理',
        desc: '告警已分配，相关人员正在排查问题原因。',
        operator: alert.handleNote ? '当前用户' : '系统自动'
      });
    }
    if (alert.status === 'resolved') {
      items.push({
        type: 'success',
        time: alert.updateTime,
        title: '告警已解决',
        desc: alert.handleNote || '问题已定位修复，指标已恢复正常范围。',
        operator: '当前用户'
      });
    }
    if (alert.status === 'ignored') {
      items.push({
        type: 'warning',
        time: alert.updateTime,
        title: '告警已忽略',
        desc: alert.handleNote || '该告警被标记为忽略，属于预期内波动或已知问题。',
        operator: '当前用户'
      });
    }
    return items;
  }, [alert]);

  if (!alert) {
    return (
      <View className={styles.container}>
        <View className={styles.content} style={{ marginTop: 0, paddingTop: '$spacing-lg' }}>
          <View style={{ padding: '$spacing-lg', textAlign: 'center', background: '#fff', borderRadius: '$radius-lg' }}>
            <Text style={{ fontSize: '$font-size-md', color: '$color-text-tertiary' }}>告警不存在或已被删除</Text>
          </View>
        </View>
      </View>
    );
  }

  const headerClass = HEADER_CLASS_MAP[alert.level];

  const handleAddNote = (suggestion: string) => {
    setHandleNote(prev => prev ? `${prev}\n${suggestion}` : suggestion);
  };

  const handleStartProcess = () => {
    AlertService.startProcess(alert.id, handleNote || undefined);
    Taro.showToast({ title: '已开始处理', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const handleResolve = () => {
    if (!handleNote.trim()) {
      Taro.showToast({ title: '请填写处理说明', icon: 'none' });
      return;
    }
    AlertService.resolve(alert.id, handleNote);
    Taro.showToast({ title: '已标记解决', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const handleIgnore = () => {
    AlertService.ignore(alert.id, handleNote || undefined);
    Taro.showToast({ title: '已忽略告警', icon: 'none' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const goToVersionDetail = () => {
    if (alert.relatedVersionId) {
      store.setSelectedVersion(alert.relatedVersionId);
      Taro.navigateTo({ url: `/pages/version-detail/index?id=${alert.relatedVersionId}` });
    }
  };

  const goToMonitor = () => {
    Taro.switchTab({ url: '/pages/monitor/index' });
  };

  return (
    <View className={styles.container}>
      <View className={`${styles.header} ${headerClass}`}>
        <Text className={styles.alertLevelBadge}>
          {alert.level === 'critical' && '🔴 严重告警'}
          {alert.level === 'error' && '🟠 错误告警'}
          {alert.level === 'warning' && '🟡 警告'}
          {alert.level === 'info' && '🔵 通知'}
        </Text>
        <Text className={styles.alertTitle}>{alert.title}</Text>
        <Text className={styles.alertDesc}>{alert.message}</Text>
      </View>

      <View className={styles.content}>
        {(alert.status === 'pending' || alert.status === 'processing') && (
          <View
            className={styles.quickLink}
            onClick={goToMonitor}
          >
            <View className={styles.quickLinkIcon}>📊</View>
            <View className={styles.quickLinkContent}>
              <Text className={styles.quickLinkTitle}>查看性能监控详情</Text>
              <Text className={styles.quickLinkDesc}>
                多维度分析该指标的趋势变化，辅助定位问题根因
              </Text>
            </View>
            <Text className={styles.quickLinkArrow}>›</Text>
          </View>
        )}

        {alert.relatedVersionId && (
          <View
            className={styles.quickLink}
            style={{ background: '#FFF7E6', borderColor: '#FF7D00' }}
            onClick={goToVersionDetail}
          >
            <View
              className={styles.quickLinkIcon}
              style={{ background: '#FF7D00' }}
            >🚀</View>
            <View className={styles.quickLinkContent}>
              <Text className={styles.quickLinkTitle} style={{ color: '#FF7D00' }}>
                关联版本: v{alert.relatedVersionId.slice(0, 8)}...
              </Text>
              <Text className={styles.quickLinkDesc}>
                该告警发生在灰度版本发布期间，可直接前往处理或暂停灰度
              </Text>
            </View>
            <Text className={styles.quickLinkArrow} style={{ color: '#FF7D00' }}>›</Text>
          </View>
        )}

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon} style={{ background: '#F53F3F' }}></Text>
            阈值对比
          </Text>
          <View className={styles.thresholdBox}>
            <View className={`${styles.thresholdItem} ${styles.thresholdItemActual}`}>
              <Text className={`${styles.thresholdValue} ${styles.thresholdValueAlert}`}>
                {formatNumber(alert.actualValue)}{alert.metricUnit}
              </Text>
              <Text className={styles.thresholdLabel}>当前实际值</Text>
            </View>
            <View className={styles.thresholdItem} style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
              <Text style={{ fontSize: '$font-size-xxl', color: '$color-error', fontWeight: 700 }}>></Text>
            </View>
            <View className={`${styles.thresholdItem} ${styles.thresholdItemLimit}`}>
              <Text className={styles.thresholdValue}>
                {formatNumber(alert.thresholdValue)}{alert.metricUnit}
              </Text>
              <Text className={styles.thresholdLabel}>告警阈值</Text>
            </View>
          </View>
          <Text className={styles.timelineDesc} style={{ marginTop: '$spacing-md', textAlign: 'center' }}>
            超出阈值 <Text style={{ fontWeight: 700, color: '#F53F3F' }}>
              {formatPercent(Math.max(0, (alert.actualValue - alert.thresholdValue) / alert.thresholdValue))}
            </Text>，持续时长约 <Text style={{ fontWeight: 700, color: '#FF7D00' }}>
              {alert.durationMinutes || 45} 分钟
            </Text>
          </Text>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon} style={{ background: '#722ED1' }}></Text>
            {alert.metricName} 近期趋势
          </Text>
          <View className={styles.affectedChart}>
            <LineChart
              labels={alertTrendChart.labels}
              series={alertTrendChart.series}
              datasets={alertTrendChart.datasets}
              height={280}
              showArea
              smooth
              referenceLine={alert.thresholdValue}
            />
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon} style={{ background: '#FF7D00' }}></Text>
            主要受影响机型 TOP
          </Text>
          <View className={styles.affectedChart}>
            <BarChart
              data={affectedDevices}
              height={280}
              color="#F53F3F"
              horizontal
            />
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon} style={{ background: '#00B42A' }}></Text>
            告警详细信息
          </Text>
          <View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>告警 ID</Text>
              <Text className={`${styles.infoValue} ${styles.infoValueMono}`}>{alert.id}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>告警状态</Text>
              <Text className={styles.infoValue}>
                <StatusTag type="alertStatus" status={alert.status} size="small" />
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>指标名称</Text>
              <Text className={styles.infoValue}>{alert.metricName}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>影响用户数</Text>
              <Text className={styles.infoValue} style={{ color: '#F53F3F', fontWeight: 700 }}>
                约 {formatNumber(alert.affectedUsers)} 人
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>地区分布</Text>
              <Text className={styles.infoValue}>
                {alert.affectedRegions ? alert.affectedRegions.join('、') : '无'}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>触发时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(alert.createTime)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>更新时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(alert.updateTime)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon} style={{ background: '#165DFF' }}></Text>
            处理时间线
          </Text>
          <View className={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <View key={idx} className={styles.timelineItem}>
                <View
                  className={`${styles.timelineDot} ${
                    item.type === 'success' ? styles.timelineDotSuccess :
                    item.type === 'warning' ? styles.timelineDotWarning :
                    styles.timelineDotError
                  }`}
                />
                <View className={styles.timelineContent}>
                  <Text className={styles.timelineTitle}>
                    {item.operator && <Text className={styles.timelineOperator}>{item.operator}</Text>}
                    {item.title}
                  </Text>
                  <Text className={styles.timelineTime}>{formatDateTime(item.time)}</Text>
                  <Text className={styles.timelineDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {(alert.status === 'pending' || alert.status === 'processing') && (
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon} style={{ background: '#FF7D00' }}></Text>
              处理操作
            </Text>
            <Text className={styles.timelineDesc} style={{ marginBottom: '$spacing-md' }}>
              填写处理说明（可选），记录本次告警的排查过程和处理结论，方便后续复盘。
            </Text>
            <View className={styles.suggestList}>
              {SUGGESTIONS.map(s => (
                <View
                  key={s}
                  className={styles.suggestBtn}
                  onClick={() => handleAddNote(s)}
                >
                  + {s}
                </View>
              ))}
            </View>
            <Textarea
              className={styles.handleInput}
              placeholder="请输入处理说明..."
              value={handleNote}
              onInput={(e) => setHandleNote(e.detail.value)}
              maxlength={300}
              autoHeight
            />
            <View className={styles.handleCount}>{handleNote.length}/300</View>
          </View>
        )}
      </View>

      <View className={styles.actionBar}>
        {alert.status === 'pending' && (
          <>
            <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleIgnore}>
              忽略
            </Button>
            <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleStartProcess}>
              开始处理
            </Button>
          </>
        )}
        {alert.status === 'processing' && (
          <>
            <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleIgnore}>
              忽略
            </Button>
            <Button className={`${styles.actionBtn} ${styles.btnSuccess}`} onClick={handleResolve}>
              标记已解决
            </Button>
          </>
        )}
        {(alert.status === 'resolved' || alert.status === 'ignored') && (
          <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => Taro.navigateBack()}>
            返回告警列表
          </Button>
        )}
      </View>
    </View>
  );
}
