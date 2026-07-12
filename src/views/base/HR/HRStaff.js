import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaKey,
  FaToggleOn,
  FaToggleOff,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaUserCheck,
  FaUserShield,
  FaUserFriends,
} from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePatchCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import HRExportButtons from "./HRExportButtons";
import "./hr.css";

const HR_TYPES = [
  { value: "hr_manager", label: "HR Manager" },
  { value: "hr_recruitment", label: "HR Recruitment" },
];

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  country_code: "+971",
  phone_number: "",
  type: "hr_recruitment",
};

const getInitials = (u) => {
  const f = (u?.first_name || "")[0] || "";
  const l = (u?.last_name || "")[0] || "";
  return (f + l).toUpperCase() || "?";
};

const avatarColor = (seed) => {
  const palette = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#0ea5e9", "#f59e0b", "#10b981"];
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const HRStaff = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [openForm, formHandlers] = useDisclosure(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [openDelete, deleteHandlers] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [openReset, resetHandlers] = useDisclosure(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);

  const loadItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(pageSize));
    if (search) params.append("search", search);
    simpleGetCallAuth(`${configWeb.GET_HR_STAFF_LIST}?${params.toString()}`)
      .then((res) => {
        setItems(res?.data || []);
        setTotal(Number(res?.total ?? (res?.data || []).length));
      })
      .catch(() => {
        notifyError("Failed to load HR staff");
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter) list = list.filter((u) => u.type === typeFilter);
    if (statusFilter !== "") list = list.filter((u) => String(u.status) === statusFilter);
    return list;
  }, [items, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = items.filter((u) => Number(u.status) === 1).length;
    const managers = items.filter((u) => u.type === "hr_manager").length;
    const recruiters = items.filter((u) => u.type === "hr_recruitment").length;
    return { total, active, inactive: items.length - active, managers, recruiters };
  }, [items, total]);

  // --- create / edit ---
  const onCreate = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
    formHandlers.open();
  };

  const onEdit = (row) => {
    setEditId(row.id);
    setForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      country_code: row.country_code || "+971",
      phone_number: row.phone_number || "",
      type: row.type || "hr_recruitment",
    });
    formHandlers.open();
  };

  const validate = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return "First and last name are required";
    if (!editId && !form.email.trim()) return "Email is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return "Email looks invalid";
    if (!form.phone_number.trim()) return "Phone number is required";
    if (!HR_TYPES.find((t) => t.value === form.type)) return "Pick an HR role";
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) {
      notifyError(err);
      return;
    }
    setSaving(true);
    const payload = editId
      ? {
          first_name: form.first_name,
          last_name: form.last_name,
          country_code: form.country_code,
          phone_number: form.phone_number,
          type: form.type,
        }
      : { ...form };

    const call = editId ? simplePutCallAuth : simplePostCallAuth;
    const url = editId ? configWeb.PUT_HR_STAFF_UPDATE(editId) : configWeb.POST_HR_STAFF_CREATE;
    call(url, JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          notifySuccess(editId ? "Staff updated" : "Staff created — temp password emailed");
          formHandlers.close();
          loadItems();
        } else {
          notifyError(
            Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to save"
          );
        }
      })
      .catch(() => notifyError("Failed to save"))
      .finally(() => setSaving(false));
  };

  const onToggleStatus = (row) => {
    const newStatus = Number(row.status) === 1 ? 0 : 1;
    simplePatchCallAuth(
      configWeb.PATCH_HR_STAFF_STATUS(row.id),
      JSON.stringify({ status: newStatus })
    )
      .then((res) => {
        if (!res?.error) {
          notifySuccess(`Staff ${newStatus === 1 ? "enabled" : "disabled"}`);
          loadItems();
        } else {
          notifyError(
            Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to update status"
          );
        }
      })
      .catch(() => notifyError("Failed to update status"));
  };

  const onResetPassword = () => {
    if (!resetTarget) return;
    setResetting(true);
    simplePostCallAuth(
      configWeb.POST_HR_STAFF_RESET_PASSWORD(resetTarget.id),
      JSON.stringify({})
    )
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Temporary password sent to email");
          resetHandlers.close();
          setResetTarget(null);
        } else {
          notifyError(res?.message || "Failed to reset password");
        }
      })
      .catch(() => notifyError("Failed to reset password"))
      .finally(() => setResetting(false));
  };

  const onDelete = () => {
    if (!deleteId) return;
    setDeleting(true);
    simpleDeleteCallAuth(configWeb.DELETE_HR_STAFF(deleteId))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Staff deleted");
          deleteHandlers.close();
          setDeleteId(null);
          loadItems();
        } else {
          notifyError(res?.message || "Failed to delete");
        }
      })
      .catch(() => notifyError("Failed to delete"))
      .finally(() => setDeleting(false));
  };

  const statCards = [
    { label: "Total Staff", value: stats.total, className: "blue", icon: <FaUsers />, filter: () => { setTypeFilter(""); setStatusFilter(""); } },
    { label: "Active", value: stats.active, className: "green", icon: <FaUserCheck />, filter: () => setStatusFilter("1") },
    { label: "HR Managers", value: stats.managers, className: "violet", icon: <FaUserShield />, filter: () => setTypeFilter("hr_manager") },
    { label: "Recruiters", value: stats.recruiters, className: "orange", icon: <FaUserFriends />, filter: () => setTypeFilter("hr_recruitment") },
  ];

  return (
    <div className="hr-module">
      <div className="hr-page-header">
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaUserTie /></div>
              <div>
                <h4>HR Staff</h4>
                <p>Manage HR managers and recruiters who access this portal</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-staff"
              title="HR Staff"
              sheetName="Staff"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "First Name", accessor: (r) => r.first_name || "" },
                { header: "Last Name", accessor: (r) => r.last_name || "" },
                { header: "Email", accessor: (r) => r.email || "" },
                { header: "Phone", accessor: (r) => `${r.country_code || ""} ${r.phone_number || ""}`.trim() },
                { header: "Role", accessor: (r) => HR_TYPES.find((t) => t.value === r.type)?.label || r.type || "" },
                { header: "Status", accessor: (r) => (Number(r.status) === 1 ? "Active" : "Disabled") },
                { header: "Created", accessor: (r) => (r.created_at || "").slice(0, 10) },
              ]}
            />
            <button className="hr-pill-button primary" onClick={onCreate}>
              <FaPlus size={12} /> Add HR Staff
            </button>
          </Col>
        </Row>
      </div>

      <Row className="mx-1 mt-3 g-3 hr-stat-grid">
        {statCards.map((c, idx) => (
          <Col xl={3} lg={3} md={6} sm={6} key={c.label}>
            <motion.div
              className={`hr-dash-stat ${c.className}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.06, duration: 0.35 }}
              style={{ cursor: "pointer" }}
              onClick={c.filter}
            >
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">{loading ? "\u2014" : c.value}</div>
                </div>
                <div className="stat-icon">{c.icon}</div>
              </div>
              <div className="stat-change up">Click to filter</div>
            </motion.div>
          </Col>
        ))}
      </Row>

      <div className="hr-filter-bar mx-1 mt-3">
        <Row className="align-items-end g-3">
          <Col lg={4} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaSearch size={10} className="me-1" /> Search
            </label>
            <Form.Control
              type="text"
              placeholder="Search name, email, phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </Col>
          <Col lg={3} md={4}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Role
            </label>
            <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All roles</option>
              {HR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col lg={3} md={4}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Status
            </label>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All</option>
              <option value="1">Active</option>
              <option value="0">Disabled</option>
            </Form.Select>
          </Col>
          <Col lg={2} md={4}>
            <Form.Select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ borderRadius: 10 }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      <div className="hr-table-wrapper mx-1 mt-3">
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="hr-empty-state"><FaUserTie size={34} /><p>No HR staff found</p></div></td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: avatarColor((row.first_name || "") + (row.last_name || "")),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "0.78rem",
                        }}>{getInitials(row)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{row.first_name} {row.last_name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>ID #{row.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.82rem", color: "#475569" }}>
                        <FaEnvelope size={10} className="text-muted" />
                        {row.email || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.82rem", color: "#475569" }}>
                        <FaPhone size={10} className="text-muted" />
                        {row.country_code || ""} {row.phone_number || ""}
                      </span>
                    </td>
                    <td>
                      <span className="hr-badge" style={{
                        background: row.type === "hr_manager" ? "#ede9fe" : "#fff7ed",
                        color: row.type === "hr_manager" ? "#5b21b6" : "#9a3412",
                      }}>
                        {HR_TYPES.find((t) => t.value === row.type)?.label || row.type || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="hr-badge" style={{
                        background: Number(row.status) === 1 ? "#dcfce7" : "#f1f5f9",
                        color: Number(row.status) === 1 ? "#166534" : "#475569",
                      }}>
                        {Number(row.status) === 1 ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#64748b" }}>{(row.created_at || "").slice(0, 10) || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="hr-action-btn"
                          style={{
                            background: Number(row.status) === 1 ? "#fef3c7" : "#dcfce7",
                            color: Number(row.status) === 1 ? "#92400e" : "#166534",
                          }}
                          onClick={() => onToggleStatus(row)}
                          title={Number(row.status) === 1 ? "Disable" : "Enable"}
                        >
                          {Number(row.status) === 1 ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                        <button
                          className="hr-action-btn"
                          style={{ background: "#dbeafe", color: "#1e40af" }}
                          onClick={() => { setResetTarget(row); resetHandlers.open(); }}
                          title="Reset password"
                        >
                          <FaKey />
                        </button>
                        <button className="hr-action-btn edit" onClick={() => onEdit(row)} title="Edit"><FaEdit /></button>
                        <button
                          className="hr-action-btn delete"
                          onClick={() => { setDeleteId(row.id); deleteHandlers.open(); }}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-3">
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Page {page} — showing {filtered.length} of {total}
            </span>
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={total}
              onPageChange={setPage}
              currentPage={page}
            />
          </div>
        )}
      </div>

      {/* CREATE / EDIT */}
      <Modal opened={openForm} onClose={formHandlers.close} title={editId ? "Edit HR Staff" : "Add HR Staff"} centered radius="lg" size="lg">
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>First Name *</Form.Label>
            <Form.Control value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </Col>
          <Col md={6}>
            <Form.Label>Last Name *</Form.Label>
            <Form.Control value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </Col>
          <Col md={12}>
            <Form.Label>Email {editId ? "" : "*"}</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!!editId}
            />
            {editId && (
              <small className="text-muted" style={{ fontSize: "0.72rem" }}>Email cannot be changed.</small>
            )}
          </Col>
          <Col md={4}>
            <Form.Label>Country Code *</Form.Label>
            <Form.Control value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="+971" />
          </Col>
          <Col md={8}>
            <Form.Label>Phone Number *</Form.Label>
            <Form.Control value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="501234567" />
          </Col>
          <Col md={12}>
            <Form.Label>Role *</Form.Label>
            <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {HR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
        </Row>
        {!editId && (
          <div style={{
            marginTop: 14, padding: "10px 12px", background: "#eff6ff", borderRadius: 10,
            border: "1px solid #bfdbfe", fontSize: "0.78rem", color: "#1e40af",
          }}>
            A temporary password will be generated and emailed to this user.
          </div>
        )}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={formHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : editId ? "Save Changes" : "Create"}
          </button>
        </div>
      </Modal>

      {/* RESET PASSWORD CONFIRM */}
      <Modal opened={openReset} onClose={resetHandlers.close} title="Reset Password" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>
          Send a new temporary password to <strong>{resetTarget?.email}</strong>?
        </p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={resetHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onResetPassword} disabled={resetting}>
            {resetting ? <Spinner size="sm" /> : "Send"}
          </button>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal opened={openDelete} onClose={deleteHandlers.close} title="Delete HR Staff" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>
          This will permanently remove the HR account. Continue?
        </p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={deleteHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HRStaff;
