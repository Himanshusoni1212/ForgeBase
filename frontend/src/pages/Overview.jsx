import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ChevronRight,
  Database,
  FolderPlus,
  HardDrive,
  KeyRound,
  Plus,
} from "lucide-react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import CreateProjectDialog from "../components/projects/CreateProjectDialog";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import {
  listOrganizations,
} from "../services/organization.service";
import { listProjects } from "../services/project.service";

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function loadErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 401)
      return "Session expired. Please sign in again.";
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not load workspace data.";
  }
  return "Something went wrong. Please try again.";
}

const QUICK_LINKS = [
  {
    to: "/database",
    label: "Explore Database",
    hint: "Collections & documents",
    icon: Database,
  },
  {
    to: "/api-keys",
    label: "Manage API Keys",
    hint: "Scoped credentials",
    icon: KeyRound,
  },
  {
    to: "/files",
    label: "File Storage",
    hint: "Uploads & metadata",
    icon: HardDrive,
  },
];

export default function Overview() {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Both lists are real backend data; counts below come from these.
      const [projectList, orgList] = await Promise.all([
        listProjects(accessToken),
        listOrganizations(accessToken),
      ]);
      setProjects(projectList);
      setOrganizations(orgList);
    } catch (err) {
      setError(loadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const orgNameById = Object.fromEntries(
    organizations.map((org) => [org._id, org.name])
  );

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading workspace"
        className="flex items-center justify-center py-20"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Overview"
          description="Manage your projects and backend services."
        />
        <Alert message={error} />
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={load}
            className="w-auto px-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Manage your projects and backend services."
        actions={
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="w-auto px-4"
          >
            <Plus size={16} aria-hidden="true" />
            Create Project
          </Button>
        }
      />

      {/* ── Summary: real counts from the API ─────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-3xl font-bold text-white">{projects.length}</p>
          <p className="mt-1 text-sm font-medium text-slate-300">Projects</p>
          <p className="text-xs text-slate-500">
            Across {organizations.length}{" "}
            {organizations.length === 1 ? "organization" : "organizations"}
          </p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-white">
            {organizations.length}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-300">
            Organizations
          </p>
          <p className="text-xs text-slate-500">You are a member of</p>
        </Card>
      </div>

      {/* ── Projects ──────────────────────────────────────────── */}
      <section aria-labelledby="projects-heading">
        <div className="mb-3 flex items-center justify-between">
          <h3
            id="projects-heading"
            className="text-sm font-semibold uppercase tracking-wider text-slate-400"
          >
            Projects
          </h3>
        </div>

        {projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={FolderPlus}
              title="No projects yet"
              description="Create your first project to get API keys, a database, and file storage."
              action={
                <Button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="w-auto px-4"
                >
                  <Plus size={16} aria-hidden="true" />
                  Create Project
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <li key={project._id}>
                <Card>
                  <p className="truncate text-base font-semibold text-white">
                    {project.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                    {project.slug}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {orgNameById[project.organizationId] || "Organization"}
                    <span aria-hidden="true"> · </span>
                    Created {formatDate(project.createdAt)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Quick actions (destinations are existing routes) ──── */}
      <section aria-labelledby="quick-actions-heading">
        <h3
          id="quick-actions-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400"
        >
          Quick actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-4 py-3.5 text-left transition hover:bg-cyan-400/10"
          >
            <Plus size={18} className="shrink-0 text-cyan-300" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-100">
                Create Project
              </span>
              <span className="block truncate text-xs text-slate-500">
                New isolated environment
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
          </button>

          {QUICK_LINKS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-800 px-4 py-3.5 transition hover:border-slate-500/60"
            >
              <action.icon size={18} className="shrink-0 text-cyan-300" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {action.label}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {action.hint}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent activity: no backend feed exists ───────────── */}
      <Card title="Recent activity">
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="ForgeBase does not expose an activity feed yet, so there is nothing to show here."
        />
      </Card>

      <CreateProjectDialog
        open={dialogOpen}
        organizations={organizations}
        onClose={() => setDialogOpen(false)}
        onCreated={load}
      />
    </div>
  );
}
