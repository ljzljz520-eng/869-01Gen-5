import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { GrayVersion } from '../../types/monitor';
import StatusTag from '../StatusTag';
import ProgressBar from '../ProgressBar';
import { formatNumber, formatTime, formatRelativeTime, formatDateShort } from '../../utils/format';

interface VersionCardProps {
  version: GrayVersion;
  onPause?: () => void;
  onResume?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

const VersionCard: React.FC<VersionCardProps> = ({
  version,
  onPause,
  onResume,
  onClick,
  compact = false
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/version-detail/index?id=${version.id}`
      });
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (version.status === 'graying' && onPause) {
      onPause();
    } else if (version.status === 'paused' && onResume) {
      onResume();
    }
  };

  const showPauseButton = version.status === 'graying' && !!onPause;
  const showResumeButton = version.status === 'paused' && !!onResume;

  const getProgressTheme = () => {
    if (version.status === 'completed') return 'success';
    if (version.status === 'paused') return 'warning';
    if (version.status === 'rolled_back') return 'error';
    return 'primary';
  };

  const errorRate = version.stats.launchCount > 0
    ? (version.stats.errorCount / version.stats.launchCount * 100).toFixed(2)
    : '0.00';
  const whiteScreenRate = version.stats.launchCount > 0
    ? (version.stats.whiteScreenCount / version.stats.launchCount * 100).toFixed(3)
    : '0.000';

  return (
    <View
      className={classnames(styles.card, compact && styles.compact)}
      onClick={handleCardClick}
    >
      <View className={styles.header}>
        <View className={styles.versionInfo}>
          <Text className={styles.versionCode}>v{version.versionCode}</Text>
          <StatusTag type="version" value={version.status} size="sm" />
        </View>
        <Text className={styles.versionName}>{version.versionName}</Text>
      </View>

      {!compact && (
        <Text className={styles.description}>{version.description}</Text>
      )}

      <View className={styles.progressSection}>
        <ProgressBar
          percentage={version.grayPercentage}
          target={version.targetPercentage}
          theme={getProgressTheme()}
          size="md"
          label="灰度进度"
        />
      </View>

      {!compact && (
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatNumber(version.stats.activeUsers)}</Text>
            <Text className={styles.statLabel}>活跃用户</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatTime(version.stats.avgLaunchTime)}</Text>
            <Text className={styles.statLabel}>启动耗时</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, Number(errorRate) > 0.3 && styles.errorText)}>
              {errorRate}%
            </Text>
            <Text className={styles.statLabel}>错误率</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, Number(whiteScreenRate) > 0.01 && styles.errorText)}>
              {whiteScreenRate}%
            </Text>
            <Text className={styles.statLabel}>白屏率</Text>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.timeText}>
          {version.publishTime ? `发布于 ${formatRelativeTime(version.publishTime)}` : `创建于 ${formatDateShort(version.createTime)}`}
        </Text>

        {(showPauseButton || showResumeButton) && (
          <Button
            className={classnames(
              styles.actionBtn,
              showPauseButton ? styles.pauseBtn : styles.resumeBtn
            )}
            onClick={handleAction}
          >
            {showPauseButton ? '暂停灰度' : '恢复灰度'}
          </Button>
        )}
      </View>

      {version.blockedDevices.length > 0 && !compact && (
        <View className={styles.blockedNotice}>
          <Text className={styles.blockedIcon}>⛔</Text>
          <Text className={styles.blockedText}>
            已屏蔽机型：{version.blockedDevices.slice(0, 2).join('、')}
            {version.blockedDevices.length > 2 && ` 等${version.blockedDevices.length}个`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default VersionCard;
export { VersionCard };
