// Memo Portal API client
// Wraps the existing fetch helpers in src/components/config.js/Setup.js so all
// requests go to /api/v1/admin/memo with the admin JWT attached, and routes
// every error through the central toast / 401 handler.
//
// Endpoints expected (per BRD section 1):
//   GET    /admin/memo/dashboard/stats
//   GET    /admin/memo/dashboard/top-documents
//   GET    /admin/memo/dashboard/recent-activity
//   GET    /admin/memo/categories                (+ ?status, ?q, ?page)
//   GET    /admin/memo/categories/active
//   POST   /admin/memo/categories
//   PUT    /admin/memo/categories/:id
//   DELETE /admin/memo/categories/:id
//   GET    /admin/memo/documents
//   POST   /admin/memo/documents
//   GET    /admin/memo/documents/:id
//   PUT    /admin/memo/documents/:id
//   DELETE /admin/memo/documents/:id
//   POST   /admin/memo/documents/:id/upload      (multipart)
//   PATCH  /admin/memo/documents/:id/publish
//   PATCH  /admin/memo/documents/:id/archive
//   POST   /admin/memo/documents/:id/access
//   DELETE /admin/memo/documents/:id/access/:entryId
//   GET    /admin/memo/documents/:id/versions
//   PATCH  /admin/memo/documents/:id/versions/:versionId/set-current
//   GET    /admin/memo/documents/:id/audit
//   GET    /admin/memo/users/lookup?q=
//   GET    /admin/memo/portal-users/lookup?q=

import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
  simplePatchCallAuth,
  simpleDeleteCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";

// ---------- Feature flag ----------
export const MEMO_PORTAL_ENABLED =
  String(process.env.REACT_APP_ENABLE_MEMO_PORTAL || "").toLowerCase() ===
  "true";

// ---------- URL builder ----------
// configWeb.MEMO_BASE already ends with a trailing slash, e.g.:
//   https://api.example.com/api/v1/admin/memo/
const trimSlashes = (path) => String(path || "").replace(/^\/+|\/+$/g, "");
const resolveMemoBase = () => {
  const base = configWeb.MEMO_BASE;
  if (!base || typeof base !== "string") {
    // Defensive: fall back to `${BASE_URL}admin/memo/` so we never request
    // `undefineddocuments` and silently get the SPA's index.html back.
    const fallback = `${configWeb.BASE_URL || ""}admin/memo/`;
    // eslint-disable-next-line no-console
    console.error(
      "[memoApi] configWeb.MEMO_BASE is missing; falling back to",
      fallback
    );
    return fallback;
  }
  return base.endsWith("/") ? base : `${base}/`;
};
export const memoUrl = (path = "", query) => {
  let url = resolveMemoBase() + trimSlashes(path);
  if (query && typeof query === "object") {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
      else params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
};

// ---------- Centralized response handling ----------
// The simple*CallAuth helpers parse the response body and return the JSON
// payload. On 401 we clear the session and bounce to /login so the user is
// not stuck on a broken page. All other errors surface a toast and re-throw
// so callers can render their own empty / error states if desired.
const handle401 = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("trasealla_user_role");
    localStorage.removeItem("trasealla_must_reset_password");
  } catch (_) {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

const isUnauthorized = (resp) => {
  if (!resp || typeof resp !== "object") return false;
  if (resp.status === 401 || resp.statusCode === 401) return true;
  if (resp.error && (resp.error.status === 401 || resp.error.code === 401))
    return true;
  return false;
};

const isErrorResponse = (resp) => {
  if (!resp || typeof resp !== "object") return false;
  if (resp.success === false) return true;
  // Nest.js / Express style errors: { statusCode, message, error }
  if (typeof resp.statusCode === "number" && (resp.statusCode < 200 || resp.statusCode >= 300))
    return true;
  if (typeof resp.status === "number" && (resp.status < 200 || resp.status >= 300))
    return true;
  return false;
};

const extractMessage = (resp, fallback) => {
  if (!resp) return fallback;
  const raw = resp.message || resp.error_message || resp.error?.message || resp.error;
  if (Array.isArray(raw)) return raw.join(", ");
  return raw || fallback;
};

// JSON.parse("<!doctype html>...") throws "Unexpected token '<', '<!doctype'
// is not valid JSON". That happens when the API host returns the SPA's
// index.html (route missing / proxy misrouted). Translate those into a
// caller-friendly message so toasts and page errors are intelligible.
const isHtmlParseError = (err) => {
  const m = String(err?.message || err || "");
  return (
    m.includes("is not valid JSON") ||
    m.includes("Unexpected token '<'") ||
    m.includes("<!doctype") ||
    m.includes("<!DOCTYPE")
  );
};

// Light per-message dedupe so a dashboard load that fans out to 4 endpoints
// doesn't fire 4 identical error toasts.
const recentToasts = new Map();
const notifyOnce = (msg) => {
  if (!msg) return;
  const now = Date.now();
  const last = recentToasts.get(msg);
  if (last && now - last < 4000) return;
  recentToasts.set(msg, now);
  notifyError(msg);
};

const wrap = async (promise, { successMessage, errorMessage } = {}) => {
  try {
    const resp = await promise;
    if (isUnauthorized(resp)) {
      handle401();
      throw new Error("Session expired");
    }
    if (isErrorResponse(resp)) {
      const msg = extractMessage(resp, errorMessage || "Request failed");
      notifyOnce(msg);
      const err = new Error(msg);
      err.response = resp;
      throw err;
    }
    return resp;
  } catch (err) {
    if (err && err.message !== "Session expired" && !err.response) {
      const friendly = isHtmlParseError(err)
        ? "Memo API is unreachable (server returned HTML). Please check the backend."
        : errorMessage || err.message || "Network error";
      if (isHtmlParseError(err)) err.message = friendly;
      notifyOnce(friendly);
    }
    throw err;
  }
};

// ---------- Verb helpers ----------
const get = (path, query, opts) => wrap(simpleGetCallAuth(memoUrl(path, query)), opts);
const post = (path, body, opts) =>
  wrap(simplePostCallAuth(memoUrl(path), JSON.stringify(body || {})), opts);
const put = (path, body, opts) =>
  wrap(simplePutCallAuth(memoUrl(path), JSON.stringify(body || {})), opts);
const patch = (path, body, opts) =>
  wrap(simplePatchCallAuth(memoUrl(path), JSON.stringify(body || {})), opts);
const del = (path, opts) => wrap(simpleDeleteCallAuth(memoUrl(path)), opts);

// ---------- Public endpoint surface ----------
const memoApi = {
  enabled: MEMO_PORTAL_ENABLED,
  url: memoUrl,

  // Dashboard
  getDashboardStats: () => get("dashboard/stats"),
  getTopDocuments: () => get("dashboard/top-documents"),
  getRecentActivity: (params) => get("dashboard/recent-activity", params),

  // Categories
  listCategories: (params) => get("categories", params),
  listActiveCategories: () => get("categories/active"),
  createCategory: (body) => post("categories", body),
  updateCategory: (id, body) => put(`categories/${id}`, body),
  deleteCategory: (id) => del(`categories/${id}`),

  // Documents
  listDocuments: (params) => get("documents", params),
  getDocument: (id) => get(`documents/${id}`),
  createDocument: (body) => post("documents", body),
  updateDocument: (id, body) => put(`documents/${id}`, body),
  deleteDocument: (id) => del(`documents/${id}`),
  publishDocument: (id) => patch(`documents/${id}/publish`),
  archiveDocument: (id) => patch(`documents/${id}/archive`),

  // Versions
  listVersions: (id) => get(`documents/${id}/versions`),
  setCurrentVersion: (id, versionId) =>
    patch(`documents/${id}/versions/${versionId}/set-current`),

  // Multipart file upload (POST /documents/:id/upload)
  // file: File | Blob, changeNotes: string
  uploadDocumentFile: async (id, file, changeNotes) => {
    if (!file) throw new Error("No file selected");
    const fd = new FormData();
    fd.append("file", file);
    if (changeNotes) fd.append("change_notes", changeNotes);

    let access_token = "";
    try {
      const raw = localStorage.getItem("token");
      if (raw) access_token = (JSON.parse(raw) || {}).access_token || "";
    } catch (_) { /* ignore */ }

    const url = memoUrl(`documents/${id}/upload`);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
        "x-api-key": process.env.REACT_APP_API_KEY,
      },
      body: fd,
    });
    let json = null;
    try { json = await res.json(); } catch (_) { json = null; }
    if (res.status === 401) {
      handle401();
      throw new Error("Session expired");
    }
    if (!res.ok || isErrorResponse(json)) {
      const msg = extractMessage(json, `Upload failed (${res.status})`);
      notifyError(msg);
      const err = new Error(msg);
      err.response = json;
      throw err;
    }
    return json;
  },

  // Inline file viewer. The backend exposes the raw file at:
  //   GET {BASE_URL}memo/documents/:id/view  (admin token)
  // It requires an Authorization header, so iframes cannot point at it
  // directly. Use fetchDocumentBlob() to get a blob URL for previews.
  viewDocumentUrl: (id) =>
    `${configWeb.BASE_URL}memo/documents/${id}/view`,

  fetchDocumentBlob: async (id) => {
    let access_token = "";
    try {
      const raw = localStorage.getItem("token");
      if (raw) access_token = (JSON.parse(raw) || {}).access_token || "";
    } catch (_) { /* ignore */ }

    const res = await fetch(`${configWeb.BASE_URL}memo/documents/${id}/view`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "x-api-key": process.env.REACT_APP_API_KEY,
      },
    });
    if (res.status === 401) {
      handle401();
      throw new Error("Session expired");
    }
    if (!res.ok) {
      let msg = `Could not load file (${res.status})`;
      try {
        const j = await res.json();
        msg = extractMessage(j, msg);
      } catch (_) { /* ignore */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    return {
      blob,
      url: URL.createObjectURL(blob),
      mimeType: blob.type || res.headers.get("content-type") || "",
    };
  },

  // Access
  setAccess: (id, entries) => post(`documents/${id}/access`, { entries }),
  revokeAccess: (id, entryId) => del(`documents/${id}/access/${entryId}`),

  // Audit
  getDocumentAudit: (id, params) => get(`documents/${id}/audit`, params),

  // Lookups (used by AccessPicker)
  lookupAdminUsers: (q) => get("users/lookup", { q }),
  lookupPortalUsers: (q) => get("portal-users/lookup", { q }),

  // View counting. Server dedupes per-user inside a 30-min window and
  // returns the up-to-date `view_count`.
  recordView: (id) => post(`documents/${id}/view-event`, {}),
};

export default memoApi;
