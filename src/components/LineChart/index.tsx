import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import {
  mapValuesToChartPoints,
  generateSmoothPath,
  generateAreaPath,
  generateYAxisTicks
} from '../../utils/chart';

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  unit?: string;
  fillColor?: string;
}

interface LineChartData {
  label: string;
  values: number[];
  color?: string;
  fillColor?: string;
}

interface LineChartPropsBase {
  width?: number;
  height?: number;
  labels: string[];
  maxValue?: number;
  minValue?: number;
  showArea?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisUnit?: string;
  smooth?: boolean;
  referenceLine?: number;
}

interface LineChartPropsLegacy extends LineChartPropsBase {
  data: LineChartData[];
  series?: undefined;
  datasets?: undefined;
}

interface LineChartPropsNew extends LineChartPropsBase {
  data?: undefined;
  series: ChartSeries[];
  datasets: Record<string, number[]>;
}

type LineChartProps = LineChartPropsLegacy | LineChartPropsNew;

const defaultColors = [
  { stroke: '#165DFF', fill: 'rgba(22, 93, 255, 0.15)' },
  { stroke: '#722ED1', fill: 'rgba(114, 46, 209, 0.15)' },
  { stroke: '#00B42A', fill: 'rgba(0, 180, 42, 0.15)' },
  { stroke: '#FF7D00', fill: 'rgba(255, 125, 0, 0.15)' },
  { stroke: '#F53F3F', fill: 'rgba(245, 63, 63, 0.15)' }
];

const LineChart: React.FC<LineChartProps> = (props) => {
  const {
    width = 686,
    height = 320,
    labels,
    maxValue,
    minValue = 0,
    showArea = true,
    showGrid = true,
    showLegend = true,
    yAxisUnit = '',
    referenceLine
  } = props;

  const normalizedData: LineChartData[] = useMemo(() => {
    if ('data' in props && props.data) {
      return props.data;
    }
    if ('series' in props && 'datasets' in props && props.series) {
      return props.series.map((s, idx) => {
        const color = s.color || defaultColors[idx % defaultColors.length].stroke;
        return {
          label: s.label,
          values: props.datasets[s.key] || [],
          color,
          fillColor: s.fillColor || defaultColors[idx % defaultColors.length].fill
        };
      });
    }
    return [];
  }, [props]);

  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { computedMax, yTicks, paths, refLineY } = useMemo(() => {
    const allValues = normalizedData.flatMap((d) => d.values);
    if (referenceLine !== undefined) allValues.push(referenceLine);
    const hasValues = allValues.length > 0;
    const computedMax = maxValue ?? (hasValues ? Math.max(...allValues) * 1.1 : 100);
    const yTicks = generateYAxisTicks(computedMax, minValue, 5);
    let refLineY: number | undefined;
    if (referenceLine !== undefined) {
      refLineY = padding.top + chartHeight - ((referenceLine - minValue) / (computedMax - minValue)) * chartHeight;
    }

    const paths = normalizedData.map((series, index) => {
      const values = series.values.length > 0 ? series.values : [0];
      const points = mapValuesToChartPoints(
        values,
        chartWidth,
        chartHeight,
        computedMax,
        minValue
      );
      const color = series.color || defaultColors[index % defaultColors.length].stroke;
      const fill = series.fillColor || defaultColors[index % defaultColors.length].fill;
      const linePath = props.smooth !== false
        ? generateSmoothPath(points, chartHeight, padding.top)
        : generateSmoothPath(points, chartHeight, padding.top);
      const areaPath = showArea
        ? generateAreaPath(points, chartHeight, padding.top, padding.left, chartWidth)
        : '';
      return { linePath, areaPath, color, fill, label: series.label };
    });

    return { computedMax, yTicks, paths, refLineY };
  }, [normalizedData, chartWidth, chartHeight, maxValue, minValue, padding.top, padding.left, showArea, props.smooth, referenceLine]);

  const labelStep = Math.ceil(labels.length / 6);
  const xLabelPositions = labels.map((_, i) => padding.left + (i * chartWidth) / Math.max(labels.length - 1, 1));

  return (
    <View className={styles.chartContainer}>
      <View className={styles.svgWrapper} style={{ width, height }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          {showGrid && (
            <g>
              {yTicks.map((tick, i) => {
                const y = padding.top + chartHeight - ((tick - minValue) / (computedMax - minValue)) * chartHeight;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#F2F3F5"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#86909C"
                    >
                      {Math.round(tick)}{yAxisUnit}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {refLineY !== undefined && (
            <g>
              <line
                x1={padding.left}
                y1={refLineY}
                x2={width - padding.right}
                y2={refLineY}
                stroke="#F53F3F"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text
                x={width - padding.right - 4}
                y={refLineY - 6}
                textAnchor="end"
                fontSize="9"
                fill="#F53F3F"
                fontWeight="600"
              >
                阈值 {Math.round(referenceLine!)}
              </text>
            </g>
          )}

          <g>
            {labels.map((label, i) => (
              i % labelStep === 0 && (
                <text
                  key={i}
                  x={xLabelPositions[i]}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#86909C"
                >
                  {label}
                </text>
              )
            ))}
          </g>

          {paths.map((path, i) => (
            <g key={i}>
              {path.areaPath && (
                <path d={path.areaPath} fill={path.fill} />
              )}
              <path
                d={path.linePath}
                fill="none"
                stroke={path.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </svg>
      </View>

      {showLegend && (
        <View className={styles.legend}>
          {paths.map((p, i) => (
            <View key={i} className={styles.legendItem}>
              <View className={styles.legendDot} style={{ backgroundColor: p.color }} />
              <Text className={styles.legendText}>{p.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default LineChart;
export { LineChart };
export type { ChartSeries };
