import { LogOut, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../Logo";
import { NAV_SECTIONS } from "./navigation";

function navLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? "bg-cyan-400/10 font-semibold text-cyan-200"
      : "font-medium text-slate-400 hover:bg-navy-700 hover:text-slate-100"
  }`;
}

// The same nav markup renders in two places: the fixed desktop
// sidebar and the mobile slide-over. `onNavigate` closes the drawer.
export function SidebarContent({ onNavigate, onSignOut, signingOut }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Logo />
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            autoFocus
            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-700 hover:text-slate-100 lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={navLinkClass}
                  >
                    <item.icon size={17} aria-hidden="true" className="shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
              {section.label === "Account" && (
                <li>
                  <button
                    type="button"
                    onClick={onSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-navy-700 hover:text-slate-100 disabled:opacity-60"
                  >
                    <LogOut size={17} aria-hidden="true" className="shrink-0" />
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      <p className="border-t border-navy-700 px-5 py-4 text-[11px] text-slate-500">
        ForgeBase · local development
      </p>
    </div>
  );
}

// Desktop sidebar: fixed, always visible on large screens.
export default function Sidebar({ onSignOut, signingOut }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-navy-700 bg-navy-800 lg:block">
      <SidebarContent onSignOut={onSignOut} signingOut={signingOut} />
    </aside>
  );
}
