// Small status pill (for job states, key states, etc.).
// Color is never the only signal: the label text always states it.
const TONES = {
  neutral: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  danger: "border-red-400/30 bg-red-400/10 text-red-200",
};

export default function StatusBadge({ tone = "neutral", children }) {
  const style = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
