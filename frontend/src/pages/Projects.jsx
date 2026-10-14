import { useCallback, useEffect, useState } from "react";
import { FolderPlus, Plus, Search, SearchX } from "lucide-react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import PageHeader from "../components/ui/PageHeader";
import CreateProjectDialog from "../components/projects/CreateProjectDialog";
import EditProjectDialog from "../components/projects/EditProjectDialog";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { listOrganizations } from "../services/organization.service";
import { deleteProject, listProjects } from "../services/project.service";

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
    if (error.status === 401) return "Session expired. Please sign in again.";
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not load projects.";
  }
  return "Something went wrong. Please try again.";
}

// Only owners/admins hold PROJECT_UPDATE and PROJECT_DELETE on the
// backend (config/roles.js) — members get read-only cards. The backend
// still enforces this; the UI just avoids dead-end buttons.
function canManage(role) {
  return role === "owner" || role === "admin";
}

export default function Projects() {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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

  async function handleDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteProject(accessToken, pendingDelete._id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setPendingDelete(null);
      setError(
        err instanceof ApiError && err.status === 403
          ? "You do not have permission to delete this project."
          : loadErrorMessage(err)
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading projects"
        className="flex items-center justify-center py-20"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const orgById = Object.fromEntries(organizations.map((org) => [org._id, org]));
  const trimmedQuery = query.trim().toLowerCase();
  const visible = trimmedQuery
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedQuery) ||
          p.slug.toLowerCase().includes(trimmedQuery)
      )
    : projects;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Create and manage your backend projects."
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-auto px-4"
          >
            <Plus size={16} aria-hidden="true" />
            Create Project
          </Button>
        }
      />

      {error && <Alert message={error} />}

      {projects.length > 0 && (
        <div className="max-w-sm">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="project-search"
              type="search"
              autoComplete="off"
              placeholder="Filter by name or slug…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-600/60 bg-navy-950 py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Create your first project to get API keys, a database, and file storage."
            action={
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="w-auto px-4"
              >
                <Plus size={16} aria-hidden="true" />
                Create Project
              </Button>
            }
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No matching projects"
            description={`Nothing matches "${query.trim()}". Try a different search.`}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQuery("")}
                className="w-auto px-4"
              >
                Clear search
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((project) => {
            const org = orgById[project.organizationId];
            const manageable = canManage(org?.userRole);
            return (
              <li key={project._id}>
                <Card>
                  <p className="truncate text-base font-semibold text-white">
                    {project.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                    {project.slug}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {org?.name || "Organization"}
                    <span aria-hidden="true"> · </span>
                    Created {formatDate(project.createdAt)}
                  </p>
                  {/* The backend has no project-details route, so cards
                      are not links. Edit/delete render only for roles
                      the backend actually grants those permissions. */}
                  {manageable && (
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditing(project)}
                        className="w-auto px-3 py-1.5 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => setPendingDelete(project)}
                        className="w-auto px-3 py-1.5 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <CreateProjectDialog
        open={createOpen}
        organizations={organizations}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      <EditProjectDialog
        open={editing !== null}
        project={editing}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name || "project"}?`}
        description="The project will be removed. This cannot be undone."
        confirmLabel="Delete"
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
