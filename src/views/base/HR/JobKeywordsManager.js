import React, { useEffect, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { FaKey, FaPlus, FaTimes } from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePostCallAuth,
} from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";

export const KEYWORD_TYPES = [
  { value: "must_have", label: "Must Have", bg: "#dcfce7", text: "#166534" },
  { value: "optional", label: "Optional", bg: "#dbeafe", text: "#1e40af" },
  { value: "exclude", label: "Exclude", bg: "#fee2e2", text: "#991b1b" },
];

export const KEYWORD_META = KEYWORD_TYPES.reduce((acc, t) => {
  acc[t.value] = t;
  return acc;
}, {});

const PLACEHOLDER = "Add a keyword (e.g. ReactJS, Node.js, English)";

/**
 * Reusable AI Keywords manager for a job.
 *
 * Modes:
 *  - jobId provided     -> live mode: GET on mount, POST/DELETE immediately.
 *  - jobId omitted      -> staged mode: keywords kept in local state and
 *                          exposed via onChange so the parent can persist
 *                          them after creating the job.
 */
const JobKeywordsManager = ({
  jobId = null,
  initialKeywords = null,
  onChange,
  showHeader = true,
  description,
  className = "",
  style,
}) => {
  const live = Boolean(jobId);

  const [keywords, setKeywords] = useState(initialKeywords || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    keyword: "",
    keyword_type: "must_have",
    weight: 1,
  });

  useEffect(() => {
    if (!live) return;
    setLoading(true);
    simpleGetCallAuth(`${configWeb.GET_RECRUITING_KEYWORD_LIST}?career_job_id=${jobId}&page=1&page_size=9999`)
      .then((res) => setKeywords(res?.data || []))
      .catch(() => setKeywords([]))
      .finally(() => setLoading(false));
  }, [jobId, live]);

  useEffect(() => {
    if (!live && typeof onChange === "function") onChange(keywords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords]);

  const addKeyword = () => {
    const keyword = (draft.keyword || "").trim();
    if (!keyword) {
      notifyError("Please enter a keyword");
      return;
    }
    const rawWeight = Number(draft.weight);
    if (!Number.isFinite(rawWeight) || rawWeight < 1 || rawWeight > 10) {
      notifyError("Weight must be between 1 and 10");
      return;
    }
    const weight = Math.round(rawWeight);

    if (!live) {
      setKeywords((prev) => [
        ...prev,
        {
          _localId: Date.now() + Math.random(),
          keyword,
          keyword_type: draft.keyword_type,
          weight,
          status: 1,
        },
      ]);
      setDraft({ keyword: "", keyword_type: draft.keyword_type, weight: 1 });
      return;
    }

    setSaving(true);
    const payload = {
      career_job_id: Number(jobId),
      keyword,
      keyword_type: draft.keyword_type,
      weight,
      status: 1,
    };
    simplePostCallAuth(configWeb.POST_RECRUITING_KEYWORD_CREATE, JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          const created = res?.data || res;
          setKeywords((prev) => [...prev, created?.id ? created : { ...payload, id: Date.now() }]);
          setDraft({ keyword: "", keyword_type: draft.keyword_type, weight: 1 });
          notifySuccess("Keyword added");
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to add keyword");
        }
      })
      .catch(() => notifyError("Failed to add keyword"))
      .finally(() => setSaving(false));
  };

  const removeKeyword = (kw) => {
    if (kw._localId) {
      setKeywords((prev) => prev.filter((k) => k._localId !== kw._localId));
      return;
    }
    if (!kw.id) return;
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_KEYWORD(kw.id))
      .then((res) => {
        if (!res?.error) {
          setKeywords((prev) => prev.filter((k) => k.id !== kw.id));
          notifySuccess("Keyword removed");
        } else {
          notifyError("Failed to remove keyword");
        }
      })
      .catch(() => notifyError("Failed to remove keyword"));
  };

  return (
    <div className={className} style={style}>
      {showHeader && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <h6 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
              <FaKey size={14} style={{ color: "#228be6" }} /> AI Screening Keywords
            </h6>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {keywords.length} keyword{keywords.length === 1 ? "" : "s"}
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 14 }}>
            {description ||
              (live
                ? "Add weighted keywords used to auto-score candidate CVs and applications."
                : "Add weighted keywords used to auto-score candidate CVs and applications. Keywords will be saved when you publish the job.")}
          </p>
        </>
      )}

      <Row className="g-2 align-items-end">
        <Col md={5}>
          <Form.Label className="fw-semibold" style={{ fontSize: "0.78rem", color: "#475569" }}>Keyword</Form.Label>
          <Form.Control
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder={PLACEHOLDER}
            style={{ borderRadius: 10 }}
          />
        </Col>
        <Col md={3}>
          <Form.Label className="fw-semibold" style={{ fontSize: "0.78rem", color: "#475569" }}>Type</Form.Label>
          <Form.Select
            value={draft.keyword_type}
            onChange={(e) => setDraft({ ...draft, keyword_type: e.target.value })}
            style={{ borderRadius: 10 }}
          >
            {KEYWORD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label className="fw-semibold" style={{ fontSize: "0.78rem", color: "#475569" }}>Weight</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="10"
            value={draft.weight}
            onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
            style={{ borderRadius: 10 }}
          />
        </Col>
        <Col md={2}>
          <motion.button
            type="button"
            className="btn w-100"
            style={{ background: "#0a1733", color: "#fff", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: "0.85rem", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onClick={addKeyword}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {saving ? <Spinner size="sm" /> : <><FaPlus size={11} /> Add</>}
          </motion.button>
        </Col>
      </Row>

      <div className="mt-3">
        {loading ? (
          <div className="d-flex justify-content-center py-3"><Spinner size="sm" /></div>
        ) : keywords.length === 0 ? (
          <div style={{ padding: "18px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", border: "1px dashed #e2e8f0", borderRadius: 10 }}>
            No keywords added yet.
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            <AnimatePresence>
              {keywords.map((kw) => {
                const meta = KEYWORD_META[kw.keyword_type] || KEYWORD_META.optional;
                const key = kw.id || kw._localId;
                return (
                  <motion.span
                    key={key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px 6px 12px",
                      borderRadius: 999,
                      background: meta.bg,
                      color: meta.text,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{kw.keyword}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>
                      {meta.label} · w{kw.weight ?? 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      title="Remove"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "none",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: meta.text,
                        cursor: "pointer",
                      }}
                    >
                      <FaTimes size={9} />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobKeywordsManager;
