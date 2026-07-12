import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { RingProgress, Tooltip, Progress } from "@mantine/core";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  FaUsers,
  FaBriefcase,
  FaBuilding,
  FaCalendarCheck,
  FaChartLine,
  FaClipboardList,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaVideo,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaChartBar,
  FaChartPie,
  FaTrophy,
  FaArrowRight,
  FaUserTie,
} from "react-icons/fa";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  APPLICATION_STATUS,
  INTERVIEW_STATUS,
  formatDate,
  formatDateTime,
  getApplicantName,
  getInitials,
} from "./hrConstants";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// Hash-based HSL avatar color — unlimited unique colors, deterministic per name
const getAvatarColor = (str) => {
  const s = String(str || "");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 48%)`;
};

const HRManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentApps, setRecentApps] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [trends, setTrends] = useState([]);
  const [interviewStats, setInterviewStats] = useState({});
  const [topRated, setTopRated] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_STATS).catch(() => ({})),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_RECENT_APPS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_UPCOMING_INTERVIEWS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_HIRING_PIPELINE).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_APPLICATION_TRENDS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_INTERVIEW_STATS).catch(() => ({})),
      simpleGetCallAuth(configWeb.GET_MANAGER_DASHBOARD_TOP_RATED).catch(() => ({ data: [] })),
    ])
      .then(([s, ra, ui, pl, tr, is, topR]) => {
        setStats(s || {});
        setRecentApps(ra?.data || []);
        setUpcomingInterviews(ui?.data || []);
        setPipeline(pl?.data || []);
        setTrends(tr?.data || []);
        setInterviewStats(is || {});
        setTopRated(topR?.data || []);
      })
      .catch(() => notifyError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  // Build 30-day trend data with gap filling
  const trendChartData = useMemo(() => {
    const map = {};
    (trends || []).forEach((t) => { map[t.date] = Number(t.count); });
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({ date: key, count: map[key] || 0, label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) });
    }
    return days;
  }, [trends]);

  // Ring progress data from applications_by_status
  const ringColors = ["#94a3b8", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#22c55e"];
  const ringData = useMemo(() => {
    const byStatus = stats.applications_by_status || [];
    const total = byStatus.reduce((s, r) => s + Number(r.count), 0) || 1;
    return byStatus.map((r) => ({
      value: Math.round((Number(r.count) / total) * 100),
      color: ringColors[Number(r.status)] || "#94a3b8",
      tooltip: `${APPLICATION_STATUS[r.status]?.label || "Unknown"}: ${r.count}`,
    }));
  }, [stats]);

  // Interview stats ring
  const interviewRing = useMemo(() => {
    const byStatus = interviewStats.interviews_by_status || [];
    const total = byStatus.reduce((s, r) => s + Number(r.count), 0) || 1;
    const colors = ["#3b82f6", "#22c55e", "#94a3b8", "#ef4444", "#f97316"];
    return byStatus.map((r) => ({
      value: Math.round((Number(r.count) / total) * 100),
      color: colors[Number(r.status)] || "#94a3b8",
      tooltip: `${INTERVIEW_STATUS[r.status]?.label || "Unknown"}: ${r.count}`,
    }));
  }, [interviewStats]);

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo size={10} className="me-1" />;
    if (type === "phone") return <FaPhoneAlt size={10} className="me-1" />;
    return <FaMapMarkerAlt size={10} className="me-1" />;
  };

  if (loading) {
    return (
      <div className="hr-module" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Spinner animation="border" style={{ color: "#228be6", width: 48, height: 48 }} />
        </motion.div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Applications", value: stats.total_applications || 0, icon: <FaUsers />, variant: "blue", change: stats.recent_applications_7days || 0, changeSuffix: "this week" },
    { label: "Active Jobs", value: stats.active_jobs || 0, icon: <FaBriefcase />, variant: "green", change: stats.total_jobs || 0, changeSuffix: "total" },
    { label: "Hired", value: stats.total_hired || 0, icon: <FaUserCheck />, variant: "teal", change: null, changeSuffix: "all time" },
    { label: "Rejected", value: stats.total_rejected || 0, icon: <FaTimesCircle />, variant: "rose" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.72rem", marginBottom: 2 }}>{label}</div>
          <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>{payload[0].value} applications</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaChartLine /></div>
              <div>
                <h4 style={{ marginBottom: 2 }}>Overview</h4>
                <p>HR Recruiting Analytics & Insights</p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 16px", backdropFilter: "blur(4px)" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 500 }}>Last 30 days</div>
                <div style={{ color: "#fff", fontSize: "1.15rem", fontWeight: 800 }}>{stats.recent_applications_30days || 0}</div>
              </div>
              <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 500 }}>Active Jobs</div>
                <div style={{ color: "#4ade80", fontSize: "1.15rem", fontWeight: 800 }}>{stats.active_jobs || 0}</div>
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Stat Cards — 6 gradient cards */}
      <Row className="mx-1 g-3 hr-stat-grid">
        {statCards.map((card, idx) => (
          <Col xl={2} lg={4} sm={6} key={card.label}>
            <motion.div className={`hr-dash-stat ${card.variant}`} variants={fadeUp} custom={idx} initial="hidden" animate="visible">
              <div className="d-flex align-items-start justify-content-between" style={{ position: "relative", zIndex: 1 }}>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value" style={{ marginTop: 8 }}>{card.value}</div>
                </div>
                <div className="stat-icon">{card.icon}</div>
              </div>
              {(card.change !== undefined || card.changeSuffix) && (
                <div style={{ marginTop: 10, position: "relative", zIndex: 1 }}>
                  <span className={`stat-change ${card.change > 0 ? "up" : ""}`}>
                    {card.change > 0 && <FaArrowUp size={9} />}
                    {card.change !== null && card.change !== undefined ? `+${card.change} ` : ""}
                    {card.changeSuffix}
                  </span>
                </div>
              )}
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Row 2: Application Trends (Area Chart) + Application Status (Donut) */}
      <Row className="mx-0 mt-3 g-3">
        {/* Application Trends — smooth area chart */}
        <Col lg={8}>
          <motion.div className="hr-dash-card h-100" variants={fadeUp} custom={6} initial="hidden" animate="visible">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="card-title mb-0">
                <FaChartBar size={16} />Application Trends
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Last 30 days</span>
                <span style={{ background: "#e7f5ff", color: "#228be6", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700 }}>
                  {trendChartData.reduce((s, d) => s + d.count, 0)} total
                </span>
              </div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#228be6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#228be6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ReTooltip content={<CustomTooltip />} cursor={{ stroke: "#228be6", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="count" stroke="#228be6" strokeWidth={2.5} fill="url(#trendGrad)" dot={false} activeDot={{ r: 5, fill: "#228be6", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </Col>

        {/* Application Status Donut */}
        <Col lg={4}>
          <motion.div className="hr-dash-card h-100" variants={fadeUp} custom={7} initial="hidden" animate="visible">
            <div className="card-title">
              <FaChartPie size={16} />Application Status
            </div>
            <div className="d-flex align-items-center justify-content-center" style={{ marginTop: 8 }}>
              <RingProgress
                size={180}
                thickness={22}
                roundCaps
                sections={ringData}
                label={
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{stats.total_applications || 0}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>Total</div>
                  </div>
                }
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 16 }}>
              {(stats.applications_by_status || []).map((r, i) => {
                const st = APPLICATION_STATUS[r.status];
                return (
                  <div key={r.status} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", borderRadius: 10, padding: "5px 12px",
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: ringColors[Number(r.status)] || "#94a3b8", display: "inline-block" }} />
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 500 }}>{st?.label}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e293b" }}>{r.count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </Col>
      </Row>

      {/* Row 3: Hiring Pipeline */}
      {pipeline.length > 0 && (
        <Row className="mx-0 mt-3">
          <Col>
            <motion.div className="hr-dash-card" variants={fadeUp} custom={8} initial="hidden" animate="visible">
              <div className="card-title">
                <FaBriefcase size={16} />Hiring Pipeline
              </div>
              <div className="table-responsive">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th style={{ textAlign: "center" }}>Total</th>
                      <th style={{ minWidth: 220 }}>Pipeline</th>
                      <th style={{ textAlign: "center" }}>Pending</th>
                      <th style={{ textAlign: "center" }}>Reviewing</th>
                      <th style={{ textAlign: "center" }}>Shortlisted</th>
                      <th style={{ textAlign: "center" }}>Rejected</th>
                      <th style={{ textAlign: "center" }}>Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.map((job) => {
                      const t = job.total || 1;
                      return (
                        <tr key={job.job_id}>
                          <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{job.job_title_en}</td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ background: "#e7f5ff", color: "#228be6", fontWeight: 800, padding: "3px 12px", borderRadius: 20, fontSize: "0.82rem" }}>{job.total}</span>
                          </td>
                          <td>
                            <Progress.Root size={20} radius="xl">
                              {job.pending > 0 && <Progress.Section value={(job.pending / t) * 100} color="#94a3b8"><Progress.Label>{job.pending}</Progress.Label></Progress.Section>}
                              {job.reviewing > 0 && <Progress.Section value={(job.reviewing / t) * 100} color="#3b82f6"><Progress.Label>{job.reviewing}</Progress.Label></Progress.Section>}
                              {job.shortlisted > 0 && <Progress.Section value={(job.shortlisted / t) * 100} color="#f97316"><Progress.Label>{job.shortlisted}</Progress.Label></Progress.Section>}
                              {job.rejected > 0 && <Progress.Section value={(job.rejected / t) * 100} color="#ef4444"><Progress.Label>{job.rejected}</Progress.Label></Progress.Section>}
                              {job.hired > 0 && <Progress.Section value={(job.hired / t) * 100} color="#22c55e"><Progress.Label>{job.hired}</Progress.Label></Progress.Section>}
                            </Progress.Root>
                          </td>
                          <td style={{ textAlign: "center", fontSize: "0.82rem", color: "#64748b" }}>{job.pending}</td>
                          <td style={{ textAlign: "center", fontSize: "0.82rem", color: "#3b82f6" }}>{job.reviewing}</td>
                          <td style={{ textAlign: "center", fontSize: "0.82rem", color: "#f97316" }}>{job.shortlisted}</td>
                          <td style={{ textAlign: "center", fontSize: "0.82rem", color: "#ef4444" }}>{job.rejected}</td>
                          <td style={{ textAlign: "center", fontSize: "0.82rem", color: "#22c55e", fontWeight: 700 }}>{job.hired}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Col>
        </Row>
      )}

      {/* Row 4: Top Rated Applicants */}
      <Row className="mx-0 mt-3 g-3">
        {/* Top Rated Applicants */}
        <Col lg={12}>
          <motion.div className="hr-dash-card h-100" variants={fadeUp} custom={10} initial="hidden" animate="visible">
            <div className="card-title">
              <FaTrophy size={16} style={{ color: "#f59e0b" }} />Top Rated Applicants
            </div>
            {topRated.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 140 }}>
                <FaTrophy size={32} style={{ color: "#e2e8f0" }} />
                <p>No rated applicants yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topRated.map((r, idx) => {
                  const st = APPLICATION_STATUS[r.application_status] || APPLICATION_STATUS[0];
                  const medalBg = idx === 0 ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : idx === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)" : idx === 2 ? "linear-gradient(135deg, #ea580c, #f97316)" : "#e2e8f0";
                  const medalColor = idx < 3 ? "#fff" : "#94a3b8";
                  return (
                    <div
                      key={r.application_id}
                      className="hr-dash-member"
                      onClick={() => navigate(`/hr/applications/${r.application_id}`)}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: medalBg, color: medalColor, fontWeight: 800, fontSize: "0.72rem", flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div className="member-avatar" style={{ background: getAvatarColor(r.first_name + r.last_name) }}>
                        {getInitials(r)}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{r.first_name} {r.last_name}</div>
                        <div className="member-sub">{r.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <FaStar size={14} style={{ color: "#f59e0b" }} />
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#1e293b" }}>{Number(r.average_rating).toFixed(1)}</span>
                      </div>
                      <span className="hr-badge" style={{ background: st.bg, color: st.text, fontSize: "0.7rem" }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </Col>
      </Row>

      {/* Row 5: Recent Applications */}
      <Row className="mx-0 mt-3 g-3 mb-4">
        {/* Recent Applications — member card style */}
        <Col lg={12}>
          <motion.div className="hr-dash-card" variants={fadeUp} custom={11} initial="hidden" animate="visible">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="card-title mb-0">
                <FaUsers size={16} />Recent Applications
              </div>
              <motion.button
                style={{
                  fontSize: "0.8rem", color: "#228be6", fontWeight: 600, border: "1px solid #bfdbfe",
                  background: "#eff6ff", cursor: "pointer", borderRadius: 10, padding: "6px 16px", display: "flex",
                  alignItems: "center", gap: 6,
                }}
                onClick={() => navigate("/hr/applications")}
                whileHover={{ scale: 1.03, background: "#dbeafe" }}
                whileTap={{ scale: 0.97 }}
              >
                View All <FaArrowRight size={11} />
              </motion.button>
            </div>
            {recentApps.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100 }}><FaUsers size={28} /><p>No recent applications</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentApps.map((app) => {
                  const st = APPLICATION_STATUS[app.status] || APPLICATION_STATUS[0];
                  return (
                    <div
                      key={app.id}
                      className="hr-dash-member"
                      onClick={() => navigate(`/hr/applications/${app.id}`)}
                    >
                      <div className="member-avatar" style={{ background: getAvatarColor(getApplicantName(app)) }}>
                        {getInitials(app)}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{getApplicantName(app)}</div>
                        <div className="member-sub">{app.career_job?.title_en || "—"} &middot; {formatDate(app.created_at)}</div>
                      </div>
                      <span className="member-badge" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

export default HRManagerDashboard;
