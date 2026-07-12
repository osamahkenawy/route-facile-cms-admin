// Public Memo Portal API client.
//
// This is the *staff-facing* portal (no admin login). Auth is email + PIN.
// The token is stored under a configurable localStorage key so the public
// site and the admin shell can run side-by-side without sharing tokens.

import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError } from "../../../components/notify/notify";

const BASE = configWeb.BASE_URL; // already ends with /api/v1/
const trim = (p) => String(p || "").replace(/^\/+|\/+$/g, "");

// ---- storage key (per spec: public vs embedded use different keys) ------
const DEFAULT_KEY = "memo_portal_token";
let storageKey = DEFAULT_KEY;
export const setStorageKey = (k) => {
  storageKey = k || DEFAULT_KEY;
};
export const getStorageKey = () => storageKey;

export const getToken = () => {
  try {
    return localStorage.getItem(storageKey) || "";
  } catch (_) {
    return "";
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(storageKey, t);
    else localStorage.removeItem(storageKey);
  } catch (_) {
    /* ignore */
  }
};
export const getEmail = () => {
  try {
    return localStorage.getItem(`${storageKey}__email`) || "";
  } catch (_) {
    return "";
  }
};
export const setEmail = (e) => {
  try {
    if (e) localStorage.setItem(`${storageKey}__email`, e);
    else localStorage.removeItem(`${storageKey}__email`);
  } catch (_) {
    /* ignore */
  }
};

export const clearSession = () => {
  setToken(null);
  setEmail(null);
};

// ---- url helpers --------------------------------------------------------
export const portalUrl = (path, query) => {
  let url = BASE + "memo-portal/" + trim(path);
  if (query && typeof query === "object") {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
};

// ---- 401 handler --------------------------------------------------------
const handle401 = () => {
  clearSession();
  if (typeof window !== "undefined" && !/\/memo-portal\/login$/.test(window.location.pathname)) {
    window.location.replace("/memo-portal/login");
  }
};

// ---- core fetch wrapper -------------------------------------------------
const extractMessage = (body, fallback) => {
  if (!body) return fallback;
  const raw = body.message || body.error_message || body.error?.message || body.error;
  if (Array.isArray(raw)) return raw.join(", ");
  return raw || fallback;
};

const request = async (method, path, opts = {}) => {
  const { body, query, json = true, auth = true, expectBlob = false } = opts;
  const headers = { Accept: "application/json" };
  if (json && body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  try {
    const res = await fetch(portalUrl(path, query), {
      method,
      headers,
      body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
    if (res.status === 401) {
      handle401();
      throw new Error("Session expired");
    }
    if (expectBlob) {
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          msg = extractMessage(j, msg);
        } catch (_) { /* binary error */ }
        throw new Error(msg);
      }
      return {
        blob: await res.blob(),
        mimeType: res.headers.get("content-type") || "",
        filename: parseFilename(res.headers.get("content-disposition")),
      };
    }
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }
    if (!res.ok) {
      const msg = extractMessage(payload, `Request failed (${res.status})`);
      notifyError(msg);
      const err = new Error(msg);
      err.response = payload;
      err.status = res.status;
      throw err;
    }
    return payload;
  } catch (err) {
    if (err.message !== "Session expired" && !err.response) {
      notifyError(err.message || "Network error");
    }
    throw err;
  }
};

const parseFilename = (disp) => {
  if (!disp) return "";
  const m =
    /filename\*=UTF-8''([^;]+)/i.exec(disp) ||
    /filename="?([^";]+)"?/i.exec(disp);
  try {
    return m ? decodeURIComponent(m[1]) : "";
  } catch (_) {
    return m ? m[1] : "";
  }
};

const unwrap = (resp) => {
  if (resp == null) return null;
  if (Array.isArray(resp)) return resp;
  if (resp.data !== undefined) return resp.data;
  return resp;
};

// ---- public api ---------------------------------------------------------
const portalApi = {
  setStorageKey,
  getStorageKey,
  getToken,
  setToken,
  getEmail,
  setEmail,
  clearSession,
  unwrap,

  // Auth
  requestPin: (email) =>
    request("POST", "auth/request-pin", { body: { email }, auth: false }),
  verifyPin: (email, pin) =>
    request("POST", "auth/verify-pin", { body: { email, pin }, auth: false }),
  me: () => request("GET", "auth/me"),
  logout: () => request("POST", "auth/logout"),

  // Catalog
  listCategories: () => request("GET", "categories"),
  listDocuments: (params) => request("GET", "documents", { query: params }),
  getDocument: (id) => request("GET", `documents/${id}`),
  getDocumentBlob: (id) =>
    request("GET", `documents/${id}/view`, { expectBlob: true }),

  // View counting. Server dedupes per-user inside a 30-min window and
  // returns the up-to-date `view_count`.
  recordView: (id) => request("POST", `documents/${id}/view-event`, { body: {} }),
};

export default portalApi;
