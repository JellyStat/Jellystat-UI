// Chart colours as hex, for libraries that need literal values (recharts, canvas, PDF export).
// Keep in sync with the tokens in styles/globals.css.
export const chartColors = {
  primary: '#aa3bff',
  accent: '#00a4dc',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f43f5e',
  info: '#38bdf8',
  grid: '#27272a', // --color-border
  cursor: '#3f3f46', // --color-border-strong
  axis: '#71717a', // zinc-500, axis labels
  tooltipBg: '#121214', // --color-surface
  tooltipText: '#e5e7eb', // gray-200
} as const;

// Ordered series palette for multi-series and categorical charts.
export const chartSeries: readonly string[] = [
  chartColors.primary,
  chartColors.accent,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
];
