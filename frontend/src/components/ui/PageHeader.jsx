// Standard page heading for dashboard pages:
// title, optional description, optional right-side actions.
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
