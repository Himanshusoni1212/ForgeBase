import { useEffect, useState } from "react";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ApiError } from "../../services/api";
import { createOrganization } from "../../services/organization.service";
import { createProject } from "../../services/project.service";
import { useAuth } from "../../context/AuthContext";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const NEW_ORG_VALUE = "__new__";

// Turn "My Cool App" into "my-cool-app" (same rules as the backend:
// lowercase letters, numbers, hyphens only).
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const inputClass =
  "w-full rounded-lg border border-slate-600/60 bg-navy-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none";

// Dialog for creating a project. Projects must live inside an
// organization, so the dialog also offers inline organization creation
// (verified POST /organizations) when needed — no separate page.
export default function CreateProjectDialog({
  open,
  organizations,
  onClose,
  onCreated,
}) {
  const { accessToken } = useAuth();

  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgSlugTouched, setOrgSlugTouched] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const needsNewOrg = organizations.length === 0;
  const creatingNewOrg = needsNewOrg || orgId === NEW_ORG_VALUE;

  // Fresh state every time the dialog opens; default to first org.
  useEffect(() => {
    if (!open) return;
    setOrgId(organizations.length > 0 ? organizations[0]._id : "");
    setOrgName("");
    setOrgSlug("");
    setOrgSlugTouched(false);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
  }, [open, organizations]);

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

  function handleOrgNameChange(value) {
    setOrgName(value);
    if (!orgSlugTouched) setOrgSlug(slugify(value));
  }

  function validate() {
    const errors = {};
    if (creatingNewOrg) {
      const trimmedOrg = orgName.trim();
      if (!trimmedOrg) errors.orgName = "Organization name is required.";
      else if (trimmedOrg.length < 2)
        errors.orgName = "Name must be at least 2 characters.";
      if (!orgSlug) errors.orgSlug = "Organization slug is required.";
      else if (orgSlug.length < 2 || !SLUG_PATTERN.test(orgSlug))
        errors.orgSlug =
          "Slug must contain only lowercase letters, numbers, and hyphens.";
    } else if (!orgId) {
      errors.orgId = "Choose an organization.";
    }
    const trimmedName = name.trim();
    if (!trimmedName) errors.name = "Project name is required.";
    else if (trimmedName.length < 2)
      errors.name = "Name must be at least 2 characters.";
    if (!slug) errors.slug = "Slug is required.";
    else if (slug.length < 2 || !SLUG_PATTERN.test(slug))
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens.";
    return { errors, trimmedName };
  }

  // Map backend field errors to the right inputs. `prefix` is "" for
  // the project call and "org" for the organization call, so backend
  // field "slug" lands on `slug` or `orgSlug` respectively.
  function mapBackendErrors(error, prefix) {
    if (!(error instanceof ApiError)) return {};
    const key = (field) =>
      prefix ? prefix + field.charAt(0).toUpperCase() + field.slice(1) : field;
    const mapped = {};
    for (const item of error.errors || []) {
      if (["name", "slug"].includes(item.field)) {
        mapped[key(item.field)] = item.message;
      } else if (item.field === "organizationId") {
        mapped.orgId = item.message;
      }
    }
    if (error.code === "PROJECT_SLUG_TAKEN")
      mapped.slug = "This slug is already taken in the selected organization.";
    if (error.code === "ORG_SLUG_TAKEN")
      mapped.orgSlug = "This organization slug is already taken.";
    return mapped;
  }

  function friendlyMessage(error) {
    if (!(error instanceof ApiError)) return "Something went wrong.";
    if (error.status === 0) return error.message;
    if (error.status === 401)
      return "Session expired. Please sign in again.";
    if (error.status === 409) return error.message;
    if (error.status >= 500)
      return "The server had a problem. Please try again in a moment.";
    return error.message || "Could not create the project.";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const { errors, trimmedName } = validate();
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      let targetOrgId = orgId;
      if (creatingNewOrg) {
        try {
          const org = await createOrganization(accessToken, {
            name: orgName.trim(),
            slug: orgSlug,
          });
          targetOrgId = org._id;
        } catch (error) {
          setFieldErrors(mapBackendErrors(error, "org"));
          setFormError(friendlyMessage(error));
          return;
        }
      }
      const project = await createProject(accessToken, {
        organizationId: targetOrgId,
        name: trimmedName,
        slug,
      });
      onCreated?.(project);
      onClose?.();
    } catch (error) {
      setFieldErrors((prev) => ({ ...prev, ...mapBackendErrors(error, "") }));
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
      aria-labelledby="create-project-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-navy-700 bg-navy-800 p-6 shadow-xl shadow-black/40">
        <h3
          id="create-project-title"
          className="text-base font-semibold text-white"
        >
          Create project
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Projects live inside an organization and get their own keys, data,
          and files.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <Alert message={formError} />

          {!needsNewOrg && (
            <div>
              <label
                htmlFor="project-org"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Organization
              </label>
              <select
                id="project-org"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                aria-invalid={Boolean(fieldErrors.orgId)}
                className={inputClass}
              >
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
                <option value={NEW_ORG_VALUE}>＋ New organization…</option>
              </select>
              {fieldErrors.orgId && (
                <p role="alert" className="mt-1.5 text-xs text-red-400">
                  {fieldErrors.orgId}
                </p>
              )}
            </div>
          )}

          {creatingNewOrg && (
            <fieldset className="space-y-4 rounded-lg border border-navy-700 bg-navy-900/60 p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                New organization
              </legend>
              <Input
                id="org-name"
                label="Organization name"
                type="text"
                autoComplete="organization"
                placeholder="Acme Inc"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                error={fieldErrors.orgName}
              />
              <Input
                id="org-slug"
                label="Organization slug"
                type="text"
                placeholder="acme-inc"
                value={orgSlug}
                onChange={(e) => {
                  setOrgSlugTouched(true);
                  setOrgSlug(slugify(e.target.value));
                }}
                error={fieldErrors.orgSlug}
              />
            </fieldset>
          )}

          <Input
            id="project-name"
            label="Project name"
            type="text"
            autoComplete="off"
            placeholder="Customer API"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={fieldErrors.name}
          />

          <Input
            id="project-slug"
            label="Project slug"
            type="text"
            autoComplete="off"
            placeholder="customer-api"
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
              {submitting ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
