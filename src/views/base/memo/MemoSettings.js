import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaSave, FaInfoCircle } from "react-icons/fa";
import { notifySuccess } from "../../../components/notify/notify";
import "./memo.css";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Section = ({ index, title, description, children }) => (
  <motion.section
    custom={index}
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    className="memo-section"
  >
    <div className="memo-section__head">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
    <div>{children}</div>
  </motion.section>
);

const Phase2Pill = () => (
  <span
    className="memo-badge"
    style={{ background: "#fff7ed", color: "#c2410c" }}
    title="Backend support required"
  >
    Phase 2
  </span>
);

const MemoSettings = () => {
  const [watermark, setWatermark] = useState("{user_email} · {datetime}");
  const [sessionTimeout, setSessionTimeout] = useState(8);
  const [emailSubject, setEmailSubject] = useState("Your Trasealla Memo Portal sign-in PIN");
  const [emailBody, setEmailBody] = useState(
    "Hi,\n\nUse the PIN below to sign in to the Memo Portal. It expires in 10 minutes.\n\nPIN: {pin}\n\n— Trasealla"
  );

  const allowedTypes = [
    { ext: "PDF",  desc: "application/pdf" },
    { ext: "DOC",  desc: "application/msword" },
    { ext: "DOCX", desc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { ext: "XLS",  desc: "application/vnd.ms-excel" },
    { ext: "XLSX", desc: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { ext: "PPT",  desc: "application/vnd.ms-powerpoint" },
    { ext: "PPTX", desc: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  ];

  const save = () => notifySuccess("Settings saved");

  return (
    <div className="memo-page">
      <div className="memo-page__header">
        <div>
          <h1 className="memo-page__title">Memo Portal Settings</h1>
          <p className="memo-page__subtitle">
            Tune how memos are uploaded, watermarked and delivered to end users.
          </p>
        </div>
        <button className="memo-pillbtn memo-pillbtn--primary" onClick={save}>
          <FaSave size={11} /> Save Changes
        </button>
      </div>

      <Section
        index={0}
        title="Allowed File Types"
        description="Read-only. Editing requires backend support."
      >
        <div className="d-flex flex-wrap gap-2 mb-3">
          {allowedTypes.map((t) => (
            <span key={t.ext} className="memo-chip" title={t.desc} style={{ padding: "0.4rem 0.7rem", fontSize: "0.78rem" }}>
              {t.ext}
            </span>
          ))}
        </div>
        <div className="d-flex align-items-center gap-2 text-muted small">
          <FaInfoCircle /> Maximum upload size: <strong className="ms-1 text-dark">25 MB</strong>
          <span className="ms-2"><Phase2Pill /></span>
        </div>
      </Section>

      <Section
        index={1}
        title="PDF Watermark"
        description="Overlay shown diagonally across the end-user PDF viewer."
      >
        <label className="form-label small text-muted">Template</label>
        <input
          className="form-control"
          value={watermark}
          onChange={(e) => setWatermark(e.target.value)}
        />
        <div className="text-muted small mt-2">
          Available variables: <code>{"{user_email}"}</code>, <code>{"{datetime}"}</code>, <code>{"{ip}"}</code>
        </div>

        <div
          className="mt-3 p-4 text-center position-relative overflow-hidden"
          style={{
            background: "#fafbfe",
            border: "1px dashed var(--memo-border)",
            borderRadius: 12,
            minHeight: 120,
          }}
        >
          <div
            style={{
              transform: "rotate(-20deg)",
              fontSize: "1.2rem",
              color: "rgba(79, 70, 229, 0.18)",
              fontWeight: 700,
              userSelect: "none",
            }}
          >
            {watermark
              .replace("{user_email}", "user@trasealla.com")
              .replace("{datetime}", new Date().toISOString())
              .replace("{ip}", "10.0.0.42")}
          </div>
          <small className="text-muted d-block mt-2">Live preview</small>
        </div>
      </Section>

      <Section
        index={2}
        title="Session Timeout"
        description="How long a portal user stays signed in before re-authenticating."
      >
        <div className="d-flex align-items-center gap-3">
          <input
            type="range"
            min={1}
            max={24}
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(+e.target.value)}
            style={{ flex: 1 }}
          />
          <div
            style={{
              minWidth: 90,
              textAlign: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: 10,
              background: "var(--memo-primary-soft)",
              color: "var(--memo-primary)",
              fontWeight: 600,
            }}
          >
            {sessionTimeout} h
          </div>
        </div>
        <small className="text-muted">Recommended: 8 hours.</small>
      </Section>

      <Section
        index={3}
        title="Email Templates"
        description="Used for the sign-in PIN and the welcome email."
      >
        <label className="form-label small text-muted">Subject</label>
        <input
          className="form-control mb-3"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
        />
        <label className="form-label small text-muted">Body</label>
        <textarea
          className="form-control"
          rows={6}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
        />
        <div className="text-muted small mt-2">
          Variables: <code>{"{pin}"}</code>, <code>{"{user_email}"}</code>, <code>{"{expires_in}"}</code>
        </div>
      </Section>
    </div>
  );
};

export default MemoSettings;
