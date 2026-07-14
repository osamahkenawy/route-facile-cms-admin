import React, { useMemo, useState } from "react";
import {
  FaLinkedin,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaInstagram,
  FaLink,
  FaShareAlt,
  FaCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { SiIndeed } from "react-icons/si";
import { notifySuccess, notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";

/**
 * Share buttons for a public job posting.
 * Props:
 *  - jobId
 *  - title (string) — used as share text
 *  - publicUrl (optional override)
 *  - compact (bool) — render a single dropdown-style row vs full card
 */
const JobShareButtons = ({ jobId, title, publicUrl, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (publicUrl) return publicUrl;
    if (!jobId) return configWeb.CAREERS_PUBLIC_URL;
    return configWeb.GET_CAREER_PUBLIC_JOB_URL(jobId);
  }, [jobId, publicUrl]);

  const text = useMemo(
    () => (title ? `We're hiring: ${title} at Route Facile` : "Job opportunity at Route Facile"),
    [title]
  );

  const enc = (s) => encodeURIComponent(s);
  const eUrl = enc(url);
  const eText = enc(text);

  const channels = [
    {
      key: "linkedin",
      label: "LinkedIn",
      color: "#0a66c2",
      icon: <FaLinkedin />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${eUrl}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      color: "#1877f2",
      icon: <FaFacebook />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${eUrl}&quote=${eText}`,
    },
    {
      key: "twitter",
      label: "X / Twitter",
      color: "#0f172a",
      icon: <FaTwitter />,
      href: `https://twitter.com/intent/tweet?url=${eUrl}&text=${eText}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      color: "#25d366",
      icon: <FaWhatsapp />,
      href: `https://wa.me/?text=${eText}%20${eUrl}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      color: "#229ed9",
      icon: <FaTelegram />,
      href: `https://t.me/share/url?url=${eUrl}&text=${eText}`,
    },
    {
      key: "email",
      label: "Email",
      color: "#475569",
      icon: <FaEnvelope />,
      href: `mailto:?subject=${eText}&body=${eText}%0A%0A${eUrl}`,
    },
    {
      key: "indeed",
      label: "Indeed",
      color: "#2557a7",
      icon: <SiIndeed />,
      manual: true,
      hint: "Indeed has no share URL — copy link & paste into your Indeed job posting / company page.",
    },
    {
      key: "instagram",
      label: "Instagram",
      color: "#e4405f",
      icon: <FaInstagram />,
      manual: true,
      hint: "Instagram doesn't allow web sharing — copy link & paste into your bio, story or DM.",
    },
  ];

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      notifySuccess("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notifyError("Failed to copy link");
    }
  };

  const tryNativeShare = async () => {
    if (!navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      /* user dismissed */
    }
  };

  const onChannelClick = (ch, e) => {
    if (ch.manual) {
      e.preventDefault();
      copyLink();
      notifySuccess(ch.hint);
    }
  };

  return (
    <div className="job-share-card" style={compact ? { padding: 0, background: "transparent", border: "none", boxShadow: "none" } : undefined}>
      {!compact && (
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h6 style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <FaShareAlt size={14} style={{ color: "#228be6" }} /> Share this job
          </h6>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#0a1733", color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 600, border: "none", display: "flex", alignItems: "center", gap: 6 }}
            onClick={tryNativeShare}
          >
            <FaShareAlt size={11} /> Quick share
          </button>
        </div>
      )}

      {!compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 14,
          }}
        >
          <FaLink size={11} style={{ color: "#64748b", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.78rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open public job page"
            style={{ color: "#228be6", display: "flex", alignItems: "center" }}
          >
            <FaExternalLinkAlt size={11} />
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="btn btn-sm"
            style={{
              background: copied ? "#dcfce7" : "#fff",
              color: copied ? "#166534" : "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: "0.74rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {copied ? <FaCheck size={10} /> : <FaLink size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2">
        {channels.map((ch) => (
          <a
            key={ch.key}
            href={ch.href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => onChannelClick(ch, e)}
            title={ch.hint || `Share on ${ch.label}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: `1px solid ${ch.color}33`,
              color: ch.color,
              borderRadius: 999,
              padding: "7px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ch.color;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = ch.color;
            }}
          >
            <span style={{ display: "inline-flex", fontSize: "0.95rem" }}>{ch.icon}</span>
            {ch.label}
          </a>
        ))}

        {compact && (
          <button
            type="button"
            onClick={copyLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: copied ? "#dcfce7" : "#fff",
              border: `1px solid ${copied ? "#86efac" : "#cbd5e1"}`,
              color: copied ? "#166534" : "#0f172a",
              borderRadius: 999,
              padding: "7px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copied ? <FaCheck size={10} /> : <FaLink size={10} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobShareButtons;
