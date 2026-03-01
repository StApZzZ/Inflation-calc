interface MetricCardProps {
  label: string;
  value: string;
  meta?: string;
  tone?: 'default' | 'positive' | 'negative';
}

export function MetricCard({ label, value, meta, tone = 'default' }: MetricCardProps) {
  const className = tone === 'positive' ? 'metric-positive' : tone === 'negative' ? 'metric-negative' : '';

  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${className}`.trim()}>{value}</div>
      {meta ? <div className="metric-meta">{meta}</div> : null}
    </div>
  );
}
