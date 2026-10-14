import { LogOut, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { titleForPath } from "./navigation";

// Topbar: menu button (mobile), current page title, and the signed-in
// user (real data from auth context) with a sign-out action.
// No notifications, no workspace selector — nothing fake.
export default function Topbar({ user, signingOut, onMenu, onSignOut }) {
  const location = useLocation();
  const title = titleForPath(location.pathname);

  const initials = (user?.name || user?.email || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-navy-700 bg-navy-900 px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-300 hover:bg-navy-700 lg:hidden"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-white">{title}</h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          ForgeBase workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xs font-bold text-cyan-200"
        >
          {initials}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-medium text-slate-100">
            {user?.name || "Account"}
          </span>
          {user?.email && (
            <span className="block truncate text-xs text-slate-500">
              {user.email}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-lg p-2 text-slate-400 hover:bg-navy-700 hover:text-slate-100 disabled:opacity-60"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
