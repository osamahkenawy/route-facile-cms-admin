import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaStar, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaCalculator } from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { formatDateTime, getApplicantName } from "./hrConstants";
import "./hr.css";
import HRExportButtons from "./HRExportButtons";

const INITIAL_FORM = {
  application_id: "",
  rating: 1,
  comments: "",
};

const HRRatings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [avgData, setAvgData] = useState(null);
  const [openForm, formHandlers] = useDisclosure(false);
  const [openDelete, deleteHandlers] = useDisclosure(false);

  const loadApplications = () => {
    simpleGetCallAuth(`${configWeb.GET_CAREER_APPLICATION_LIST}?page=1&page_size=9999`)
      .then((res) => setApplications(res?.data || []))
      .catch(() => setApplications([]));
  };

  const loadItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("page_size", "9999");
    if (selectedApplication) params.append("application_id", selectedApplication);

    simpleGetCallAuth(`${configWeb.GET_RECRUITING_RATING_LIST}?${params.toString()}`)
      .then((res) => setItems(res?.data || []))
      .catch(() => {
        notifyError("Failed to load ratings");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedApplication]);

  useEffect(() => {
    if (!selectedApplication) {
      setAvgData(null);
      return;
    }
    simpleGetCallAuth(configWeb.GET_RECRUITING_RATING_AVERAGE(selectedApplication))
      .then((res) => {
        if (res?.average_rating) {
          setAvgData({ average: Number(res.average_rating), total: Number(res.total_ratings || 0) });
        } else {
          setAvgData(null);
        }
      })
      .catch(() => setAvgData(null));
  }, [selectedApplication]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (selectedRating !== "") {
      list = list.filter((item) => String(item.rating) === selectedRating);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          (item.comments || "").toLowerCase().includes(term) ||
          String(item.application_id || "").includes(term) ||
          (item.application && getApplicantName(item.application).toLowerCase().includes(term))
      );
    }
    return list;
  }, [items, selectedRating, searchTerm]);

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM, application_id: selectedApplication || "" });
    formHandlers.open();
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      application_id: row.application_id ? String(row.application_id) : "",
      rating: row.rating || 1,
      comments: row.comments || "",
    });
    formHandlers.open();
  };

  const onSave = () => {
    if (!form.application_id || !form.rating) {
      notifyError("Application and rating are required");
      return;
    }

    setSaving(true);

    if (!editId) {
      const payload = {
        application_id: Number(form.application_id),
        rating: Number(form.rating),
        comments: form.comments || undefined,
      };

      simplePostCallAuth(configWeb.POST_RECRUITING_RATING_CREATE, JSON.stringify(payload))
        .then((res) => {
          if (!res?.error) {
            notifySuccess("Rating created");
            formHandlers.close();
            loadItems();
          } else {
            notifyError(res?.message || "Failed to create rating");
          }
        })
        .catch(() => notifyError("Failed to create rating"))
        .finally(() => setSaving(false));
      return;
    }

    const payload = {};
    const original = items.find((i) => i.id === editId) || {};
    if (Number(form.application_id) !== Number(original.application_id)) payload.application_id = Number(form.application_id);
    if (Number(form.rating) !== Number(original.rating || 0)) payload.rating = Number(form.rating);
    if ((form.comments || "") !== (original.comments || "")) payload.comments = form.comments || null;

    simplePutCallAuth(configWeb.PUT_RECRUITING_RATING_UPDATE(editId), JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Rating updated");
          formHandlers.close();
          loadItems();
        } else {
          notifyError(res?.message || "Failed to update rating");
        }
      })
      .catch(() => notifyError("Failed to update rating"))
      .finally(() => setSaving(false));
  };

  const onDelete = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_RATING(deleteId))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Rating deleted");
          deleteHandlers.close();
          setDeleteId(null);
          loadItems();
        } else {
          notifyError(res?.message || "Failed to delete rating");
        }
      })
      .catch(() => notifyError("Failed to delete rating"))
      .finally(() => setDeleteLoading(false));
  };

  const renderStars = (value) => (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Number(value || 0) ? "#f59e0b" : "#cbd5e1", fontSize: "0.95rem" }}>★</span>
      ))}
    </span>
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRating, selectedApplication, pageSize]);

  return (
    <div className="hr-module">
      <div className="hr-page-header">
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaStar /></div>
              <div>
                <h4>Ratings</h4>
                <p>Manage recruiter ratings and feedback for applications</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-ratings"
              title="HR Ratings"
              sheetName="Ratings"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Application ID", accessor: (r) => r.application_id },
                { header: "Applicant", accessor: (r) => getApplicantName(r.application || {}) },
                { header: "Rating", accessor: (r) => r.rating ?? "" },
                { header: "Comments", accessor: (r) => r.comments || "" },
                { header: "Created", accessor: (r) => formatDateTime(r.created_at) },
              ]}
            />
            <button className="hr-pill-button primary" onClick={openCreate}>
              <FaPlus size={12} /> Add Rating
            </button>
          </Col>
        </Row>
      </div>

      <div className="hr-filter-bar mx-1 mt-3">
        <Row className="align-items-end g-3">
          <Col lg={4} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Application
            </label>
            <Form.Select value={selectedApplication} onChange={(e) => setSelectedApplication(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All applications</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>#{app.id} - {getApplicantName(app)}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Rating
            </label>
            <Form.Select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </Form.Select>
          </Col>
          <Col lg={4} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control
                type="text"
                placeholder="Search by comments, applicant, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 40, borderRadius: 10 }}
              />
            </div>
          </Col>
          <Col lg={2} md={4}>
            <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ borderRadius: 10 }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {avgData && (
        <div className="mx-1 mt-3 p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12 }}>
          <div className="d-flex align-items-center gap-3">
            <FaCalculator style={{ color: "#b45309" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#92400e" }}>Average Rating</div>
              <div style={{ color: "#78350f", fontSize: "0.9rem" }}>
                {avgData.average.toFixed(1)} / 5 from {avgData.total} rating(s)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hr-table-wrapper mx-1 mt-3">
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Application</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Comments</th>
                <th>Created At</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}><div className="hr-empty-state"><FaStar size={34} /><p>No ratings found</p></div></td></tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>
                      {row.application
                        ? `${getApplicantName(row.application)} (#${row.application_id})`
                        : `#${row.application_id || "-"}`}
                    </td>
                    <td>
                      {row.admin
                        ? `${row.admin.first_name || ""} ${row.admin.last_name || ""}`.trim() || row.admin.email || "-"
                        : row.created_by || "-"}
                    </td>
                    <td>{renderStars(row.rating)}</td>
                    <td>{row.comments || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div className="d-flex justify-content-center gap-2">
                        <button className="hr-action-btn edit" onClick={() => openEdit(row)} title="Edit"><FaEdit /></button>
                        <button
                          className="hr-action-btn delete"
                          onClick={() => {
                            setDeleteId(row.id);
                            deleteHandlers.open();
                          }}
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

        {!loading && totalRecords > 0 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-3">
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Showing {start + 1} - {Math.min(start + pageSize, totalRecords)} of {totalRecords}
            </span>
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
            />
          </div>
        )}
      </div>

      <Modal opened={openForm} onClose={formHandlers.close} title={editId ? "Edit Rating" : "Create Rating"} centered radius="lg" size="lg">
        <Row className="g-3">
          <Col md={12}>
            <Form.Label>Application *</Form.Label>
            <Form.Select value={form.application_id} onChange={(e) => setForm({ ...form, application_id: e.target.value })}>
              <option value="">Select application</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>#{app.id} - {getApplicantName(app)}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Rating *</Form.Label>
            <Form.Select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
              <option value={5}>5</option>
              <option value={4}>4</option>
              <option value={3}>3</option>
              <option value={2}>2</option>
              <option value={1}>1</option>
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Label>Comments</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={formHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : editId ? "Save Changes" : "Create"}
          </button>
        </div>
      </Modal>

      <Modal opened={openDelete} onClose={deleteHandlers.close} title="Delete Rating" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure you want to delete this rating?</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={deleteHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete} disabled={deleteLoading}>
            {deleteLoading ? <Spinner size="sm" /> : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HRRatings;
