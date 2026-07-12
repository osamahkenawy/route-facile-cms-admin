import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { RingProgress, Tooltip } from "@mantine/core";
import {
  FaBriefcase,
  FaClipboardCheck,
  FaCalendarCheck,
  FaCheckCircle,
  FaStar,
  FaClock,
  FaVideo,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaUserTie,
  FaRegCalendarAlt,
  FaChartLine,
  FaBullseye,
  FaTasks,
} from "react-icons/fa";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import { formatDate, formatDateTime, getInitials } from "./hrConstants";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRStaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [myInterviews, setMyInterviews] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [myRatings, setMyRatings] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      simpleGetCallAuth(configWeb.GET_STAFF_DASHBOARD_STATS).catch(() => ({})),
      simpleGetCallAuth(configWeb.GET_STAFF_DASHBOARD_MY_INTERVIEWS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_STAFF_DASHBOARD_MY_RECENT_INTERVIEWS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_STAFF_DASHBOARD_OPEN_POSITIONS).catch(() => ({ data: [] })),
      simpleGetCallAuth(configWeb.GET_STAFF_DASHBOARD_MY_RATINGS).catch(() => ({ data: [] })),
    ])
      .then(([s, mi, ri, op, mr]) => {
        setStats(s || {});
        setMyInterviews(mi?.data || []);
        setRecentInterviews(ri?.data || []);
        setOpenPositions(op?.data || []);
        setMyRatings(mr?.data || []);
      })
      .catch(() => notifyError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo size={11} className="me-1" style={{ color: "#228be6" }} />;
    if (type === "phone") return <FaPhoneAlt size={11} className="me-1" style={{ color: "#16a34a" }} />;
    return <FaMapMarkerAlt size={11} className="me-1" style={{ color: "#f97316" }} />;
  };

  const getTimeUntil = (dateStr) => {
    if (!dateStr) return "";
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return "Passed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h`;
    const mins = Math.floor(diff / (1000 * 60));
    return `in ${mins}m`;
  };

  const todayInterviews = useMemo(
    () => myInterviews.filter((iv) => iv?.interview_date && new Date(iv.interview_date).toDateString() === new Date().toDateString()).length,
    [myInterviews]
  );

  const nextInterview = useMemo(() => {
    const sorted = [...myInterviews]
      .filter((iv) => iv?.interview_date)
      .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));
    return sorted[0] || null;
  }, [myInterviews]);

  const ratingAverage = useMemo(() => {
    if (!myRatings.length) return 0;
    const total = myRatings.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return total / myRatings.length;
  }, [myRatings]);

  const completionRate = useMemo(() => {
    const total = Number(stats.my_upcoming_interviews || 0) + Number(stats.my_completed_interviews || 0);
    if (!total) return 0;
    return Math.round((Number(stats.my_completed_interviews || 0) / total) * 100);
  }, [stats]);

  const modeBreakdown = useMemo(() => {
    const video = myInterviews.filter((iv) => iv.interview_type === "video").length;
    const phone = myInterviews.filter((iv) => iv.interview_type === "phone").length;
    const inPerson = myInterviews.filter((iv) => !iv.interview_type || iv.interview_type === "in-person").length;
    return [
      { label: "Video", value: video, color: "#228be6" },
      { label: "Phone", value: phone, color: "#16a34a" },
      { label: "On-site", value: inPerson, color: "#f97316" },
    ];
  }, [myInterviews]);

  const upcomingTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return {
        key: date.toISOString().slice(0, 10),
        day: date.toLocaleDateString("en-GB", { weekday: "short" }),
        label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        interviews: 0,
      };
    });

    const mapped = Object.fromEntries(days.map((item) => [item.key, item]));
    myInterviews.forEach((iv) => {
      if (!iv?.interview_date) return;
      const d = new Date(iv.interview_date);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      if (mapped[key]) mapped[key].interviews += 1;
    });

    return days.map((item) => ({ day: item.day, label: item.label, interviews: item.interviews }));
  }, [myInterviews]);

  if (loading) {
    return (
      <div className="hr-module">
        <div className="hr-loading" style={{ minHeight: 400 }}>
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Open Roles",
      value: stats.active_jobs || 0,
      icon: <FaBriefcase />,
      className: "blue",
      change: `${openPositions.length} visible now`,
    },
    {
      label: "Pending Reviews",
      value: stats.pending_applications || 0,
      icon: <FaClipboardCheck />,
      className: "orange",
      change: `${Math.max((stats.pending_applications || 0) - myInterviews.length, 0)} awaiting follow-up`,
    },
    {
      label: "Upcoming",
      value: stats.my_upcoming_interviews || 0,
      icon: <FaCalendarCheck />,
      className: "teal",
      change: todayInterviews ? `${todayInterviews} today` : "Nothing due today",
    },
    {
      label: "Completed",
      value: stats.my_completed_interviews || 0,
      icon: <FaCheckCircle />,
      className: "green",
      change: `${completionRate}% completion rate`,
    },
    {
      label: "Ratings Given",
      value: stats.my_ratings_given || 0,
      icon: <FaStar />,
      className: "rose",
      change: `${ratingAverage ? ratingAverage.toFixed(1) : "0.0"}/5 avg`,
    },
  ];

  return (
    <div className="hr-module">
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center g-3">
          <Col lg={7}>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3">
                <FaUserTie />
              </div>
              <div>
                <h4>My Recruiting Workspace</h4>
                <p>Track interviews, candidate feedback and today’s hiring priorities in one place</p>
                <div className="hr-hero-pills">
                  <span className="hr-hero-pill">
                    <FaRegCalendarAlt size={11} /> {todayInterviews} today
                  </span>
                  <span className="hr-hero-pill">
                    <FaStar size={11} /> {ratingAverage ? ratingAverage.toFixed(1) : "0.0"}/5 average
                  </span>
                  <span className="hr-hero-pill">
                    <FaTasks size={11} /> {openPositions.length} open roles
                  </span>
                </div>
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <div className="hr-header-actions">
              <motion.button className="hr-pill-button primary" onClick={() => navigate("/hr/interviews")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <FaCalendarCheck size={12} /> Review interviews
              </motion.button>
              <motion.button className="hr-pill-button secondary" onClick={() => navigate("/hr/applications")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <FaClipboardCheck size={12} /> Candidates
              </motion.button>
              <motion.button className="hr-pill-button secondary" onClick={() => navigate("/hr/jobs")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <FaBriefcase size={12} /> Open roles
              </motion.button>
            </div>
          </Col>
        </Row>
      </motion.div>

      <Row className="mx-1 g-3 hr-stat-grid">
        {statCards.map((card, idx) => (
          <Col xl={true} lg={4} md={6} key={card.label}>
            <motion.div className={`hr-dash-stat ${card.className}`} variants={fadeUp} custom={idx} initial="hidden" animate="visible">
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
                <div className="stat-icon">{card.icon}</div>
              </div>
              <div className="stat-change up">{card.change}</div>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row className="mx-1 mt-3 g-3">
        <Col lg={12}>
          <motion.div className="hr-dash-card" variants={fadeUp} custom={5} initial="hidden" animate="visible">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="card-title mb-0">
                <FaChartLine /> My Interview Rhythm
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Next 7 days</span>
            </div>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Next interview</div>
                  <div className="value">{nextInterview ? formatDate(nextInterview.interview_date) : "Clear"}</div>
                  <div className="sub">{nextInterview ? getTimeUntil(nextInterview.interview_date) : "No upcoming meeting"}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Execution rate</div>
                  <div className="value">{completionRate}%</div>
                  <div className="sub">Completed vs scheduled interviews</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Feedback quality</div>
                  <div className="value">{ratingAverage ? ratingAverage.toFixed(1) : "0.0"}</div>
                  <div className="sub">Average score from submitted ratings</div>
                </div>
              </Col>
            </Row>

            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={upcomingTrend} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="staffTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228be6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#228be6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    formatter={(value) => [`${value} interview(s)`, "Scheduled"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.label || label}
                    contentStyle={{ borderRadius: 12, border: "1px solid #dbeafe" }}
                  />
                  <Area type="monotone" dataKey="interviews" stroke="#228be6" fill="url(#staffTrend)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </Col>
      </Row>

      <Row className="mx-1 mt-3 g-3">
        <Col lg={7}>
          <motion.div className="hr-dash-card" variants={fadeUp} custom={7} initial="hidden" animate="visible">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="card-title mb-0">
                <FaRegCalendarAlt /> Upcoming Interviews
              </div>
              <motion.button
                style={{ fontSize: "0.78rem", color: "#228be6", fontWeight: 700, border: "none", background: "none" }}
                onClick={() => navigate("/hr/interviews")}
                whileHover={{ scale: 1.04 }}
              >
                All interviews <FaArrowRight size={10} className="ms-1" />
              </motion.button>
            </div>

            {myInterviews.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 120 }}>
                <FaCalendarCheck size={30} style={{ color: "#cbd5e1" }} />
                <p>No upcoming interviews assigned to you</p>
              </div>
            ) : (
              <div className="hr-insight-list">
                {myInterviews.slice(0, 6).map((iv, idx) => {
                  const timeLabel = getTimeUntil(iv.interview_date);
                  const isToday = iv.interview_date && new Date(iv.interview_date).toDateString() === new Date().toDateString();
                  return (
                    <motion.div
                      key={iv.id}
                      className="hr-insight-item"
                      style={{ cursor: "pointer", background: isToday ? "#eff6ff" : undefined, borderColor: isToday ? "#bfdbfe" : undefined }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/hr/interview/${iv.id}`)}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                    >
                      <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                        <div className="hr-avatar" style={{ width: 40, height: 40, fontSize: "0.78rem", background: isToday ? "#228be6" : undefined }}>
                          {getInitials(iv.application || {})}
                        </div>
                        <div>
                          <div className="title">
                            {iv.application ? `${iv.application.first_name} ${iv.application.last_name}` : `#${iv.application_id}`}
                          </div>
                          <div className="sub d-flex align-items-center gap-1" style={{ textTransform: "capitalize" }}>
                            {interviewTypeIcon(iv.interview_type)} {iv.interview_type || "in-person"}
                            {iv.location ? `· ${iv.location}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isToday ? "#1d4ed8" : "#334155" }}>
                          {formatDateTime(iv.interview_date)}
                        </div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isToday ? "#228be6" : timeLabel === "Passed" ? "#ef4444" : "#16a34a" }}>
                          {isToday ? "TODAY · " : ""}{timeLabel}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </Col>

        <Col lg={5}>
          <motion.div className="hr-dash-card h-100" variants={fadeUp} custom={8} initial="hidden" animate="visible">
            <div className="card-title">
              <FaStar /> Recent Ratings
            </div>

            <div className="hr-spotlight-card mb-3">
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.6px" }}>Feedback score</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>{ratingAverage ? ratingAverage.toFixed(1) : "0.0"}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{myRatings.length} rating(s) submitted</div>
                </div>
                <div className="d-flex align-items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FaStar key={s} size={12} style={{ color: s <= Math.round(ratingAverage || 0) ? "#f59e0b" : "#dbeafe" }} />
                  ))}
                </div>
              </div>
            </div>

            {myRatings.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100 }}>
                <FaStar size={24} style={{ color: "#cbd5e1" }} />
                <p>No ratings submitted yet</p>
              </div>
            ) : (
              <div className="hr-insight-list">
                {myRatings.slice(0, 5).map((r) => (
                  <div key={r.id} className="hr-insight-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/hr/applications/${r.application_id}`)}>
                    <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                      <div className="hr-avatar" style={{ width: 30, height: 30, fontSize: "0.65rem" }}>
                        {getInitials(r.application || {})}
                      </div>
                      <div>
                        <div className="title">
                          {r.application ? `${r.application.first_name} ${r.application.last_name}` : `#${r.application_id}`}
                        </div>
                        <div className="sub" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.comments || "Feedback submitted"}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} size={10} style={{ color: s <= r.rating ? "#f59e0b" : "#e2e8f0" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </Col>
      </Row>

      <Row className="mx-1 mt-3 g-3 mb-4">
        <Col lg={6}>
          <motion.div className="hr-dash-card" variants={fadeUp} custom={9} initial="hidden" animate="visible">
            <div className="card-title">
              <FaCheckCircle /> Recently Completed Interviews
            </div>
            {recentInterviews.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100 }}>
                <FaCheckCircle size={24} />
                <p>No completed interviews</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInterviews.map((iv) => (
                      <tr key={iv.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/hr/interview/${iv.id}`)}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="hr-avatar" style={{ width: 26, height: 26, fontSize: "0.6rem" }}>{getInitials(iv.application || {})}</div>
                            <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                              {iv.application ? `${iv.application.first_name} ${iv.application.last_name}` : `#${iv.application_id}`}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "#64748b" }}>{formatDate(iv.interview_date)}</td>
                        <td>
                          <span className="d-flex align-items-center" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {interviewTypeIcon(iv.interview_type)}
                            <span style={{ textTransform: "capitalize" }}>{iv.interview_type}</span>
                          </span>
                        </td>
                        <td>
                          {iv.rating ? (
                            <div className="d-flex align-items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <FaStar key={s} size={10} style={{ color: s <= iv.rating ? "#f59e0b" : "#e2e8f0" }} />
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#cbd5e1", fontSize: "0.78rem" }}>—</span>
                          )}
                        </td>
                        <td>
                          <Tooltip label={iv.feedback || "No feedback"} withArrow multiline w={220}>
                            <span style={{ fontSize: "0.78rem", color: "#64748b", maxWidth: 120, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {iv.feedback || <span style={{ color: "#cbd5e1" }}>—</span>}
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </Col>

        <Col lg={6}>
          <motion.div className="hr-dash-card" variants={fadeUp} custom={10} initial="hidden" animate="visible">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="card-title mb-0">
                <FaBriefcase /> Open Positions
              </div>
              <motion.button
                style={{ fontSize: "0.78rem", color: "#228be6", fontWeight: 700, border: "none", background: "none" }}
                onClick={() => navigate("/hr/jobs")}
                whileHover={{ scale: 1.04 }}
              >
                View all <FaArrowRight size={10} className="ms-1" />
              </motion.button>
            </div>

            {openPositions.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100 }}>
                <FaBriefcase size={24} />
                <p>No open positions</p>
              </div>
            ) : (
              <div className="hr-insight-list">
                {openPositions.slice(0, 5).map((job) => {
                  const daysLeft = job.expiry_date ? Math.ceil((new Date(job.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <motion.div
                      key={job.id}
                      className="hr-insight-item"
                      style={{ cursor: "pointer", borderColor: daysLeft != null && daysLeft <= 7 ? "#fecaca" : undefined, background: daysLeft != null && daysLeft <= 7 ? "#fff7f7" : undefined }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/hr/jobs/${job.id}/edit`)}
                    >
                      <div>
                        <div className="title">{job.title_en}</div>
                        <div className="sub">
                          <FaMapMarkerAlt size={9} className="me-1" />{job.location_en || "—"}
                          {job.experience_years != null ? ` · ${job.experience_years} yrs exp` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {daysLeft != null && (
                          <span
                            className="hr-badge"
                            style={{
                              background: daysLeft <= 7 ? "#fef2f2" : daysLeft <= 14 ? "#fff7ed" : "#f0fdf4",
                              color: daysLeft <= 7 ? "#dc2626" : daysLeft <= 14 ? "#ea580c" : "#16a34a",
                            }}
                          >
                            {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                          </span>
                        )}
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>Expires {formatDate(job.expiry_date)}</div>
                      </div>
                    </motion.div>
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

export default HRStaffDashboard;
