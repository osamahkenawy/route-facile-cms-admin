import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaCalendarCheck,
  FaPlus,
  FaEye,
  FaTrash,
  FaSearch,
  FaFilter,
  FaClock,
  FaVideo,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaStar,
} from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simpleDeleteCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import {
  INTERVIEW_STATUS,
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPES,
  formatDateTime,
} from "./hrConstants";
import "./hr.css";
import HRExportButtons from "./HRExportButtons";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRInterviewsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Schedule Modal
  const initialScheduleForm = {
    application_id: "",
    interview_date: "",
    interview_type: "in-person",
    location: "",
    notes: "",
    interviewer_id: "",
  };
  const [scheduleOpen, { open: openSchedule, close: closeScheduleRaw }] = useDisclosure(false);
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
  const closeSchedule = () => {
    setScheduleForm(initialScheduleForm);
    closeScheduleRaw();
  };
  const [scheduling, setScheduling] = useState(false);

  // Applications dropdown
  const [appDropdown, setAppDropdown] = useState([]);

  // Cancel modal
  const [cancelOpen, { open: openCancel, close: closeCancel }] = useDisclosure(false);
  const [cancelId, setCancelId] = useState(null);

  const loadInterviews = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.append("status", filterStatus);
    params.append("page", 1);
    params.append("page_size", 9999);
    simpleGetCallAuth(`${configWeb.GET_RECRUITING_INTERVIEW_LIST}?${params.toString()}`)
      .then((res) => setInterviews(res?.data || []))
      .catch(() => { notifyError("Failed to load interviews"); setInterviews([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    simpleGetCallAuth(`${configWeb.GET_CAREER_APPLICATION_LIST}?page_size=9999`)
      .then((res) => setAppDropdown(res?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadInterviews(); }, [filterStatus]);

  const filtered = useMemo(() => {
    let list = interviews;
    if (filterType) list = list.filter((iv) => iv.interview_type === filterType);
    if (!searchTerm) return list;
    const t = searchTerm.toLowerCase();
    return list.filter((iv) => {
      const name = iv.application
        ? `${iv.application.first_name || ""} ${iv.application.last_name || ""} ${iv.application.full_name || ""}`.toLowerCase()
        : "";
      return name.includes(t) || (iv.location && iv.location.toLowerCase().includes(t)) || String(iv.id).includes(searchTerm);
    });
  }, [interviews, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: interviews.length,
    today: interviews.filter((iv) => iv.interview_date && new Date(iv.interview_date).toDateString() === new Date().toDateString()).length,
    upcoming: interviews.filter((iv) => iv.interview_date && new Date(iv.interview_date) > new Date() && iv.status === 0).length,
    completed: interviews.filter((iv) => iv.status === 1).length,
    avgRating: interviews.filter((iv) => iv.rating).length
      ? (
          interviews.filter((iv) => iv.rating).reduce((sum, iv) => sum + Number(iv.rating || 0), 0) /
          interviews.filter((iv) => iv.rating).length
        ).toFixed(1)
      : "0.0",
  }), [interviews]);

  const upcomingQueue = useMemo(
    () => [...filtered].filter((iv) => iv.interview_date && new Date(iv.interview_date) >= new Date()).sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date)).slice(0, 4),
    [filtered]
  );

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo size={11} className="me-1" />;
    if (type === "phone") return <FaPhoneAlt size={11} className="me-1" />;
    return <FaMapMarkerAlt size={11} className="me-1" />;
  };

  const handleSchedule = () => {
    if (!scheduleForm.application_id || !scheduleForm.interview_date) {
      return notifyError("Application and date are required");
    }
    setScheduling(true);
    let currentUserId = null;
    try {
      const t = JSON.parse(localStorage.getItem("token") || "{}");
      currentUserId = t?.user_id ? Number(t.user_id) : null;
    } catch (e) { /* noop */ }
    const interviewerId = scheduleForm.interviewer_id
      ? Number(scheduleForm.interviewer_id)
      : currentUserId;
    const body = JSON.stringify({
      application_id: Number(scheduleForm.application_id),
      interview_date: scheduleForm.interview_date,
      interview_type: scheduleForm.interview_type,
      location: scheduleForm.location,
      notes: scheduleForm.notes,
      ...(interviewerId && { interviewer_id: interviewerId }),
    });
    simplePostCallAuth(configWeb.POST_RECRUITING_INTERVIEW_CREATE, body)
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("Interview scheduled");
          closeSchedule();
          setScheduleForm(initialScheduleForm);
          loadInterviews();
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to schedule");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setScheduling(false));
  };

  const confirmCancel = () => {
    if (!cancelId) return;
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_INTERVIEW(cancelId))
      .then((res) => {
        if (res && !res.error) { notifySuccess("Interview cancelled"); loadInterviews(); }
        else notifyError("Failed to cancel");
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => { setCancelId(null); closeCancel(); });
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterType]);

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaCalendarCheck /></div>
              <div>
                <h4>Interviews</h4>
                <p>Schedule and manage all interview sessions</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-interviews"
              title="HR Interviews"
              sheetName="Interviews"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Application ID", accessor: (r) => r.application_id },
                { header: "Candidate", accessor: (r) => (r.application ? `${r.application.first_name || ""} ${r.application.last_name || ""}`.trim() : "") },
                { header: "Type", accessor: (r) => r.interview_type || "" },
                { header: "Date", accessor: (r) => formatDateTime(r.interview_date) },
                { header: "Location", accessor: (r) => r.location || "" },
                { header: "Status", accessor: (r) => INTERVIEW_STATUS[r.status]?.label || "" },
                { header: "Notes", accessor: (r) => r.notes || "" },
              ]}
            />
            <motion.button
              className="btn"
              style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: "0.85rem", border: "none", display: "flex", alignItems: "center", gap: 8 }}
              onClick={openSchedule}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaPlus size={12} /> Schedule Interview
            </motion.button>
          </Col>
        </Row>
      </motion.div>

      <Row className="mx-1 mt-3 g-3 mb-3">
        {[
          { label: "Total", value: stats.total, color: "blue", icon: <FaCalendarCheck /> },
          { label: "Today", value: stats.today, color: "amber", icon: <FaClock /> },
          { label: "Upcoming", value: stats.upcoming, color: "cyan", icon: <FaCalendarCheck /> },
          { label: "Completed", value: stats.completed, color: "green", icon: <FaCheckCircle /> },
          { label: "Avg Rating", value: stats.avgRating, color: "red", icon: <FaStar /> },
        ].map((card, idx) => (
          <Col xl={true} lg={4} md={6} key={card.label}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={idx}>
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

      <Row className="mx-1 mt-2 g-3 mb-3">
        <Col lg={8}>
          <motion.div className="hr-dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="card-title mb-0">
                <FaFilter /> Schedule Filters
              </div>
              <div className="hr-chip-group">
                {[
                  { label: "All", value: "" },
                  { label: "Video", value: "video" },
                  { label: "Phone", value: "phone" },
                  { label: "On-site", value: "in-person" },
                ].map((item) => (
                  <button key={item.label} className={`hr-chip ${filterType === item.value ? "active" : ""}`} onClick={() => setFilterType(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Video calls</div>
                  <div className="value">{interviews.filter((iv) => iv.interview_type === "video").length}</div>
                  <div className="sub">Remote interview sessions</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">Phone screens</div>
                  <div className="value">{interviews.filter((iv) => iv.interview_type === "phone").length}</div>
                  <div className="sub">Short qualification conversations</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label">On-site</div>
                  <div className="value">{interviews.filter((iv) => !iv.interview_type || iv.interview_type === "in-person").length}</div>
                  <div className="sub">In-person interview rounds</div>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Col>

        <Col lg={4}>
          <motion.div className="hr-dash-card h-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}>
            <div className="card-title mb-3">
              <FaCalendarCheck /> Upcoming Queue
            </div>
            {upcomingQueue.length === 0 ? (
              <div className="hr-empty-state" style={{ minHeight: 100, padding: "24px 10px" }}>
                <FaCalendarCheck size={22} />
                <p style={{ marginBottom: 0 }}>No upcoming interviews</p>
              </div>
            ) : (
              <div className="hr-insight-list">
                {upcomingQueue.map((iv) => (
                  <div key={iv.id} className="hr-insight-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/hr/interview/${iv.id}`)}>
                    <div>
                      <div className="title">
                        {iv.application ? `${iv.application.first_name || ""} ${iv.application.last_name || ""}`.trim() : `App #${iv.application_id}`}
                      </div>
                      <div className="sub">{formatDateTime(iv.interview_date)}</div>
                    </div>
                    <span className="hr-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{iv.interview_type || "in-person"}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </Col>
      </Row>

      {/* Filters */}
      <motion.div className="hr-filter-bar mx-1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Row className="align-items-end g-3">
          <Col lg={3} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Status
            </label>
            <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ borderRadius: 10 }}>
              {INTERVIEW_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Type
            </label>
            <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All types</option>
              {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col lg={4} md={6}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control type="text" placeholder="Search by candidate, location or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: 40, borderRadius: 10 }} />
            </div>
          </Col>
          <Col lg={2} md={3}>
            <Form.Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ borderRadius: 10 }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </Col>
          <Col className="text-end">
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{totalRecords} interview(s)</span>
          </Col>
        </Row>
      </motion.div>

      {/* Table */}
      <motion.div className="hr-table-wrapper mx-1 mt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }}>
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Location</th>
                <th>Interviewer</th>
                <th>Status</th>
                <th>Rating</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody>
                {loading ? (
                  <tr><td colSpan={9}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9}><div className="hr-empty-state"><FaCalendarCheck size={40} /><p>No interviews found</p></div></td></tr>
                ) : (
                  paginated.map((iv, idx) => {
                    const ist = INTERVIEW_STATUS[iv.status] || INTERVIEW_STATUS[0];
                    const candidateName = iv.application
                      ? `${iv.application.first_name || ""} ${iv.application.last_name || ""}`.trim() || iv.application.full_name || `#${iv.application_id}`
                      : `App #${iv.application_id}`;
                    return (
                      <motion.tr key={iv.id} variants={fadeUp} custom={idx} initial="hidden" animate="visible" layout>
                        <td><span style={{ fontWeight: 700, color: "#228be6", fontSize: "0.82rem" }}>#{iv.id}</span></td>
                        <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{candidateName}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.82rem" }}>
                            <FaClock size={10} className="text-muted" />
                            {formatDateTime(iv.interview_date)}
                          </div>
                          {iv.interview_date && new Date(iv.interview_date).toDateString() === new Date().toDateString() && (
                            <span className="hr-badge mt-2" style={{ background: "#eff6ff", color: "#1d4ed8" }}>Today</span>
                          )}
                        </td>
                        <td>
                          <span className="d-flex align-items-center" style={{ fontSize: "0.82rem" }}>
                            {interviewTypeIcon(iv.interview_type)}
                            <span style={{ textTransform: "capitalize" }}>{iv.interview_type || "—"}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{iv.location || "—"}</td>
                        <td style={{ fontSize: "0.82rem" }}>
                          {iv.interviewer ? `${iv.interviewer.first_name || ""} ${iv.interviewer.last_name || ""}`.trim() : "—"}
                        </td>
                        <td>
                          <span className="hr-badge" style={{ background: ist.bg, color: ist.text }}>{ist.label}</span>
                        </td>
                        <td>
                          {iv.rating ? (
                            <div className="hr-stars">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className={`star ${s <= iv.rating ? "filled" : ""}`}>★</span>
                              ))}
                            </div>
                          ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="d-flex justify-content-center gap-2">
                            <motion.button className="hr-action-btn view" onClick={() => navigate(`/hr/interview/${iv.id}`)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="View Detail">
                              <FaEye />
                            </motion.button>
                            {iv.status === 0 && (
                              <motion.button className="hr-action-btn delete" onClick={() => { setCancelId(iv.id); openCancel(); }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="Cancel">
                                <FaTrash />
                              </motion.button>
                            )}
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
            <CustomPagination recordsPerPage={pageSize} totalRecords={totalRecords} onPageChange={setCurrentPage} currentPage={currentPage} />
          </div>
        )}
      </motion.div>

      {/* Schedule Interview Modal */}
      <Modal opened={scheduleOpen} onClose={closeSchedule} title="Schedule Interview" centered radius="lg" size="lg">
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Application *</Form.Label>
          <Form.Select value={scheduleForm.application_id} onChange={(e) => setScheduleForm({ ...scheduleForm, application_id: e.target.value })} style={{ borderRadius: 10 }}>
            <option value="">Select an application...</option>
            {appDropdown.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} — {a.first_name || ""} {a.last_name || ""} ({a.career_job?.title_en || "N/A"})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Date & Time *</Form.Label>
              <Form.Control type="datetime-local" value={scheduleForm.interview_date} onChange={(e) => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })} style={{ borderRadius: 10 }} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Interview Type</Form.Label>
              <Form.Select value={scheduleForm.interview_type} onChange={(e) => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })} style={{ borderRadius: 10 }}>
                {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Location</Form.Label>
          <Form.Control value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="e.g. Head Office - Room 3" style={{ borderRadius: 10 }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Notes</Form.Label>
          <Form.Control as="textarea" rows={2} value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} placeholder="Pre-interview notes..." style={{ borderRadius: 10, resize: "vertical" }} />
        </Form.Group>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 24px" }} onClick={closeSchedule}>Cancel</motion.button>
          <motion.button
            className="btn btn-sm"
            style={{ borderRadius: 10, padding: "8px 24px", background: "#228be6", color: "#fff", border: "none", fontWeight: 600 }}
            onClick={handleSchedule}
            disabled={scheduling}
            whileHover={{ scale: 1.03 }}
          >
            {scheduling ? <Spinner size="sm" /> : "Schedule"}
          </motion.button>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal opened={cancelOpen} onClose={closeCancel} title="Cancel Interview" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure you want to cancel this interview?</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px" }} onClick={closeCancel}>No</motion.button>
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none" }} onClick={confirmCancel} whileHover={{ scale: 1.03 }}>Yes, Cancel</motion.button>
        </div>
      </Modal>
    </div>
  );
};

export default HRInterviewsList;
