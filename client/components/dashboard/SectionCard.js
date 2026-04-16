export function SectionCard({ title, description, children }) {
  return (
    <section className="glass-card p-6">
      {(title || description) ? (
        <div className="mb-4 grid gap-1">
          {title ? <h2 className="text-2xl font-semibold text-ink">{title}</h2> : null}
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
