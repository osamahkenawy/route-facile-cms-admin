import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { Tabs, Modal, Rating } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBriefcase,
  FaArrowLeft,
  FaFileDownload,
  FaStar,
  FaClipboardCheck,
  FaHistory,
  FaPaperclip,
  FaPlus,
  FaVideo,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRobot,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePutCallAuth,
  simplePostCallAuth,
  simpleDeleteCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  APPLICATION_STATUS,
  INTERVIEW_STATUS,
  formatDate,
  formatDateTime,
  getApplicantName,
  getApplicantPhone,
  getInitials,
} from "./hrConstants";
import "./hr.css";

// Lazy-loaded pdf.js to keep initial bundle small
let pdfjsLibPromise = null;
const loadPdfJs = () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/build/pdf").then((pdfjs) => {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      } catch (e) { /* noop */ }
      return pdfjs;
    });
  }
  return pdfjsLibPromise;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Reviewing" },
  { value: 2, label: "Shortlisted" },
  { value: 3, label: "Interviewed" },
  { value: 4, label: "Rejected" },
  { value: 5, label: "Hired" },
];

const HRApplicationDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [app, setApp] = useState(null);
  const [status, setStatus] = useState(0);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Related data
  const [statusHistory, setStatusHistory] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(null);

  // Rating form
  const [ratingOpen, { open: openRating, close: closeRating }] = useDisclosure(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComments, setRatingComments] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);

  // Keywords / Auto screening
  const [keywords, setKeywords] = useState([]);
  const [savingAiRating, setSavingAiRating] = useState(false);
  const [cvText, setCvText] = useState("");
  const [cvParsing, setCvParsing] = useState(false);

  // Book interview
  const [bookOpen, { open: openBook, close: closeBook }] = useDisclosure(false);
  const [bookSaving, setBookSaving] = useState(false);
  const [bookForm, setBookForm] = useState({
    interview_date: "",
    interview_type: "in-person",
    location: "",
    notes: "",
  });

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      simpleGetCallAuth(configWeb.GET_CAREER_APPLICATION_DETAILS(id)),
      simpleGetCallAuth(`${configWeb.GET_RECRUITING_STATUS_HISTORY}?application_id=${id}`),
      simpleGetCallAuth(`${configWeb.GET_RECRUITING_INTERVIEW_LIST}?application_id=${id}&page_size=100`),
      simpleGetCallAuth(`${configWeb.GET_RECRUITING_RATING_LIST}?application_id=${id}`),
      simpleGetCallAuth(configWeb.GET_RECRUITING_RATING_AVERAGE(id)),
    ])
      .then(([appRes, histRes, ivRes, ratRes, avgRes]) => {
        if (appRes && !appRes.error) {
          setApp(appRes);
          setStatus(appRes.status ?? 0);
          setAdminNotes(appRes.admin_notes || "");
        }
        setStatusHistory(histRes?.data || []);
        setInterviews(ivRes?.data || []);
        setRatings(ratRes?.data || []);
        setAvgRating(avgRes?.average_rating ? { avg: parseFloat(avgRes.average_rating), total: avgRes.total_ratings } : null);

        // Load job-scoped keywords for auto-screening
        const jobId = appRes?.career_job_id || appRes?.career_job?.id;
        if (jobId) {
          simpleGetCallAuth(`${configWeb.GET_RECRUITING_KEYWORD_LIST}?career_job_id=${jobId}&page=1&page_size=500`)
            .then((kwRes) => setKeywords(kwRes?.data || []))
            .catch(() => setKeywords([]));
        } else {
          setKeywords([]);
        }
      })
      .catch(() => notifyError("Failed to load application"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) fetchAll(); }, [id]);

  // Auto-extract text from CV PDF for screening
  useEffect(() => {
    if (!app?.id) return;
    setCvText("");
    setCvParsing(true);
    const token = localStorage?.getItem("token");
    const access_token = token ? JSON.parse(token)?.access_token : null;
    fetch(configWeb.GET_CAREER_APPLICATION_CV(app.id), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "x-api-key": process.env.REACT_APP_API_KEY,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("cv-fetch-failed");
        return res.arrayBuffer();
      })
      .then(async (buf) => {
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        let full = "";
        for (let p = 1; p <= pdf.numPages; p += 1) {
          // eslint-disable-next-line no-await-in-loop
          const page = await pdf.getPage(p);
          // eslint-disable-next-line no-await-in-loop
          const content = await page.getTextContent();
          full += " " + content.items.map((i) => i.str).join(" ");
        }
        setCvText(full);
      })
      .catch(() => setCvText(""))
      .finally(() => setCvParsing(false));
  }, [app?.id]);

  const handleUpdate = () => {
    setUpdateLoading(true);
    const oldStatus = app?.status;
    const newStatus = Number(status);

    const updatePromise = simplePutCallAuth(
      configWeb.PUT_CAREER_APPLICATION_UPDATE(id),
      JSON.stringify({ status: newStatus, admin_notes: adminNotes })
    );

    // If status changed, also log status history
    const promises = [updatePromise];
    if (oldStatus !== newStatus) {
      promises.push(
        simplePostCallAuth(
          configWeb.POST_RECRUITING_STATUS_HISTORY,
          JSON.stringify({
            application_id: Number(id),
            from_status: oldStatus,
            to_status: newStatus,
            notes: statusNotes || `Status changed from ${APPLICATION_STATUS[oldStatus]?.label} to ${APPLICATION_STATUS[newStatus]?.label}`,
          })
        )
      );
    }

    Promise.all(promises)
      .then(([updateRes]) => {
        if (updateRes?.status === "success" || (!updateRes?.error)) {
          notifySuccess("Application updated");
          setStatusNotes("");
          fetchAll();
        } else {
          notifyError(Array.isArray(updateRes?.message) ? updateRes.message[0] : updateRes?.message || "Update failed");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setUpdateLoading(false));
  };

  const handleDownloadCV = () => {
    const token = localStorage?.getItem("token");
    const parse_token = JSON.parse(token);
    const access_token = parse_token?.access_token;
    fetch(configWeb.GET_CAREER_APPLICATION_CV(id), {
      method: "GET",
      headers: { Authorization: `Bearer ${access_token}`, "x-api-key": process.env.REACT_APP_API_KEY },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Download failed");
        const cd = response.headers.get("content-disposition");
        let filename = `CV_${app?.first_name || "applicant"}_${id}`;
        if (cd) { const m = cd.match(/filename="?(.+)"?/); if (m) filename = m[1]; }
        return response.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => notifyError("Failed to download CV"));
  };

  const handleDownloadAttachment = (attachmentId, originalName) => {
    const token = localStorage?.getItem("token");
    const parse_token = JSON.parse(token);
    const access_token = parse_token?.access_token;
    fetch(configWeb.GET_CAREER_APPLICATION_ATTACHMENT(id, attachmentId), {
      method: "GET",
      headers: { Authorization: `Bearer ${access_token}`, "x-api-key": process.env.REACT_APP_API_KEY },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Download failed");
        return response.blob().then((blob) => ({ blob, filename: originalName }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => notifyError("Failed to download attachment"));
  };

  const handleAddRating = () => {
    if (!ratingValue) return notifyError("Please select a rating");
    setRatingSaving(true);
    simplePostCallAuth(
      configWeb.POST_RECRUITING_RATING_CREATE,
      JSON.stringify({ application_id: Number(id), rating: ratingValue, comments: ratingComments })
    )
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("Rating added");
          setRatingValue(0);
          setRatingComments("");
          closeRating();
          fetchAll();
        } else {
          notifyError("Failed to add rating");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setRatingSaving(false));
  };

  const interviewTypeIcon = (type) => {
    if (type === "video") return <FaVideo size={11} />;
    if (type === "phone") return <FaPhoneAlt size={11} />;
    return <FaMapMarkerAlt size={11} />;
  };

  // ---------- Auto Screening (client-side keyword match) ----------
  const screening = useMemo(() => {
    if (!app || !keywords || keywords.length === 0) return null;
    const candidateText = [
      app.cover_letter,
      app.skills,
      app.experience_summary,
      app.summary,
      app.notes,
      app.qualifications,
      app.message,
      app.first_name,
      app.last_name,
      app.email,
      cvText,
    ]
      .filter(Boolean)
      .join(" \n ")
      .toLowerCase();

    const buckets = { must_have: [], optional: [], exclude: [] };
    keywords.forEach((k) => {
      const word = (k.keyword || "").trim().toLowerCase();
      if (!word) return;
      const matched = candidateText.includes(word);
      const bucket = buckets[k.keyword_type] || buckets.optional;
      bucket.push({ ...k, matched });
    });

    const sumWeights = (arr) => arr.reduce((s, k) => s + (Number(k.weight) || 1), 0);
    const matchedWeights = (arr) => arr.filter((k) => k.matched).reduce((s, k) => s + (Number(k.weight) || 1), 0);

    const mustTotal = sumWeights(buckets.must_have);
    const mustMatched = matchedWeights(buckets.must_have);
    const optTotal = sumWeights(buckets.optional);
    const optMatched = matchedWeights(buckets.optional);
    const exclHits = buckets.exclude.filter((k) => k.matched);
    const exclPenalty = sumWeights(exclHits) * 10;

    const baseTotal = mustTotal * 2 + optTotal;
    const baseMatched = mustMatched * 2 + optMatched;
    const rawScore = baseTotal > 0 ? (baseMatched / baseTotal) * 100 : 0;
    const score = Math.max(0, Math.min(100, Math.round(rawScore - exclPenalty)));
    const stars = Math.max(1, Math.min(5, Math.round(score / 20)));

    return {
      score,
      stars,
      mustHave: buckets.must_have,
      optional: buckets.optional,
      exclude: buckets.exclude,
      hasExcludeHit: exclHits.length > 0,
      cvParsed: !!cvText,
    };
  }, [app, keywords, cvText]);

  const handleSaveAiRating = () => {
    if (!screening) return;
    setSavingAiRating(true);
    const matched = [...screening.mustHave, ...screening.optional]
      .filter((k) => k.matched)
      .map((k) => k.keyword)
      .join(", ");
    const missing = screening.mustHave.filter((k) => !k.matched).map((k) => k.keyword).join(", ");
    const comments =
      `[AI Screening] Score ${screening.score}%.` +
      (matched ? ` Matched: ${matched}.` : "") +
      (missing ? ` Missing must-have: ${missing}.` : "") +
      (screening.hasExcludeHit ? " Contains excluded terms." : "");
    simplePostCallAuth(
      configWeb.POST_RECRUITING_RATING_CREATE,
      JSON.stringify({ application_id: Number(id), rating: screening.stars, comments })
    )
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("AI rating saved");
          fetchAll();
        } else {
          notifyError("Failed to save AI rating");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setSavingAiRating(false));
  };

  const handleBookInterview = () => {
    if (!bookForm.interview_date) {
      return notifyError("Pick a date and time");
    }
    setBookSaving(true);
    let currentUserId = null;
    try {
      const t = JSON.parse(localStorage.getItem("token") || "{}");
      currentUserId = t?.user_id ? Number(t.user_id) : null;
    } catch (e) { /* noop */ }
    simplePostCallAuth(
      configWeb.POST_RECRUITING_INTERVIEW_CREATE,
      JSON.stringify({
        application_id: Number(id),
        interview_date: bookForm.interview_date,
        interview_type: bookForm.interview_type,
        location: bookForm.location,
        notes: bookForm.notes,
        ...(currentUserId && { interviewer_id: currentUserId }),
      })
    )
      .then((res) => {
        if (res && !res.error) {
          notifySuccess("Interview booked");
          setBookForm({ interview_date: "", interview_type: "in-person", location: "", notes: "" });
          closeBook();
          fetchAll();
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to book");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setBookSaving(false));
  };

  if (loading) {
    return <div className="hr-module"><div className="hr-loading"><Spinner animation="border" /></div></div>;
  }

  if (!app) {
    return (
      <div className="hr-module">
        <div className="hr-empty-state">
          <FaUser size={48} />
          <p>Application not found</p>
          <Link to="/hr/applications"><button className="btn btn-primary btn-sm">Back to Applications</button></Link>
        </div>
      </div>
    );
  }

  const st = APPLICATION_STATUS[app.status] || APPLICATION_STATUS[0];

  const infoItems = [
    { icon: <FaUser />, label: "Full Name", value: getApplicantName(app) },
    { icon: <FaEnvelope />, label: "Email", value: app.email },
    { icon: <FaPhone />, label: "Phone", value: getApplicantPhone(app) },
    { icon: <FaCalendarAlt />, label: "Applied Date", value: formatDate(app.created_at) },
    { icon: <FaBriefcase />, label: "Job Title", value: app.career_job?.title_en },
  ].filter((i) => i.value && i.value !== "—");

  const nextAction =
    Number(app.status) <= 0 ? "Start review" :
    Number(app.status) === 1 ? "Shortlist or reject" :
    Number(app.status) === 2 ? "Schedule interview" :
    Number(app.status) === 3 ? "Collect final decision" :
    Number(app.status) === 5 ? "Prepare onboarding" : "Closed outcome";

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-avatar lg me-3">{getInitials(app)}</div>
              <div>
                <h4 style={{ marginBottom: 2 }}>{getApplicantName(app)}</h4>
                <p style={{ marginBottom: 4 }}>Applied for {app.career_job?.title_en || "N/A"}</p>
                <span className="hr-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{st.label}</span>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/hr/interviews">
                <motion.button
                  className="btn"
                  style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "10px 16px", fontWeight: 600, fontSize: "0.82rem", border: "none", display: "flex", alignItems: "center", gap: 8 }}
                  whileHover={{ scale: 1.04 }}
                >
                  <FaCalendarAlt size={12} /> Interview Queue
                </motion.button>
              </Link>
              <Link to="/hr/applications">
                <motion.button
                  className="btn"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 8 }}
                  whileHover={{ scale: 1.04 }}
                >
                  <FaArrowLeft size={12} /> Back
                </motion.button>
              </Link>
            </div>
          </Col>
        </Row>
      </motion.div>

      <Row className="g-3 px-1">
        {/* LEFT COLUMN */}
        <Col lg={8}>
          {/* Applicant Info Card */}
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <h6><FaUser size={13} className="me-2" style={{ color: "#228be6" }} />Applicant Information</h6>
            <Row className="g-3">
              {infoItems.map((item, i) => (
                <Col md={6} key={item.label}>
                  <motion.div className="hr-info-item" variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}>
                    <div className="hr-info-icon">{item.icon}</div>
                    <div className="ms-3">
                      <div className="hr-info-label">{item.label}</div>
                      <div className="hr-info-value">{item.value}</div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* CV & Attachments */}
            <div className="mt-4 d-flex flex-wrap gap-2">
              <motion.button
                className="btn"
                style={{ background: "#228be6", color: "#fff", borderRadius: 10, padding: "8px 18px", fontSize: "0.82rem", fontWeight: 600, border: "none", display: "flex", alignItems: "center", gap: 6 }}
                onClick={handleDownloadCV}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaFileDownload size={14} /> Download CV
              </motion.button>

              {app.attachments?.map((att) => (
                <motion.button
                  key={att.id}
                  className="btn"
                  style={{ background: "#f1f5f9", color: "#475569", borderRadius: 10, padding: "8px 14px", fontSize: "0.78rem", fontWeight: 600, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 5 }}
                  onClick={() => handleDownloadAttachment(att.id, att.original_name)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaPaperclip size={11} /> {att.original_name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tabs: Timeline / Interviews / Ratings */}
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <Tabs defaultValue="timeline" variant="pills" radius="lg">
              <Tabs.List mb="lg">
                <Tabs.Tab value="timeline" leftSection={<FaHistory size={12} />}>Status Timeline</Tabs.Tab>
                <Tabs.Tab value="interviews" leftSection={<FaCalendarAlt size={12} />}>Interviews ({interviews.length})</Tabs.Tab>
                <Tabs.Tab value="ratings" leftSection={<FaStar size={12} />}>Ratings ({ratings.length})</Tabs.Tab>
              </Tabs.List>

              {/* Timeline Tab */}
              <Tabs.Panel value="timeline">
                {statusHistory.length > 0 ? (
                  <div className="hr-timeline">
                    {statusHistory.map((h) => {
                      const from = APPLICATION_STATUS[h.from_status] || { label: `Status ${h.from_status}` };
                      const to = APPLICATION_STATUS[h.to_status] || { label: `Status ${h.to_status}` };
                      return (
                        <div className="hr-timeline-item" key={h.id}>
                          <div className="hr-timeline-date">{formatDateTime(h.created_at)}</div>
                          <div className="hr-timeline-content">
                            <span className="hr-badge me-1" style={{ background: from.bg, color: from.text, fontSize: "0.68rem" }}>{from.label}</span>
                            → <span className="hr-badge ms-1" style={{ background: to.bg, color: to.text, fontSize: "0.68rem" }}>{to.label}</span>
                            {h.notes && <div style={{ marginTop: 4, fontSize: "0.8rem", color: "#64748b" }}>{h.notes}</div>}
                          </div>
                          {h.changed_by_admin && (
                            <div className="hr-timeline-admin">
                              by {h.changed_by_admin.first_name} {h.changed_by_admin.last_name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="hr-empty-state"><FaHistory size={32} /><p>No status changes yet</p></div>
                )}
              </Tabs.Panel>

              {/* Interviews Tab */}
              <Tabs.Panel value="interviews">
                {interviews.length > 0 ? (
                  <div className="table-responsive">
                    <table className="hr-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Location</th>
                          <th>Interviewer</th>
                          <th>Status</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interviews.map((iv) => {
                          const ist = INTERVIEW_STATUS[iv.status] || INTERVIEW_STATUS[0];
                          return (
                            <tr key={iv.id}>
                              <td style={{ fontSize: "0.82rem" }}>{formatDateTime(iv.interview_date)}</td>
                              <td>
                                <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.82rem" }}>
                                  {interviewTypeIcon(iv.interview_type)} {iv.interview_type}
                                </span>
                              </td>
                              <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{iv.location || "—"}</td>
                              <td style={{ fontSize: "0.82rem" }}>
                                {iv.interviewer ? `${iv.interviewer.first_name || ""} ${iv.interviewer.last_name || ""}`.trim() : "—"}
                              </td>
                              <td><span className="hr-badge" style={{ background: ist.bg, color: ist.text }}>{ist.label}</span></td>
                              <td>
                                {iv.rating ? (
                                  <div className="hr-stars">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <span key={s} className={`star ${s <= iv.rating ? "filled" : ""}`}>★</span>
                                    ))}
                                  </div>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="hr-empty-state"><FaCalendarAlt size={32} /><p>No interviews scheduled</p></div>
                )}
              </Tabs.Panel>

              {/* Ratings Tab */}
              <Tabs.Panel value="ratings">
                {/* Average display */}
                {avgRating && (
                  <div className="d-flex align-items-center gap-3 mb-3 p-3" style={{ background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{avgRating.avg.toFixed(1)}</div>
                    <div>
                      <div className="hr-stars" style={{ fontSize: "1.1rem" }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`star ${s <= Math.round(avgRating.avg) ? "filled" : ""}`}>★</span>
                        ))}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#92400e" }}>{avgRating.total} rating(s)</div>
                    </div>
                    <div className="ms-auto">
                      <motion.button
                        className="btn btn-sm"
                        style={{ background: "#f59e0b", color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: "0.8rem", border: "none", display: "flex", alignItems: "center", gap: 5 }}
                        onClick={openRating}
                        whileHover={{ scale: 1.04 }}
                      >
                        <FaPlus size={10} /> Add Rating
                      </motion.button>
                    </div>
                  </div>
                )}
                {!avgRating && (
                  <div className="mb-3">
                    <motion.button
                      className="btn btn-sm"
                      style={{ background: "#f59e0b", color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: "0.8rem", border: "none", display: "flex", alignItems: "center", gap: 5 }}
                      onClick={openRating}
                      whileHover={{ scale: 1.04 }}
                    >
                      <FaPlus size={10} /> Add First Rating
                    </motion.button>
                  </div>
                )}

                {ratings.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {ratings.map((r) => (
                      <div key={r.id} style={{ padding: "12px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="hr-stars" style={{ marginBottom: 4 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className={`star ${s <= r.rating ? "filled" : ""}`}>★</span>
                              ))}
                            </div>
                            {r.comments && <div style={{ fontSize: "0.82rem", color: "#475569" }}>{r.comments}</div>}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
                            {r.rated_by_admin && <div>{r.rated_by_admin.first_name} {r.rated_by_admin.last_name}</div>}
                            <div>{formatDate(r.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hr-empty-state"><FaStar size={32} /><p>No ratings yet</p></div>
                )}
              </Tabs.Panel>
            </Tabs>
          </motion.div>
        </Col>

        {/* RIGHT COLUMN - Review Panel */}
        <Col lg={4}>
          <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={1} style={{ position: "sticky", top: 20 }}>
            <h6><FaClipboardCheck size={13} className="me-2" style={{ color: "#f59e0b" }} />Review & Update</h6>

            {/* Auto Screening */}
            <div
              className="mb-3"
              style={{
                padding: 14,
                borderRadius: 12,
                background: screening?.hasExcludeHit
                  ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
                  : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                border: "1px solid #dbeafe",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <FaRobot size={14} style={{ color: "#1d4ed8" }} />
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    AI Screening
                  </div>
                </div>
                {screening && (
                  <div className="hr-stars" style={{ fontSize: "0.95rem" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`star ${s <= screening.stars ? "filled" : ""}`}>★</span>
                    ))}
                  </div>
                )}
              </div>

              {!screening && (
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  No keywords configured for this job. Add some in <Link to="/hr/keywords" style={{ color: "#1d4ed8", fontWeight: 600 }}>AI Keywords</Link> to enable auto screening.
                </div>
              )}

              {screening && (
                <>
                  <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: 4 }}>
                    {cvParsing
                      ? "Reading CV…"
                      : screening.cvParsed
                        ? "CV scanned ✓"
                        : "CV not readable — using application fields only"}
                  </div>
                  <div className="d-flex align-items-baseline gap-2" style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>{screening.score}%</div>
                    <div style={{ fontSize: "0.72rem", color: "#475569" }}>match score</div>
                  </div>
                  <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${screening.score}%`,
                        height: "100%",
                        background: screening.hasExcludeHit
                          ? "linear-gradient(90deg, #ef4444, #b91c1c)"
                          : "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  {screening.mustHave.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>MUST HAVE</div>
                      <div className="d-flex flex-wrap gap-1">
                        {screening.mustHave.map((k) => (
                          <span
                            key={k.id}
                            style={{
                              fontSize: "0.7rem",
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: k.matched ? "#dcfce7" : "#fee2e2",
                              color: k.matched ? "#166534" : "#991b1b",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {k.matched ? <FaCheck size={8} /> : <FaTimes size={8} />} {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {screening.optional.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>OPTIONAL</div>
                      <div className="d-flex flex-wrap gap-1">
                        {screening.optional.map((k) => (
                          <span
                            key={k.id}
                            style={{
                              fontSize: "0.7rem",
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: k.matched ? "#e0f2fe" : "#f1f5f9",
                              color: k.matched ? "#075985" : "#64748b",
                              fontWeight: 600,
                            }}
                          >
                            {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {screening.hasExcludeHit && (
                    <div style={{ marginTop: 10, fontSize: "0.72rem", color: "#b91c1c", fontWeight: 600 }}>
                      ⚠ Contains excluded terms
                    </div>
                  )}

                  <motion.button
                    className="btn btn-sm w-100 mt-3"
                    style={{
                      background: "#1d4ed8",
                      color: "#fff",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      border: "none",
                    }}
                    onClick={handleSaveAiRating}
                    disabled={savingAiRating}
                    whileHover={{ scale: 1.02 }}
                  >
                    {savingAiRating ? <Spinner size="sm" animation="border" /> : "Save as AI Rating"}
                  </motion.button>
                </>
              )}
            </div>

            <div className="hr-spotlight-card mb-3">
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.6px" }}>Quick snapshot</div>
              <Row className="g-2 mt-1">
                <Col xs={6}>
                  <div className="hr-mini-metric" style={{ padding: 12 }}>
                    <div className="label">Rating</div>
                    <div className="value" style={{ fontSize: "1.05rem" }}>{avgRating ? avgRating.avg.toFixed(1) : "—"}</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="hr-mini-metric" style={{ padding: 12 }}>
                    <div className="label">Next step</div>
                    <div className="sub" style={{ marginTop: 8, fontWeight: 700, color: "#0f172a" }}>{nextAction}</div>
                  </div>
                </Col>
              </Row>
            </div>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Application Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(Number(e.target.value))} style={{ borderRadius: 10 }}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Form.Group>

            {Number(status) !== app?.status && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Status Change Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for status change..."
                  style={{ borderRadius: 10, resize: "vertical", fontSize: "0.85rem" }}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>
                Reviewer
              </Form.Label>
              <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#475569" }}>
                {app.reviewed_by_admin
                  ? `${app.reviewed_by_admin.first_name || ""} ${app.reviewed_by_admin.last_name || ""}`.trim()
                  : "Not yet reviewed"}
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes..."
                style={{ borderRadius: 10, resize: "vertical", fontSize: "0.85rem" }}
              />
            </Form.Group>

            <motion.button
              className="btn w-100"
              style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: "0.9rem", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={handleUpdate}
              disabled={updateLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {updateLoading ? <Spinner size="sm" /> : "Update Application"}
            </motion.button>

            <motion.button
              className="btn w-100 mt-2"
              style={{ background: "#0a1733", color: "#fff", borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: "0.9rem", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={openBook}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaCalendarAlt size={12} /> Book Interview
            </motion.button>
          </motion.div>
        </Col>
      </Row>

      {/* Book Interview Modal */}
      <Modal opened={bookOpen} onClose={closeBook} title="Book Interview" centered radius="lg" size="md">
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Date & Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={bookForm.interview_date}
            onChange={(e) => setBookForm({ ...bookForm, interview_date: e.target.value })}
            style={{ borderRadius: 10 }}
          />
        </Form.Group>
        <Row className="g-2">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Type</Form.Label>
              <Form.Select
                value={bookForm.interview_type}
                onChange={(e) => setBookForm({ ...bookForm, interview_type: e.target.value })}
                style={{ borderRadius: 10 }}
              >
                <option value="in-person">In Person</option>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Location / Link</Form.Label>
              <Form.Control
                type="text"
                value={bookForm.location}
                onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                placeholder="Office, Zoom, etc."
                style={{ borderRadius: 10 }}
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={bookForm.notes}
            onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
            placeholder="Agenda, panelists, etc."
            style={{ borderRadius: 10, resize: "vertical" }}
          />
        </Form.Group>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-light" style={{ borderRadius: 10 }} onClick={closeBook}>Cancel</button>
          <motion.button
            className="btn"
            style={{ background: "#0a1733", color: "#fff", borderRadius: 10, padding: "8px 18px", fontWeight: 600, border: "none" }}
            onClick={handleBookInterview}
            disabled={bookSaving}
            whileHover={{ scale: 1.02 }}
          >
            {bookSaving ? <Spinner size="sm" animation="border" /> : "Confirm Booking"}
          </motion.button>
        </div>
      </Modal>

      {/* Add Rating Modal */}
      <Modal opened={ratingOpen} onClose={closeRating} title="Add Rating" centered radius="lg" size="sm">
        <div className="mb-3 text-center">
          <Rating value={ratingValue} onChange={setRatingValue} size="xl" />
        </div>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Comments</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={ratingComments}
            onChange={(e) => setRatingComments(e.target.value)}
            placeholder="Share your thoughts..."
            style={{ borderRadius: 10, resize: "vertical" }}
          />
        </Form.Group>
        <motion.button
          className="btn w-100"
          style={{ background: "#f59e0b", color: "#fff", borderRadius: 10, padding: "10px", fontWeight: 600, border: "none" }}
          onClick={handleAddRating}
          disabled={ratingSaving}
          whileHover={{ scale: 1.02 }}
        >
          {ratingSaving ? <Spinner size="sm" /> : "Submit Rating"}
        </motion.button>
      </Modal>
    </div>
  );
};

export default HRApplicationDetail;
