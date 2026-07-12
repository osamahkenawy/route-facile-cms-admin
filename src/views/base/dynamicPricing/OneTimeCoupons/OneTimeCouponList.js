import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import {
  TfiPlus,
  TfiLayersAlt,
  TfiSearch,
  TfiTicket,
  TfiCheck,
  TfiClose,
  TfiTime,
  TfiAlert,
  TfiPencilAlt,
  TfiTrash,
  TfiEye,
  TfiDownload,
} from "react-icons/tfi";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import "./oneTimeCoupons.css";

// State derivation shared with Detail page
export const computeCouponState = (coupon) => {
  if (!coupon) return { key: "unknown", label: "—", tone: "tone-grey" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endRaw = coupon.end_date || coupon.valid_to;
  const end = endRaw ? new Date(endRaw) : null;
  if (end) end.setHours(0, 0, 0, 0);
  const remaining =
    Number(coupon.usage_limit ?? 0) - Number(coupon.usage_count ?? 0);

  if (Number(coupon.status) === 0)
    return { key: "inactive", label: "Inactive", tone: "tone-grey" };
  if (end && end < today)
    return { key: "expired", label: "Expired", tone: "tone-amber" };
  if (remaining <= 0)
    return { key: "used_up", label: "Used up", tone: "tone-red" };
  return { key: "active", label: "Active", tone: "tone-green" };
};

const OneTimeCouponList = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("daily");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showDel, setShowDel] = useState(false);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = () => {
    setLoading(true);
    const url = `${configWeb.GET_ONE_TIME_COUPON}?type=${encodeURIComponent(type)}`;
    simpleGetCallAuth(url)
      .then((res) => {
        const all = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        if (!Array.isArray(res) && res?.error) {
          setCoupons([]);
        } else {
          setCoupons(all);
        }
      })
      .catch(() => {
        notifyError("Could not load coupons. Please try again.");
        setCoupons([]);
      })
      .finally(() => setLoading(false));
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [type, statusFilter, search]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter === "active" && Number(c.status) !== 1) return false;
      if (statusFilter === "inactive" && Number(c.status) !== 0) return false;
      if (search && !String(c.code || "").toLowerCase().includes(search.trim().toLowerCase()))
        return false;
      return true;
    });
  }, [coupons, statusFilter, search]);

  // Client-side pagination for the dedicated single-use endpoint (plain array)
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  // Clamp page if filters shrunk the result set below current page range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  // Keep totalRecords in sync (used by header + CustomPagination)
  useEffect(() => {
    setTotalRecords(totalFiltered);
  }, [totalFiltered]);

  const stats = useMemo(() => {
    let active = 0,
      used = 0,
      expired = 0;
    coupons.forEach((c) => {
      const s = computeCouponState(c).key;
      if (s === "active") active++;
      if (s === "used_up") used++;
      if (s === "expired") expired++;
    });
    return { total: coupons.length, active, used, expired };
  }, [coupons]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const headers = [
      "Code",
      "Type",
      "Discount Type",
      "Rate",
      "Start Date",
      "End Date",
      "Usage Limit",
      "Usage Count",
      "Remaining",
      "Status",
      "State",
    ];
    const esc = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((c) => {
      const limit = Number(c.usage_limit || 0);
      const used = Number(c.usage_count || 0);
      return [
        c.code,
        c.type,
        c.discount_type,
        c.rate ?? c.discount_value ?? 0,
        c.start_date || c.valid_from || "",
        c.end_date || c.valid_to || "",
        limit,
        used,
        Math.max(limit - used, 0),
        Number(c.status) === 1 ? "Active" : "Inactive",
        computeCouponState(c).label,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map(esc).join(","))
      .join("\r\n");
    // BOM for Excel UTF-8 friendliness
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `one-time-coupons-${type}-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const onDelete = () => {    if (!delId) return;
    setDeleting(true);
    simpleDeleteCallAuth(configWeb.DELETE_ONE_TIME_COUPON(delId))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Coupon deleted");
          setShowDel(false);
          setDelId(null);
          // If we deleted the last item on the current page, step back one page
          if (coupons.length === 1 && currentPage > 1) {
            setCurrentPage((p) => p - 1);
          } else {
            fetchList();
          }
        } else {
          notifyError(
            (Array.isArray(res?.message) ? res?.message[0] : res?.message) ||
              "Delete failed"
          );
        }
      })
      .catch(() => notifyError("Delete failed. Please try again."))
      .finally(() => setDeleting(false));
  };

  return (
    <div className="otc-page">
      {/* Hero */}
      <div className="otc-hero">
        <div className="otc-hero-inner">
          <div>
            <span className="otc-hero-pill">
              <TfiTicket /> Single-use campaign
            </span>
            <h1>
              One-Time <span className="otc-hero-accent">Discount Coupons</span>
            </h1>
            <p>
              Coupons that become invalid after their usage limit is reached.
              Perfect for VIP campaigns, partner giveaways and one-shot codes.
            </p>
          </div>
          <div className="otc-hero-actions">
            <Link to="/admin/one-time-coupons/new" className="otc-btn otc-btn-primary">
              <TfiPlus /> Add coupon
            </Link>
            <Link to="/admin/one-time-coupons/bulk" className="otc-btn otc-btn-ghost">
              <TfiLayersAlt /> Bulk create
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="otc-stats">
        <div className="otc-stat">
          <div className="otc-stat-ico tone-blue"><TfiTicket /></div>
          <div>
            <div className="otc-stat-label">Total</div>
            <div className="otc-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="otc-stat">
          <div className="otc-stat-ico tone-green"><TfiCheck /></div>
          <div>
            <div className="otc-stat-label">Active</div>
            <div className="otc-stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="otc-stat">
          <div className="otc-stat-ico tone-red"><TfiAlert /></div>
          <div>
            <div className="otc-stat-label">Used up</div>
            <div className="otc-stat-value">{stats.used}</div>
          </div>
        </div>
        <div className="otc-stat">
          <div className="otc-stat-ico tone-amber"><TfiTime /></div>
          <div>
            <div className="otc-stat-label">Expired</div>
            <div className="otc-stat-value">{stats.expired}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="otc-toolbar">
        <div className="otc-segment" role="tablist" aria-label="Coupon type">
          <button
            type="button"
            className={type === "daily" ? "is-active" : ""}
            onClick={() => setType("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            className={type === "monthly" ? "is-active" : ""}
            onClick={() => setType("monthly")}
          >
            Monthly
          </button>
        </div>

        <div className="otc-segment" role="tablist" aria-label="Status">
          <button
            type="button"
            className={statusFilter === "all" ? "is-active" : ""}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={statusFilter === "active" ? "is-active" : ""}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>
          <button
            type="button"
            className={statusFilter === "inactive" ? "is-active" : ""}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </button>
        </div>

        <div className="otc-search">
          <TfiSearch className="otc-search-ico" />
          <input
            type="text"
            placeholder="Search by code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table card */}
      <div className="otc-card">
        <div className="otc-card-header">
          <div>
            <p className="otc-card-title">
              {type === "daily" ? "Daily" : "Monthly"} one-time coupons
            </p>
            <p className="otc-card-sub">
              {totalRecords === 0
                ? "0 entries"
                : `Page ${currentPage} · showing ${paged.length} of ${totalFiltered} · ${coupons.length} total`}
            </p>
          </div>
          <button
            type="button"
            className="otc-btn otc-btn-outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            title={
              filtered.length === 0
                ? "No rows to export"
                : `Download ${filtered.length} row(s) as CSV`
            }
          >
            <TfiDownload /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="otc-loader">
            <Spinner animation="border" size="sm" /> Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <div className="otc-empty">
            <div className="otc-empty-ico"><TfiTicket /></div>
            <h3>No one-time coupons yet</h3>
            <p>Create one or generate a batch to launch your campaign.</p>
            <div className="otc-empty-actions">
              <Link to="/admin/one-time-coupons/new" className="otc-btn otc-btn-dark">
                <TfiPlus /> Add coupon
              </Link>
              <Link to="/admin/one-time-coupons/bulk" className="otc-btn otc-btn-outline">
                <TfiLayersAlt /> Bulk create
              </Link>
            </div>
          </div>
        ) : paged.length === 0 ? (
          <div className="otc-empty">
            <div className="otc-empty-ico"><TfiSearch /></div>
            <h3>No matches</h3>
            <p>Adjust your filters or search term.</p>
          </div>
        ) : (
          <div className="otc-table-wrap">
            <table className="otc-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Rate</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Usage</th>
                  <th>Remaining</th>
                  <th>State</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => {
                  const limit = Number(c.usage_limit || 0);
                  const used = Number(c.usage_count || 0);
                  const remaining = Math.max(limit - used, 0);
                  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                  const barTone =
                    pct >= 100 ? "full" : pct >= 70 ? "warn" : "";
                  const state = computeCouponState(c);
                  const startDate = c.start_date || c.valid_from || "—";
                  const endDate = c.end_date || c.valid_to || "—";
                  const rate = c.rate ?? c.discount_value ?? 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="otc-code">{c.code}</span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{c.type}</td>
                      <td style={{ textTransform: "capitalize" }}>
                        {c.discount_type}
                      </td>
                      <td>
                        {rate}
                        {c.discount_type === "percentage" ? "%" : ""}
                      </td>
                      <td>{startDate}</td>
                      <td>{endDate}</td>
                      <td>
                        <div className="otc-usage">
                          <div className={`otc-usage-bar ${barTone}`}>
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <span className="otc-usage-text">
                            {used}/{limit}
                          </span>
                        </div>
                      </td>
                      <td>{remaining}</td>
                      <td>
                        <span className={`otc-badge ${state.tone}`}>
                          <span className="otc-badge-dot" />
                          {state.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="otc-actions">
                          <button
                            type="button"
                            className="otc-icon-btn is-view"
                            title="View"
                            onClick={() =>
                              navigate(`/admin/one-time-coupons/${c.id}`)
                            }
                          >
                            <TfiEye />
                          </button>
                          <button
                            type="button"
                            className="otc-icon-btn is-edit"
                            title="Edit"
                            onClick={() =>
                              navigate(`/admin/one-time-coupons/${c.id}/edit`)
                            }
                          >
                            <TfiPencilAlt />
                          </button>
                          <button
                            type="button"
                            className="otc-icon-btn is-delete"
                            title="Delete"
                            onClick={() => {
                              setDelId(c.id);
                              setShowDel(true);
                            }}
                          >
                            <TfiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalRecords > 0 && (
          <div
            className="otc-card-header"
            style={{
              borderTop: "1px solid #eef2f7",
              borderBottom: "none",
              flexWrap: "wrap",
            }}
          >
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              currentPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
            <select
              className="otc-select"
              style={{ width: "auto", minWidth: 90 }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        )}
      </div>

      <Modal show={showDel} onHide={() => setShowDel(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete coupon?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action cannot be undone. The coupon will be soft-deleted and no
          longer available for redemption.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDel(false)} disabled={deleting}>
            <TfiClose /> Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : <TfiTrash />} Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OneTimeCouponList;
