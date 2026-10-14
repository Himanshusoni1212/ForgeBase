// Centralized fetch wrapper for all ForgeBase backend requests.
//
// Why this file exists:
// - Keeps the backend base URL in one place (VITE_API_BASE_URL).
// - Sends JSON headers and serializes request bodies.
// - Parses responses safely (handles empty / non-JSON bodies).
// - Normalizes HTTP errors and network failures into ApiError.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor({ message, status = 0, code = null, errors = [] }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function backendUnavailable() {
  return new ApiError({
    message:
      "Cannot reach the ForgeBase backend. Make sure it is running (npm run dev in the repo root) and VITE_API_BASE_URL is correct.",
    status: 0,
    code: "NETWORK_ERROR",
  });
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { success: response.ok, message: text.slice(0, 300) };
  }
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;

  const requestHeaders = { ...headers };
  let requestBody;

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch {
    throw backendUnavailable();
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError({
      message:
        (payload && payload.message) || `Request failed (${response.status})`,
      status: response.status,
      code: (payload && payload.code) || null,
      errors: (payload && payload.errors) || [],
    });
  }

  return payload;
}

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "POST", body });
}

export function apiPatch(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "PATCH", body });
}

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export { API_BASE_URL };
