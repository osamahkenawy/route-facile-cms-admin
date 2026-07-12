import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { RingProgress, Text } from "@mantine/core";
import {
  FaBriefcase,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaChartLine,
  FaArrowRight,
  FaClock,
  FaVideo,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  APPLICATION_STATUS,
  INTERVIEW_STATUS,
  formatDate,
  formatDateTime,
  getApplicantName,
} from "./hrConstants";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      simpleGetCallAuth(configWeb.GET_RECRUITING_DASHBOARD_STATS),
      simpleGetCallAuth(configWeb.GET_RECRUITING_DASHBOARD_RECENT_APPS),
      simpleGetCallAuth(configWeb.GET_RECRUITING_DASHBOARD_UPCOMING_INTERVIEWS),
    ])
      .then(([statsRes, appsRes, interviewsRes]) => {
        setStats(statsRes?.error ? null : statsRes);
        setRecentApps(appsRes?.data || []);
        setUpcomingInterviews(interviewsRes?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = (stats?.applications_by_status || []).map((s) => ({
    status: Number(s.status),
    count: Number(s.count),
    label: APPLICATION_STATUS[s.status]?.label || `Status ${s.status}`,
    color: APPLICATION_STATUS[s.status]?.text || "#94a3b8",
  }));

  const totalByStatus = statusChartData.reduce((a, b) => a + b.count, 0);

  const ringData = statusChartData.map((s) => ({
    value: totalByStatus > 0 ? (s.count / totalByStatus) * 100 : 0,
    color: s.color,
    tooltip: `${s.label}: ${s.count}`,
  }));

  const statCards = [
    { label: "Total Applications", value: stats?.total_applications ?? "—", icon: <FaUsers />, color: "blue" },
    { label: "Active Jobs", value: stats?.active_jobs ?? "—", icon: <FaBriefcase />, color: "violet" },
    { label: "This Week", value: stats?.recent_applications_7days ?? "—", icon: <FaChartLine />, color: "green" },
  ];

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo size={11} />;
    if (type === "phone") return <FaPhone size={11} />;
    return <FaMapMarkerAlt size={11} />;
  };

  if (loading) {
    return (
      <div className="hr-module">
        <div className="hr-loading">
          <div className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="d-flex align-items-center">
          <div className="hr-header-icon me-3"><FaChartLine /></div>
          <div>
            <h4>HR & Recruiting Dashboard</h4>
            <p>Overview of your hiring pipeline and team activity</p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <Row className="mb-4 g-3 px-1">
        {statCards.map((card, i) => (
          <Col xs={6} lg key={card.label}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <div className={`hr-stat-card ${card.color}`}>
                <div className={`hr-stat-icon ${card.color}`}>{card.icon}</div>
                <div>
                  <div className="hr-stat-value">{card.value}</div>
                  <div className="hr-stat-label">{card.label}</div>
                </div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row className="g-3 px-1">
        {/* Applications by Status (Donut) */}
        <Col lg={4}>
          <motion.div className="hr-glass-card" variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <h6>Applications by Status</h6>
            {totalByStatus > 0 ? (
              <div className="d-flex flex-column align-items-center">
                <RingProgress
                  size={180}
                  thickness={20}
                  roundCaps
                  sections={ringData}
                  label={
                    <Text ta="center" fw={700} size="lg">{totalByStatus}</Text>
                  }
                />
                <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                  {statusChartData.map((s) => (
                    <div key={s.status} className="d-flex align-items-center gap-1" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      <span>{s.label} ({s.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hr-empty-state"><p>No data available</p></div>
            )}
          </motion.div>
        </Col>

        {/* Recent Applications */}
        <Col lg={8}>
          <motion.div className="hr-glass-card" variants={fadeUp} initial="hidden" animate="visible" custom={6}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Recent Applications</h6>
              <motion.button
                className="btn btn-sm"
                style={{ fontSize: "0.78rem", color: "#228be6", fontWeight: 600, border: "none", background: "none" }}
                onClick={() => navigate("/hr/applications")}
                whileHover={{ x: 4 }}
              >
                View all <FaArrowRight size={10} className="ms-1" />
              </motion.button>
            </div>
            {recentApps.length > 0 ? (
              <div className="table-responsive">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Job</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.slice(0, 7).map((app) => {
                      const st = APPLICATION_STATUS[app.status] || APPLICATION_STATUS[0];
                      return (
                        <tr
                          key={app.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/hr/applications/${app.id}`)}
                        >
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="hr-avatar" style={{ width: 32, height: 32, fontSize: "0.7rem", borderRadius: 8 }}>
                                {(app.first_name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{getApplicantName(app)}</div>
                                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{app.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.82rem" }}>{app.career_job?.title_en || "—"}</td>
                          <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{formatDate(app.created_at)}</td>
                          <td>
                            <span className="hr-badge" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="hr-empty-state"><FaUsers size={36} /><p>No recent applications</p></div>
            )}
          </motion.div>
        </Col>
      </Row>

      {/* Upcoming Interviews removed from report */}
    </div>
  );
};

export default HRDashboard;
