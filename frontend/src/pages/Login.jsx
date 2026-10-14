import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Database,
  KeyRound,
  Radio,
  ShieldCheck,
} from "lucide-react";
import Logo from "../components/Logo";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Authentication & access control",
    text: "Email login with short-lived access tokens and rotating refresh sessions.",
  },
  {
    icon: Database,
    title: "Database & file management",
    text: "Project-scoped collections, documents, and file storage behind one API.",
  },
  {
    icon: Radio,
    title: "Jobs & realtime",
    text: "Background job queue with live event delivery over WebSockets.",
  },
];

// Map backend failures to readable, non-technical messages.
// Never expose stack traces, tokens, or internal details.
function toFriendlyMessage(error) {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }
  if (error.status === 0) return error.message;
  if (error.status === 401) return "Invalid email or password.";
  if (error.status === 403)
    return error.message || "This account cannot sign in.";
  if (error.status === 429)
    return "Too many sign-in attempts. Please wait a moment and try again.";
  if (error.status === 400 && error.errors.length > 0) {
    return error.errors.map((e) => e.message).join(" ");
  }
  if (error.status >= 500)
    return "The server had a problem. Please try again in a moment.";
  return error.message || "Sign-in failed. Please try again.";
}

export default function Login() {
  const { user, isAuthenticated, restoring, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showCreated, setShowCreated] = useState(false);

  // One-time "account created" note when arriving from /signup.
  // Cleared from history state so it never shows twice.
  useEffect(() => {
    if (location.state?.justRegistered) {
      setShowCreated(true);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    return { errors, trimmedEmail };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return; // guard against duplicate submissions

    const { errors, trimmedEmail } = validate();
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // Success: AuthContext stores the session and this page switches
      // to the signed-in panel below. No redirect — the dashboard
      // does not exist yet.
      await login({ email: trimmedEmail, password });
    } catch (error) {
      // Surface backend field errors (e.g. "Invalid email format") inline.
      if (error instanceof ApiError && error.errors.length > 0) {
        const mapped = {};
        for (const item of error.errors) {
          if (item.field === "email" || item.field === "password") {
            mapped[item.field] = item.message;
          }
        }
        setFieldErrors(mapped);
      }
      setFormError(toFriendlyMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setFormError("");
    try {
      // Calls the real POST /auth/logout endpoint.
      await logout();
    } catch {
      // The local session is cleared regardless; just tell the user
      // the server could not be reached to revoke it.
      setFormError(
        "Signed out on this device, but the server could not be reached."
      );
    } finally {
      setSigningOut(false);
    }
  }

  // Session still being restored (checked via GET /users/me):
  // wait before choosing between the form and the signed-in panel.
  if (restoring) {
    return <LoadingSpinner label="Checking session…" />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left: brand panel ─────────────────────────────────── */}
      <section className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,rgba(34,211,238,0.12),transparent)]"
        />
        <Logo />

        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
            Your backend. One platform.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            ForgeBase gives your app authentication, a managed database, file
            storage, background jobs, and realtime events — without running
            your own infrastructure.
          </p>

          {/* Subtle infrastructure visual: connected API nodes */}
          <svg
            viewBox="0 0 400 150"
            role="img"
            aria-label="Diagram of connected backend services"
            className="mt-8 w-full max-w-md"
          >
            <g stroke="#164e63" strokeWidth="1.5">
              <line x1="200" y1="30" x2="80" y2="115" />
              <line x1="200" y1="30" x2="200" y2="115" />
              <line x1="200" y1="30" x2="320" y2="115" />
            </g>
            <g fontFamily="monospace" fontSize="10" fill="#67e8f9">
              <rect x="160" y="10" width="80" height="36" rx="8" fill="#0f1d36" stroke="#22d3ee" strokeOpacity="0.5" />
              <text x="200" y="33" textAnchor="middle" fill="#e2e8f0">API</text>
              <rect x="30" y="100" width="100" height="36" rx="8" fill="#0f1d36" stroke="#334155" />
              <text x="80" y="123" textAnchor="middle">Auth</text>
              <rect x="150" y="100" width="100" height="36" rx="8" fill="#0f1d36" stroke="#334155" />
              <text x="200" y="123" textAnchor="middle">Database</text>
              <rect x="270" y="100" width="100" height="36" rx="8" fill="#0f1d36" stroke="#334155" />
              <text x="320" y="123" textAnchor="middle">Jobs</text>
            </g>
            <circle cx="200" cy="30" r="3.5" fill="#22d3ee" />
            <circle cx="80" cy="115" r="3" fill="#22d3ee" opacity="0.7" />
            <circle cx="200" cy="115" r="3" fill="#22d3ee" opacity="0.7" />
            <circle cx="320" cy="115" r="3" fill="#22d3ee" opacity="0.7" />
          </svg>

          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
                  <item.icon size={17} className="text-cyan-300" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-100">
                    {item.title}
                  </span>
                  <span className="block text-xs leading-relaxed text-slate-400">
                    {item.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Secure by default · Scoped API keys · Project isolation
        </p>
      </section>

      {/* ── Right: sign-in card ───────────────────────────────── */}
      <main className="flex items-center justify-center bg-navy-900 px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          {/* Mobile brand row (left panel is hidden on small screens) */}
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <section
            aria-labelledby="login-heading"
            className="rounded-2xl border border-slate-700/40 bg-navy-800 p-6 shadow-xl shadow-black/30 sm:p-8"
          >
            {isAuthenticated ? (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
                  <CheckCircle2 size={22} className="text-cyan-300" aria-hidden="true" />
                </span>
                <h2 id="login-heading" className="mt-4 text-2xl font-bold text-white">
                  Signed in
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Welcome,{" "}
                  <span className="font-semibold text-slate-200">
                    {user?.name || user?.email}
                  </span>
                  {user?.email && (
                    <span className="mt-1 block font-mono text-xs text-slate-500">
                      {user.email}
                    </span>
                  )}
                </p>
                {showCreated && (
                  <p
                    role="status"
                    className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-200"
                  >
                    Account created — you&apos;re signed in.
                  </p>
                )}

                <div className="mt-6 space-y-4">
                  <Alert message={formError} />
                  <Button
                    type="button"
                    onClick={() => navigate("/", { replace: true })}
                  >
                    Open workspace
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={signingOut}
                    disabled={signingOut}
                    onClick={handleSignOut}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="login-heading" className="text-2xl font-bold text-white">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Sign in to your ForgeBase workspace to manage projects,
                  keys, and data.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                  <Alert message={formError} />

                  <Input
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={fieldErrors.email}
                  />

                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    error={fieldErrors.password}
                  />

                  {/* No "remember me": the backend always issues a 7-day
                      refresh token, so there is no short/long session
                      choice to offer. */}
                  {/* No "forgot password": the backend has no recovery
                      endpoint yet. */}

                  <div className="pt-1">
                    <Button disabled={submitting} loading={submitting}>
                      {submitting ? "Signing in…" : "Sign in"}
                    </Button>
                  </div>
                </form>

                <p className="mt-6 flex items-center gap-1.5 text-sm text-slate-400">
                  <KeyRound size={14} aria-hidden="true" />
                  New to ForgeBase?
                  <Link
                    to="/signup"
                    className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </>
            )}
          </section>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected by rate limiting and rotating refresh sessions.
          </p>
        </div>
      </main>
    </div>
  );
}
