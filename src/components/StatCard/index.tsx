import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

export type StatTrend = 'up' | 'down' | 'flat';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendValue?: string;
  description?: string;
  theme?: 'primary' | 'success' | 'warning' | 'error' | 'purple' | 'blue' | 'green' | 'orange' | 'red';
  icon?: string;
  onClick?: () => void;
}

const themeConfig = {
  primary: { bg: 'rgba(22, 93, 255, 0.08)', text: '#165DFF', icon: '📊' },
  blue: { bg: 'rgba(22, 93, 255, 0.08)', text: '#165DFF', icon: '📊' },
  success: { bg: 'rgba(0, 180, 42, 0.08)', text: '#00B42A', icon: '✅' },
  green: { bg: 'rgba(0, 180, 42, 0.08)', text: '#00B42A', icon: '✅' },
  warning: { bg: 'rgba(255, 125, 0, 0.08)', text: '#FF7D00', icon: '⚠️' },
  orange: { bg: 'rgba(255, 125, 0, 0.08)', text: '#FF7D00', icon: '⚠️' },
  error: { bg: 'rgba(245, 63, 63, 0.08)', text: '#F53F3F', icon: '❌' },
  red: { bg: 'rgba(245, 63, 63, 0.08)', text: '#F53F3F', icon: '❌' },
  purple: { bg: 'rgba(114, 46, 209, 0.08)', text: '#722ED1', icon: '🎯' }
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  description,
  theme = 'primary',
  icon,
  onClick
}) => {
  const config = themeConfig[theme as keyof typeof themeConfig] || themeConfig.primary;
  const displayIcon = icon || config.icon;

  let trendType: StatTrend = 'flat';
  let trendDisplay = trendValue;
  if (typeof trend === 'number') {
    if (trend > 0) trendType = 'up';
    else if (trend < 0) trendType = 'down';
    if (!trendDisplay) {
      trendDisplay = `${trend > 0 ? '+' : ''}${(Math.abs(trend) * 100).toFixed(1)}%`;
    }
  }

  return (
    <View
      className={classnames(styles.card, onClick && styles.clickable)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.icon} style={{ backgroundColor: config.bg }}>
          <Text className={styles.iconText}>{displayIcon}</Text>
        </View>
        {trendType && trendDisplay && (
          <View
            className={classnames(styles.trend, styles[trendType])}
          >
            <Text className={styles.trendIcon}>
              {trendType === 'up' ? '↑' : trendType === 'down' ? '↓' : '→'}
            </Text>
            <Text className={styles.trendValue}>{trendDisplay}</Text>
          </View>
        )}
      </View>
      <View className={styles.valueWrap}>
        <Text className={styles.value} style={{ color: config.text }}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
    </View>
  );
};

export default StatCard;
export { StatCard };
