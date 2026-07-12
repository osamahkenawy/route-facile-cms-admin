import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaHistory, FaPlus, FaSearch, FaFilter, FaEye } from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
} from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { APPLICATION_STATUS, APPLICATION_STATUS_OPTIONS, formatDateTime, getApplicantName } from "./hrConstants";
import "./hr.css";
import HRExportButtons from "./HRExportButtons";

const INITIAL_FORM = {
  application_id: "",
  from_status: 0,
  to_status: 1,
  notes: "",
};

const HRStatusHistory = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState(INITIAL_FORM);
  const [detailData, setDetailData] = useState(null);
  const [openForm, formHandlers] = useDisclosure(false);
  const [openDetails, detailHandlers] = useDisclosure(false);

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

    simpleGetCallAuth(`${configWeb.GET_RECRUITING_STATUS_HISTORY}?${params.toString()}`)
      .then((res) => setItems(res?.data || []))
      .catch(() => {
        notifyError("Failed to load status history");
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

  const filtered = useMemo(() => {
    let list = [...items];
    if (selectedStatus !== "") {
      list = list.filter(
        (item) => String(item.to_status) === selectedStatus || String(item.from_status) === selectedStatus
      );
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          (item.notes || "").toLowerCase().includes(term) ||
          String(item.application_id || "").includes(term) ||
          (item.application && getApplicantName(item.application).toLowerCase().includes(term))
      );
    }
    return list;
  }, [items, selectedStatus, searchTerm]);

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const openCreate = () => {
    setForm({ ...INITIAL_FORM, application_id: selectedApplication || "" });
    formHandlers.open();
  };

  const onCreate = () => {
    if (!form.application_id) {
      notifyError("Application is required");
      return;
    }
    setSaving(true);
    const payload = {
      application_id: Number(form.application_id),
      from_status: Number(form.from_status),
      to_status: Number(form.to_status),
      notes: form.notes || undefined,
    };

    simplePostCallAuth(configWeb.POST_RECRUITING_STATUS_HISTORY, JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Status history entry created");
          formHandlers.close();
          loadItems();
        } else {
          notifyError(res?.message || "Failed to create status history entry");
        }
      })
      .catch(() => notifyError("Failed to create status history entry"))
      .finally(() => setSaving(false));
  };

  const onOpenDetails = (id) => {
    simpleGetCallAuth(configWeb.GET_RECRUITING_STATUS_HISTORY_DETAILS(id))
      .then((res) => {
        if (!res?.error || res?.id) {
          setDetailData(res);
          detailHandlers.open();
        } else {
          notifyError(res?.message || "Failed to load status history details");
        }
      })
      .catch(() => notifyError("Failed to load status history details"));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedApplication, pageSize]);

  return (
    <div className="hr-module">
      <div className="hr-page-header">
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaHistory /></div>
              <div>
                <h4>Status History</h4>
                <p>Track application status transitions and notes</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-status-history"
              title="HR Application Status History"
              sheetName="History"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Application ID", accessor: (r) => r.application_id },
                { header: "Applicant", accessor: (r) => getApplicantName(r.application || {}) },
                { header: "From", accessor: (r) => APPLICATION_STATUS[r.from_status]?.label || "" },
                { header: "To", accessor: (r) => APPLICATION_STATUS[r.to_status]?.label || "" },
                { header: "Notes", accessor: (r) => r.notes || "" },
                { header: "Changed At", accessor: (r) => formatDateTime(r.created_at) },
              ]}
            />
            <button className="hr-pill-button primary" onClick={openCreate}>
              <FaPlus size={12} /> Add History Entry
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
              <FaFilter size={10} className="me-1" /> Status
            </label>
            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ borderRadius: 10 }}>
              {APPLICATION_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={4} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control
                type="text"
                placeholder="Search by notes, application ID..."
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

      <div className="hr-table-wrapper mx-1 mt-3">
        <div className="table-responsive">
          <table className="hr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Application</th>
                <th>From</th>
                <th>To</th>
                <th>Notes</th>
                <th>Created At</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}><div className="hr-empty-state"><FaHistory size={34} /><p>No status history found</p></div></td></tr>
              ) : (
                paginated.map((row) => {
                  const from = APPLICATION_STATUS[row.from_status] || { label: `#${row.from_status}` };
                  const to = APPLICATION_STATUS[row.to_status] || { label: `#${row.to_status}` };
                  return (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>
                        {row.application
                          ? `${getApplicantName(row.application)} (#${row.application_id})`
                          : `#${row.application_id || "-"}`}
                      </td>
                      <td>{from.label}</td>
                      <td>{to.label}</td>
                      <td>{row.notes || "-"}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button className="hr-action-btn view" onClick={() => onOpenDetails(row.id)} title="View"><FaEye /></button>
                      </td>
                    </tr>
                  );
                })
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

      <Modal opened={openForm} onClose={formHandlers.close} title="Create Status History Entry" centered radius="lg" size="lg">
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
            <Form.Label>From Status</Form.Label>
            <Form.Select value={form.from_status} onChange={(e) => setForm({ ...form, from_status: Number(e.target.value) })}>
              {APPLICATION_STATUS_OPTIONS.filter((s) => s.value !== "").map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>To Status</Form.Label>
            <Form.Select value={form.to_status} onChange={(e) => setForm({ ...form, to_status: Number(e.target.value) })}>
              {APPLICATION_STATUS_OPTIONS.filter((s) => s.value !== "").map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={formHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onCreate} disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Create"}
          </button>
        </div>
      </Modal>

      <Modal opened={openDetails} onClose={detailHandlers.close} title="Status History Details" centered radius="lg" size="md">
        {detailData ? (
          <div>
            <p><strong>ID:</strong> #{detailData.id}</p>
            <p><strong>Application:</strong> #{detailData.application_id || "-"}</p>
            <p><strong>From:</strong> {APPLICATION_STATUS[detailData.from_status]?.label || detailData.from_status}</p>
            <p><strong>To:</strong> {APPLICATION_STATUS[detailData.to_status]?.label || detailData.to_status}</p>
            <p><strong>Notes:</strong> {detailData.notes || "-"}</p>
            <p><strong>Created:</strong> {formatDateTime(detailData.created_at)}</p>
          </div>
        ) : (
          <div className="hr-loading"><Spinner animation="border" /></div>
        )}
      </Modal>
    </div>
  );
};

export default HRStatusHistory;
