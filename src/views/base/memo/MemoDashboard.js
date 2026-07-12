import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaFileAlt,
  FaUsers,
  FaEye,
  FaUserCheck,
  FaArrowRight,
  FaCircle,
  FaPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import StatusBadge from "./StatusBadge";
import { ACTION_LABELS, formatDate, timeAgo } from "./memoMockData";
import {
  useDocuments,
  fetchDashboardStats,
  fetchTopDocuments,
  fetchRecentActivity,
} from "./memoStore";
import CreateMemoModal from "./CreateMemoModal";
import "./memo.css";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const KpiCard = ({ index, variant, label, value, hint, hintColor, icon }) => (
  <motion.div
    custom={index}
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    className={`memo-kpi memo-kpi--${variant}`}
  >
    <div className="memo-kpi__bg" />
    <div className="memo-kpi__icon">{icon}</div>
    <p className="memo-kpi__label">{label}</p>
    <p className="memo-kpi__value">{value}</p>
    <p className="memo-kpi__hint" style={hintColor ? { color: hintColor } : undefined}>{hint}</p>
  </motion.div>
);

const MemoDashboard = () => {
  const { documents, loading: docsLoading, error: docsError, reload } = useDocuments();
  const [createOpen, createH] = useDisclosure(false);

  const [serverStats, setServerStats] = useState(null);
  const [topDocs, setTopDocs] = useState(null);
  const [activity, setActivity] = useState(null);
  const [bgLoading, setBgLoading] = useState(true);
  const [bgError, setBgError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setBgLoading(true);
    setBgError(null);
    Promise.all([
      fetchDashboardStats().catch(() => null),
      fetchTopDocuments().catch(() => null),
      fetchRecentActivity({ limit: 6 }).catch(() => null),
    ])
      .then(([s, t, a]) => {
        if (cancelled) return;
        setServerStats(s);
        setTopDocs(t);
        setActivity(a);
      })
      .finally(() => !cancelled && setBgLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Derive from documents list as a fallback when the dashboard endpoints
  // haven't been provisioned yet.
  const fallback = useMemo(() => {
    const list = documents || [];
    const total = list.length;
    const published = list.filter((d) => d.status === "published").length;
    const draft = list.filter((d) => d.status === "draft").length;
    const archived = list.filter((d) => d.status === "archived").length;
    const recentlyPublished = [...list]
      .filter((d) => d.status === "published")
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 5);
    const top = [...list]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 6);
    return { total, published, draft, archived, recentlyPublished, top };
  }, [documents]);

  const stats = {
    total: serverStats?.totalDocuments ?? fallback.total,
    published: serverStats?.published ?? fallback.published,
    draft: serverStats?.draft ?? fallback.draft,
    archived: serverStats?.archived ?? fallback.archived,
    adminUsers: serverStats?.totalAdminUsers ?? null,
    adminRoles: serverStats?.totalRoles ?? null,
    viewsToday:
      serverStats?.viewsToday ?? serverStats?.views_today ?? null,
    viewsYesterday:
      serverStats?.viewsYesterday ?? serverStats?.views_yesterday ?? null,
    viewsTrend:
      serverStats?.viewsTrend ?? serverStats?.views_trend ?? null,
    viewsTrendPct:
      serverStats?.viewsTrendPct ?? serverStats?.views_trend_pct ?? null,
    activeUsers30d: serverStats?.activeUsers30d ?? null,
    activeUsersPct: serverStats?.activeUsersPct ?? null,
    recentlyPublished: fallback.recentlyPublished,
    topViewed: (topDocs && topDocs.length ? topDocs : fallback.top),
  };
  stats.maxViews = Math.max(...stats.topViewed.map((d) => d.views || 0), 1);

  const recentActivity = activity && activity.length ? activity : [];
  const loading = docsLoading || bgLoading;
  const error = docsError && !documents?.length ? docsError : bgError;

  return (
    <div className="memo-page">
      <div className="memo-page__header">
        <div>
          <h1 className="memo-page__title">Memo Portal Dashboard</h1>
          <p className="memo-page__subtitle">
            Today is {formatDate(new Date().toISOString())}. Here's how things are going.
          </p>
        </div>
        <button onClick={createH.open} className="memo-pillbtn memo-pillbtn--primary">
          <FaPlus size={11} /> New Memo
        </button>
      </div>

      {loading && (
        <div className="memo-card text-center py-5">
          <Loader color="indigo" />
          <p className="text-muted small mt-2 mb-0">Loading dashboard…</p>
        </div>
      )}

      {!loading && error && (
        <div className="memo-card memo-empty">
          <div className="memo-empty__icon" style={{ color: "var(--memo-danger)" }}>
            <FaExclamationTriangle />
          </div>
          <h5>Could not load dashboard</h5>
          <p className="mb-3">{error.message || "Please try again."}</p>
          <button className="memo-pillbtn memo-pillbtn--primary" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
      <>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            index={0}
            variant="1"
            label="Total Documents"
            value={stats.total}
            hint={`${stats.published} published · ${stats.draft} draft · ${stats.archived} archived`}
            icon={<FaFileAlt />}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            index={1}
            variant="2"
            label="Total Admin Users"
            value={stats.adminUsers ?? "—"}
            hint={stats.adminRoles ? `${stats.adminRoles} roles across the org` : "Awaiting backend stats"}
            icon={<FaUsers />}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            index={2}
            variant="3"
            label="Views Today"
            value={stats.viewsToday ?? "—"}
            hint={stats.viewsTrend ?? "—"}
            hintColor={
              stats.viewsTrendPct == null
                ? undefined
                : Number(stats.viewsTrendPct) >= 0
                  ? "#16a34a"
                  : "#dc2626"
            }
            icon={<FaEye />}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            index={3}
            variant="4"
            label="Active Users · 30d"
            value={stats.activeUsers30d ?? "—"}
            hint={stats.activeUsersPct != null ? `${stats.activeUsersPct}% of admin users` : "—"}
            icon={<FaUserCheck />}
          />
        </div>
      </div>

      <div className="row g-3">
        {/* Recently Published */}
        <div className="col-12 col-xl-5">
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="memo-card"
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="memo-card__title">Recently Published</h3>
                <p className="memo-card__subtitle mb-0">Last 5 memos pushed live</p>
              </div>
              <Link to="/memo/documents" className="memo-pillbtn">
                View all <FaArrowRight size={11} />
              </Link>
            </div>

            <ul className="list-unstyled m-0">
              {stats.recentlyPublished.length === 0 && (
                <li className="text-muted small py-3">No published memos yet.</li>
              )}
              {stats.recentlyPublished.map((d, i) => (
                <motion.li
                  key={d.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="d-flex align-items-start gap-3 py-2"
                  style={{ borderBottom: "1px dashed var(--memo-border)" }}
                >
                  <Link
                    to={`/memo/documents/${d.id}`}
                    className="d-flex align-items-start gap-3 flex-grow-1 text-decoration-none"
                    style={{ color: "inherit", minWidth: 0 }}
                  >
                    <div
                      className="memo-doc-card__thumb"
                      style={{ width: 40, height: 46, marginBottom: 0, fontSize: "0.78rem" }}
                    >
                      PDF
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: "var(--memo-text)" }}>
                        {d.title}
                      </div>
                      <small className="text-muted">
                        {d.category} · {formatDate(d.publishedAt)}
                      </small>
                    </div>
                  </Link>
                  <StatusBadge status={d.status} />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Top Viewed */}
        <div className="col-12 col-xl-4">
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="memo-card h-100"
          >
            <h3 className="memo-card__title">Top Viewed</h3>
            <p className="memo-card__subtitle">Most opened memos this month</p>
            {stats.topViewed.length === 0 && (
              <p className="text-muted small mb-0">No view data yet.</p>
            )}
            {stats.topViewed.map((d, i) => (
              <motion.div
                key={d.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="memo-bar-row"
              >
                <div>
                  <div className="memo-bar-row__label">{d.title}</div>
                  <div className="memo-bar-row__track">
                    <motion.div
                    className="memo-bar-row__fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (d.views || 0) / stats.maxViews }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                  />
                  </div>
                </div>
                <div className="memo-bar-row__value">{d.views || 0}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="col-12 col-xl-3">
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="memo-card h-100"
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="memo-card__title">Recent Activity</h3>
                <p className="memo-card__subtitle mb-0">Live feed</p>
              </div>
              <Link to="/memo/audit-log" className="memo-pillbtn">
                Audit
              </Link>
            </div>
            <ul className="memo-timeline">
              {recentActivity.length === 0 && (
                <li className="text-muted small">No recent activity.</li>
              )}
              {recentActivity.slice(0, 6).map((a) => {
                const meta = ACTION_LABELS[a.action] || { label: a.action, color: "#94a3b8" };
                return (
                  <li key={a.id} className="memo-timeline__item">
                    <div
                      className="memo-timeline__dot"
                      style={{ background: `${meta.color}20`, color: meta.color }}
                    >
                      <FaCircle size={8} />
                    </div>
                    <div className="memo-timeline__body">
                      <p className="memo-timeline__line">
                        <strong>{a.actor}</strong> {meta.label}{" "}
                        <span className="text-muted">— {a.entity}</span>
                      </p>
                      <span className="memo-timeline__time">{timeAgo(a.at)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
      </>
      )}

      <CreateMemoModal opened={createOpen} onClose={createH.close} />
    </div>
  );
};

export default MemoDashboard;
