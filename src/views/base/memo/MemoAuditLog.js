import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "@mantine/core";
import { FaSearch, FaDownload, FaCircle, FaHistory, FaExclamationTriangle } from "react-icons/fa";
import { ACTION_LABELS, timeAgo, formatDate } from "./memoMockData";
import { fetchRecentActivity } from "./memoStore";
import { notifySuccess } from "../../../components/notify/notify";
import "./memo.css";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

const MemoAuditLog = () => {
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchRecentActivity({ q, actor, action, from, to, limit: 200 })
      .then(setEvents)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const actors = useMemo(
    () => Array.from(new Set(events.map((a) => a.actor).filter(Boolean))),
    [events]
  );

  const dateRangeInvalid = !!(from && to && new Date(from) > new Date(to));

  const filtered = useMemo(() => {
    if (dateRangeInvalid) return [];
    return events.filter((a) => {
      if (q) {
        const needle = q.toLowerCase();
        if (
          !(a.entity || "").toLowerCase().includes(needle) &&
          !(a.actor || "").toLowerCase().includes(needle)
        )
          return false;
      }
      if (actor && a.actor !== actor) return false;
      if (action && a.action !== action) return false;
      if (from && new Date(a.at) < new Date(from)) return false;
      if (to && new Date(a.at) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [events, q, actor, action, from, to, dateRangeInvalid]);

  const exportCsv = () => {
    const headers = ["Actor", "Action", "Entity", "Timestamp"];
    const lines = filtered.map((a) =>
      [a.actor, a.action, `"${a.entity.replace(/"/g, '""')}"`, a.at].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `memo-audit-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notifySuccess("CSV exported");
  };

  // Group by day for the timeline
  const grouped = useMemo(() => {
    const map = new Map();
    [...filtered]
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
      .forEach((a) => {
        const ts = a.at ? new Date(a.at) : null;
        const key =
          ts && !Number.isNaN(ts.getTime())
            ? ts.toISOString().slice(0, 10) // YYYY-MM-DD, stable across TZ
            : "unknown";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(a);
      });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="memo-page">
      <div className="memo-page__header">
        <div>
          <h1 className="memo-page__title">Audit Log</h1>
          <p className="memo-page__subtitle">
            Every action across the Memo Portal — {filtered.length} event
            {filtered.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button className="memo-pillbtn memo-pillbtn--primary" onClick={exportCsv}>
          <FaDownload size={11} /> Export CSV
        </button>
      </div>

      <div className="memo-filterbar">
        <div className="memo-filterbar__search">
          <FaSearch className="memo-filterbar__search-icon" size={12} />
          <input
            placeholder="Search actor or entity..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="">All actors</option>
          {actors.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          style={dateRangeInvalid ? { borderColor: "var(--memo-danger)" } : undefined}
        />
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          style={dateRangeInvalid ? { borderColor: "var(--memo-danger)" } : undefined}
        />
      </div>

      {dateRangeInvalid && (
        <div className="memo-card" style={{ borderLeft: "3px solid var(--memo-danger)", color: "var(--memo-danger)" }}>
          "From" date is after "To" date — please fix the range.
        </div>
      )}

      {loading ? (
        <div className="memo-card text-center py-5">
          <Loader color="indigo" />
          <p className="text-muted small mt-2 mb-0">Loading activity…</p>
        </div>
      ) : error ? (
        <div className="memo-card memo-empty">
          <div className="memo-empty__icon" style={{ color: "var(--memo-danger)" }}>
            <FaExclamationTriangle />
          </div>
          <h5>Could not load activity</h5>
          <p className="mb-3">{error.message || "Please try again."}</p>
          <button className="memo-pillbtn memo-pillbtn--primary" onClick={reload}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="memo-card memo-empty">
          <div className="memo-empty__icon"><FaHistory /></div>
          <h5>No activity matches your filters</h5>
          <p className="mb-0">Try widening your date range.</p>
        </div>
      ) : (
        <div className="row g-3">
          {grouped.map(([day, events], gi) => (
            <motion.div
              key={day}
              custom={gi}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="col-12"
            >
              <div className="memo-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="memo-card__title mb-0">
                    {day === "unknown" ? "Undated" : formatDate(day)}
                  </h3>
                  <span className="text-muted small">{events.length} events</span>
                </div>
                <ul className="memo-timeline">
                  {events.map((a, i) => {
                    const meta = ACTION_LABELS[a.action] || { label: a.action, color: "#94a3b8" };
                    return (
                      <motion.li
                        key={a.id}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="memo-timeline__item"
                      >
                        <div
                          className="memo-timeline__dot"
                          style={{ background: `${meta.color}20`, color: meta.color }}
                        >
                          <FaCircle size={8} />
                        </div>
                        <div className="memo-timeline__body">
                          <p className="memo-timeline__line">
                            <strong>{a.actor || "System"}</strong> {meta.label}{" "}
                            <span className="text-muted">— {a.entity || "—"}</span>
                          </p>
                          <span className="memo-timeline__time">
                            {timeAgo(a.at)} · <code style={{ background: "#f1f4fa", padding: "1px 5px", borderRadius: 3 }}>{a.action}</code>
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoAuditLog;
