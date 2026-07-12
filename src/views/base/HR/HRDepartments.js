import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaGlobe,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
  simpleDeleteCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import "./hr.css";
import HRExportButtons from "./HRExportButtons";
import { formatDate } from "./hrConstants";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const emptyForm = { name_en: "", name_ae: "", description_en: "", description_ae: "", status: 1 };

const HRDepartments = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Form modal
  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadDepartments = () => {
    setLoading(true);
    simpleGetCallAuth(`${configWeb.GET_RECRUITING_DEPARTMENT_LIST}?page=1&page_size=9999`)
      .then((res) => setDepartments(res?.data || []))
      .catch(() => notifyError("Failed to load departments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDepartments(); }, []);

  const stats = useMemo(() => ({
    total: departments.length,
    active: departments.filter((d) => d.status === 1).length,
    inactive: departments.filter((d) => d.status === 0).length,
    bilingual: departments.filter((d) => d.name_en && d.name_ae).length,
    described: departments.filter((d) => d.description_en || d.description_ae).length,
  }), [departments]);

  const filtered = useMemo(() => {
    let list = departments;
    if (statusFilter === "active") list = list.filter((d) => d.status === 1);
    if (statusFilter === "inactive") list = list.filter((d) => d.status === 0);

    if (!searchTerm) return list;
    const t = searchTerm.toLowerCase();
    return list.filter(
      (d) =>
        (d.name_en && d.name_en.toLowerCase().includes(t)) ||
        (d.name_ae && d.name_ae.toLowerCase().includes(t)) ||
        (d.id && String(d.id).includes(searchTerm))
    );
  }, [departments, searchTerm, statusFilter]);

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData(emptyForm);
    openForm();
  };

  const handleOpenEdit = (dept) => {
    setEditId(dept.id);
    setFormData({
      name_en: dept.name_en || "",
      name_ae: dept.name_ae || "",
      description_en: dept.description_en || "",
      description_ae: dept.description_ae || "",
      status: dept.status ?? 1,
    });
    openForm();
  };

  const handleSubmit = () => {
    if (!formData.name_en) return notifyError("English name is required");
    setSaving(true);
    const body = JSON.stringify({ ...formData, status: Number(formData.status) });
    const promise = editId
      ? simplePutCallAuth(configWeb.PUT_RECRUITING_DEPARTMENT_UPDATE(editId), body)
      : simplePostCallAuth(configWeb.POST_RECRUITING_DEPARTMENT_CREATE, body);
    promise
      .then((res) => {
        if (res && !res.error) {
          notifySuccess(editId ? "Department updated" : "Department created");
          closeForm();
          loadDepartments();
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Operation failed");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setSaving(false));
  };

  const toggleStatus = (dept) => {
    const newStatus = dept.status === 1 ? 0 : 1;
    simplePutCallAuth(
      configWeb.PUT_RECRUITING_DEPARTMENT_UPDATE(dept.id),
      JSON.stringify({
        name_en: dept.name_en || "",
        name_ae: dept.name_ae || "",
        description_en: dept.description_en || "",
        description_ae: dept.description_ae || "",
        status: newStatus,
      })
    )
      .then((res) => {
        if (res && !res.error) {
          notifySuccess(`Department ${newStatus === 1 ? "activated" : "deactivated"}`);
          loadDepartments();
        } else {
          notifyError("Failed to update status");
        }
      })
      .catch(() => notifyError("Something went wrong"));
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_DEPARTMENT(deleteId))
      .then((res) => {
        if (res && !res.error) { notifySuccess("Department deleted"); loadDepartments(); }
        else notifyError("Failed to delete");
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => { setDeleteId(null); closeDelete(); });
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaBuilding /></div>
              <div>
                <h4>Departments</h4>
                <p>Organize your organization's departments</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-departments"
              title="HR Departments"
              sheetName="Departments"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Name (EN)", accessor: (r) => r.name_en || "" },
                { header: "Name (AR)", accessor: (r) => r.name_ae || "" },
                { header: "Description (EN)", accessor: (r) => r.description_en || "" },
                { header: "Description (AR)", accessor: (r) => r.description_ae || "" },
                { header: "Status", accessor: (r) => (r.status === 1 ? "Active" : "Inactive") },
                { header: "Created", accessor: (r) => formatDate(r.created_at) },
              ]}
            />
            <motion.button
              className="btn"
              style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: "0.85rem", border: "none", display: "flex", alignItems: "center", gap: 8 }}
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaPlus size={12} /> Add Department
            </motion.button>
          </Col>
        </Row>
      </motion.div>

      <Row className="mx-1 mt-3 g-3 mb-3">
        {[
          { label: "Total", value: stats.total, color: "blue", icon: <FaBuilding /> },
          { label: "Active", value: stats.active, color: "green", icon: <FaToggleOn /> },
          { label: "Inactive", value: stats.inactive, color: "red", icon: <FaToggleOff /> },
          { label: "Bilingual Ready", value: stats.bilingual, color: "cyan", icon: <FaGlobe /> },
        ].map((card, idx) => (
          <Col xl={true} lg={4} md={6} key={card.label}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={idx}>
              <div className={`hr-stat-card ${card.color}`}>
                <div className={`hr-stat-icon ${card.color}`}>{card.icon}</div>
                <div>
                  <div className="hr-stat-value">{card.value}</div>
                  <div className="hr-stat-label">{card.label}</div>
                </div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Search */}
      <motion.div className="hr-filter-bar mx-1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Row className="align-items-end g-3">
          <Col lg={5} md={6}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control type="text" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: 40, borderRadius: 10 }} />
            </div>
          </Col>
          <Col lg={2} md={3}>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
          </Col>
          <Col lg={2} md={3}>
            <Form.Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ borderRadius: 10 }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </Col>
          <Col className="text-end">
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{totalRecords} department(s) · {stats.described} with descriptions</span>
          </Col>
        </Row>
      </motion.div>

      {/* Table */}
      <motion.div className="hr-table-wrapper mx-1 mt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }}>
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name (EN)</th>
                <th>Name (AR)</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6}><div className="hr-empty-state"><FaBuilding size={40} /><p>No departments found</p></div></td></tr>
                ) : (
                  paginated.map((dept, idx) => (
                    <motion.tr key={dept.id} variants={fadeUp} custom={idx} initial="hidden" animate="visible" layout>
                      <td><span style={{ fontWeight: 700, color: "#228be6", fontSize: "0.82rem" }}>#{dept.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{dept.name_en || "—"}</td>
                      <td style={{ direction: "rtl", color: "#64748b" }}>{dept.name_ae || "—"}</td>
                      <td style={{ color: "#64748b", fontSize: "0.82rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dept.description_en || "—"}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="hr-badge" style={{ background: dept.status === 1 ? "#f0fdf4" : "#f1f5f9", color: dept.status === 1 ? "#16a34a" : "#64748b" }}>
                            {dept.status === 1 ? "Active" : "Inactive"}
                          </span>
                          <motion.button
                            onClick={() => toggleStatus(dept)}
                            style={{ background: "none", border: "none", fontSize: "1.25rem", color: dept.status === 1 ? "#22c55e" : "#cbd5e1" }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            title={`Set ${dept.status === 1 ? "inactive" : "active"}`}
                          >
                            {dept.status === 1 ? <FaToggleOn /> : <FaToggleOff />}
                          </motion.button>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="d-flex justify-content-center gap-2">
                          <motion.button className="hr-action-btn edit" onClick={() => handleOpenEdit(dept)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}><FaEdit /></motion.button>
                          <motion.button className="hr-action-btn delete" onClick={() => { setDeleteId(dept.id); openDelete(); }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}><FaTrash /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
        {!loading && totalRecords > 0 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-3">
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Showing {start + 1} – {Math.min(start + pageSize, totalRecords)} of {totalRecords}
            </span>
            <CustomPagination recordsPerPage={pageSize} totalRecords={totalRecords} onPageChange={setCurrentPage} currentPage={currentPage} />
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal opened={formOpen} onClose={closeForm} title={editId ? "Edit Department" : "Create Department"} centered radius="lg" size="lg">
        <Tabs defaultValue="english" variant="pills" radius="lg">
          <Tabs.List mb="lg">
            <Tabs.Tab value="english" leftSection={<FaGlobe size={12} />}>English</Tabs.Tab>
            <Tabs.Tab value="arabic" leftSection={<FaGlobe size={12} />}>Arabic</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="english">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Name (EN) *</Form.Label>
              <Form.Control value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} style={{ borderRadius: 10 }} placeholder="e.g. Engineering" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Description (EN)</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} style={{ borderRadius: 10, resize: "vertical" }} />
            </Form.Group>
          </Tabs.Panel>
          <Tabs.Panel value="arabic">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Name (AR)</Form.Label>
              <Form.Control value={formData.name_ae} onChange={(e) => setFormData({ ...formData, name_ae: e.target.value })} style={{ borderRadius: 10, direction: "rtl" }} placeholder="اسم القسم" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Description (AR)</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description_ae} onChange={(e) => setFormData({ ...formData, description_ae: e.target.value })} style={{ borderRadius: 10, direction: "rtl", resize: "vertical" }} />
            </Form.Group>
          </Tabs.Panel>
        </Tabs>

        <Form.Group className="mb-3 mt-3">
          <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Status</Form.Label>
          <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ borderRadius: 10 }}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </Form.Select>
        </Form.Group>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 24px" }} onClick={closeForm}>Cancel</motion.button>
          <motion.button
            className="btn btn-sm"
            style={{ borderRadius: 10, padding: "8px 24px", background: "#228be6", color: "#fff", border: "none", fontWeight: 600 }}
            onClick={handleSubmit}
            disabled={saving}
            whileHover={{ scale: 1.03 }}
          >
            {saving ? <Spinner size="sm" /> : editId ? "Update" : "Create"}
          </motion.button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpen} onClose={closeDelete} title="Delete Department" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure you want to delete this department?</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px" }} onClick={closeDelete}>Cancel</motion.button>
          <motion.button className="btn btn-sm" style={{ borderRadius: 10, padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none" }} onClick={confirmDelete} whileHover={{ scale: 1.03 }}>Delete</motion.button>
        </div>
      </Modal>
    </div>
  );
};

export default HRDepartments;
