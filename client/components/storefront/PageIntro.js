import Link from "next/link";

export function PageIntro({ eyebrow, title, description, actions = [], stats = [] }) {
  return (
    <section className="shell-container py-6">
      <div className="surface-panel page-hero">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h1 className="page-title mt-3 max-w-4xl">{title}</h1>
            {description ? <p className="muted-copy mt-4 max-w-3xl">{description}</p> : null}
            {actions.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={action.variant === "secondary" ? "btn-secondary" : "btn-primary"}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {stats.length ? (
            <div className="hero-metrics">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-chip">
                  <div className="mini-label">{stat.label}</div>
                  <strong className="mt-2 block text-3xl text-ink">{stat.value}</strong>
                  {stat.caption ? <p className="mt-2 text-sm text-slate-600">{stat.caption}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

