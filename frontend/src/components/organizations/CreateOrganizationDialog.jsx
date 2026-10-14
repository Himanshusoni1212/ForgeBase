import { useEffect, useState } from "react";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ApiError } from "../../services/api";
import { createOrganization } from "../../services/organization.service";
import { useAuth } from "../../context/AuthContext";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

// Same slug rules as the backend (validators/organization.validator.js).
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function CreateOrganizationDialog({
  open,
  onClose,
  onCreated,
}) {
  const { accessToken } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fresh state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName("");
    setSlug("");
    setSlugTouched(false);
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
  }, [open ]);

  // Close on Escape (overlay click handled on the backdrop element).
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleNameChange(value) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function validate() {
    const errors = {};
    const trimmedName = name.trim();
    if (!trimmedName) errors.name = "Organization name is required.";
    else if (trimmedName.length < 2)
      errors.name = "Name must be at least 2 characters.";
    if (!slug) errors.slug = "Slug is required.";
    else if (slug.length < 2 || !SLUG_PATTERN.test(slug))
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens.";
    return { errors, trimmedName };
  }

  function friendlyMessage(error) {
    if (!(error instanceof ApiError)) return "Something went wrong.";
    if (error.status === 0) return error.message;
    if (error.status === 401) return "Session expired. Please sign in again.";
    if (error.status === 409) return error.message;
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not create the organization.";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return; // guard against duplicate submissions

    const { errors, trimmedName } = validate();
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const org = await createOrganization(accessToken, {
        name: trimmedName,
        slug,
      });
      onCreated?.(org);
      onClose?.();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped = {};
        for (const item of error.errors || []) {
          if (item.field === "name" || item.field === "slug") {
            mapped[item.field] = item.message;
          }
        }
        if (error.code === "ORG_SLUG_TAKEN") {
          mapped.slug = "This organization slug is already taken.";
        }
        setFieldErrors(mapped);
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
      aria-labelledby="create-org-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-navy-700 bg-navy-800 p-6 shadow-xl shadow-black/40">
        <h3 id="create-org-title" className="text-base font-semibold text-white">
          Create organization
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Organizations own projects and members. You will be the owner.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <Alert message={formError} />

          <Input
            id="org-name"
            label="Organization name"
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={fieldErrors.name}
          />

          <Input
            id="org-slug"
            label="Organization slug"
            type="text"
            autoComplete="off"
            placeholder="acme-inc"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            error={fieldErrors.slug}
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
              {submitting ? "Creating…" : "Create organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
