export function MetricCard({ label, value, detail }) {
  return (
    <div className="glass-card p-6">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="mt-2 block text-4xl font-semibold text-ink">{value}</strong>
      {detail ? <span className="mt-1 block text-sm text-slate-600">{detail}</span> : null}
    </div>
  );
}
