import React, { useEffect, useState } from "react";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBriefcase,
  FaClock,
  FaArrowLeft,
  FaFileDownload,
  FaClipboardCheck,
  FaStar,
} from "react-icons/fa";
import "./career.css";

const STATUS_MAP = {
  0: { label: "Pending", css: "pending" },
  1: { label: "Reviewing", css: "reviewing" },
  2: { label: "Shortlisted", css: "shortlisted" },
  3: { label: "Interviewed", css: "interviewed" },
  4: { label: "Rejected", css: "rejected" },
  5: { label: "Hired", css: "hired" },
};

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Reviewing" },
  { value: 2, label: "Shortlisted" },
  { value: 3, label: "Interviewed" },
  { value: 4, label: "Rejected" },
  { value: 5, label: "Hired" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const getDetails = () => {
    setLoading(true);
    const url = configWeb.GET_CAREER_APPLICATION_DETAILS(id);
    simpleGetCallAuth(url)
      .then((res) => {
        if (res && !res.error) {
          setApplication(res);
          setStatus(res?.status != null ? Number(res.status) : 0);
          setAdminNotes(res?.admin_notes || "");
          setReviewerName(res?.reviewed_by || "");
        } else {
          notifyError(res?.message?.[0] || "Failed to load application");
        }
      })
      .catch(() => {
        notifyError("Something went wrong. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      getDetails();
    }
  }, [id]);

  const handleUpdate = () => {
    setUpdateLoading(true);
    const url = configWeb.PUT_CAREER_APPLICATION_UPDATE(id);
    const body = JSON.stringify({
      status: Number(status),
      admin_notes: adminNotes,
    });
    simplePutCallAuth(url, body)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Application updated successfully");
          getDetails();
        } else {
          notifyError(
            Array.isArray(res?.message)
              ? res.message[0]
              : res?.message || "Update failed"
          );
        }
      })
      .catch(() => {
        notifyError("Something went wrong. Please try again later.");
      })
      .finally(() => {
        setUpdateLoading(false);
      });
  };

  const handleDownloadCV = () => {
    const token = localStorage?.getItem("token");
    const parse_token = JSON.parse(token);
    const access_token = parse_token?.access_token;

    const url = configWeb.GET_CAREER_APPLICATION_CV(id);
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Download failed");
        }
        const contentDisposition = response.headers.get("content-disposition");
        let filename = `CV_${application?.first_name || "applicant"}_${id}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }
        return response.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(() => {
        notifyError("Failed to download CV");
      });
  };

  if (loading) {
    return (
      <div className="career-module">
        <div className="career-loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="career-module">
        <div className="career-empty-state">
          <FaUser size={48} />
          <p>Application not found</p>
          <Link to="/career/applications">
            <motion.button
              className="career-btn-primary"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaArrowLeft size={13} /> Back to Applications
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const infoItems = [
    { icon: <FaUser />, label: "Full Name", value: `${application.first_name || ""} ${application.last_name || ""}`.trim() || null },
    { icon: <FaEnvelope />, label: "Email", value: application.email },
    { icon: <FaPhone />, label: "Phone", value: application.phone_number ? `+${application.phone_code || ""} ${application.phone_number}` : null },
    { icon: <FaCalendarAlt />, label: "Applied Date", value: application.created_at ? new Date(application.created_at).toLocaleDateString() : null },
    {
      icon: <FaBriefcase />,
      label: "Job Title",
      value: application.career_job?.title_en,
    },
  ].filter((item) => item.value);

  return (
    <div className="career-module">
      {/* Header */}
      <motion.div
        className="career-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="career-header-icon me-3">
                <FaClipboardCheck />
              </div>
              <div>
                <h4 className="career-header-title">Application Detail</h4>
                <p className="career-header-subtitle">
                  {`${application.first_name || ""} ${application.last_name || ""}`.trim()} — applied for{" "}
                  {application.career_job?.title_en || "N/A"}
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <Link to="/career/applications">
              <motion.button
                className="career-btn-primary"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaArrowLeft size={13} /> Back to Applications
              </motion.button>
            </Link>
          </Col>
        </Row>
      </motion.div>

      <Row className="px-2">
        {/* Left: Applicant Info */}
        <Col lg={8}>
          <motion.div
            className="career-detail-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="d-flex align-items-center mb-4">
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(application.first_name || "?")[0].toUpperCase()}
              </div>
              <div className="ms-3">
                <h5 className="mb-0 fw-bold">{`${application.first_name || ""} ${application.last_name || ""}`.trim() || "N/A"}</h5>
                <span
                  className={`career-badge ${STATUS_MAP[application.status]?.css || "pending"}`}
                  style={{ marginTop: "4px", display: "inline-flex" }}
                >
                  {STATUS_MAP[application.status]?.label || "N/A"}
                </span>
              </div>
            </div>

            <Row>
              {infoItems.map((item, i) => (
                <Col md={6} key={item.label} className="mb-3">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i + 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2563eb",
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="ms-3">
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>
                        {item.value}
                      </div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {application.cover_letter && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={infoItems.length + 1}
                className="mt-3"
              >
                <h6 className="fw-bold mb-2" style={{ color: "#475569" }}>
                  Cover Letter
                </h6>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    color: "#334155",
                  }}
                >
                  {application.cover_letter}
                </div>
              </motion.div>
            )}

            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                className="career-cv-btn"
                onClick={handleDownloadCV}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaFileDownload size={16} /> Download CV
              </motion.button>
            </motion.div>
          </motion.div>
        </Col>

        {/* Right: Review Panel */}
        <Col lg={4}>
          <motion.div
            className="career-detail-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="d-flex align-items-center mb-4">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              >
                <FaStar />
              </div>
              <h6 className="mb-0 ms-2 fw-bold" style={{ color: "#1e293b" }}>
                Review & Update
              </h6>
            </div>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Application Status
              </Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                style={{ borderRadius: "10px" }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Reviewer Name
              </Form.Label>
              <Form.Control
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Enter reviewer name"
                style={{ borderRadius: "10px" }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Admin Notes
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this application..."
                style={{ borderRadius: "10px", resize: "vertical" }}
              />
            </Form.Group>

            <motion.button
              className="career-btn-primary w-100"
              onClick={handleUpdate}
              disabled={updateLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: "0.75rem", fontSize: "0.9rem", justifyContent: "center" }}
            >
              {updateLoading ? <Spinner size="sm" /> : "Update Application"}
            </motion.button>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

export default ApplicationDetail;
