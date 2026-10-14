import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import CreateOrganizationDialog from "../components/organizations/CreateOrganizationDialog";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import {
  deleteOrganization,
  listOrgMembers,
  listOrganizations,
} from "../services/organization.service";

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function roleTone(role) {
  return role === "owner" ? "info" : "neutral";
}

function loadErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 401) return "Session expired. Please sign in again.";
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not load organizations.";
  }
  return "Something went wrong. Please try again.";
}

export default function Organizations() {
  const { accessToken } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const orgs = await listOrganizations(accessToken);
      setOrganizations(orgs);
      // Member counts come from the real members endpoint, one call
      // per org. A single failure never blanks the whole page.
      const results = await Promise.allSettled(
        orgs.map((org) => listOrgMembers(accessToken, org._id))
      );
      const counts = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          counts[orgs[index]._id] = result.value.length;
        }
      });
      setMemberCounts(counts);
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
      // Owner-only on the backend as well (403 otherwise).
      await deleteOrganization(accessToken, pendingDelete._id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setPendingDelete(null);
      setError(
        err instanceof ApiError && err.status === 403
          ? "Only the organization owner can delete it."
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
        aria-label="Loading organizations"
        className="flex items-center justify-center py-20"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Manage your workspaces and collaborate with your team."
        actions={
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="w-auto px-4"
          >
            <Plus size={16} aria-hidden="true" />
            Create Organization
          </Button>
        }
      />

      {error && <Alert message={error} />}

      {organizations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Create your first organization to group projects and invite your team."
            action={
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="w-auto px-4"
              >
                <Plus size={16} aria-hidden="true" />
                Create Organization
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {organizations.map((org) => (
            <li key={org._id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-base font-semibold text-white">
                    {org.name}
                  </p>
                  {org.userRole && (
                    <StatusBadge tone={roleTone(org.userRole)}>
                      {capitalize(org.userRole)}
                    </StatusBadge>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                  {org.slug}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {capitalize(org.plan)} plan
                  {memberCounts[org._id] !== undefined && (
                    <>
                      <span aria-hidden="true"> · </span>
                      {memberCounts[org._id]}{" "}
                      {memberCounts[org._id] === 1 ? "member" : "members"}
                    </>
                  )}
                  <span aria-hidden="true"> · </span>
                  Created {formatDate(org.createdAt)}
                </p>
                {/* Delete is owner-only on the backend too, so the
                    button only renders for owners — never a dead end. */}
                {org.userRole === "owner" && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setPendingDelete(org)}
                      className="w-auto px-3 py-1.5 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateOrganizationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={load}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name || "organization"}?`}
        description="The organization will be removed for all members. This cannot be undone."
        confirmLabel="Delete"
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
