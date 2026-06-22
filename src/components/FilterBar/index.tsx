import React from 'react';
import { View, Text, ScrollView, ViewStyle } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

export interface FilterItem<K = string> {
  key: K;
  label: string;
  value?: string | number;
}

export type FilterOption<K = string> = FilterItem<K>;

interface FilterBarProps<K = string> {
  items?: FilterItem<K>[];
  options?: FilterOption<K>[];
  activeKey?: K;
  onChange?: (key: K, option?: FilterItem<K>) => void;
  scrollable?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle | string;
}

const FilterBar = <K = string,>({
  items,
  options,
  activeKey,
  onChange,
  scrollable = true,
  size = 'md',
  style
}: FilterBarProps<K>) => {
  const list = (items || options || []) as FilterItem<K>[];

  const handleClick = (option: FilterItem<K>) => {
    onChange?.(option.key, option);
  };

  const content = (
    <>
      {list.map((option) => (
        <View
          key={String(option.key)}
          className={classnames(
            styles.filterItem,
            styles[size],
            activeKey === option.key && styles.active
          )}
          onClick={() => handleClick(option)}
        >
          <Text className={styles.itemText}>{option.label}</Text>
        </View>
      ))}
    </>
  );

  const wrapperStyle = typeof style === 'string' ? undefined : style;

  if (scrollable) {
    return (
      <ScrollView scrollX className={styles.wrapper} style={wrapperStyle}>
        <View className={styles.inner}>
          {content}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className={classnames(styles.wrapper, styles.notScrollable)} style={wrapperStyle}>
      {content}
    </View>
  );
};

export default FilterBar;
export { FilterBar };
export type { FilterItem };
