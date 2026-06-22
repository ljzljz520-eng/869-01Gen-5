import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  desc?: string;
  actionText?: string;
  onAction?: () => void;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title = '暂无数据',
  description,
  desc,
  actionText,
  onAction,
  compact
}) => {
  const displayDesc = desc || description;
  return (
    <View className={styles.wrapper} style={compact ? { padding: '24rpx 0' } : undefined}>
      <Text className={styles.icon} style={compact ? { fontSize: 40, marginBottom: 8 } : undefined}>{icon}</Text>
      <Text className={styles.title} style={compact ? { fontSize: 24 } : undefined}>{title}</Text>
      {displayDesc && <Text className={styles.description}>{displayDesc}</Text>}
      {actionText && onAction && (
        <Button className={styles.actionBtn} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
export { EmptyState };
