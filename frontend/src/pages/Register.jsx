import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Database, LogIn, Radio, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Matches the backend rule (backend/src/validators/auth.validator.js):
// password 8-128 chars, name 1-100 chars.
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;

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
  if (error.status === 409)
    return "An account with this email already exists. Try signing in instead.";
  if (error.status === 429)
    return "Too many attempts. Please wait a moment and try again.";
  if (error.status === 400 && error.errors.length > 0) {
    return error.errors.map((e) => e.message).join(" ");
  }
  if (error.status >= 500)
    return "The server had a problem. Please try again in a moment.";
  return error.message || "Registration failed. Please try again.";
}

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, restoring, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Registration makes no sense — go to sign in,
  // which shows the signed-in panel.
  if (!restoring && isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  function validate() {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = "Full name is required.";
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      errors.name = "Name must not exceed 100 characters.";
    }
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return { errors, trimmedName, trimmedEmail };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return; // guard against duplicate submissions

    const { errors, trimmedName, trimmedEmail } = validate();
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // Only name/email/password go to the backend — the confirmation
      // value is a frontend-only check and is never sent.
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      // Registration also signs the user in (backend returns tokens),
      // so land on the sign-in page, which shows the signed-in panel
      // plus a one-time "account created" note.
      navigate("/login", {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (error) {
      // Surface backend field errors inline (e.g. duplicate email,
      // "Invalid email format").
      if (error instanceof ApiError && error.errors.length > 0) {
        const mapped = {};
        for (const item of error.errors) {
          if (["name", "email", "password"].includes(item.field)) {
            mapped[item.field] = item.message;
          }
        }
        setFieldErrors(mapped);
      }
      if (error instanceof ApiError && error.status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists.",
        }));
      }
      setFormError(toFriendlyMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (restoring) {
    return <LoadingSpinner label="Checking session…" />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left: brand panel (mirrors the Sign In page) ───────── */}
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

      {/* ── Right: registration card ──────────────────────────── */}
      <main className="flex items-center justify-center bg-navy-900 px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          {/* Mobile brand row (left panel is hidden on small screens) */}
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <section
            aria-labelledby="register-heading"
            className="rounded-2xl border border-slate-700/40 bg-navy-800 p-6 shadow-xl shadow-black/30 sm:p-8"
          >
            <h2 id="register-heading" className="text-2xl font-bold text-white">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Get started with ForgeBase.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <Alert message={formError} />

              <Input
                id="name"
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
              />

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
                label="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                error={fieldErrors.password}
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                error={fieldErrors.confirmPassword}
              />

              <div className="pt-1">
                <Button disabled={submitting} loading={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
              </div>
            </form>

            <p className="mt-6 flex items-center gap-1.5 text-sm text-slate-400">
              <LogIn size={14} aria-hidden="true" />
              Already have an account?
              <Link
                to="/login"
                className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </section>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected by rate limiting and rotating refresh sessions.
          </p>
        </div>
      </main>
    </div>
  );
}
