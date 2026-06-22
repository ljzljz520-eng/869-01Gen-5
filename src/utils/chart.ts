// ============================================
// 图表工具函数
// ============================================

export interface ChartPoint {
  x: number;
  y: number;
  label?: string;
}

export function calculateChartDimensions(
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
) {
  return {
    chartWidth: width - padding.left - padding.right,
    chartHeight: height - padding.top - padding.bottom,
    padding
  };
}

export function normalizeData(points: number[], maxValue?: number, minValue?: number): number[] {
  const actualMax = maxValue ?? Math.max(...points);
  const actualMin = minValue ?? Math.min(...points);
  const range = actualMax - actualMin || 1;

  return points.map((p) => (p - actualMin) / range);
}

export function generateSmoothPath(
  points: ChartPoint[],
  chartHeight: number,
  paddingTop: number
): string {
  if (points.length === 0) return '';

  const firstPoint = points[0];
  let path = `M ${firstPoint.x} ${paddingTop + chartHeight - firstPoint.y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = paddingTop + chartHeight - p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = paddingTop + chartHeight - p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${paddingTop + chartHeight - p2.y}`;
  }

  return path;
}

export function buildSmoothLinePath(
  points: ChartPoint[],
  chartHeight: number,
  paddingTop: number
): string {
  return generateSmoothPath(points, chartHeight, paddingTop);
}

export function generateAreaPath(
  points: ChartPoint[],
  chartHeight: number,
  paddingTop: number,
  paddingLeft: number,
  chartWidth: number
): string {
  if (points.length === 0) return '';

  const linePath = generateSmoothPath(points, chartHeight, paddingTop);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const bottomY = paddingTop + chartHeight;

  return `${linePath} L ${lastPoint.x} ${bottomY} L ${paddingLeft} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
}

export function generateYAxisTicks(max: number, min: number = 0, count: number = 5): number[] {
  const range = max - min || 1;
  const step = Math.ceil(range / count);
  const niceStep = niceNumber(step, true);

  const ticks: number[] = [];
  for (let value = Math.ceil(min / niceStep) * niceStep; value <= max; value += niceStep) {
    ticks.push(value);
  }

  return ticks;
}

function niceNumber(range: number, round: boolean): number {
  const pow = Math.pow(10, Math.floor(Math.log10(range)));
  const fraction = range / pow;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * pow;
}

export function mapValuesToChartPoints(
  values: number[],
  chartWidth: number,
  chartHeight: number,
  maxValue?: number,
  minValue?: number
): ChartPoint[] {
  if (values.length === 0) return [];

  const actualMax = maxValue ?? Math.max(...values);
  const actualMin = minValue ?? Math.min(...values, 0);
  const range = actualMax - actualMin || 1;

  const pointSpacing = values.length > 1 ? chartWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: values.length > 1 ? index * pointSpacing : chartWidth / 2,
    y: ((value - actualMin) / range) * chartHeight,
    label: value.toString()
  }));
}

export function calculateBarPositions(
  values: number[],
  chartWidth: number,
  chartHeight: number,
  maxValue?: number,
  barGap: number = 8
): { x: number; width: number; height: number }[] {
  if (values.length === 0) return [];

  const actualMax = maxValue ?? Math.max(...values);
  const barWidth = (chartWidth - barGap * (values.length - 1)) / values.length;

  return values.map((value, index) => ({
    x: index * (barWidth + barGap),
    width: barWidth,
    height: (value / actualMax) * chartHeight
  }));
}

export function calculatePieAngles(values: number[]): { startAngle: number; endAngle: number; percentage: number }[] {
  const total = values.reduce((sum, v) => sum + v, 0) || 1;

  let currentAngle = -Math.PI / 2;
  return values.map((value) => {
    const percentage = value / total;
    const angleSpan = percentage * Math.PI * 2;
    const result = {
      startAngle: currentAngle,
      endAngle: currentAngle + angleSpan,
      percentage
    };
    currentAngle += angleSpan;
    return result;
  });
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

export function generateArcPath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const endOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  const commands = [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    'Z'
  ];

  return commands.join(' ');
}
