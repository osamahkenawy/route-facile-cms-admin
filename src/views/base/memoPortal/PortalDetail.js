// Memo detail with inline preview. Fetches metadata + binary blob (the /view
// endpoint requires Authorization, so we feed an object URL to the iframe).

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader } from "@mantine/core";
import {
  FaArrowLeft,
  FaDownload,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaFileAlt,
  FaEye,
} from "react-icons/fa";
import portalApi from "./portalApi";
import PortalLayout from "./PortalLayout";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) { return String(d); }
};

const OFFICE_MIMES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const PortalDetail = ({ embedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email] = useState(portalApi.getEmail());
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [blobUrl, setBlobUrl] = useState(null);
  const [mime, setMime] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [liveViewCount, setLiveViewCount] = useState(null);

  // Metadata
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setLiveViewCount(null);
    portalApi
      .getDocument(id)
      .then((r) => {
        if (!alive) return;
        const data = portalApi.unwrap(r) || r;
        setDoc(data);
      })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  // Record a view event (server dedupes per-user inside a 30-min window).
  useEffect(() => {
    if (!id || !doc) return;
    let cancelled = false;
    portalApi
      .recordView(id)
      .then((r) => {
        if (cancelled) return;
        const payload = portalApi.unwrap(r) || r;
        const next = payload?.view_count ?? payload?.viewCount;
        if (next != null) setLiveViewCount(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, doc?.id]);

  // Blob preview
  useEffect(() => {
    let alive = true;
    let toRevoke = null;
    setPreviewLoading(true);
    setPreviewError(null);
    portalApi
      .getDocumentBlob(id)
      .then(({ blob, mimeType }) => {
        if (!alive) return;
        const url = URL.createObjectURL(blob);
        toRevoke = url;
        setBlobUrl(url);
        setMime(mimeType || blob.type || "");
      })
      .catch((e) => {
        if (alive) {
          setPreviewError(
            e?.status === 404
              ? "This memo is no longer available or you no longer have access."
              : e?.message || "Failed to load file. Please try again."
          );
        }
      })
      .finally(() => { if (alive) setPreviewLoading(false); });
    return () => {
      alive = false;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    };
  }, [id]);

  const tags = useMemo(() => {
    const raw = doc?.tags;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split(",").map((t) => t.trim()).filter(Boolean);
    return [];
  }, [doc]);

  // Backend may return `version` as an object { id, version_no, file_name,
  // mime_type, file_size, uploaded_at } or as a primitive number/string.
  const versionInfo = useMemo(() => {
    const v = doc?.version;
    if (v && typeof v === "object") {
      return {
        no: v.version_no ?? v.no ?? v.number ?? null,
        fileName: v.file_name ?? v.fileName ?? null,
        size: v.file_size ?? v.fileSize ?? null,
        uploadedAt: v.uploaded_at ?? v.uploadedAt ?? null,
        mime: v.mime_type ?? v.mimeType ?? null,
      };
    }
    if (v != null) return { no: v, fileName: null, size: null, uploadedAt: null, mime: null };
    return { no: null, fileName: null, size: null, uploadedAt: null, mime: null };
  }, [doc]);

  const categoryName = useMemo(() => {
    const c = doc?.category;
    if (!c) return doc?.categoryName || "";
    if (typeof c === "string") return c;
    if (typeof c === "object") return c.name || c.title || "";
    return "";
  }, [doc]);

  const fmtSize = (b) => {
    if (b == null) return "";
    const n = Number(b);
    if (!Number.isFinite(n)) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filename =
    versionInfo.fileName ||
    (doc?.title ? `${doc.title}${extFromMime(mime)}` : `memo${extFromMime(mime)}`);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isPdf = mime === "application/pdf";
  const isImage = mime.startsWith("image/");
  const isOffice = OFFICE_MIMES.includes(mime);

  return (
    <PortalLayout embedded={embedded} email={email}>
      <button
        className="mp-btn"
        style={{ marginBottom: 12 }}
        onClick={() => navigate("/memo-portal")}
      >
        <FaArrowLeft size={11} /> All memos
      </button>

      {loading ? (
        <div className="text-center py-5">
          <Loader color="indigo" />
        </div>
      ) : error || !doc ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e4e7ee",
            borderRadius: 14,
            padding: "2.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <FaExclamationTriangle size={26} style={{ color: "#ef4444" }} />
          <h5 className="mt-2">Memo unavailable</h5>
          <p className="text-muted small mb-3">
            {error?.message || "This memo is no longer available."}
          </p>
          <button className="mp-btn mp-btn--primary" onClick={() => navigate("/memo-portal")}>
            Back to list
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mp-detail-hero">
            <h1>{doc.title}</h1>
            <div className="mp-meta">
              {categoryName && <span>📁 {categoryName}</span>}
              <span>
                <FaCalendarAlt size={10} />{" "}
                {fmtDate(
                  doc.publishedAt ||
                    doc.published_at ||
                    versionInfo.uploadedAt ||
                    doc.updatedAt
                )}
              </span>
              {versionInfo.no != null && <span>v{versionInfo.no}</span>}
              {versionInfo.fileName && <span>📄 {versionInfo.fileName}</span>}
              {versionInfo.size != null && <span>{fmtSize(versionInfo.size)}</span>}
              <span>
                <FaEye size={10} />{" "}
                {(liveViewCount ?? doc.view_count ?? doc.viewCount ?? doc.views ?? 0)} views
              </span>
              {tags.length > 0 && (
                <span>🏷 {tags.map((t) => `#${t}`).join(" ")}</span>
              )}
            </div>
            {doc.description && (
              <p style={{ marginTop: 12, marginBottom: 0, opacity: 0.92 }}>
                {doc.description}
              </p>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mb-2">
            <button
              className="mp-btn"
              disabled={!blobUrl}
              onClick={handleDownload}
            >
              <FaDownload size={11} /> Download
            </button>
          </div>

          <div className="mp-preview">
            {previewLoading ? (
              <div className="mp-preview__empty">
                <Loader color="indigo" />
                <p className="text-muted small mt-2 mb-0">Loading file…</p>
              </div>
            ) : previewError ? (
              <div className="mp-preview__empty">
                <FaExclamationTriangle size={28} style={{ color: "#ef4444" }} />
                <h5 className="mt-2">Could not load file</h5>
                <p className="text-muted small mb-0">{previewError}</p>
              </div>
            ) : !blobUrl ? (
              <div className="mp-preview__empty">
                <FaFileAlt size={28} style={{ color: "#94a3b8" }} />
                <p className="text-muted small mb-0">No file attached.</p>
              </div>
            ) : isImage ? (
              <img
                src={blobUrl}
                alt={doc.title}
                style={{ maxWidth: "100%", maxHeight: 760, margin: "0 auto", display: "block" }}
              />
            ) : isPdf ? (
              <iframe
                title={doc.title}
                src={`${blobUrl}#toolbar=1&view=FitH`}
                style={{ width: "100%", minHeight: 720, border: 0 }}
              />
            ) : isOffice ? (
              <div className="mp-preview__empty">
                <FaFileAlt size={28} style={{ color: "#4f46e5" }} />
                <h5 className="mt-2">Preview not supported</h5>
                <p className="text-muted small">
                  This file type cannot be previewed in the browser. Download it
                  to view.
                </p>
                <button className="mp-btn mp-btn--primary" onClick={handleDownload}>
                  <FaDownload size={11} /> Download file
                </button>
              </div>
            ) : (
              <iframe
                title={doc.title}
                src={blobUrl}
                style={{ width: "100%", minHeight: 720, border: 0 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </PortalLayout>
  );
};

const extFromMime = (m) => {
  const map = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  };
  return map[m] || "";
};

export default PortalDetail;
