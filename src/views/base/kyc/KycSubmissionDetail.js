import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaUserShield,
  FaIdBadge,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPhoneAlt,
  FaEnvelope,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaCalendarAlt,
  FaGlobe,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaFile,
  FaDownload,
  FaSearchPlus,
  FaShieldAlt,
  FaSignature,
  FaPaperPlane,
  FaInbox,
  FaEye,
  FaHourglassHalf,
  FaThumbsUp,
  FaThumbsDown,
  FaExclamationTriangle,
  FaUserEdit,
  FaStickyNote,
  FaSms,
  FaFingerprint,
} from "react-icons/fa";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import {
  authHeaders,
  fetchKycJson,
  filenameFromDisposition,
  formatBytes,
  formatDateTime,
  resolveDocumentSlots,
  documentsCompletion,
  statusMeta,
} from "./kycHelpers";
import "../HR/hr.css";
import "./kyc.css";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const Field = ({ icon, label, value, full }) => (
  <Col md={full ? 12 : 6} className="mb-3">
    <div className="kyc-field h-100">
      <div className="kyc-field-label">
        {icon}
        {label}
      </div>
      <div
        className={`kyc-field-value ${
          value === 0 || value ? "" : "muted"
        }`}
      >
        {value === 0 || value ? value : "—"}
      </div>
    </div>
  </Col>
);

const SectionTitle = ({ icon, title, sub }) => (
  <div className="kyc-section-title">
    <span className="icon">{icon}</span>
    <div>
      <h6>{title}</h6>
      {sub ? (
        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{sub}</div>
      ) : null}
    </div>
  </div>
);

const renderMobile = (s) => {
  if (!s) return "";
  const code = s.contact_mobile_country_code || s.contact_mobile_code || "";
  const number = s.contact_mobile_number || s.contact_mobile || "";
  if (!code && !number) return "";
  return `${code ? code + " " : ""}${number || ""}`.trim();
};

const renderLandline = (s) => {
  if (!s) return "";
  const code = s.contact_landline_country_code || s.contact_landline_code || "";
  const number = s.contact_landline_number || s.contact_landline || "";
  if (!code && !number) return "";
  return `${code ? code + " " : ""}${number || ""}`.trim();
};

const attachmentVisual = (mime) => {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf"))
    return { cls: "pdf", icon: <FaFilePdf /> };
  if (m.startsWith("image/"))
    return { cls: "image", icon: <FaFileImage /> };
  return { cls: "", icon: <FaFile /> };
};

const statusIcon = (s) => {
  switch (s) {
    case "approved":
      return <FaCheckCircle size={11} />;
    case "rejected":
      return <FaTimesCircle size={11} />;
    case "under_review":
      return <FaHourglassHalf size={11} />;
    case "submitted":
      return <FaPaperPlane size={11} />;
    default:
      return <FaClock size={11} />;
  }
};

const ACTION_CONFIG = {
  approved: {
    title: "Approve KYC Submission",
    confirmLabel: "Approve",
    successMessage: "Submission approved",
    requireRejection: false,
  },
  rejected: {
    title: "Reject KYC Submission",
    confirmLabel: "Reject",
    successMessage: "Submission rejected",
    requireRejection: true,
  },
};

const KycSubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preview modal
  const [previewOpened, { open: openPreview, close: closePreview }] =
    useDisclosure(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Review modal
  const [reviewOpened, { open: openReview, close: closeReview }] =
    useDisclosure(false);
  const [reviewAction, setReviewAction] = useState(null); // under_review | approved | rejected
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reasonInvalid, setReasonInvalid] = useState(false);

  // PDF download
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Signature image (admin-auth blob)
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const url = configWeb.GET_KYC_SUBMISSION_DETAILS(id);
      const { ok, status: httpStatus, data: resp } = await fetchKycJson(url);
      if (cancelled) return;
      if (!ok) {
        if (httpStatus === 403) {
          notifyError("You do not have permission to view this submission.");
        } else if (httpStatus === 404) {
          notifyError("Submission not found.");
        } else {
          notifyError(resp?.message || "Failed to load submission");
        }
        setData(null);
        setLoading(false);
        return;
      }
      const payload = resp?.data || resp || {};
      const sanitized = { ...payload };
      Object.keys(sanitized).forEach((k) => {
        if (/_otp$/i.test(k) || /_otp_expires_at$/i.test(k)) {
          delete sanitized[k];
        }
      });
      setData(sanitized);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewName("");
    closePreview();
  };

  const downloadAttachment = async (att) => {
    const url = configWeb.GET_KYC_ATTACHMENT_DOWNLOAD(id, att.id);
    try {
      const res = await fetch(url, { method: "GET", headers: authHeaders() });
      if (!res.ok) {
        notifyError(`Download failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const fallback =
        att.original_name || att.file_name || `attachment-${att.id}`;
      const dispo = res.headers.get("Content-Disposition");
      const filename = filenameFromDisposition(dispo, fallback);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch (e) {
      notifyError("Download failed");
    }
  };

  const previewAttachment = async (att) => {
    const mime = (att.file_type || att.mime_type || "").toLowerCase();
    const isPdf = mime.includes("pdf");
    const isImage = mime.startsWith("image/");
    if (!isPdf && !isImage) {
      downloadAttachment(att);
      return;
    }
    setPreviewLoading(true);
    try {
      const url = configWeb.GET_KYC_ATTACHMENT_DOWNLOAD(id, att.id);
      const res = await fetch(url, { method: "GET", headers: authHeaders() });
      if (!res.ok) {
        notifyError(`Preview failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      setPreviewUrl(objUrl);
      setPreviewType(isPdf ? "pdf" : "image");
      setPreviewName(att.original_name || att.file_name || "Attachment");
      openPreview();
    } catch (e) {
      notifyError("Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ---- Review actions ----
  const startReview = (action) => {
    setReviewAction(action);
    setReviewNotes(data?.review_notes || "");
    setRejectionReason(action === "rejected" ? data?.rejection_reason || "" : "");
    setReviewError("");
    setReasonInvalid(false);
    openReview();
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    closeReview();
    setReviewAction(null);
    setReviewError("");
    setReasonInvalid(false);
  };

  const submitReview = async () => {
    if (!reviewAction) return;
    const cfg = ACTION_CONFIG[reviewAction];
    if (cfg.requireRejection && !rejectionReason.trim()) {
      setReasonInvalid(true);
      setReviewError("Rejection reason is required.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    const body = { status: reviewAction };
    if (reviewNotes.trim()) body.notes = reviewNotes.trim();
    if (cfg.requireRejection) body.rejection_reason = rejectionReason.trim();
    const { ok, status, data: resp } = await fetchKycJson(
      configWeb.PATCH_KYC_SUBMISSION_STATUS(id),
      { method: "PATCH", body: JSON.stringify(body) }
    );
    setReviewSubmitting(false);
    if (!ok) {
      if (status === 403) {
        setReviewError("You do not have permission to perform this action.");
      } else {
        setReviewError(resp?.message || "Failed to update submission status.");
      }
      return;
    }
    const updated = (resp?.data || resp || {});
    const merged = { ...data, ...updated };
    Object.keys(merged).forEach((k) => {
      if (/_otp$/i.test(k) || /_otp_expires_at$/i.test(k)) delete merged[k];
    });
    setData(merged);
    notifySuccess(cfg.successMessage);
    closeReview();
    setReviewAction(null);
  };

  // ---- PDF download ----
  const downloadPdf = async () => {
    if (pdfDownloading) return;
    setPdfDownloading(true);
    try {
      const res = await fetch(configWeb.GET_KYC_SUBMISSION_PDF(id), {
        headers: authHeaders(),
      });
      if (!res.ok) {
        notifyError(`Download failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const fallback = `kyc-${data?.reference_token || id}.pdf`;
      const filename = filenameFromDisposition(
        res.headers.get("Content-Disposition"),
        fallback
      );
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
      notifySuccess("PDF ready");
    } catch (e) {
      notifyError("Download failed");
    } finally {
      setPdfDownloading(false);
    }
  };

  // ---- Load signature image (admin-auth blob -> object URL) ----
  useEffect(() => {
    if (!data) return;
    const hasSig =
      data.signature_signed_at ||
      data.signature_method ||
      data.signature_image ||
      data.has_signature;
    if (!hasSig) return;
    let cancelled = false;
    let objUrl = null;
    setSignatureLoading(true);
    setSignatureError(false);
    (async () => {
      try {
        const res = await fetch(configWeb.GET_KYC_SUBMISSION_SIGNATURE(id), {
          headers: authHeaders(),
        });
        if (!res.ok) {
          if (!cancelled) setSignatureError(true);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objUrl = URL.createObjectURL(blob);
        setSignatureUrl(objUrl);
      } catch (e) {
        if (!cancelled) setSignatureError(true);
      } finally {
        if (!cancelled) setSignatureLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [id, data?.signature_signed_at, data?.signature_method]);

  if (loading) {
    return (
      <div className="hr-module kyc-module">
        <div className="hr-loading">
          <Spinner animation="border" />{" "}
          <span className="ms-2 text-muted">Loading submission...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="hr-module kyc-module">
        <button
          className="hr-pill-button secondary mb-3"
          onClick={() => navigate("/admin/kyc/submissions")}
        >
          <FaArrowLeft size={11} /> Back to list
        </button>
        <div className="hr-glass-card text-center text-muted py-5">
          Submission not available.
        </div>
      </div>
    );
  }

  const attachments = Array.isArray(data.attachments) ? data.attachments : [];
  const meta = statusMeta(data.status);
  const isDraft = data.status === "draft";
  const isRejected = data.status === "rejected";
  const isReviewed = !!(data.reviewed_at || data.reviewed_by_admin_id);

  const initial = ((data.company_name || data.email || "?").trim() || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="hr-module kyc-module">
      {/* Hero header */}
      <motion.div
        className="hr-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="align-items-center g-3">
          <Col>
            <button
              type="button"
              onClick={() => navigate("/admin/kyc/submissions")}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <FaArrowLeft size={10} /> Back to submissions
            </button>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3">
                <FaUserShield />
              </div>
              <div style={{ flex: 1 }}>
                <h4>
                  {data.company_name || data.email || "KYC Submission"}
                </h4>
                <p>
                  Reference token{" "}
                  <span
                    style={{
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {data.reference_token || "—"}
                  </span>
                </p>
                <div className="hr-hero-pills">
                  <span className="hr-hero-pill">
                    {statusIcon(data.status)} {meta.label}
                  </span>
                  <span className="hr-hero-pill">
                    <FaPhoneAlt />{" "}
                    {data.phone_verified ? "Phone OK" : "Phone unverified"}
                  </span>
                  <span className="hr-hero-pill">
                    <FaEnvelope />{" "}
                    {data.email_verified ? "Email OK" : "Email unverified"}
                  </span>
                  {data.submitted_at ? (
                    <span className="hr-hero-pill">
                      <FaCalendarAlt /> {formatDateTime(data.submitted_at)}
                    </span>
                  ) : null}
                </div>

                {/* Review action buttons */}
                <div className="kyc-review-actions">
                  <button
                    type="button"
                    className="kyc-review-btn green"
                    onClick={() => startReview("approved")}
                    disabled={reviewSubmitting}
                    title="Approve submission"
                  >
                    <FaThumbsUp /> Approve
                  </button>
                  <button
                    type="button"
                    className="kyc-review-btn red"
                    onClick={() => startReview("rejected")}
                    disabled={reviewSubmitting}
                    title="Reject submission"
                  >
                    <FaThumbsDown /> Reject
                  </button>
                  <button
                    type="button"
                    className="kyc-review-btn amber"
                    onClick={downloadPdf}
                    disabled={pdfDownloading}
                    title="Download submission as PDF"
                  >
                    {pdfDownloading ? (
                      <>
                        <Spinner animation="border" size="sm" /> Preparing…
                      </>
                    ) : (
                      <>
                        <FaFilePdf /> Download PDF
                      </>
                    )}
                  </button>
                </div>

                {/* SMS delivery status (A3) */}
                {(data.sms_status_sent_at || data.sms_status_error) && (
                  <div className="kyc-sms-status mt-2">
                    {data.sms_status_error ? (
                      <span className="kyc-sms-status-pill red">
                        <FaTimesCircle size={11} /> SMS failed:{" "}
                        {data.sms_status_error}
                      </span>
                    ) : (
                      <span className="kyc-sms-status-pill green">
                        <FaSms size={11} /> SMS sent ·{" "}
                        {formatDateTime(data.sms_status_sent_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Mini metrics */}
      <Row className="mb-3 g-3 px-1">
        <Col xl={3} lg={6} md={6}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="hr-stat-card blue">
              <div className="hr-stat-icon blue">
                <FaIdBadge />
              </div>
              <div>
                <div className="hr-stat-value" style={{ fontSize: "1.05rem" }}>
                  #{data.id || "—"}
                </div>
                <div className="hr-stat-label">Submission ID</div>
              </div>
            </div>
          </motion.div>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div
              className={`hr-stat-card ${
                data.status === "approved"
                  ? "green"
                  : data.status === "rejected"
                  ? "red"
                  : data.status === "under_review"
                  ? "amber"
                  : data.status === "submitted"
                  ? "blue"
                  : "amber"
              }`}
            >
              <div
                className={`hr-stat-icon ${
                  data.status === "approved"
                    ? "green"
                    : data.status === "rejected"
                    ? "red"
                    : data.status === "under_review"
                    ? "amber"
                    : data.status === "submitted"
                    ? "blue"
                    : "amber"
                }`}
              >
                {statusIcon(data.status)}
              </div>
              <div>
                <div
                  className="hr-stat-value"
                  style={{ fontSize: "1.05rem" }}
                >
                  {meta.label}
                </div>
                <div className="hr-stat-label">Status</div>
              </div>
            </div>
          </motion.div>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="hr-stat-card cyan">
              <div className="hr-stat-icon cyan">
                <FaFileAlt />
              </div>
              <div>
                <div className="hr-stat-value">{attachments.length}</div>
                <div className="hr-stat-label">Attachments</div>
              </div>
            </div>
          </motion.div>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="hr-stat-card violet">
              <div className="hr-stat-icon violet">
                <FaShieldAlt />
              </div>
              <div>
                <div
                  className="hr-stat-value"
                  style={{ fontSize: "1.05rem" }}
                >
                  {(data.phone_verified ? 1 : 0) +
                    (data.email_verified ? 1 : 0)}{" "}
                  / 2
                </div>
                <div className="hr-stat-label">Verifications</div>
              </div>
            </div>
          </motion.div>
        </Col>
      </Row>

      {/* Reference & status */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SectionTitle
          icon={<FaIdBadge />}
          title="Reference & Status"
          sub="Identifiers and submission timeline"
        />
        <Row>
          <Field
            icon={<FaIdBadge />}
            label="Reference Token"
            value={
              data.reference_token ? (
                <span className="kyc-token">{data.reference_token}</span>
              ) : (
                "—"
              )
            }
          />
          <Field
            icon={<FaShieldAlt />}
            label="Status"
            value={
              <span className={`kyc-status ${meta.className}`}>
                {statusIcon(data.status)}
                {meta.label}
              </span>
            }
          />
          <Field
            icon={<FaGlobe />}
            label="Submission IP"
            value={data.submission_ip}
          />
          <Field
            icon={<FaCalendarAlt />}
            label="Created At"
            value={formatDateTime(data.created_at)}
          />
          <Field
            icon={<FaPaperPlane />}
            label="Submitted At"
            value={formatDateTime(data.submitted_at)}
          />
        </Row>
      </motion.div>

      {/* Review metadata */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.03 }}
      >
        <SectionTitle
          icon={<FaUserEdit />}
          title="Review"
          sub="Decision history and internal notes"
        />
        {!isReviewed && !data.review_notes && !isRejected ? (
          <div className="kyc-empty" style={{ padding: "30px 10px" }}>
            <div className="kyc-empty-icon">
              <FaHourglassHalf />
            </div>
            <p>Not yet reviewed.</p>
          </div>
        ) : (
          <Row>
            <Field
              icon={<FaShieldAlt />}
              label="Current Status"
              value={
                <span className={`kyc-status ${meta.className}`}>
                  {statusIcon(data.status)}
                  {meta.label}
                </span>
              }
            />
            <Field
              icon={<FaUserShield />}
              label="Reviewed By"
              value={
                data.reviewed_by_admin_name ||
                data.reviewed_by_admin?.name ||
                (data.reviewed_by_admin_id
                  ? `Admin #${data.reviewed_by_admin_id}`
                  : null)
              }
            />
            <Field
              icon={<FaCalendarAlt />}
              label="Reviewed At"
              value={formatDateTime(data.reviewed_at)}
            />
            <Col md={12} className="mb-3">
              <div className="kyc-field-label mb-2">
                <FaStickyNote /> Internal Notes
              </div>
              {data.review_notes ? (
                <div className="kyc-notes-block">{data.review_notes}</div>
              ) : (
                <div className="kyc-field-value muted">—</div>
              )}
            </Col>
            {isRejected && (
              <Col md={12} className="mb-3">
                <div className="kyc-field-label mb-2">
                  <FaExclamationTriangle style={{ color: "#b91c1c" }} />{" "}
                  Rejection Reason
                </div>
                {data.rejection_reason ? (
                  <div className="kyc-rejection-block">
                    {data.rejection_reason}
                  </div>
                ) : (
                  <div className="kyc-field-value muted">—</div>
                )}
              </Col>
            )}
          </Row>
        )}
      </motion.div>

      {/* Personal & residential */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <SectionTitle
          icon={<FaUserShield />}
          title="Personal & Residential"
          sub="Applicant contact details"
        />
        <Row>
          <Field
            icon={<FaMapMarkerAlt />}
            label="Residential Address"
            value={data.residential_address}
            full
          />
          <Field
            icon={<FaEnvelope />}
            label="Email"
            value={data.email}
          />
          <Field
            icon={<FaPhoneAlt />}
            label="Contact Mobile"
            value={renderMobile(data)}
          />
          <Field
            icon={<FaPhone />}
            label="Contact Landline"
            value={renderLandline(data)}
          />
        </Row>
      </motion.div>

      {/* Company info */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SectionTitle
          icon={<FaBuilding />}
          title="Company Information"
          sub="Business details on record"
        />
        <Row className="align-items-stretch">
          <Col md={4} className="mb-3">
            <div className="kyc-field h-100 d-flex flex-row align-items-center" style={{ gap: 14 }}>
              <div
                className="kyc-avatar"
                style={{ width: 48, height: 48, fontSize: "1.05rem" }}
              >
                {initial}
              </div>
              <div>
                <div className="kyc-field-label">
                  <FaBuilding /> Company
                </div>
                <div className="kyc-field-value">
                  {data.company_name || "—"}
                </div>
              </div>
            </div>
          </Col>
          <Field
            icon={<FaPhone />}
            label="Company Phone"
            value={data.company_phone}
          />
          <Field
            icon={<FaMapMarkerAlt />}
            label="Company Address"
            value={data.company_address}
            full
          />
        </Row>
      </motion.div>

      {/* Verification */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <SectionTitle
          icon={<FaShieldAlt />}
          title="Verification"
          sub="Phone and email verification status"
        />
        <Row>
          <Col md={6} className="mb-3">
            <div className="kyc-field h-100">
              <div className="kyc-field-label">
                <FaPhoneAlt /> Phone Verified
              </div>
              <div className="kyc-field-value">
                <span
                  className={`kyc-chip ${
                    data.phone_verified ? "ok" : "no"
                  }`}
                >
                  {data.phone_verified ? (
                    <>
                      <FaCheckCircle size={10} /> Verified
                    </>
                  ) : (
                    <>
                      <FaTimesCircle size={10} /> Not verified
                    </>
                  )}
                </span>
                {data.phone_verified_at ? (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    Verified at {formatDateTime(data.phone_verified_at)}
                  </div>
                ) : null}
              </div>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className="kyc-field h-100">
              <div className="kyc-field-label">
                <FaEnvelope /> Email Verified
              </div>
              <div className="kyc-field-value">
                <span
                  className={`kyc-chip ${
                    data.email_verified ? "ok" : "no"
                  }`}
                >
                  {data.email_verified ? (
                    <>
                      <FaCheckCircle size={10} /> Verified
                    </>
                  ) : (
                    <>
                      <FaTimesCircle size={10} /> Not verified
                    </>
                  )}
                </span>
                {data.email_verified_at ? (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    Verified at {formatDateTime(data.email_verified_at)}
                  </div>
                ) : null}
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Consent */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <SectionTitle
          icon={<FaSignature />}
          title="Consent"
          sub="Applicant agreement details"
        />
        <Row>
          <Col md={12} className="mb-3">
            <div className="kyc-field-label mb-2">
              <FaFileAlt /> Consent Text
            </div>
            {data.consent_text ? (
              <div className="kyc-consent-block">{data.consent_text}</div>
            ) : (
              <div className="kyc-field-value muted">—</div>
            )}
          </Col>
          <Field
            icon={<FaCalendarAlt />}
            label="Consent Given At"
            value={formatDateTime(data.consent_given_at)}
          />
        </Row>
      </motion.div>

      {/* Signature (A6) */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
      >
        <SectionTitle
          icon={<FaSignature />}
          title="Signature"
          sub="Customer-signed AECB acknowledgement"
        />
        {!(
          data.signature_signed_at ||
          data.signature_method ||
          data.signature_image ||
          data.has_signature
        ) ? (
          <div className="kyc-empty" style={{ padding: "30px 10px" }}>
            <div className="kyc-empty-icon">
              <FaSignature />
            </div>
            <p>No signature on file.</p>
          </div>
        ) : (
          <Row>
            <Col md={6} className="mb-3">
              <div className="kyc-signature-frame">
                {signatureLoading ? (
                  <div className="kyc-signature-loading">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : signatureError ? (
                  <div className="kyc-signature-loading text-danger">
                    <FaExclamationTriangle /> Failed to load signature
                  </div>
                ) : signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Customer signature"
                    className="kyc-signature-img"
                  />
                ) : (
                  <div className="kyc-signature-loading">—</div>
                )}
                <div className="kyc-signature-caption">
                  Signed on {formatDateTime(data.signature_signed_at)}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <Row>
                <Field
                  icon={<FaSignature />}
                  label="Method"
                  value={
                    data.signature_method ? (
                      <span
                        className="kyc-chip ok"
                        style={{ textTransform: "capitalize" }}
                      >
                        {data.signature_method}
                      </span>
                    ) : null
                  }
                />
                {data.signature_method === "typed" && (
                  <Field
                    icon={<FaUserShield />}
                    label="Typed Name"
                    value={data.signature_typed_text}
                  />
                )}
                <Field
                  icon={<FaCalendarAlt />}
                  label="Signed At"
                  value={formatDateTime(data.signature_signed_at)}
                />
                <Field
                  icon={<FaGlobe />}
                  label="Signed IP"
                  value={data.signature_ip}
                />
                <Col md={12} className="mb-3">
                  <div className="kyc-field h-100">
                    <div className="kyc-field-label">
                      <FaUserShield /> Device / User Agent
                    </div>
                    <div
                      className="kyc-field-value"
                      style={{
                        fontSize: "0.78rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={data.signature_user_agent || ""}
                    >
                      {data.signature_user_agent || "—"}
                    </div>
                  </div>
                </Col>
                <Col md={12} className="mb-3">
                  <div className="kyc-field h-100">
                    <div className="kyc-field-label">
                      <FaFingerprint /> SHA-256 Hash
                    </div>
                    <div
                      className="kyc-field-value"
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: "0.8rem",
                      }}
                      title={data.signature_hash || ""}
                    >
                      {data.signature_hash
                        ? `${data.signature_hash.slice(0, 12)}…`
                        : "—"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </motion.div>

      {/* Attachments */}
      <motion.div
        className="hr-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {(() => {
          const slots = resolveDocumentSlots(attachments);
          const completion = documentsCompletion(attachments);
          return (
            <>
              <SectionTitle
                icon={<FaFileAlt />}
                title="Documents"
                sub={
                  <>
                    {completion.filled} / {completion.total} required documents
                    {" · "}
                    <span
                      className={`kyc-docs-pill ${
                        completion.complete ? "ok" : "warn"
                      }`}
                    >
                      {completion.complete ? (
                        <>
                          <FaCheckCircle size={10} /> Complete
                        </>
                      ) : (
                        <>
                          <FaExclamationTriangle size={10} /> Incomplete
                        </>
                      )}
                    </span>
                  </>
                }
              />

              <Row className="g-3">
                {slots.map(({ slot, attachment, legacy }) => {
                  if (!attachment && !slot.required) return null; // skip empty optional
                  const att = attachment;
                  const mime = att
                    ? (att.file_type || att.mime_type || "").toLowerCase()
                    : "";
                  const visual = attachmentVisual(mime);
                  const canPreview =
                    !!att &&
                    (mime.includes("pdf") || mime.startsWith("image/"));
                  return (
                    <Col xl={6} lg={6} md={6} key={slot.key}>
                      <div
                        className={`kyc-doc-tile ${
                          !att ? "missing" : legacy ? "legacy" : ""
                        }`}
                      >
                        <div
                          className={`kyc-attachment-icon ${
                            !att ? "muted" : visual.cls
                          }`}
                        >
                          {!att ? <FaExclamationTriangle /> : visual.icon}
                        </div>
                        <div className="kyc-attachment-meta">
                          <p className="title">
                            {slot.label}
                            {legacy && (
                              <span
                                className="kyc-doc-badge legacy"
                                title="Uploaded as a single file before front/back split"
                              >
                                Legacy single-side upload
                              </span>
                            )}
                            {!att && slot.required && (
                              <span className="kyc-doc-badge missing">
                                Missing
                              </span>
                            )}
                            {!att && !slot.required && (
                              <span className="kyc-doc-badge optional">
                                Not provided
                              </span>
                            )}
                          </p>
                          {att ? (
                            <div className="subtitle">
                              <span>
                                {att.original_name ||
                                  att.file_name ||
                                  "Attachment"}
                              </span>
                              <span className="dot" />
                              <span>
                                {att.file_type || att.mime_type || "—"}
                              </span>
                              <span className="dot" />
                              <span>{formatBytes(att.file_size)}</span>
                              {att.created_at && (
                                <>
                                  <span className="dot" />
                                  <span>
                                    {formatDateTime(att.created_at)}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="subtitle muted">
                              {slot.required
                                ? "No file uploaded for this side."
                                : "Customer chose not to upload this document."}
                            </div>
                          )}
                        </div>
                        {att ? (
                          <div className="kyc-attachment-actions">
                            {canPreview && (
                              <button
                                type="button"
                                className="hr-action-btn view"
                                title="Preview"
                                disabled={previewLoading}
                                onClick={() => previewAttachment(att)}
                              >
                                <FaSearchPlus />
                              </button>
                            )}
                            <button
                              type="button"
                              className="hr-pill-button primary"
                              onClick={() => downloadAttachment(att)}
                            >
                              <FaDownload size={11} /> Download
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </>
          );
        })()}
      </motion.div>

      {/* Preview modal */}
      <Modal
        opened={previewOpened}
        onClose={handleClosePreview}
        size="xl"
        title={
          <div style={{ fontWeight: 700, color: "#0f172a" }}>
            <FaEye style={{ marginRight: 8, color: "#1d4ed8" }} />
            {previewName || "Preview"}
          </div>
        }
        centered
        overlayProps={{ blur: 3 }}
      >
        {previewType === "pdf" && previewUrl ? (
          <iframe
            src={previewUrl}
            title="attachment-preview"
            style={{ width: "100%", height: "75vh", border: 0, borderRadius: 8 }}
          />
        ) : previewType === "image" && previewUrl ? (
          <div className="text-center">
            <img
              src={previewUrl}
              alt={previewName}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                borderRadius: 8,
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              }}
            />
          </div>
        ) : null}
      </Modal>

      {/* Review action modal */}
      <Modal
        opened={reviewOpened}
        onClose={closeReviewModal}
        size="lg"
        centered
        overlayProps={{ blur: 3 }}
        closeOnClickOutside={!reviewSubmitting}
        closeOnEscape={!reviewSubmitting}
        withCloseButton={!reviewSubmitting}
        title={
          <div style={{ fontWeight: 700, color: "#0f172a" }}>
            {reviewAction === "approved" && (
              <FaThumbsUp style={{ marginRight: 8, color: "#047857" }} />
            )}
            {reviewAction === "rejected" && (
              <FaThumbsDown style={{ marginRight: 8, color: "#b91c1c" }} />
            )}
            {reviewAction === "under_review" && (
              <FaHourglassHalf style={{ marginRight: 8, color: "#b45309" }} />
            )}
            {reviewAction ? ACTION_CONFIG[reviewAction].title : "Review"}
          </div>
        }
      >
        <div className="kyc-modal-summary">
          <div>
            <strong>Reference:</strong>{" "}
            <span className="kyc-token">{data.reference_token || "—"}</span>
          </div>
          <div>
            <strong>Email:</strong> {data.email || "—"}
          </div>
          <div>
            <strong>Mobile:</strong> {renderMobile(data) || "—"}
          </div>
        </div>

        {reviewError && (
          <div className="kyc-modal-error">
            <FaExclamationTriangle style={{ marginRight: 6 }} />
            {reviewError}
          </div>
        )}

        {reviewAction === "rejected" && (
          <div className="mb-3">
            <label className="kyc-modal-label">
              Reason for rejection <span style={{ color: "#b91c1c" }}>*</span>
            </label>
            <textarea
              className={`kyc-modal-textarea ${reasonInvalid ? "invalid" : ""}`}
              maxLength={2000}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (e.target.value.trim()) setReasonInvalid(false);
              }}
              placeholder="Explain why this submission is being rejected (visible internally)"
              disabled={reviewSubmitting}
            />
            <div className="kyc-modal-helper">
              <span>Required. Shown on the detail page.</span>
              <span>{rejectionReason.length} / 2000</span>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="kyc-modal-label">Internal notes (optional)</label>
          <textarea
            className="kyc-modal-textarea"
            maxLength={2000}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Anything the team should know about this decision"
            disabled={reviewSubmitting}
          />
          <div className="kyc-modal-helper">
            <span>Visible to admin / KYC officers only.</span>
            <span>{reviewNotes.length} / 2000</span>
          </div>
        </div>

        <div className="d-flex justify-content-end" style={{ gap: 8 }}>
          <button
            type="button"
            className="hr-pill-button secondary"
            onClick={closeReviewModal}
            disabled={reviewSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`kyc-review-btn ${
              reviewAction === "approved"
                ? "green"
                : reviewAction === "rejected"
                ? "red"
                : "amber"
            }`}
            onClick={submitReview}
            disabled={reviewSubmitting}
          >
            {reviewSubmitting ? (
              <>
                <Spinner animation="border" size="sm" /> Saving…
              </>
            ) : (
              <>
                {reviewAction === "approved" && <FaThumbsUp />}
                {reviewAction === "rejected" && <FaThumbsDown />}
                {reviewAction === "under_review" && <FaHourglassHalf />}
                {reviewAction
                  ? ACTION_CONFIG[reviewAction].confirmLabel
                  : "Confirm"}
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default KycSubmissionDetail;
