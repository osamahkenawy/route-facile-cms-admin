import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaBroadcastTower, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import "./hr.css";
import HRExportButtons from "./HRExportButtons";
import { formatDateTime } from "./hrConstants";

const CHANNEL_NAMES = ["trasealla", "indeed", "linkedin", "naukrigulf", "facebook", "instagram", "tiktok"];
const POSTING_STATUS = ["queued", "posted", "failed", "retrying"];

const INITIAL_FORM = {
  career_job_id: "",
  channel_name: "trasealla",
  external_post_id: "",
  posting_status: "queued",
  status_message: "",
  status: 1,
};

const HRChannelPostings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [openForm, formHandlers] = useDisclosure(false);
  const [openDelete, deleteHandlers] = useDisclosure(false);

  const loadJobs = () => {
    simpleGetCallAuth(`${configWeb.GET_CAREER_JOB_LIST}?page=1&page_size=9999`)
      .then((res) => setJobs(res?.data || []))
      .catch(() => setJobs([]));
  };

  const loadItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("page_size", "9999");
    if (selectedJob) params.append("career_job_id", selectedJob);
    if (selectedChannel) params.append("channel_name", selectedChannel);

    simpleGetCallAuth(`${configWeb.GET_RECRUITING_CHANNEL_POSTING_LIST}?${params.toString()}`)
      .then((res) => setItems(res?.data || []))
      .catch(() => {
        notifyError("Failed to load channel postings");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedJob, selectedChannel]);

  const filtered = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        (item.channel_name || "").toLowerCase().includes(term) ||
        (item.posting_status || "").toLowerCase().includes(term) ||
        (item.external_post_id || "").toLowerCase().includes(term) ||
        (item.career_job?.title_en || "").toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const onCreateClick = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM, career_job_id: selectedJob || "", channel_name: selectedChannel || "trasealla" });
    formHandlers.open();
  };

  const onEditClick = (row) => {
    setEditId(row.id);
    setForm({
      career_job_id: row.career_job_id ? String(row.career_job_id) : "",
      channel_name: row.channel_name || "trasealla",
      external_post_id: row.external_post_id || "",
      posting_status: row.posting_status || "queued",
      status_message: row.status_message || "",
      status: row.status ?? 1,
    });
    formHandlers.open();
  };

  const onSave = () => {
    if (!form.career_job_id || !form.channel_name || !form.posting_status) {
      notifyError("Job, channel and posting status are required");
      return;
    }

    setSaving(true);

    if (!editId) {
      const payload = {
        career_job_id: Number(form.career_job_id),
        channel_name: form.channel_name,
        external_post_id: form.external_post_id || undefined,
        posting_status: form.posting_status,
        status_message: form.status_message || undefined,
        status: Number(form.status),
      };
      simplePostCallAuth(configWeb.POST_RECRUITING_CHANNEL_POSTING_CREATE, JSON.stringify(payload))
        .then((res) => {
          if (!res?.error) {
            notifySuccess("Channel record created");
            formHandlers.close();
            loadItems();
          } else {
            notifyError(res?.message || "Failed to create channel record");
          }
        })
        .catch(() => notifyError("Failed to create channel record"))
        .finally(() => setSaving(false));
      return;
    }

    const payload = {};
    const original = items.find((i) => i.id === editId) || {};

    if (Number(form.career_job_id) !== Number(original.career_job_id)) payload.career_job_id = Number(form.career_job_id);
    if (form.channel_name !== (original.channel_name || "")) payload.channel_name = form.channel_name;
    if ((form.external_post_id || "") !== (original.external_post_id || "")) payload.external_post_id = form.external_post_id || null;
    if (form.posting_status !== (original.posting_status || "")) payload.posting_status = form.posting_status;
    if ((form.status_message || "") !== (original.status_message || "")) payload.status_message = form.status_message || null;
    if (Number(form.status) !== Number(original.status || 0)) payload.status = Number(form.status);

    simplePutCallAuth(configWeb.PUT_RECRUITING_CHANNEL_POSTING_UPDATE(editId), JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Channel record updated");
          formHandlers.close();
          loadItems();
        } else {
          notifyError(res?.message || "Failed to update channel record");
        }
      })
      .catch(() => notifyError("Failed to update channel record"))
      .finally(() => setSaving(false));
  };

  const onQuickStatusChange = (row, nextStatus) => {
    simplePutCallAuth(
      configWeb.PUT_RECRUITING_CHANNEL_POSTING_UPDATE(row.id),
      JSON.stringify({ posting_status: nextStatus })
    )
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Posting status updated");
          loadItems();
        } else {
          notifyError(res?.message || "Failed to update posting status");
        }
      })
      .catch(() => notifyError("Failed to update posting status"));
  };

  const onDelete = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_CHANNEL_POSTING(deleteId))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Channel record deleted");
          deleteHandlers.close();
          setDeleteId(null);
          loadItems();
        } else {
          notifyError(res?.message || "Failed to delete channel record");
        }
      })
      .catch(() => notifyError("Failed to delete channel record"))
      .finally(() => setDeleteLoading(false));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedChannel, selectedJob, pageSize]);

  return (
    <div className="hr-module">
      <div className="hr-page-header">
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaBroadcastTower /></div>
              <div>
                <h4>Channel Postings</h4>
                <p>Track publishing state across recruitment channels</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-channel-postings"
              title="HR Channel Postings"
              sheetName="Channels"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Job", accessor: (r) => r.career_job?.title_en || "" },
                { header: "Channel", accessor: (r) => r.channel_name || "" },
                { header: "Status", accessor: (r) => r.posting_status || "" },
                { header: "Status Message", accessor: (r) => r.status_message || "" },
                { header: "Posted At", accessor: (r) => formatDateTime(r.posted_at) },
                { header: "Created", accessor: (r) => formatDateTime(r.created_at) },
                { header: "Active", accessor: (r) => (r.status === 1 ? "Yes" : "No") },
              ]}
            />
            <button className="hr-pill-button primary" onClick={onCreateClick}>
              <FaPlus size={12} /> Add Channel Record
            </button>
          </Col>
        </Row>
      </div>

      <div className="hr-filter-bar mx-1 mt-3">
        <Row className="align-items-end g-3">
          <Col lg={4} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Job
            </label>
            <Form.Select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Channel
            </label>
            <Form.Select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All</option>
              {CHANNEL_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={4} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control
                type="text"
                placeholder="Search by channel, status, post ID..."
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
                <th>Job</th>
                <th>Channel</th>
                <th>Posting Status</th>
                <th>External Post ID</th>
                <th>Last Synced</th>
                <th>Status Message</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8}><div className="hr-empty-state"><FaBroadcastTower size={34} /><p>No channel postings found</p></div></td></tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.career_job?.title_en || "-"}</td>
                    <td>{row.channel_name || "-"}</td>
                    <td>
                      <span className="hr-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        {row.posting_status || "queued"}
                      </span>
                    </td>
                    <td>{row.external_post_id || "-"}</td>
                    <td>{row.last_synced_at ? new Date(row.last_synced_at).toLocaleString() : "-"}</td>
                    <td>{row.status_message || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button className="hr-action-btn edit" onClick={() => onEditClick(row)} title="Edit"><FaEdit /></button>
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
                        {row.posting_status === "queued" && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => onQuickStatusChange(row, "posted")}>Mark Posted</button>
                        )}
                        {row.posting_status === "posted" && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => onQuickStatusChange(row, "failed")}>Mark Failed</button>
                        )}
                        {row.posting_status === "failed" && (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => onQuickStatusChange(row, "retrying")}>Retry</button>
                        )}
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

      <Modal opened={openForm} onClose={formHandlers.close} title={editId ? "Edit Channel Posting" : "Create Channel Posting"} centered radius="lg" size="lg">
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>Job *</Form.Label>
            <Form.Select value={form.career_job_id} onChange={(e) => setForm({ ...form, career_job_id: e.target.value })}>
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Channel *</Form.Label>
            <Form.Select value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })}>
              {CHANNEL_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Posting Status *</Form.Label>
            <Form.Select value={form.posting_status} onChange={(e) => setForm({ ...form, posting_status: e.target.value })}>
              {POSTING_STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Label>External Post ID</Form.Label>
            <Form.Control value={form.external_post_id} onChange={(e) => setForm({ ...form, external_post_id: e.target.value })} />
          </Col>
          <Col md={12}>
            <Form.Label>Status Message</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.status_message} onChange={(e) => setForm({ ...form, status_message: e.target.value })} />
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={formHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : editId ? "Save Changes" : "Create"}
          </button>
        </div>
      </Modal>

      <Modal opened={openDelete} onClose={deleteHandlers.close} title="Delete Channel Posting" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure you want to delete this channel posting record?</p>
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

export default HRChannelPostings;
