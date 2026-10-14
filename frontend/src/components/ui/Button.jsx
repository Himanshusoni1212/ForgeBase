export default function Button({
  children,
  variant = "primary",
  type = "submit",
  disabled = false,
  loading = false,
  className = "",
  ...rest
}) {
  const styles =
    variant === "primary"
      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:hover:bg-cyan-400"
      : variant === "danger"
        ? "bg-red-500/15 text-red-200 border border-red-500/40 hover:bg-red-500/25"
        : "bg-transparent text-slate-200 border border-slate-600/60 hover:border-slate-400";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
