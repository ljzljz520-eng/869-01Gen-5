import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { calculatePieAngles, generateArcPath, polarToCartesian } from '../../utils/chart';

interface PieChartItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  size?: number;
  data: PieChartItem[];
  innerRadiusRatio?: number;
  showLegend?: boolean;
  centerContent?: {
    title: string;
    value: string | number;
    unit?: string;
  };
  unit?: string;
}

const defaultColors = [
  '#165DFF', '#722ED1', '#00B42A', '#FF7D00',
  '#F53F3F', '#14C9C9', '#86909C', '#F5319D'
];

const PieChart: React.FC<PieChartProps> = ({
  size = 300,
  data,
  innerRadiusRatio = 0.6,
  showLegend = true,
  centerContent,
  unit = ''
}) => {
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * innerRadiusRatio;
  const centerX = size / 2;
  const centerY = size / 2;

  const { total, arcs } = useMemo(() => {
    const values = data.map((d) => d.value);
    const total = values.reduce((sum, v) => sum + v, 0);
    const angles = calculatePieAngles(values);

    const arcs = angles.map((angle, i) => ({
      ...angle,
      path: generateArcPath(
        centerX,
        centerY,
        outerRadius,
        innerRadius,
        angle.startAngle,
        angle.endAngle
      ),
      color: data[i].color || defaultColors[i % defaultColors.length],
      label: data[i].label,
      value: data[i].value
    }));

    return { total, arcs };
  }, [data, outerRadius, innerRadius, centerX, centerY]);

  return (
    <View className={styles.chartContainer}>
      <View className={styles.svgWrapper} style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
          {arcs.map((arc, i) => {
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const labelPos = polarToCartesian(centerX, centerY, (outerRadius + innerRadius) / 2, midAngle);
            return (
              <g key={i}>
                <path
                  d={arc.path}
                  fill={arc.color}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity={0.9}
                />
                {arc.percentage >= 0.05 && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                    fontWeight="600"
                  >
                    {(arc.percentage * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {centerContent && (
            <g>
              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#86909C"
              >
                {centerContent.title}
              </text>
              <text
                x={centerX}
                y={centerY + 12}
                textAnchor="middle"
                fontSize="20"
                fill="#1D2129"
                fontWeight="700"
              >
                {centerContent.value}
                {centerContent.unit && (
                  <tspan fontSize="12" fill="#86909C" fontWeight="400">{centerContent.unit}</tspan>
                )}
              </text>
            </g>
          )}
        </svg>
      </View>

      {showLegend && (
        <View className={styles.legend}>
          {arcs.map((arc, i) => (
            <View key={i} className={styles.legendItem}>
              <View className={styles.legendDot} style={{ backgroundColor: arc.color }} />
              <View className={styles.legendContent}>
                <Text className={styles.legendLabel}>{arc.label}</Text>
                <Text className={styles.legendValue}>
                  {arc.value.toLocaleString()}{unit} · {(arc.percentage * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {!centerContent && !showLegend && total > 0 && (
        <View className={styles.total}>
          <Text className={styles.totalLabel}>总计</Text>
          <Text className={styles.totalValue}>{total.toLocaleString()}{unit}</Text>
        </View>
      )}
    </View>
  );
};

export default PieChart;
