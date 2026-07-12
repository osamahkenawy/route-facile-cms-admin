import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import {
  FaIdCard,
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaInbox,
  FaClock,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaListUl,
  FaPaperPlane,
  FaPhoneAlt,
  FaEnvelope,
  FaFileCsv,
  FaCalendarAlt,
  FaUndo,
  FaThumbsUp,
  FaThumbsDown,
  FaHourglassHalf,
} from "react-icons/fa";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import {
  authHeaders,
  documentsCompletion,
  fetchKycJson,
  filenameFromDisposition,
  formatDateTime,
  PAGE_SIZE_OPTIONS,
  STATUS_OPTIONS,
  statusMeta,
  todayIso,
} from "./kycHelpers";
import "../HR/hr.css";
import "./kyc.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const renderMobile = (sub) => {
  const code = sub.contact_mobile_country_code || sub.contact_mobile_code || "";
  const number = sub.contact_mobile_number || sub.contact_mobile || "";
  if (!code && !number) return "-";
  return `${code ? code + " " : ""}${number || ""}`.trim();
};

const initial = (s) => {
  const v = (s.company_name || s.email || "?").trim();
  return v.charAt(0).toUpperCase();
};

const statusIcon = (s) => {
  switch (s) {
    case "approved":
      return <FaCheckCircle size={10} />;
    case "rejected":
      return <FaTimesCircle size={10} />;
    case "under_review":
      return <FaHourglassHalf size={10} />;
    case "submitted":
      return <FaPaperPlane size={10} />;
    default:
      return <FaClock size={10} />;
  }
};

const KycSubmissionsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const [searchInput, setSearchInput] = useState(search);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20,
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParam = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === "" || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      const changedKeys = Object.keys(updates);
      if (!(changedKeys.length === 1 && changedKeys[0] === "page")) {
        next.set("page", "1");
      }
      return next;
    });
  };

  const buildFilterParams = (overrides = {}) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (search) p.set("search", search);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined) p.delete(k);
      else p.set(k, String(v));
    });
    return p;
  };

  const queryString = useMemo(() => {
    const p = buildFilterParams();
    p.set("page", String(page));
    p.set("limit", String(Math.min(limit, 100)));
    return p.toString();
  }, [status, search, from, to, page, limit]);

  // Load list
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const url = `${configWeb.GET_KYC_SUBMISSIONS}?${queryString}`;
      const { ok, status: httpStatus, data } = await fetchKycJson(url);
      if (cancelled) return;
      if (!ok) {
        if (httpStatus === 403) {
          notifyError("You do not have permission to view KYC submissions.");
        } else {
          notifyError(data?.message || "Failed to load KYC submissions");
        }
        setItems([]);
        setLoading(false);
        return;
      }
      const payload = data?.data || data || {};
      const list = payload.submissions || payload.items || payload.data || [];
      const pg =
        payload.pagination ||
        data?.pagination || {
          current_page: page,
          total_pages: 1,
          total_items: Array.isArray(list) ? list.length : 0,
          items_per_page: limit,
        };
      setItems(Array.isArray(list) ? list : []);
      setPagination(pg);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [queryString]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load global stat counts (one call per status with limit=1)
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async (statusVal) => {
      const p = new URLSearchParams();
      if (statusVal) p.set("status", statusVal);
      if (search) p.set("search", search);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      p.set("page", "1");
      p.set("limit", "1");
      const { ok, data } = await fetchKycJson(
        `${configWeb.GET_KYC_SUBMISSIONS}?${p.toString()}`
      );
      if (!ok) return 0;
      const payload = data?.data || data || {};
      return (
        payload?.pagination?.total_items ??
        data?.pagination?.total_items ??
        0
      );
    };
    const load = async () => {
      const [total, submitted, under_review, approved, rejected] =
        await Promise.all([
          fetchCount(""),
          fetchCount("submitted"),
          fetchCount("under_review"),
          fetchCount("approved"),
          fetchCount("rejected"),
        ]);
      if (cancelled) return;
      setGlobalStats({ total, submitted, under_review, approved, rejected });
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search, from, to]);

  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateParam({ search: searchInput });
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > (pagination.total_pages || 1)) return;
    updateParam({ page: p });
  };

  const clearAll = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const p = buildFilterParams();
      const url = `${configWeb.GET_KYC_SUBMISSIONS_EXPORT}?${p.toString()}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        notifyError("Export failed - please try again.");
        return;
      }
      const blob = await res.blob();
      const fallback = `kyc-submissions-${todayIso()}.csv`;
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
      notifySuccess("Export ready");
    } catch (e) {
      notifyError("Export failed - please try again.");
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    {
      label: "Total Submissions",
      value: globalStats.total,
      icon: <FaIdCard />,
      color: "blue",
    },
    {
      label: "Submitted",
      value: globalStats.submitted,
      icon: <FaPaperPlane />,
      color: "blue",
    },
    {
      label: "Under Review",
      value: globalStats.under_review,
      icon: <FaHourglassHalf />,
      color: "amber",
    },
    {
      label: "Approved",
      value: globalStats.approved,
      icon: <FaThumbsUp />,
      color: "green",
    },
    {
      label: "Rejected",
      value: globalStats.rejected,
      icon: <FaThumbsDown />,
      color: "red",
    },
  ];

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
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3">
                <FaUserShield />
              </div>
              <div>
                <h4>KYC Submissions</h4>
                <p>
                  Review identity verification requests, inspect supporting
                  documents and confirm submission status
                </p>
                <div className="hr-hero-pills">
                  <span className="hr-hero-pill">
                    <FaInbox /> {globalStats.total} total
                  </span>
                  <span className="hr-hero-pill">
                    <FaPaperPlane /> {globalStats.submitted} submitted
                  </span>
                  <span className="hr-hero-pill">
                    <FaHourglassHalf /> {globalStats.under_review} under review
                  </span>
                  <span className="hr-hero-pill">
                    <FaThumbsUp /> {globalStats.approved} approved
                  </span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Stat cards */}
      <Row className="mb-3 g-3 px-1">
        {statCards.map((s, i) => (
          <Col xl={2} lg={4} md={6} sm={6} key={s.label}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
            >
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

      {/* Filter bar */}
      <motion.div
        className="hr-filter-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Row className="g-3 align-items-center">
          <Col xl={4} md={6}>
            <div className="kyc-input-group">
              <FaSearch className="icon" />
              <input
                type="text"
                placeholder="Search reference token, email, mobile or company..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={onSearchKey}
                onBlur={() => {
                  if (searchInput !== search)
                    updateParam({ search: searchInput });
                }}
              />
            </div>
          </Col>
          <Col xl={2} md={3}>
            <div className="kyc-input-group">
              <FaFilter className="icon" />
              <select
                value={status}
                onChange={(e) => updateParam({ status: e.target.value })}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </Col>
          <Col xl={2} md={3}>
            <div className="kyc-input-group">
              <FaCalendarAlt className="icon" />
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => updateParam({ from: e.target.value })}
                title="From date"
              />
            </div>
          </Col>
          <Col xl={2} md={3}>
            <div className="kyc-input-group">
              <FaCalendarAlt className="icon" />
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => updateParam({ to: e.target.value })}
                title="To date"
              />
            </div>
          </Col>
          <Col xl={1} md={2}>
            <div className="kyc-input-group">
              <FaListUl className="icon" />
              <select
                value={limit}
                onChange={(e) =>
                  updateParam({ limit: Number(e.target.value) })
                }
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}/pg
                  </option>
                ))}
              </select>
            </div>
          </Col>
          <Col xl={1} md={4}>
            <button
              type="button"
              className="hr-pill-button secondary w-100 justify-content-center"
              onClick={clearAll}
              title="Clear all filters"
            >
              <FaUndo size={11} /> Clear
            </button>
          </Col>
        </Row>

        <Row className="g-3 mt-1">
          <Col className="d-flex justify-content-end">
            <button
              type="button"
              className="hr-pill-button primary"
              onClick={exportCsv}
              disabled={exporting}
              title="Export current filters as CSV"
            >
              {exporting ? (
                <>
                  <Spinner animation="border" size="sm" /> Exporting…
                </>
              ) : (
                <>
                  <FaFileCsv size={12} /> Export CSV
                </>
              )}
            </button>
          </Col>
        </Row>
      </motion.div>

      {/* Table */}
      <motion.div
        className="hr-table-wrapper mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Status</th>
                <th className="text-center">Verification</th>
                <th className="text-center">Docs</th>
                <th>Submitted</th>
                <th>Reviewed</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10}>
                    <div className="hr-loading">
                      <Spinner animation="border" size="sm" />{" "}
                      <span className="ms-2 text-muted">
                        Loading submissions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="kyc-empty">
                      <div className="kyc-empty-icon">
                        <FaInbox />
                      </div>
                      <p>No KYC submissions match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((sub, idx) => {
                  const meta = statusMeta(sub.status);
                  return (
                    <motion.tr
                      key={sub.id || sub.reference_token}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025, duration: 0.3 }}
                    >
                      <td>
                        <span className="kyc-token">
                          {sub.reference_token || "-"}
                        </span>
                      </td>
                      <td>
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: 10 }}
                        >
                          <div className="kyc-avatar">{initial(sub)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#0f172a",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 220,
                              }}
                            >
                              {sub.email || "-"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "#94a3b8",
                              }}
                            >
                              ID #{sub.id || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#0f172a" }}>
                          {renderMobile(sub)}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#0f172a",
                            fontWeight: 500,
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {sub.company_name || "-"}
                        </div>
                      </td>
                      <td>
                        <span className={`kyc-status ${meta.className}`}>
                          {statusIcon(sub.status)}
                          {meta.label}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-inline-flex" style={{ gap: 6 }}>
                          <span
                            className={`kyc-chip ${
                              sub.phone_verified ? "ok" : "no"
                            }`}
                            title={
                              sub.phone_verified
                                ? "Phone verified"
                                : "Phone not verified"
                            }
                          >
                            <FaPhoneAlt size={9} />
                            {sub.phone_verified ? (
                              <FaCheckCircle size={10} />
                            ) : (
                              <FaTimesCircle size={10} />
                            )}
                          </span>
                          <span
                            className={`kyc-chip ${
                              sub.email_verified ? "ok" : "no"
                            }`}
                            title={
                              sub.email_verified
                                ? "Email verified"
                                : "Email not verified"
                            }
                          >
                            <FaEnvelope size={9} />
                            {sub.email_verified ? (
                              <FaCheckCircle size={10} />
                            ) : (
                              <FaTimesCircle size={10} />
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        {(() => {
                          const docs = documentsCompletion(sub.attachments);
                          if (!sub.attachments) {
                            return (
                              <span className="kyc-docs-pill muted" title="Open submission to inspect documents">
                                —
                              </span>
                            );
                          }
                          return (
                            <span
                              className={`kyc-docs-pill ${
                                docs.complete ? "ok" : "warn"
                              }`}
                              title={
                                docs.complete
                                  ? "All required documents uploaded"
                                  : "One or more required documents missing"
                              }
                            >
                              {docs.complete ? (
                                <FaCheckCircle size={10} />
                              ) : (
                                <FaTimesCircle size={10} />
                              )}
                              {docs.filled}/{docs.total}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", color: "#334155" }}>
                          {formatDateTime(sub.submitted_at)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", color: "#334155" }}>
                          {formatDateTime(sub.reviewed_at)}
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="hr-action-btn view"
                          title="View details"
                          onClick={() =>
                            navigate(`/admin/kyc/submissions/${sub.id}`)
                          }
                        >
                          <FaEye />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="kyc-pagination-footer">
          <div className="info">
            Showing page <strong>{pagination.current_page || page}</strong> of{" "}
            <strong>{pagination.total_pages || 1}</strong> ·{" "}
            <strong>{pagination.total_items || 0}</strong> submissions
          </div>
          <div className="d-flex" style={{ gap: 8 }}>
            <button
              type="button"
              className="kyc-page-btn"
              disabled={(pagination.current_page || page) <= 1 || loading}
              onClick={() => goToPage((pagination.current_page || page) - 1)}
            >
              <FaChevronLeft size={10} /> Previous
            </button>
            <button
              type="button"
              className="kyc-page-btn"
              disabled={
                (pagination.current_page || page) >=
                  (pagination.total_pages || 1) || loading
              }
              onClick={() => goToPage((pagination.current_page || page) + 1)}
            >
              Next <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KycSubmissionsList;
