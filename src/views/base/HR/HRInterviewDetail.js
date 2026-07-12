import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { Modal, Rating } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaClock,
  FaUser,
  FaVideo,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaStickyNote,
  FaStar,
  FaBriefcase,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  INTERVIEW_STATUS,
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPES,
  formatDateTime,
  getApplicantName,
  getApplicantPhone,
  getInitials,
} from "./hrConstants";
import "./hr.css";

const HRInterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Update form
  const [status, setStatus] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewType, setInterviewType] = useState("in-person");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reschedule modal
  const [reschedOpen, { open: openResched, close: closeResched }] = useDisclosure(false);
  const [reschedDate, setReschedDate] = useState("");

  const load = () => {
    setLoading(true);
    simpleGetCallAuth(configWeb.GET_RECRUITING_INTERVIEW_DETAILS(id))
      .then((res) => {
        const d = res?.data || res;
        setData(d);
        setStatus(d.status ?? 0);
        setFeedback(d.feedback || "");
        setRating(d.rating || 0);
        setInterviewDate(d.interview_date ? d.interview_date.slice(0, 16) : "");
        setInterviewType(d.interview_type || "in-person");
        setLocation(d.location || "");
        setNotes(d.notes || "");
      })
      .catch(() => notifyError("Failed to load interview"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = () => {
    setSaving(true);
    const body = JSON.stringify({
      status,
      feedback,
      rating: rating || undefined,
      interview_date: interviewDate,
      interview_type: interviewType,
      location,
      notes,
    });
    simplePutCallAuth(configWeb.PUT_RECRUITING_INTERVIEW_UPDATE(id), body)
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("Interview updated");
          load();
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Update failed");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setSaving(false));
  };

  const handleReschedule = () => {
    if (!reschedDate) return notifyError("Select new date");
    setSaving(true);
    const body = JSON.stringify({ interview_date: reschedDate, status: 4 });
    simplePutCallAuth(configWeb.PUT_RECRUITING_INTERVIEW_UPDATE(id), body)
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("Interview rescheduled");
          closeResched();
          load();
        } else notifyError("Reschedule failed");
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <div className="hr-module"><div className="hr-loading"><Spinner animation="border" /></div></div>;
  }

  if (!data) {
    return (
      <div className="hr-module">
        <div className="hr-empty-state"><FaCalendarCheck size={40} /><p>Interview not found</p></div>
      </div>
    );
  }

  const ist = INTERVIEW_STATUS[data.status] || INTERVIEW_STATUS[0];
  const app = data.application;
  const candidateName = app ? getApplicantName(app) : `App #${data.application_id}`;
  const initials = app ? getInitials(app) : "#";

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo className="me-1" />;
    if (type === "phone") return <FaPhoneAlt className="me-1" />;
    return <FaMapMarkerAlt className="me-1" />;
  };

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <motion.button
                className="btn me-3"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", padding: "8px 12px" }}
                onClick={() => navigate("/hr/interviews")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft />
              </motion.button>
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  Interview #{data.id}
                  <span className="hr-badge" style={{ background: ist.bg, color: ist.text, fontSize: "0.72rem" }}>{ist.label}</span>
                </h4>
                <p>
                  with <strong>{candidateName}</strong> — {formatDateTime(data.interview_date)}
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2 flex-wrap">
              {app && (
                <motion.button
                  className="btn"
                  style={{ background: "#228be6", color: "#fff", border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 600, fontSize: "0.82rem" }}
                  onClick={() => navigate(`/hr/applications/${data.application_id}`)}
                  whileHover={{ scale: 1.04 }}
                >
                  <FaBriefcase className="me-1" /> Application
                </motion.button>
              )}
              {data.status === 0 && (
                <motion.button
                  className="btn"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "8px 18px", fontWeight: 600, fontSize: "0.82rem" }}
                  onClick={openResched}
                  whileHover={{ scale: 1.04 }}
                >
                  <FaClock className="me-1" /> Reschedule
                </motion.button>
              )}
            </div>
          </Col>
        </Row>
      </motion.div>

      <Row className="mx-1 mt-3 g-3">
        {/* Left — Interview Info & Candidate */}
        <Col lg={7}>
          {/* Interview Info */}
          <motion.div className="hr-detail-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <h6 className="fw-bold mb-3"><FaCalendarCheck className="me-2 text-primary" />Interview Details</h6>
            <Row className="g-3">
              <Col md={6}>
                <div className="hr-info-item">
                  <div className="hr-info-icon"><FaClock /></div>
                  <div><small className="text-muted">Date & Time</small><div className="fw-semibold">{formatDateTime(data.interview_date)}</div></div>
                </div>
              </Col>
              <Col md={6}>
                <div className="hr-info-item">
                  <div className="hr-info-icon">{interviewTypeIcon(data.interview_type)}</div>
                  <div><small className="text-muted">Type</small><div className="fw-semibold" style={{ textTransform: "capitalize" }}>{data.interview_type || "—"}</div></div>
                </div>
              </Col>
              <Col md={6}>
                <div className="hr-info-item">
                  <div className="hr-info-icon"><FaMapMarkerAlt /></div>
                  <div><small className="text-muted">Location</small><div className="fw-semibold">{data.location || "—"}</div></div>
                </div>
              </Col>
              <Col md={6}>
                <div className="hr-info-item">
                  <div className="hr-info-icon"><FaUser /></div>
                  <div>
                    <small className="text-muted">Interviewer</small>
                    <div className="fw-semibold">
                      {data.interviewer ? `${data.interviewer.first_name || ""} ${data.interviewer.last_name || ""}`.trim() : "—"}
                    </div>
                  </div>
                </div>
              </Col>
              {data.rating > 0 && (
                <Col md={6}>
                  <div className="hr-info-item">
                    <div className="hr-info-icon"><FaStar /></div>
                    <div>
                      <small className="text-muted">Rating</small>
                      <div className="hr-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`star ${s <= data.rating ? "filled" : ""}`}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
            {data.notes && (
              <div className="mt-3 p-3" style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <small className="text-muted d-flex align-items-center gap-1 mb-1"><FaStickyNote size={10} /> Pre-Interview Notes</small>
                <p className="mb-0" style={{ fontSize: "0.88rem", color: "#334155" }}>{data.notes}</p>
              </div>
            )}
            {data.feedback && (
              <div className="mt-2 p-3" style={{ background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                <small className="text-muted d-flex align-items-center gap-1 mb-1"><FaStar size={10} /> Feedback</small>
                <p className="mb-0" style={{ fontSize: "0.88rem", color: "#166534" }}>{data.feedback}</p>
              </div>
            )}
          </motion.div>

          {/* Candidate Card */}
          {app && (
            <motion.div className="hr-detail-card mt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <h6 className="fw-bold mb-3"><FaUser className="me-2 text-primary" />Candidate</h6>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="hr-avatar" style={{ width: 52, height: 52, fontSize: "1rem" }}>{initials}</div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "1rem" }}>{candidateName}</div>
                  {app.career_job?.title_en && <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Applied for: {app.career_job.title_en}</div>}
                </div>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <div className="hr-info-item">
                    <div className="hr-info-icon"><FaEnvelope /></div>
                    <div><small className="text-muted">Email</small><div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{app.email || "—"}</div></div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="hr-info-item">
                    <div className="hr-info-icon"><FaPhone /></div>
                    <div><small className="text-muted">Phone</small><div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{getApplicantPhone(app)}</div></div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="hr-info-item">
                    <div className="hr-info-icon"><FaBriefcase /></div>
                    <div><small className="text-muted">Experience</small><div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{app.experience_years ? `${app.experience_years} years` : "—"}</div></div>
                  </div>
                </Col>
              </Row>
              <div className="mt-3 text-end">
                <motion.button
                  className="btn btn-sm"
                  style={{ borderRadius: 10, padding: "6px 16px", border: "1px solid #228be6", color: "#228be6", fontWeight: 600, fontSize: "0.82rem" }}
                  onClick={() => navigate(`/hr/applications/${data.application_id}`)}
                  whileHover={{ scale: 1.04 }}
                >
                  View Full Application
                </motion.button>
              </div>
            </motion.div>
          )}
        </Col>

        {/* Right — Edit Panel */}
        <Col lg={5}>
          <motion.div className="hr-detail-card" style={{ position: "sticky", top: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <h6 className="fw-bold mb-3">Update Interview</h6>

            <div className="hr-spotlight-card mb-3">
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.6px" }}>Quick summary</div>
              <Row className="g-2 mt-1">
                <Col xs={4}>
                  <div className="hr-mini-metric" style={{ padding: 12 }}>
                    <div className="label">Status</div>
                    <div className="sub" style={{ marginTop: 8, fontWeight: 700, color: "#0f172a" }}>{ist.label}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="hr-mini-metric" style={{ padding: 12 }}>
                    <div className="label">Type</div>
                    <div className="sub" style={{ marginTop: 8, fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>{data.interview_type || "in-person"}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="hr-mini-metric" style={{ padding: 12 }}>
                    <div className="label">Rating</div>
                    <div className="value" style={{ fontSize: "1.05rem" }}>{data.rating || "—"}</div>
                  </div>
                </Col>
              </Row>
            </div>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(Number(e.target.value))} style={{ borderRadius: 10 }}>
                {INTERVIEW_STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Date & Time</Form.Label>
                  <Form.Control type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} style={{ borderRadius: 10 }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Type</Form.Label>
                  <Form.Select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} style={{ borderRadius: 10 }}>
                    {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Location</Form.Label>
              <Form.Control value={location} onChange={(e) => setLocation(e.target.value)} style={{ borderRadius: 10 }} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Notes</Form.Label>
              <Form.Control as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ borderRadius: 10, resize: "vertical" }} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Rating</Form.Label>
              <div>
                <Rating value={rating} onChange={setRating} size="lg" color="orange" />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Feedback</Form.Label>
              <Form.Control as="textarea" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Post-interview feedback..." style={{ borderRadius: 10, resize: "vertical" }} />
            </Form.Group>

            <motion.button
              className="btn w-100"
              style={{
                borderRadius: 12,
                padding: "10px 0",
                background: "#228be6",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "none",
              }}
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? <Spinner size="sm" /> : "Save Changes"}
            </motion.button>
          </motion.div>
        </Col>
      </Row>

      {/* Reschedule Modal */}
      <Modal opened={reschedOpen} onClose={closeResched} title="Reschedule Interview" centered radius="lg" size="sm">
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>New Date & Time</Form.Label>
          <Form.Control type="datetime-local" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} style={{ borderRadius: 10 }} />
        </Form.Group>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px" }} onClick={closeResched}>Cancel</motion.button>
          <motion.button
            className="btn btn-sm"
            style={{ borderRadius: 10, padding: "8px 20px", background: "#228be6", color: "#fff", border: "none", fontWeight: 600 }}
            onClick={handleReschedule}
            disabled={saving}
            whileHover={{ scale: 1.03 }}
          >
            {saving ? <Spinner size="sm" /> : "Reschedule"}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
};

export default HRInterviewDetail;
