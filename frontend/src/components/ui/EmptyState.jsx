// Friendly "nothing here" block for empty lists and
// not-yet-connected sections. Never shows fake data.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-700 bg-navy-900">
          <Icon size={20} className="text-slate-400" aria-hidden="true" />
        </span>
      )}
      <p className="mt-4 text-sm font-semibold text-slate-100">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
