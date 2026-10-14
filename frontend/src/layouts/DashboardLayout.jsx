import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar, { SidebarContent } from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

// Reusable authenticated shell: sidebar + topbar + page content.
// Future pages render inside <Outlet /> — no copying chrome per page.
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    function onKey(event) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout(); // real POST /auth/logout, local session always cleared
    } finally {
      setSigningOut(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen bg-navy-900 text-slate-100">
      <Sidebar onSignOut={handleSignOut} signingOut={signingOut} />

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-navy-700 bg-navy-800">
            <SidebarContent
              onNavigate={() => setSidebarOpen(false)}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          signingOut={signingOut}
          onMenu={() => setSidebarOpen(true)}
          onSignOut={handleSignOut}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
