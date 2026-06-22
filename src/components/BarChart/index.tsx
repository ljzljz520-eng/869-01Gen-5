import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { calculateBarPositions } from '../../utils/chart';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  unit?: string;
}

interface BarChartProps {
  width?: number;
  height?: number;
  data: BarChartItem[];
  color?: string;
  maxValue?: number;
  barGap?: number;
  showValue?: boolean;
  horizontal?: boolean;
  unit?: string;
  valueColor?: string;
}

const defaultBarColor = '#165DFF';

const BarChart: React.FC<BarChartProps> = ({
  width = 686,
  height = 300,
  data,
  color,
  maxValue,
  barGap = 12,
  showValue = true,
  horizontal = false,
  unit = '',
  valueColor
}) => {
  const padding = { top: 20, right: horizontal ? 80 : 20, bottom: 40, left: horizontal ? 120 : 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { computedMax, positions } = useMemo(() => {
    const values = data.map((d) => d.value);
    const computedMax = maxValue ?? Math.max(...values, 1) * 1.15;
    const positions = horizontal
      ? []
      : calculateBarPositions(values, chartWidth, chartHeight, computedMax, barGap);
    return { computedMax, positions };
  }, [data, chartWidth, chartHeight, maxValue, barGap, horizontal]);

  if (horizontal) {
    const barHeight = data.length > 0
      ? Math.max(20, (chartHeight - barGap * (data.length - 1)) / data.length)
      : 30;

    return (
      <View className={styles.chartContainer}>
        <View className={styles.svgWrapper} style={{ width, height }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
            {data.map((item, i) => {
              const y = padding.top + i * (barHeight + barGap);
              const ratio = computedMax > 0 ? Math.min(1, item.value / computedMax) : 0;
              const barWidth = ratio * chartWidth;
              const barColor = item.color || color || defaultBarColor;
              const displayUnit = item.unit || unit;

              return (
                <g key={i}>
                  <text
                    x={padding.left - 10}
                    y={y + barHeight / 2 + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#4E5969"
                  >
                    {item.label}
                  </text>
                  <rect
                    x={padding.left}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    rx={barHeight / 2}
                    opacity={0.9}
                  >
                    <animate
                      attributeName="width"
                      from="0"
                      to={barWidth}
                      dur="0.6s"
                      fill="freeze"
                    />
                  </rect>
                  {showValue && (
                    <text
                      x={padding.left + barWidth + 10}
                      y={y + barHeight / 2 + 4}
                      textAnchor="start"
                      fontSize="11"
                      fill={valueColor || barColor}
                      fontWeight="600"
                    >
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}{displayUnit}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.chartContainer}>
      <View className={styles.svgWrapper} style={{ width, height }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          {data.map((item, i) => {
            const pos = positions[i] || { x: 0, width: 30, height: 0 };
            const x = padding.left + pos.x;
            const y = padding.top + chartHeight - pos.height;
            const barColor = item.color || color || defaultBarColor;
            const displayUnit = item.unit || unit;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={pos.width}
                  height={pos.height}
                  fill={barColor}
                  rx={pos.width / 2}
                  opacity={0.9}
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={pos.height}
                    dur="0.6s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="y"
                    from={padding.top + chartHeight}
                    to={y}
                    dur="0.6s"
                    fill="freeze"
                  />
                </rect>
                {showValue && (
                  <text
                    x={x + pos.width / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill={valueColor || barColor}
                    fontWeight="600"
                  >
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}{displayUnit}
                  </text>
                )}
                <text
                  x={x + pos.width / 2}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#86909C"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </View>
    </View>
  );
};

export default BarChart;
export { BarChart };
export type { BarChartItem };
