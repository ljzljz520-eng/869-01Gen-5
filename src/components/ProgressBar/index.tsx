import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

export type ProgressTheme = 'primary' | 'success' | 'warning' | 'error' | 'purple';

interface ProgressBarProps {
  percentage: number;
  targetPercentage?: number;
  target?: number;
  theme?: ProgressTheme;
  size?: 'small' | 'md' | 'large';
  label?: string;
  showLabel?: boolean;
  animated?: boolean;
}

const themeColors: Record<ProgressTheme, { bar: string; target: string; bg: string }> = {
  primary: { bar: 'linear-gradient(90deg, #165DFF 0%, #4080FF 100%)', target: '#165DFF', bg: 'rgba(22, 93, 255, 0.1)' },
  success: { bar: 'linear-gradient(90deg, #00B42A 0%, #23C343 100%)', target: '#00B42A', bg: 'rgba(0, 180, 42, 0.1)' },
  warning: { bar: 'linear-gradient(90deg, #FF7D00 0%, #FF9A2E 100%)', target: '#FF7D00', bg: 'rgba(255, 125, 0, 0.1)' },
  error: { bar: 'linear-gradient(90deg, #F53F3F 0%, #FF7875 100%)', target: '#F53F3F', bg: 'rgba(245, 63, 63, 0.1)' },
  purple: { bar: 'linear-gradient(90deg, #722ED1 0%, #9254DE 100%)', target: '#722ED1', bg: 'rgba(114, 46, 209, 0.1)' }
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  targetPercentage,
  target,
  theme = 'primary',
  size = 'md',
  label,
  showLabel = false,
  animated = true
}) => {
  const actualTarget = targetPercentage ?? target ?? 100;
  const colors = themeColors[theme];
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const safeTarget = Math.min(Math.max(actualTarget, safePercentage), 100);

  return (
    <View className={classnames(styles.container, styles[size])}>
      {(showLabel || label) && (
        <View className={styles.labelRow}>
          {label && <Text className={styles.labelText}>{label}</Text>}
          <View className={styles.values}>
            <Text className={styles.currentValue} style={{ color: colors.target }}>
              {safePercentage.toFixed(0)}%
            </Text>
            {safeTarget !== 100 && (
              <Text className={styles.targetValue}>
                / 目标 {safeTarget.toFixed(0)}%
              </Text>
            )}
          </View>
        </View>
      )}
      <View
        className={styles.track}
        style={{ backgroundColor: colors.bg }}
      >
        {safeTarget < 100 && safeTarget > safePercentage && (
          <View
            className={styles.targetMarker}
            style={{
              left: `${safeTarget}%`,
              backgroundColor: colors.target
            }}
          />
        )}
        <View
          className={classnames(styles.bar, animated && styles.animated)}
          style={{
            width: `${safePercentage}%`,
            background: colors.bar
          }}
        />
      </View>
    </View>
  );
};

export { ProgressBar };
export default ProgressBar;
