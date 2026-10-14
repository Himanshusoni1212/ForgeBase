// Shared panel used by dashboard pages. Same border, radius,
// and shadow language as the auth cards.
export default function Card({ title, description, actions, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-navy-700 bg-navy-800 shadow-lg shadow-black/20 ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-navy-700 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
