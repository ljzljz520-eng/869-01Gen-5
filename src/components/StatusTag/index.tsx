import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { VersionStatus, AlertLevel, AlertStatus } from '../../types/monitor';
import {
  getVersionStatusText,
  getVersionStatusColor,
  getAlertLevelText,
  getAlertLevelColor,
  getAlertStatusText,
  getAlertStatusColor
} from '../../utils/format';

export type StatusTagType =
  | 'version'
  | 'versionStatus'
  | 'alert-level'
  | 'alertLevel'
  | 'alert-status'
  | 'alertStatus'
  | 'default';

interface StatusTagProps {
  type?: StatusTagType;
  status?: VersionStatus | AlertLevel | AlertStatus;
  value?: VersionStatus | AlertLevel | AlertStatus;
  text?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'tertiary' | string;
  size?: 'sm' | 'md' | 'large';
}

const colorMap: Record<string, string> = {
  primary: '#165DFF',
  success: '#00B42A',
  warning: '#FF7D00',
  error: '#F53F3F',
  tertiary: '#86909C'
};

const StatusTag: React.FC<StatusTagProps> = ({
  type,
  status,
  value,
  text,
  color,
  size = 'md'
}) => {
  let displayText = text || '';
  let displayColor = '';

  const actualValue = status ?? value;
  const actualType = type ?? 'default';

  if (actualType === 'version' || actualType === 'versionStatus') {
    const val = actualValue as VersionStatus;
    displayText = getVersionStatusText(val) || displayText;
    displayColor = getVersionStatusColor(val);
  } else if (actualType === 'alert-level' || actualType === 'alertLevel') {
    const val = actualValue as AlertLevel;
    displayText = getAlertLevelText(val) || displayText;
    displayColor = getAlertLevelColor(val);
  } else if (actualType === 'alert-status' || actualType === 'alertStatus') {
    const val = actualValue as AlertStatus;
    displayText = getAlertStatusText(val) || displayText;
    displayColor = getAlertStatusColor(val);
  } else if (actualType === 'default') {
    if (color) {
      displayColor = colorMap[color] || color;
    } else {
      displayColor = '#86909C';
    }
  }

  if (!displayColor) displayColor = '#86909C';

  return (
    <View
      className={classnames(styles.tag, styles[size])}
      style={{
        backgroundColor: `${displayColor}15`,
        borderColor: `${displayColor}30`
      }}
    >
      {displayColor && (
        <View className={styles.dot} style={{ backgroundColor: displayColor }} />
      )}
      <Text className={styles.text} style={{ color: displayColor }}>
        {displayText}
      </Text>
    </View>
  );
};

export { StatusTag };
export default StatusTag;
