// API-backed store for the Memo Portal. Tiny pub/sub cache + async actions
// that call memoApi and re-fetch on success. No mock data here.

import { useEffect, useState, useCallback } from "react";
import memoApi from "./memoApi";

// ---------- Response unwrap ----------
// Backend convention: { success, data, message }. Some endpoints return the
// payload directly, so we fall back to the raw response.
const unwrap = (resp) => {
  if (resp == null) return null;
  if (Array.isArray(resp)) return resp;
  if (resp.data !== undefined) return resp.data;
  return resp;
};

// ---------- Shape normalizers ----------
// Backend may return tags as CSV string, id as _id/documentId, etc.
const toTagsArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string") {
    return raw.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

const normalizeDocument = (d) => {
  if (!d || typeof d !== "object") return d;
  return {
    ...d,
    id: d.id ?? d._id ?? d.documentId ?? d.uuid ?? d.slug,
    tags: toTagsArray(d.tags),
    category: d.category?.name ?? d.categoryName ?? d.category ?? "",
    version: d.version ?? d.currentVersion ?? d.latestVersion ?? 1,
    views: d.view_count ?? d.views ?? d.viewCount ?? 0,
    publishedAt: d.publishedAt ?? d.published_at ?? d.updatedAt ?? d.createdAt,
    uploadedBy: d.uploadedBy ?? d.createdBy?.name ?? d.createdByName ?? d.author ?? "—",
    fileUrl:
      d.fileUrl ??
      d.file_url ??
      d.url ??
      d.filePath ??
      d.file?.url ??
      d.file?.path ??
      d.attachment?.url ??
      d.document?.url ??
      d.currentVersion?.fileUrl ??
      d.currentVersion?.url ??
      d.latestVersion?.fileUrl ??
      d.latestVersion?.url ??
      null,
    fileName:
      d.fileName ??
      d.file_name ??
      d.file?.name ??
      d.attachment?.name ??
      null,
    mimeType:
      d.mimeType ??
      d.mime_type ??
      d.file?.mimeType ??
      d.file?.type ??
      null,
  };
};

const normalizeDocumentList = (arr) =>
  Array.isArray(arr) ? arr.map(normalizeDocument) : [];

// Backend stores category status as 1 (active) / 0 (inactive). Normalize to
// the string form the UI uses everywhere.
const toCategoryStatus = (raw) => {
  if (raw === 1 || raw === "1" || raw === true || raw === "active") return "active";
  if (raw === 0 || raw === "0" || raw === false || raw === "inactive") return "inactive";
  return raw || "inactive";
};

const normalizeCategory = (c) => {
  if (!c || typeof c !== "object") return c;
  return {
    ...c,
    id: c.id ?? c._id ?? c.categoryId,
    status: toCategoryStatus(c.status ?? c.is_active),
    docs: c.docs ?? c.documentsCount ?? c.documents_count ?? 0,
    createdAt: c.createdAt ?? c.created_at,
  };
};

const normalizeCategoryList = (arr) =>
  Array.isArray(arr) ? arr.map(normalizeCategory) : [];

// ---------- Documents cache ----------
let docs = [];
let docsLoaded = false;
let docsLoading = null; // in-flight promise
const docListeners = new Set();
const emitDocs = () => docListeners.forEach((fn) => fn(docs));

export const subscribeDocuments = (fn) => {
  docListeners.add(fn);
  return () => docListeners.delete(fn);
};

export const fetchDocuments = async (params) => {
  if (docsLoading) return docsLoading;
  docsLoading = (async () => {
    try {
      const resp = await memoApi.listDocuments(params);
      const data = unwrap(resp);
      const raw = Array.isArray(data) ? data : data?.items || data?.documents || [];
      docs = normalizeDocumentList(raw);
      docsLoaded = true;
      emitDocs();
      return docs;
    } finally {
      docsLoading = null;
    }
  })();
  return docsLoading;
};

export const useDocuments = (params) => {
  const [list, setList] = useState(docs);
  const [loading, setLoading] = useState(!docsLoaded);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchDocuments(params)
      .then(setList)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params || {})]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const off = subscribeDocuments(setList);
    reload();
    return off;
  }, [reload]);

  return { documents: list, loading, error, reload };
};

export const useDocument = (id) => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    if (!id) return Promise.resolve(null);
    setLoading(true);
    setError(null);
    return memoApi
      .getDocument(id)
      .then((resp) => {
        const data = normalizeDocument(unwrap(resp));
        setDoc(data);
        return data;
      })
      .catch((e) => {
        setError(e);
        setDoc(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  return { document: doc, loading, error, reload };
};

// Mutating actions - update the API, then the local cache, then notify.
const replaceInCache = (id, patch) => {
  docs = docs.map((d) =>
    String(d.id) === String(id) ? { ...d, ...patch } : d
  );
  emitDocs();
};
const removeFromCache = (id) => {
  docs = docs.filter((d) => String(d.id) !== String(id));
  emitDocs();
};
const prependToCache = (doc) => {
  if (!doc) return;
  docs = [doc, ...docs];
  emitDocs();
};

export const addDocument = async (body) => {
  const resp = await memoApi.createDocument(body);
  const created = normalizeDocument(unwrap(resp));
  prependToCache(created);
  return created;
};

export const updateDocument = async (id, patch) => {
  const resp = await memoApi.updateDocument(id, patch);
  const updated = normalizeDocument(unwrap(resp)) || patch;
  replaceInCache(id, updated);
  return updated;
};

export const deleteDocument = async (id) => {
  await memoApi.deleteDocument(id);
  removeFromCache(id);
};

export const publishDocument = async (id) => {
  const resp = await memoApi.publishDocument(id);
  const updated = unwrap(resp) || { status: "published", publishedAt: new Date().toISOString() };
  replaceInCache(id, updated);
  return updated;
};

export const archiveDocument = async (id) => {
  const resp = await memoApi.archiveDocument(id);
  const updated = unwrap(resp) || { status: "archived" };
  replaceInCache(id, updated);
  return updated;
};

export const uploadDocumentFile = async (id, file, changeNotes) => {
  const resp = await memoApi.uploadDocumentFile(id, file, changeNotes);
  const updated = normalizeDocument(unwrap(resp));
  if (updated) replaceInCache(id, updated);
  return updated;
};

// ---------- Categories ----------
export const fetchCategories = async (params) => {
  const resp = await memoApi.listCategories(params);
  const data = unwrap(resp);
  const raw = Array.isArray(data) ? data : data?.items || data?.categories || [];
  return normalizeCategoryList(raw);
};

export const fetchActiveCategories = async () => {
  const resp = await memoApi.listActiveCategories();
  const data = unwrap(resp);
  const raw = Array.isArray(data) ? data : data?.items || data?.categories || [];
  return normalizeCategoryList(raw);
};

export const useCategories = (params) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchCategories(params)
      .then(setItems)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params || {})]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);

  return { categories: items, loading, error, reload };
};

// ---------- Versions / Audit ----------
export const fetchVersions = async (id) => {
  const resp = await memoApi.listVersions(id);
  const data = unwrap(resp);
  return Array.isArray(data) ? data : data?.items || data?.versions || [];
};

// Audit/activity events come back from several endpoints with inconsistent
// field names (snake_case from the API, camelCase from older mock data).
// Normalize them here so the UI can rely on a single shape.
const normalizeAuditEvent = (e, idx = 0) => {
  if (!e || typeof e !== "object") return e;
  const at =
    e.at ??
    e.created_at ??
    e.createdAt ??
    e.occurred_at ??
    e.occurredAt ??
    e.timestamp ??
    e.time ??
    null;
  const actor =
    e.actor ??
    e.actor_name ??
    e.actorName ??
    e.user_name ??
    e.userName ??
    e.user?.name ??
    e.user?.full_name ??
    e.user?.email ??
    e.created_by_name ??
    e.created_by?.name ??
    (e.actor_id || e.user_id ? "System user" : "System");
  const entity =
    e.entity ??
    e.entity_label ??
    e.entityLabel ??
    e.target_label ??
    e.targetLabel ??
    e.target_title ??
    e.target?.title ??
    e.document?.title ??
    e.document_title ??
    e.documentTitle ??
    (e.target_type && e.target_id ? `${e.target_type} #${e.target_id}` : "—");
  const action = e.action ?? e.event ?? e.type ?? "";
  return {
    ...e,
    id: e.id ?? e._id ?? e.event_id ?? `${at || "x"}-${idx}`,
    actor,
    action,
    entity,
    at,
  };
};

const normalizeAuditList = (arr) =>
  Array.isArray(arr) ? arr.map((e, i) => normalizeAuditEvent(e, i)) : [];

export const fetchDocumentAudit = async (id, params) => {
  const resp = await memoApi.getDocumentAudit(id, params);
  const data = unwrap(resp);
  const list = Array.isArray(data) ? data : data?.items || data?.events || [];
  return normalizeAuditList(list);
};

// ---------- Dashboard ----------
export const fetchDashboardStats = async () => unwrap(await memoApi.getDashboardStats());
export const fetchTopDocuments = async () => {
  const resp = await memoApi.getTopDocuments();
  const data = unwrap(resp);
  return Array.isArray(data) ? data : data?.items || [];
};
export const fetchRecentActivity = async (params) => {
  const resp = await memoApi.getRecentActivity(params);
  const data = unwrap(resp);
  const list = Array.isArray(data) ? data : data?.items || data?.events || [];
  return normalizeAuditList(list);
};

export { unwrap };
