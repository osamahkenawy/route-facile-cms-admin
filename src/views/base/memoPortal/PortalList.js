// Memo list — published memos the signed-in portal user has access to.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader } from "@mantine/core";
import {
  FaSearch,
  FaFileAlt,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaArrowRight,
  FaInbox,
  FaFolderOpen,
  FaTags,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import portalApi from "./portalApi";
import PortalLayout from "./PortalLayout";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (_) { return String(d); }
};

const dayDiff = (d) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
};

const PAGE_SIZE = 12;

// Stable color hash for category chips
const palette = [
  ["#eef2ff", "#4338ca"],
  ["#ecfeff", "#0e7490"],
  ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"],
  ["#dcfce7", "#15803d"],
  ["#ffedd5", "#c2410c"],
  ["#f3e8ff", "#7e22ce"],
];
const colorFor = (s = "") => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const PortalList = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [email] = useState(portalApi.getEmail());
  const [docs, setDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (q) params.q = q;
      if (categoryId) params.category_id = categoryId;
      const resp = await portalApi.listDocuments(params);
      const data = portalApi.unwrap(resp);
      const list = Array.isArray(data) ? data : data?.items || data?.documents || [];
      setDocs(list);
    } catch (e) {
      setError(e);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [q, categoryId, page]);

  useEffect(() => {
    portalApi
      .listCategories()
      .then((r) => {
        const data = portalApi.unwrap(r);
        const list = Array.isArray(data) ? data : data?.items || data?.categories || [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(
    () =>
      (docs || []).map((d) => {
        const v = d.version;
        const versionNo =
          v && typeof v === "object"
            ? (v.version_no ?? v.no ?? v.number ?? null)
            : (v ?? null);
        const c = d.category;
        const categoryName =
          c && typeof c === "object"
            ? (c.name || c.title || "")
            : (typeof c === "string" ? c : (d.categoryName ?? ""));
        return {
          ...d,
          id: d.id ?? d._id,
          tags: Array.isArray(d.tags)
            ? d.tags
            : typeof d.tags === "string"
              ? d.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : [],
          categoryName,
          versionNo,
          publishedAt: d.publishedAt ?? d.published_at ?? d.updatedAt ?? d.createdAt,
          viewCount: d.view_count ?? d.viewCount ?? d.views ?? 0,
        };
      }),
    [docs]
  );

  const stats = useMemo(() => {
    const newCount = items.filter((d) => {
      const dd = dayDiff(d.publishedAt);
      return dd !== null && dd <= 7;
    }).length;
    return { total: items.length, newCount, cats: categories.length };
  }, [items, categories]);

  const activeCategoryName = useMemo(() => {
    if (!categoryId) return "";
    const c = categories.find((x) => String(x.id) === String(categoryId));
    return c?.name || "";
  }, [categoryId, categories]);

  const clearFilters = () => {
    setQ("");
    setCategoryId("");
    setPage(1);
  };

  return (
    <PortalLayout embedded={embedded} email={email}>
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mp-hero"
      >
        <div className="mp-hero__bg" />
        <div className="mp-hero__content">
          <div>
            <span className="mp-hero__eyebrow">Memo Portal</span>
            <h1 className="mp-hero__title">
              Welcome{email ? `, ${email.split("@")[0].split(".")[0]}` : ""}.
              <br />
              <span>Stay in the loop.</span>
            </h1>
            <p className="mp-hero__sub">
              Browse the latest published memos, circulars and policies shared with you.
            </p>
          </div>
          <div className="mp-hero__stats">
            <div className="mp-stat">
              <div className="mp-stat__icon"><FaInbox /></div>
              <div>
                <div className="mp-stat__num">{stats.total}</div>
                <div className="mp-stat__lbl">Available</div>
              </div>
            </div>
            <div className="mp-stat">
              <div className="mp-stat__icon mp-stat__icon--accent"><FaTags /></div>
              <div>
                <div className="mp-stat__num">{stats.newCount}</div>
                <div className="mp-stat__lbl">New (7d)</div>
              </div>
            </div>
            <div className="mp-stat">
              <div className="mp-stat__icon mp-stat__icon--alt"><FaFolderOpen /></div>
              <div>
                <div className="mp-stat__num">{stats.cats}</div>
                <div className="mp-stat__lbl">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FILTER BAR */}
      <div className="mp-filters">
        <div className="mp-filters__search">
          <FaSearch className="mp-filters__searchIcon" />
          <input
            className="mp-filters__input"
            placeholder="Search title, description, tags…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
          {q && (
            <button
              className="mp-filters__clear"
              onClick={() => { setPage(1); setQ(""); }}
              title="Clear search"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
        <select
          className="mp-filters__select"
          value={categoryId}
          onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(q || categoryId) && (
          <button className="mp-filters__reset" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Active chip indicator */}
      {(q || activeCategoryName) && !loading && (
        <div className="mp-activeFilters">
          <span className="mp-activeFilters__lbl">Showing:</span>
          {activeCategoryName && (
            <span className="mp-activeFilters__chip">
              <FaFolderOpen size={10} /> {activeCategoryName}
              <button onClick={() => setCategoryId("")} aria-label="Remove category filter">×</button>
            </span>
          )}
          {q && (
            <span className="mp-activeFilters__chip">
              <FaSearch size={10} /> "{q}"
              <button onClick={() => setQ("")} aria-label="Remove search filter">×</button>
            </span>
          )}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="mp-stateBox">
          <Loader color="indigo" />
          <p className="mp-stateBox__sub">Loading memos…</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mp-stateBox mp-stateBox--error"
        >
          <div className="mp-stateBox__icon mp-stateBox__icon--error">
            <FaExclamationTriangle size={26} />
          </div>
          <h3>Could not load memos</h3>
          <p className="mp-stateBox__sub">{error.message || "Please try again."}</p>
          <button className="mp-btn mp-btn--primary" onClick={load}>Retry</button>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mp-stateBox"
        >
          <div className="mp-stateBox__icon">
            <FaFileAlt size={26} />
          </div>
          <h3>{q || categoryId ? "No memos match your filters" : "No memos available yet"}</h3>
          <p className="mp-stateBox__sub">
            {q || categoryId
              ? "Try clearing your filters or searching with different keywords."
              : "New memos will appear here as they are published to you."}
          </p>
          {(q || categoryId) && (
            <button className="mp-btn mp-btn--primary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="mp-grid">
          {items.map((d, i) => {
            const [bg, fg] = colorFor(d.categoryName || "General");
            const dd = dayDiff(d.publishedAt);
            const isNew = dd !== null && dd <= 7;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.32 }}
                whileHover={{ y: -4 }}
                className="mp-card"
                onClick={() => navigate(`/memo-portal/memos/${d.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/memo-portal/memos/${d.id}`);
                  }
                }}
              >
                <div className="mp-card__top" style={{ background: bg }}>
                  <div className="mp-card__icon" style={{ color: fg }}>
                    <FaFileAlt />
                  </div>
                  {isNew && <span className="mp-card__newBadge">NEW</span>}
                </div>
                <div className="mp-card__body">
                  {d.categoryName && (
                    <span
                      className="mp-card__category"
                      style={{ background: bg, color: fg }}
                    >
                      {d.categoryName}
                    </span>
                  )}
                  <h3 className="mp-card__title" title={d.title}>{d.title}</h3>
                  {d.description && (
                    <p className="mp-card__desc">
                      {String(d.description).slice(0, 120)}
                      {d.description.length > 120 ? "…" : ""}
                    </p>
                  )}
                  {d.tags.length > 0 && (
                    <div className="mp-card__tags">
                      {d.tags.slice(0, 3).map((t) => (
                        <span key={t} className="mp-card__tag">#{t}</span>
                      ))}
                      {d.tags.length > 3 && (
                        <span className="mp-card__tag mp-card__tag--more">
                          +{d.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mp-card__footer">
                    <span className="mp-card__date">
                      <FaCalendarAlt size={10} /> {fmtDate(d.publishedAt)}
                      {d.versionNo != null && <span className="mp-card__version">· v{d.versionNo}</span>}
                      <span className="mp-card__version"><FaEye size={10} /> {d.viewCount}</span>
                    </span>
                    <span className="mp-card__cta">
                      Open <FaArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && !error && items.length >= PAGE_SIZE && (
        <div className="mp-pagination">
          <button
            className="mp-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="mp-pagination__info">Page {page}</span>
          <button className="mp-btn" onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalList;
