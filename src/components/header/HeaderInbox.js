import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaEnvelope,
  FaUserPlus,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaBriefcase,
  FaInbox,
  FaCheckCircle,
} from "react-icons/fa";
import { simpleGetCallAuth } from "../config.js/Setup";
import configWeb from "../config.js/ConfigWeb";
import { APPLICATION_STATUS, getApplicantName, getInitials, formatDateTime } from "../../views/base/HR/hrConstants";
import "./header-inbox.css";

const isHrPortal = () =>
  typeof window !== "undefined" && window.location?.pathname?.startsWith("/hr");

const timeAgo = (date) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
};

const NOTIF_DISMISS_KEY = "trasealla_hr_dismissed_notifications";

const loadDismissed = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIF_DISMISS_KEY) || "[]"));
  } catch (e) {
    return new Set();
  }
};

const saveDismissed = (set) => {
  try {
    localStorage.setItem(NOTIF_DISMISS_KEY, JSON.stringify([...set]));
  } catch (e) {}
};

const HeaderInbox = () => {
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState(null); // 'notif' | 'msg' | null
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const wrapperRef = useRef(null);

  const hr = isHrPortal();
  const isMountedRef = useRef(true);

  const fetchData = () => {
    if (!hr) return;
    Promise.all([
      simpleGetCallAuth(`${configWeb.GET_CAREER_APPLICATION_LIST}?page=1&page_size=50`).catch(() => null),
      simpleGetCallAuth(`${configWeb.GET_RECRUITING_INTERVIEW_LIST}?page=1&page_size=50`).catch(() => null),
      simpleGetCallAuth(`${configWeb.GET_CAREER_JOB_LIST}?page=1&page_size=200`).catch(() => null),
    ]).then(([appsRes, intRes, jobsRes]) => {
      if (!isMountedRef.current) return;
      setApplications(appsRes?.data || []);
      setInterviews(intRes?.data || []);
      setJobs(jobsRes?.data || []);
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpenPanel(null);
    };
    document.addEventListener("mousedown", handler);
    // Refresh every 60s while header is mounted
    const interval = setInterval(fetchData, 60000);
    return () => {
      isMountedRef.current = false;
      document.removeEventListener("mousedown", handler);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build notification feed from real data
  const notifications = useMemo(() => {
    const items = [];
    const now = Date.now();

    // New applications in the last 7 days
    applications.forEach((a) => {
      if (!a?.created_at) return;
      const ageDays = (now - new Date(a.created_at).getTime()) / 86400000;
      if (ageDays <= 7) {
        items.push({
          id: `app-${a.id}`,
          type: "application",
          icon: <FaUserPlus />,
          color: "#2563eb",
          bg: "#dbeafe",
          title: `New application from ${getApplicantName(a)}`,
          subtitle: a.career_job?.title_en ? `For ${a.career_job.title_en}` : "Direct application",
          time: a.created_at,
          onClick: () => navigate(`/hr/applications/${a.id}`),
        });
      }
    });

    // Upcoming interviews within 48h
    interviews.forEach((iv) => {
      if (!iv?.interview_date) return;
      const t = new Date(iv.interview_date).getTime();
      const hours = (t - now) / 3600000;
      if (hours >= -1 && hours <= 48) {
        const status = (iv.status || "").toString().toLowerCase();
        items.push({
          id: `int-${iv.id}`,
          type: "interview",
          icon: <FaCalendarCheck />,
          color: "#7c3aed",
          bg: "#ede9fe",
          title: hours < 0
            ? `Interview now with ${iv.application ? getApplicantName(iv.application) : `App #${iv.application_id}`}`
            : `Interview ${hours < 24 ? "today" : "tomorrow"} \u2022 ${iv.application ? getApplicantName(iv.application) : `App #${iv.application_id}`}`,
          subtitle: status ? `Status: ${status}` : iv.interview_type || "Scheduled",
          time: iv.interview_date,
          onClick: () => navigate(`/hr/interview/${iv.id}`),
        });
      }
    });

    // Jobs closing within 7 days
    jobs.forEach((j) => {
      if (!j?.expiry_date || j.status !== 1) return;
      const days = Math.ceil((new Date(j.expiry_date).getTime() - now) / 86400000);
      if (days <= 7 && days >= 0) {
        items.push({
          id: `job-exp-${j.id}`,
          type: "job",
          icon: <FaExclamationTriangle />,
          color: "#ea580c",
          bg: "#ffedd5",
          title: `${j.title_en || `Job #${j.id}`} closing in ${days}d`,
          subtitle: j.location_en || "Renew or extend before expiry",
          time: j.expiry_date,
          onClick: () => navigate(`/hr/jobs/${j.id}`),
        });
      } else if (days < 0) {
        items.push({
          id: `job-exp-${j.id}`,
          type: "job",
          icon: <FaExclamationTriangle />,
          color: "#dc2626",
          bg: "#fee2e2",
          title: `${j.title_en || `Job #${j.id}`} has expired`,
          subtitle: "Needs renewal or archive",
          time: j.expiry_date,
          onClick: () => navigate(`/hr/jobs/${j.id}`),
        });
      }
    });

    // Sort newest first by time
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items.filter((i) => !dismissed.has(i.id));
  }, [applications, interviews, jobs, dismissed, navigate]);

  // Messages = recent applications (treat each as candidate inbox message)
  const messages = useMemo(() => {
    return [...applications]
      .filter((a) => a?.id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 25)
      .map((a) => {
        const stMeta = APPLICATION_STATUS[a.status] || APPLICATION_STATUS[0];
        return {
          id: `msg-${a.id}`,
          name: getApplicantName(a),
          initials: getInitials(a),
          email: a.email || "",
          jobTitle: a.career_job?.title_en || "Direct application",
          preview: (a.cover_letter || a.message || a.summary || a.notes || "Sent an application").toString().replace(/<[^>]*>/g, "").slice(0, 90),
          time: a.created_at,
          status: stMeta,
          onClick: () => navigate(`/hr/applications/${a.id}`),
        };
      });
  }, [applications, navigate]);

  const notifCount = notifications.length;
  const msgCount = messages.length;

  const togglePanel = (panel) => setOpenPanel((p) => (p === panel ? null : panel));

  const dismissNotif = (id, e) => {
    e?.stopPropagation();
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const clearAllNotifs = () => {
    const next = new Set(dismissed);
    notifications.forEach((n) => next.add(n.id));
    setDismissed(next);
    saveDismissed(next);
  };

  // For non-HR portal we keep the original simple bell/envelope icons (no real data)
  if (!hr) {
    return (
      <div className="d-flex align-items-center gap-3 me-3">
        <button className="hi-icon-btn" title="Notifications" type="button">
          <FaBell />
        </button>
        <button className="hi-icon-btn" title="Messages" type="button">
          <FaEnvelope />
        </button>
      </div>
    );
  }

  return (
    <div className="hi-wrapper d-flex align-items-center gap-2 me-2" ref={wrapperRef}>
      {/* Notifications */}
      <div className="hi-trigger-wrap">
        <button
          type="button"
          className={`hi-icon-btn ${openPanel === "notif" ? "active" : ""}`}
          onClick={() => togglePanel("notif")}
          title="Notifications"
        >
          <FaBell />
          {notifCount > 0 && <span className="hi-badge danger">{notifCount > 99 ? "99+" : notifCount}</span>}
        </button>

        {openPanel === "notif" && (
          <div className="hi-panel">
            <div className="hi-panel-head">
              <div>
                <div className="hi-panel-title">Notifications</div>
                <div className="hi-panel-sub">
                  {notifCount === 0 ? "You're all caught up" : `${notifCount} new alert${notifCount > 1 ? "s" : ""}`}
                </div>
              </div>
              {notifCount > 0 && (
                <button className="hi-link-btn" onClick={clearAllNotifs} type="button">
                  Mark all read
                </button>
              )}
            </div>

            <div className="hi-panel-body">
              {notifCount === 0 ? (
                <div className="hi-empty">
                  <FaCheckCircle size={26} />
                  <p>No new notifications</p>
                  <span>New applications, interviews, and expiring jobs appear here.</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="hi-notif-item"
                    onClick={() => {
                      n.onClick && n.onClick();
                      setOpenPanel(null);
                    }}
                  >
                    <span className="hi-notif-icon" style={{ background: n.bg, color: n.color }}>
                      {n.icon}
                    </span>
                    <span className="hi-notif-body">
                      <span className="hi-notif-title">{n.title}</span>
                      <span className="hi-notif-sub">{n.subtitle}</span>
                      <span className="hi-notif-time">{timeAgo(n.time)}</span>
                    </span>
                    <span
                      className="hi-notif-dismiss"
                      onClick={(e) => dismissNotif(n.id, e)}
                      title="Dismiss"
                      role="button"
                    >
                      ×
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="hi-panel-foot">
              <button
                type="button"
                onClick={() => {
                  setOpenPanel(null);
                  navigate("/hr/dashboard");
                }}
              >
                View HR dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages / Inbox */}
      <div className="hi-trigger-wrap">
        <button
          type="button"
          className={`hi-icon-btn ${openPanel === "msg" ? "active" : ""}`}
          onClick={() => togglePanel("msg")}
          title="Inbox"
        >
          <FaEnvelope />
          {msgCount > 0 && <span className="hi-badge warning">{msgCount > 99 ? "99+" : msgCount}</span>}
        </button>

        {openPanel === "msg" && (
          <div className="hi-panel">
            <div className="hi-panel-head">
              <div>
                <div className="hi-panel-title">Candidate Inbox</div>
                <div className="hi-panel-sub">
                  {msgCount === 0 ? "Inbox is empty" : `${msgCount} recent application${msgCount > 1 ? "s" : ""}`}
                </div>
              </div>
              <button
                className="hi-link-btn"
                type="button"
                onClick={() => {
                  setOpenPanel(null);
                  navigate("/hr/applications");
                }}
              >
                Open inbox
              </button>
            </div>

            <div className="hi-panel-body">
              {msgCount === 0 ? (
                <div className="hi-empty">
                  <FaInbox size={26} />
                  <p>No messages yet</p>
                  <span>Candidate applications will land here in real time.</span>
                </div>
              ) : (
                messages.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="hi-msg-item"
                    onClick={() => {
                      m.onClick && m.onClick();
                      setOpenPanel(null);
                    }}
                  >
                    <span className="hi-msg-avatar">{m.initials}</span>
                    <span className="hi-msg-body">
                      <span className="hi-msg-row">
                        <span className="hi-msg-name">{m.name}</span>
                        <span className="hi-msg-time">{timeAgo(m.time)}</span>
                      </span>
                      <span className="hi-msg-job">
                        <FaBriefcase size={9} className="me-1" /> {m.jobTitle}
                      </span>
                      <span className="hi-msg-preview">{m.preview || "Sent an application"}</span>
                      <span className="hi-msg-status" style={{ background: m.status.bg, color: m.status.text }}>
                        {m.status.label}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="hi-panel-foot">
              <button
                type="button"
                onClick={() => {
                  setOpenPanel(null);
                  navigate("/hr/applications");
                }}
              >
                View all applications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderInbox;
