export default function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-navy-900"
      role="status"
      aria-label={label}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}
