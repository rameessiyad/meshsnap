import axios from "axios";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const CSRF_STORAGE_KEY = "meshsnap_csrf_token";
const SAFE_METHODS = new Set(["get", "head", "options"]);

const NETWORK_MESSAGE =
  "Unable to reach MeshSnap. Check your connection and try again.";
const GENERIC_MESSAGE =
  "We couldn’t complete your request. Please check your details and try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/* ---------------------------- CSRF token store ---------------------------- */

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof window === "undefined") return null;

  try {
    csrfToken = window.sessionStorage.getItem(CSRF_STORAGE_KEY);
  } catch {
    csrfToken = null;
  }
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
  if (typeof window === "undefined") return;

  try {
    if (token) {
      window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked (private mode); the in-memory copy still works.
  }
}

/* -------------------------------- ApiError -------------------------------- */

export class ApiError extends Error {
  readonly status: number | null;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    options: { status: number | null; fieldErrors?: Record<string, string> },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

function errorFromResponse(status: number, data: unknown): ApiError {
  if (isRecord(data) && typeof data.detail === "string") {
    return new ApiError(data.detail, { status });
  }

  // FastAPI validation errors (422): detail is a list of { loc, msg }.
  if (isRecord(data) && Array.isArray(data.detail)) {
    const messages: string[] = [];
    const fieldErrors: Record<string, string> = {};

    for (const item of data.detail) {
      if (!isRecord(item) || typeof item.msg !== "string") continue;

      messages.push(item.msg);

      const loc = Array.isArray(item.loc) ? item.loc : [];
      const field = loc[loc.length - 1];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field] = item.msg;
      }
    }

    if (messages.length > 0) {
      return new ApiError(messages.join(" "), { status, fieldErrors });
    }
  }

  if (status === 401) {
    return new ApiError("Please sign in to continue.", { status });
  }

  return new ApiError(GENERIC_MESSAGE, { status });
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(NETWORK_MESSAGE, { status: null });
    }
    return errorFromResponse(error.response.status, error.response.data);
  }

  return new ApiError(GENERIC_MESSAGE, { status: null });
}

/* ------------------------------- Axios client ------------------------------ */

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Add the CSRF header to every state-changing request.
apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();

  if (!SAFE_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers.set("X-CSRF-Token", token);
    }
  }

  return config;
});

// Every failure reaches the rest of the app as an ApiError.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);