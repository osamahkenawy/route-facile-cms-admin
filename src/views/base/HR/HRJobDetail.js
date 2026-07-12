import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { Badge } from "@mantine/core";
import {
  FaBriefcase,
  FaArrowLeft,
  FaEdit,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import JobKeywordsManager from "./JobKeywordsManager";
import JobShareButtons from "./JobShareButtons";
import { JOB_STATUS, formatDate } from "./hrConstants";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [applicantCount, setApplicantCount] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    simpleGetCallAuth(configWeb.GET_CAREER_JOB_DETAILS(id))
      .then((res) => {
        if (res && !res.error) setJob(res);
        else notifyError("Failed to load job details");
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setLoading(false));

    simpleGetCallAuth(`${configWeb.GET_CAREER_APPLICATION_LIST}?career_job_id=${id}&page=1&page_size=1`)
      .then((res) => setApplicantCount(res?.total ?? res?.data?.length ?? null))
      .catch(() => setApplicantCount(null));
  }, [id]);

  const expired = useMemo(
    () => job?.expiry_date && new Date(job.expiry_date) < new Date(),
    [job]
  );

  const daysLeft = useMemo(() => {
    if (!job?.expiry_date) return null;
    return Math.ceil((new Date(job.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
  }, [job]);

  if (loading) {
    return (
      <div className="hr-module">
        <div className="hr-loading"><Spinner animation="border" /></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="hr-module">
        <div className="hr-empty-state">
          <FaBriefcase size={40} />
          <p>Job not found</p>
        </div>
      </div>
    );
  }

  const statusMeta = JOB_STATUS[job.status] || JOB_STATUS[0];

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaBriefcase /></div>
              <div>
                <h4>{job.title_en || `Job #${job.id}`}</h4>
                <p>Job posting overview &amp; AI screening setup</p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <motion.button
                className="btn"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => navigate("/hr/jobs")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaArrowLeft size={12} /> Back
              </motion.button>
              <motion.button
                className="btn"
                style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: "0.85rem", border: "none", display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => navigate(`/hr/jobs/${id}/edit`)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaEdit size={12} /> Edit Job
              </motion.button>
            </div>
          </Col>
        </Row>
      </motion.div>

      <Row className="g-3 px-1 mt-1">
        {/* Job overview */}
        <Col lg={8}>
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <h6 style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <FaBriefcase size={14} style={{ color: "#228be6" }} /> Overview
              </h6>
              <div className="d-flex align-items-center gap-2">
                <span className="hr-badge" style={{ background: statusMeta.bg, color: statusMeta.text }}>{statusMeta.label}</span>
                {expired && <Badge size="sm" color="red" variant="light">Expired</Badge>}
                {!expired && daysLeft != null && daysLeft <= 7 && (
                  <Badge size="sm" color="orange" variant="light">Closing in {Math.max(daysLeft, 0)}d</Badge>
                )}
              </div>
            </div>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label"><FaMapMarkerAlt size={11} className="me-1" /> Location</div>
                  <div className="value" style={{ fontSize: "1rem" }}>{job.location_en || "—"}</div>
                  {job.location_ae && <div className="sub" style={{ direction: "rtl" }}>{job.location_ae}</div>}
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label"><FaClock size={11} className="me-1" /> Experience</div>
                  <div className="value" style={{ fontSize: "1rem" }}>{job.experience_years != null ? `${job.experience_years} yrs` : "—"}</div>
                  <div className="sub">Required level</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="hr-mini-metric">
                  <div className="label"><FaCalendarAlt size={11} className="me-1" /> Expiry</div>
                  <div className="value" style={{ fontSize: "1rem", color: expired ? "#ef4444" : "#0f172a" }}>{formatDate(job.expiry_date)}</div>
                  <div className="sub">{expired ? "Already expired" : daysLeft != null ? `${Math.max(daysLeft, 0)} days left` : "—"}</div>
                </div>
              </Col>
            </Row>

            {(job.title_ae && job.title_ae !== job.title_en) && (
              <div className="mb-3">
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Title (AR)</div>
                <div style={{ direction: "rtl", color: "#0f172a", fontWeight: 600 }}>{job.title_ae}</div>
              </div>
            )}

            <div className="mb-3">
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Description (EN)</div>
              <div
                style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: job.description_en || "<em>No description provided</em>" }}
              />
            </div>

            {job.description_ae && (
              <div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Description (AR)</div>
                <div
                  style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.6, direction: "rtl" }}
                  dangerouslySetInnerHTML={{ __html: job.description_ae }}
                />
              </div>
            )}
          </motion.div>
        </Col>

        {/* Side stats */}
        <Col lg={4}>
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <h6 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaUsers size={14} style={{ color: "#228be6" }} /> At a glance
            </h6>
            <Row className="g-3 mt-1">
              <Col xs={12}>
                <div className="hr-mini-metric">
                  <div className="label">Applications</div>
                  <div className="value">{applicantCount ?? "—"}</div>
                  <div className="sub">Total received for this role</div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="hr-mini-metric">
                  <div className="label">Status</div>
                  <div className="value" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    {expired ? (
                      <><FaExclamationTriangle style={{ color: "#ef4444" }} /> Expired</>
                    ) : job.status === 1 ? (
                      <><FaCheckCircle style={{ color: "#22c55e" }} /> Active &amp; live</>
                    ) : (
                      <><FaExclamationTriangle style={{ color: "#94a3b8" }} /> Paused</>
                    )}
                  </div>
                  <div className="sub">{expired ? "Renew to start collecting applicants" : "Visible on careers page"}</div>
                </div>
              </Col>
              <Col xs={12}>
                <button
                  type="button"
                  className="btn w-100"
                  style={{ background: "#0a1733", color: "#fff", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: "0.85rem", border: "none" }}
                  onClick={() => navigate(`/hr/applications?career_job_id=${id}`)}
                >
                  View Applicants
                </button>
              </Col>
            </Row>
          </motion.div>
        </Col>

        {/* AI Keywords */}
        <Col lg={12}>
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <JobKeywordsManager jobId={id} />
          </motion.div>
        </Col>

        {/* Share Job */}
        <Col lg={12}>
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <JobShareButtons jobId={id} title={job.title_en} />
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

export default HRJobDetail;
