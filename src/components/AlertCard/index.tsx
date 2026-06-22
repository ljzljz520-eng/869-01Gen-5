import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Alert } from '../../types/monitor';
import StatusTag from '../StatusTag';
import { formatRelativeTime, truncateText } from '../../utils/format';

interface AlertCardProps {
  alert: Alert;
  onClick?: (alertId: string) => void;
  onStartProcess?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onIgnore?: (alertId: string) => void;
  onQuickAction?: (action: 'resolve' | 'ignore' | 'process') => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onClick,
  onStartProcess,
  onResolve,
  onIgnore,
  onQuickAction
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(alert.id);
    } else {
      Taro.navigateTo({
        url: `/pages/alert-detail/index?id=${alert.id}`
      });
    }
  };

  const handleAction = (e: React.MouseEvent, action: 'resolve' | 'ignore' | 'process') => {
    e.stopPropagation();
    onQuickAction?.(action);
    if (action === 'process' && onStartProcess) onStartProcess(alert.id);
    if (action === 'resolve' && onResolve) onResolve(alert.id);
    if (action === 'ignore' && onIgnore) onIgnore(alert.id);
  };

  const getLevelBadgeColor = () => {
    const colors: Record<string, { bg: string; border: string }> = {
      critical: { bg: 'rgba(114, 46, 209, 0.1)', border: '#722ED1' },
      error: { bg: 'rgba(245, 63, 63, 0.1)', border: '#F53F3F' },
      warning: { bg: 'rgba(255, 125, 0, 0.1)', border: '#FF7D00' },
      info: { bg: 'rgba(22, 93, 255, 0.1)', border: '#165DFF' }
    };
    return colors[alert.level] || colors.info;
  };

  const levelIcon = {
    critical: '🔴',
    error: '🟥',
    warning: '🟧',
    info: '🟦'
  };

  const badgeColor = getLevelBadgeColor();
  const showActions = (alert.status === 'pending' || alert.status === 'processing') && onQuickAction;

  return (
    <View
      className={classnames(styles.card, styles[`level_${alert.level}`], alert.status === 'resolved' && styles.resolved)}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <View className={styles.levelBadge} style={{ backgroundColor: badgeColor.bg, borderColor: badgeColor.border }}>
          <Text className={styles.levelIcon}>{levelIcon[alert.level]}</Text>
          <StatusTag type="alert-level" value={alert.level} size="sm" />
        </View>
        <View className={styles.statusWrap}>
          <StatusTag type="alert-status" value={alert.status} size="sm" />
        </View>
      </View>

      <Text className={styles.title}>{alert.title}</Text>

      <View className={styles.versionRow}>
        <Text className={styles.versionTag}>v{alert.versionCode}</Text>
        <Text className={styles.timeText}>{formatRelativeTime(alert.triggerTime)}</Text>
      </View>

      <Text className={styles.description}>
        {truncateText(alert.description, 80)}
      </Text>

      {(alert.affectedDevices?.length || alert.affectedRegions?.length) ? (
        <View className={styles.affectedRow}>
          {alert.affectedDevices && alert.affectedDevices.length > 0 && (
            <View className={styles.affectedTag}>
              <Text className={styles.tagLabel}>机型</Text>
              <Text className={styles.tagValue}>
                {alert.affectedDevices.slice(0, 2).join('、')}
                {alert.affectedDevices.length > 2 && ` +${alert.affectedDevices.length - 2}`}
              </Text>
            </View>
          )}
          {alert.affectedRegions && alert.affectedRegions.length > 0 && (
            <View className={styles.affectedTag}>
              <Text className={styles.tagLabel}>地区</Text>
              <Text className={styles.tagValue}>
                {alert.affectedRegions.slice(0, 2).join('、')}
                {alert.affectedRegions.length > 2 && ` +${alert.affectedRegions.length - 2}`}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      <View className={styles.metricRow}>
        <View className={styles.metricItem}>
          <Text className={styles.metricLabel}>当前值</Text>
          <Text className={classnames(styles.metricValue, styles.abnormal)}>
            {alert.metricValue}{alert.type.includes('rate') ? '%' : alert.type === 'device' ? 'ms' : ''}
          </Text>
        </View>
        <View className={styles.metricDivider} />
        <View className={styles.metricItem}>
          <Text className={styles.metricLabel}>阈值</Text>
          <Text className={styles.metricValue}>
            {alert.threshold}{alert.type.includes('rate') ? '%' : alert.type === 'device' ? 'ms' : ''}
          </Text>
        </View>
      </View>

      {showActions && (
        <View className={styles.actions}>
          {alert.status === 'pending' && (
            <View
              className={classnames(styles.actionBtn, styles.processBtn)}
              onClick={(e) => handleAction(e as any, 'process')}
            >
              <Text>开始处理</Text>
            </View>
          )}
          <View
            className={classnames(styles.actionBtn, styles.ignoreBtn)}
            onClick={(e) => handleAction(e as any, 'ignore')}
          >
            <Text>忽略</Text>
          </View>
          <View
            className={classnames(styles.actionBtn, styles.resolveBtn)}
            onClick={(e) => handleAction(e as any, 'resolve')}
          >
            <Text>标记解决</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AlertCard;
export { AlertCard };
