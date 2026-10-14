import { useEffect, useState } from "react";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ApiError } from "../../services/api";
import { updateProject } from "../../services/project.service";
import { useAuth } from "../../context/AuthContext";

// Rename dialog. The backend only allows changing `name`
// (updateProjectSchema) — slug and organization are immutable,
// so they are shown read-only for context, never sent.
export default function EditProjectDialog({ open, project, onClose, onSaved }) {
  const { accessToken } = useAuth();

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fresh state every time the dialog opens for a project.
  useEffect(() => {
    if (!open) return;
    setName(project?.name || "");
    setFieldError("");
    setFormError("");
    setSubmitting(false);
  }, [open, project]);

  // Close on Escape (overlay click handled on the backdrop element).
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !project) return null;

  function friendlyMessage(error) {
    if (!(error instanceof ApiError)) return "Something went wrong.";
    if (error.status === 0) return error.message;
    if (error.status === 401) return "Session expired. Please sign in again.";
    if (error.status === 403)
      return "You do not have permission to edit this project.";
    if (error.status === 404) return "Project not found. It may have been deleted.";
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not save the project.";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return; // guard against duplicate submissions

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError("Project name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setFieldError("Name must be at least 2 characters.");
      return;
    }
    setFieldError("");
    setFormError("");

    setSubmitting(true);
    try {
      const saved = await updateProject(accessToken, project._id, {
        name: trimmedName,
      });
      onSaved?.(saved);
      onClose?.();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldIssue = (error.errors || []).find(
          (item) => item.field === "name"
        );
        if (fieldIssue) setFieldError(fieldIssue.message);
      }
      setFormError(friendlyMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-navy-700 bg-navy-800 p-6 shadow-xl shadow-black/40">
        <h3 id="edit-project-title" className="text-base font-semibold text-white">
          Rename project
        </h3>
        <p className="mt-1 font-mono text-xs text-slate-500">{project.slug}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <Alert message={formError} />

          <Input
            id="edit-project-name"
            label="Project name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldError}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={onClose}
              className="w-auto px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="w-auto px-4"
            >
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
