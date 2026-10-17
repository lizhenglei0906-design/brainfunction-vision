// Preserve the statistic's reported magnitude and textual qualifiers.
export function formatReportedStatistic(statistic) {
  if (typeof statistic === 'string') return statistic.trim() ? statistic : '统计量见原表';
  if (!statistic || typeof statistic !== 'object') return '统计量见原表';
  const scale = statistic.scale === 'x10^-3' ? ' ×10⁻³'
    : statistic.scale && statistic.scale !== 'unscaled' ? `（原表倍率：${statistic.scale}）` : '';
  const volume = statistic.clusterVolumeMm3 == null ? '' : `；簇体积 ${statistic.clusterVolumeMm3} mm³`;
  return `${statistic.name ?? statistic.type ?? '统计量'} = ${statistic.value ?? '见原表'}${scale}${volume}`;
}
