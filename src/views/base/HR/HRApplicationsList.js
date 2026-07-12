import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaUsers,
  FaSearch,
  FaEye,
  FaTrash,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaChartLine,
  FaCalendarCheck,
} from "react-icons/fa";
import {
  simpleGetCallAuth,
  simpleDeleteCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_OPTIONS,
  formatDate,
  getApplicantName,
  getApplicantPhone,
  getInitials,
} from "./hrConstants";
import HRExportButtons from "./HRExportButtons";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRApplicationsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  // Derive all filter state directly from URL so browser back/forward works
  const filterStatus = searchParams.get("status") || "";
  const filterJob = searchParams.get("career_job_id") || "";
  const filterSourceChannel = searchParams.get("source_channel") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("page_size")) || 25;

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      // Reset to page 1 on filter change (not on page/pageSize change)
      if (!["page", "page_size"].includes(key)) next.set("page", "1");
      return next;
    });
  };

  const loadApplications = (status, job) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (job) params.append("career_job_id", job);
    params.append("page", 1);
    params.append("page_size", 9999);
    simpleGetCallAuth(`${configWeb.GET_CAREER_APPLICATION_LIST}?${params.toString()}`)
      .then((res) => setApplications(res?.data || []))
      .catch(() => { notifyError("Failed to load applications"); setApplications([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    simpleGetCallAuth(`${configWeb.GET_CAREER_JOB_LIST}?page_size=9999`)
      .then((res) => setJobList(res?.data || []))
      .catch(() => {});

    // Aggregate ratings per application for the list column
    simpleGetCallAuth(`${configWeb.GET_RECRUITING_RATING_LIST}?page=1&page_size=9999`)
      .then((res) => {
        const list = res?.data || [];
        const acc = {};
        list.forEach((r) => {
          const appId = r.application_id;
          const stars = Number(r.rating) || 0;
          if (!appId || !stars) return;
          if (!acc[appId]) acc[appId] = { sum: 0, count: 0 };
          acc[appId].sum += stars;
          acc[appId].count += 1;
        });
        const map = {};
        Object.keys(acc).forEach((k) => {
          map[k] = { avg: acc[k].sum / acc[k].count, count: acc[k].count };
        });
        setRatingsMap(map);
      })
      .catch(() => setRatingsMap({}));
  }, []);

  useEffect(() => { loadApplications(filterStatus, filterJob); }, [filterStatus, filterJob]);

  const filtered = useMemo(() => {
    let list = applications;
    if (filterSourceChannel) {
      list = list.filter((a) => a.source_channel === filterSourceChannel);
    }
    const withDate = list.filter((a) => {
      if (!dateFrom && !dateTo) return true;
      if (!a.created_at) return false;
      const created = new Date(a.created_at);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (created < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }
      return true;
    });

    if (!searchTerm) return withDate;
    const t = searchTerm.toLowerCase();
    return withDate.filter(
      (a) =>
        (a.first_name && a.first_name.toLowerCase().includes(t)) ||
        (a.last_name && a.last_name.toLowerCase().includes(t)) ||
        (a.email && a.email.toLowerCase().includes(t)) ||
        (a.phone_number && a.phone_number.includes(searchTerm)) ||
        (a.id && String(a.id).includes(searchTerm))
    );
  }, [applications, searchTerm, dateFrom, dateTo, filterSourceChannel]);

  const sourceChannels = useMemo(() => {
    const values = applications
      .map((a) => a.source_channel)
      .filter(Boolean)
      .filter((v, idx, arr) => arr.indexOf(v) === idx);
    return values.sort();
  }, [applications]);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => a.status === 0).length,
    reviewing: applications.filter((a) => a.status === 1).length,
    shortlisted: applications.filter((a) => a.status === 2).length,
    interviewed: applications.filter((a) => a.status === 3).length,
    hired: applications.filter((a) => a.status === 5).length,
    rejected: applications.filter((a) => a.status === 4).length,
    recent: applications.filter((a) => a.created_at && (new Date() - new Date(a.created_at)) / (1000 * 60 * 60 * 24) <= 7).length,
  }), [applications]);

  const recentApplicants = useMemo(
    () => [...applications].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5),
    [applications]
  );

  const quickStatuses = [
    { label: "All", value: "" },
    { label: "Pending", value: "0" },
    { label: "Reviewing", value: "1" },
    { label: "Shortlisted", value: "2" },
    { label: "Hired", value: "5" },
  ];

  const shortlistRate = stats.total ? Math.round((stats.shortlisted / stats.total) * 100) : 0;

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const confirmDelete = () => {
    if (!deleteId) return;
    simpleDeleteCallAuth(configWeb.DELETE_CAREER_APPLICATION(deleteId))
      .then((res) => {
        if (res && !res.error) { notifySuccess("Application deleted"); loadApplications(); }
        else notifyError("Failed to delete");
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => { setDeleteId(null); closeDelete(); });
  };

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaUsers /></div>
              <div>
                <h4>Applications</h4>
                <p>Review candidates, monitor the funnel and move the best talent faster</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-applications"
              title="HR Applications"
              sheetName="Applications"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Applicant", accessor: (r) => getApplicantName(r) },
                { header: "Email", accessor: (r) => r.email || "" },
                { header: "Phone", accessor: (r) => getApplicantPhone(r) },
                { header: "Job", accessor: (r) => r.career_job?.title_en || "" },
                { header: "Source", accessor: (r) => r.source_channel || "" },
                { header: "Applied", accessor: (r) => formatDate(r.created_at) },
                { header: "Avg Rating", accessor: (r) => (ratingsMap[r.id] ? ratingsMap[r.id].avg.toFixed(1) : "") },
                { header: "Ratings", accessor: (r) => (ratingsMap[r.id] ? ratingsMap[r.id].count : 0) },
                { header: "Status", accessor: (r) => APPLICATION_STATUS[r.status]?.label || "" },
              ]}
            />
            <motion.button
              className="hr-pill-button primary"
              onClick={() => navigate("/hr/interviews")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaCalendarCheck size={12} /> Interview Queue
            </motion.button>
          </Col>
        </Row>
      </motion.div>

      {/* Stat Cards */}
      <Row className="mb-3 g-3 px-1">
        {[
          { label: "Total", value: stats.total, icon: <FaUsers />, color: "blue" },
          { label: "Pending", value: stats.pending, icon: <FaClock />, color: "amber" },
          { label: "Shortlisted", value: stats.shortlisted, icon: <FaCheckCircle />, color: "cyan" },
          { label: "Hired", value: stats.hired, icon: <FaCheckCircle />, color: "green" },
          { label: "Rejected", value: stats.rejected, icon: <FaTimesCircle />, color: "red" },
        ].map((s, i) => (
          <Col xl={true} lg={4} md={6} key={s.label}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <div className={`hr-stat-card ${s.color}`}>
                <div className={`hr-stat-icon ${s.color}`}>{s.icon}</div>
                <div>
                  <div className="hr-stat-value">{s.value}</div>
                  <div className="hr-stat-label">{s.label}</div>
                </div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row className="mx-1 mt-2 g-3 mb-3">
        <Col lg={8}>
          <motion.div className="hr-dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="card-title mb-0">
                <FaChartLine /> Funnel Snapshot
              </div>
              <div className="hr-chip-group">
                {quickStatuses.map((item) => (
                  <button key={item.label} className={`hr-chip ${filterStatus === item.value ? "active" : ""}`} onClick={() => updateParam("status", item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Shortlist rate</div>
                  <div className="value">{shortlistRate}%</div>
                  <div className="sub">Candidates that made it to shortlist</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Reviewing now</div>
                  <div className="value">{stats.reviewing}</div>
                  <div className="sub">Applications currently under review</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">New this week</div>
                  <div className="value">{stats.recent}</div>
                  <div className="sub">Fresh applications in the last 7 days</div>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Col>

        <Col lg={4}>
          <motion.div className="hr-dash-card h-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
            <div className="card-title mb-3">
              <FaUsers /> Recent Candidates
            </div>
            {recentApplicants.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100, padding: "24px 10px" }}>
                <FaUsers size={22} />
                <p style={{ marginBottom: 0 }}>No recent applications</p>
              </div>
            ) : (
              <div className="hr-insight-list">
                {recentApplicants.map((candidate) => {
                  const statusMeta = APPLICATION_STATUS[candidate.status] || APPLICATION_STATUS[0];
                  return (
                    <div key={candidate.id} className="hr-insight-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/hr/applications/${candidate.id}`)}>
                      <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                        <div className="hr-avatar" style={{ width: 30, height: 30, fontSize: "0.66rem" }}>{getInitials(candidate)}</div>
                        <div>
                          <div className="title">{getApplicantName(candidate)}</div>
                          <div className="sub">{candidate.career_job?.title_en || "No job linked"}</div>
                        </div>
                      </div>
                      <span className="hr-badge" style={{ background: statusMeta.bg, color: statusMeta.text }}>{statusMeta.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </Col>
      </Row>

      {/* Filters */}
      <motion.div className="hr-filter-bar mx-1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <Row className="align-items-end g-3">
          <Col lg={3} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Filter by Job
            </label>
            <Form.Select value={filterJob} onChange={(e) => updateParam("career_job_id", e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All Jobs</option>
              {jobList.map((j) => <option key={j.id} value={j.id}>{j.title_en}</option>)}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Status
            </label>
            <Form.Select value={filterStatus} onChange={(e) => updateParam("status", e.target.value)} style={{ borderRadius: 10 }}>
              {APPLICATION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Source
            </label>
            <Form.Select value={filterSourceChannel} onChange={(e) => updateParam("source_channel", e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All Channels</option>
              {sourceChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>Date From</label>
            <Form.Control type="date" value={dateFrom} onChange={(e) => updateParam("date_from", e.target.value)} style={{ borderRadius: 10 }} />
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>Date To</label>
            <Form.Control type="date" value={dateTo} onChange={(e) => updateParam("date_to", e.target.value)} style={{ borderRadius: 10 }} />
          </Col>
          <Col lg={2} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control
                type="text"
                placeholder="Search by name, email, phone or ID..."
                value={searchTerm}
                onChange={(e) => updateParam("q", e.target.value)}
                style={{ paddingLeft: 40, borderRadius: 10 }}
              />
            </div>
          </Col>
          <Col lg={2} md={4}>
            <Form.Select value={pageSize} onChange={(e) => updateParam("page_size", e.target.value)} style={{ borderRadius: 10 }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </Form.Select>
          </Col>
        </Row>
      </motion.div>

      {/* Table */}
      <motion.div className="hr-table-wrapper mx-1 mt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}>
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Job Title</th>
                <th>Source</th>
                <th>Applied</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody>
                {loading ? (
                  <tr><td colSpan={10}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={10}><div className="hr-empty-state"><FaUsers size={40} /><p>No applications found</p></div></td></tr>
                ) : (
                  paginated.map((row, idx) => {
                    const st = APPLICATION_STATUS[row.status] || APPLICATION_STATUS[0];
                    return (
                      <motion.tr key={row.id} variants={fadeUp} custom={idx} initial="hidden" animate="visible" exit={{ opacity: 0 }} layout>
                        <td><span style={{ fontWeight: 700, color: "#228be6", fontSize: "0.82rem" }}>#{row.id}</span></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="hr-avatar" style={{ width: 34, height: 34, fontSize: "0.7rem", borderRadius: 9 }}>
                              {getInitials(row)}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{getApplicantName(row)}</span>
                          </div>
                        </td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{row.email || "—"}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{getApplicantPhone(row)}</td>
                        <td style={{ fontSize: "0.85rem" }}>{row.career_job?.title_en || "—"}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "capitalize" }}>{row.source_channel || "—"}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatDate(row.created_at)}</td>
                        <td>
                          {ratingsMap[row.id] ? (
                            <div className="d-flex align-items-center gap-1" title={`${ratingsMap[row.id].avg.toFixed(1)} avg • ${ratingsMap[row.id].count} rating${ratingsMap[row.id].count > 1 ? "s" : ""}`}>
                              <div className="hr-stars" style={{ fontSize: "0.9rem" }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} className={`star ${s <= Math.round(ratingsMap[row.id].avg) ? "filled" : ""}`}>★</span>
                                ))}
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 4 }}>
                                ({ratingsMap[row.id].count})
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="hr-badge" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="d-flex justify-content-center gap-2">
                            <motion.button className="hr-action-btn view" onClick={() => navigate(`/hr/applications/${row.id}`)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="View">
                              <FaEye />
                            </motion.button>
                            <motion.button className="hr-action-btn delete" onClick={() => { setDeleteId(row.id); openDelete(); }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="Delete">
                              <FaTrash />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
        {!loading && totalRecords > 0 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-3">
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Showing {start + 1} – {Math.min(start + pageSize, totalRecords)} of {totalRecords}
            </span>
            <CustomPagination recordsPerPage={pageSize} totalRecords={totalRecords} onPageChange={(p) => updateParam("page", String(p))} currentPage={currentPage} />
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      <Modal opened={deleteOpen} onClose={closeDelete} title="Delete Application" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure? This will permanently remove this application and all attachments.</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px" }} onClick={closeDelete}>Cancel</motion.button>
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none" }} onClick={confirmDelete} whileHover={{ scale: 1.03 }}>Delete</motion.button>
        </div>
      </Modal>
    </div>
  );
};

export default HRApplicationsList;
