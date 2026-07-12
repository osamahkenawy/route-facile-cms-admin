import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaClipboardList,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaLayerGroup,
  FaCopy,
  FaTimes,
} from "react-icons/fa";
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

// All 12 question types supported by the backend
const QUESTION_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number" },
  { value: "rating", label: "Rating" },
  { value: "date", label: "Date" },
  { value: "yes_no", label: "Yes / No" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "file_upload", label: "File Upload" },
];

const SUPPORTS_OPTIONS = ["single_choice", "multiple_choice"];
const SUPPORTS_MIN_MAX = ["number", "rating"];

const INITIAL_FORM = {
  career_job_id: "",
  category: "",
  question_en: "",
  question_ae: "",
  question_type: "text",
  help_text_en: "",
  help_text_ae: "",
  placeholder_en: "",
  placeholder_ae: "",
  min_value: "",
  max_value: "",
  options: [],
  is_required: 1,
  display_order: 1,
  status: 1,
};

const BLANK_OPTION = { value: "", label_en: "", label_ae: "" };

const BLANK_BULK_QUESTION = {
  category: "",
  question_en: "",
  question_ae: "",
  question_type: "text",
  is_required: 1,
  options: [],
};

const HRQuestionnaires = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [openForm, formHandlers] = useDisclosure(false);
  const [openDelete, deleteHandlers] = useDisclosure(false);

  // Bulk-create modal state
  const [openBulk, bulkHandlers] = useDisclosure(false);
  const [bulkJobId, setBulkJobId] = useState("");
  const [bulkReplace, setBulkReplace] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ ...BLANK_BULK_QUESTION }]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Duplicate modal state
  const [openDuplicate, duplicateHandlers] = useDisclosure(false);
  const [dupSourceJob, setDupSourceJob] = useState("");
  const [dupTargetJob, setDupTargetJob] = useState("");
  const [dupReplace, setDupReplace] = useState(false);
  const [dupSaving, setDupSaving] = useState(false);

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

    simpleGetCallAuth(`${configWeb.GET_RECRUITING_QUESTIONNAIRE_LIST}?${params.toString()}`)
      .then((res) => setItems(res?.data || []))
      .catch(() => {
        notifyError("Failed to load questionnaires");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "") {
      list = list.filter((item) => String(item.status) === statusFilter);
    }
    if (typeFilter !== "") {
      list = list.filter((item) => item.question_type === typeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          (item.question_en || "").toLowerCase().includes(term) ||
          (item.question_ae || "").toLowerCase().includes(term) ||
          (item.category || "").toLowerCase().includes(term) ||
          (item.career_job?.title_en || "").toLowerCase().includes(term)
      );
    }
    return list;
  }, [items, statusFilter, typeFilter, searchTerm]);

  const totalRecords = filtered.length;
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  // ---- single create / edit ----
  const onCreateClick = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM, career_job_id: selectedJob || "" });
    formHandlers.open();
  };

  const parseOptions = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const onEditClick = (row) => {
    setEditId(row.id);
    setForm({
      career_job_id: row.career_job_id ? String(row.career_job_id) : "",
      category: row.category || "",
      question_en: row.question_en || "",
      question_ae: row.question_ae || "",
      question_type: row.question_type || "text",
      help_text_en: row.help_text_en || "",
      help_text_ae: row.help_text_ae || "",
      placeholder_en: row.placeholder_en || "",
      placeholder_ae: row.placeholder_ae || "",
      min_value: row.min_value ?? "",
      max_value: row.max_value ?? "",
      options: parseOptions(row.options),
      is_required: row.is_required ? 1 : 0,
      display_order: row.display_order || 1,
      status: row.status ?? 1,
    });
    formHandlers.open();
  };

  const validateForm = (f) => {
    if (!f.career_job_id) return "Job is required";
    if (!f.question_en || !f.question_en.trim()) return "Question (EN) is required";
    if (SUPPORTS_OPTIONS.includes(f.question_type)) {
      const opts = (f.options || []).filter((o) => o.value && o.label_en);
      if (opts.length < 2) return "Choice questions need at least 2 options (value + label)";
      const values = opts.map((o) => o.value);
      if (new Set(values).size !== values.length) return "Option values must be unique";
    }
    if (SUPPORTS_MIN_MAX.includes(f.question_type)) {
      const min = f.min_value === "" ? null : Number(f.min_value);
      const max = f.max_value === "" ? null : Number(f.max_value);
      if (min !== null && max !== null && min > max) return "min_value cannot be greater than max_value";
    }
    return null;
  };

  const buildPayload = (f) => {
    const payload = {
      career_job_id: Number(f.career_job_id),
      category: f.category || undefined,
      question_en: f.question_en,
      question_ae: f.question_ae || undefined,
      question_type: f.question_type,
      help_text_en: f.help_text_en || undefined,
      help_text_ae: f.help_text_ae || undefined,
      placeholder_en: f.placeholder_en || undefined,
      placeholder_ae: f.placeholder_ae || undefined,
      is_required: Number(f.is_required),
      display_order: Number(f.display_order) || 1,
      status: Number(f.status),
    };
    if (SUPPORTS_OPTIONS.includes(f.question_type)) {
      payload.options = (f.options || [])
        .filter((o) => o.value && o.label_en)
        .map((o) => ({ value: o.value, label_en: o.label_en, label_ae: o.label_ae || undefined }));
    }
    if (SUPPORTS_MIN_MAX.includes(f.question_type)) {
      if (f.min_value !== "" && f.min_value !== null) payload.min_value = Number(f.min_value);
      if (f.max_value !== "" && f.max_value !== null) payload.max_value = Number(f.max_value);
    }
    // Strip undefined keys to keep payload clean
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const onSave = () => {
    const err = validateForm(form);
    if (err) {
      notifyError(err);
      return;
    }
    setSaving(true);
    const payload = buildPayload(form);
    const url = editId
      ? configWeb.PUT_RECRUITING_QUESTIONNAIRE_UPDATE(editId)
      : configWeb.POST_RECRUITING_QUESTIONNAIRE_CREATE;
    const call = editId ? simplePutCallAuth : simplePostCallAuth;
    call(url, JSON.stringify(payload))
      .then((res) => {
        if (!res?.error) {
          notifySuccess(editId ? "Question updated" : "Question created");
          formHandlers.close();
          loadItems();
        } else {
          notifyError(
            Array.isArray(res?.message) ? res.message[0] : res?.message || "Failed to save question"
          );
        }
      })
      .catch(() => notifyError("Failed to save question"))
      .finally(() => setSaving(false));
  };

  // ---- options editor inside single form ----
  const updateOption = (idx, key, value) => {
    const next = [...(form.options || [])];
    next[idx] = { ...(next[idx] || BLANK_OPTION), [key]: value };
    setForm({ ...form, options: next });
  };
  const addOption = () => setForm({ ...form, options: [...(form.options || []), { ...BLANK_OPTION }] });
  const removeOption = (idx) => {
    const next = [...(form.options || [])];
    next.splice(idx, 1);
    setForm({ ...form, options: next });
  };

  // ---- bulk create ----
  const onBulkClick = () => {
    setBulkJobId(selectedJob || "");
    setBulkReplace(false);
    setBulkRows([{ ...BLANK_BULK_QUESTION }]);
    bulkHandlers.open();
  };

  const updateBulkRow = (idx, key, value) => {
    const next = [...bulkRows];
    next[idx] = { ...next[idx], [key]: value };
    setBulkRows(next);
  };
  const addBulkRow = () => setBulkRows([...bulkRows, { ...BLANK_BULK_QUESTION }]);
  const removeBulkRow = (idx) => {
    const next = [...bulkRows];
    next.splice(idx, 1);
    setBulkRows(next.length ? next : [{ ...BLANK_BULK_QUESTION }]);
  };

  const updateBulkOption = (rowIdx, optIdx, key, value) => {
    const next = [...bulkRows];
    const opts = [...(next[rowIdx].options || [])];
    opts[optIdx] = { ...(opts[optIdx] || BLANK_OPTION), [key]: value };
    next[rowIdx] = { ...next[rowIdx], options: opts };
    setBulkRows(next);
  };
  const addBulkOption = (rowIdx) => {
    const next = [...bulkRows];
    next[rowIdx] = {
      ...next[rowIdx],
      options: [...(next[rowIdx].options || []), { ...BLANK_OPTION }],
    };
    setBulkRows(next);
  };
  const removeBulkOption = (rowIdx, optIdx) => {
    const next = [...bulkRows];
    const opts = [...(next[rowIdx].options || [])];
    opts.splice(optIdx, 1);
    next[rowIdx] = { ...next[rowIdx], options: opts };
    setBulkRows(next);
  };

  const onBulkSave = () => {
    if (!bulkJobId) {
      notifyError("Select a job for the bulk import");
      return;
    }
    const cleaned = bulkRows
      .filter((r) => (r.question_en || "").trim())
      .map((r, i) => {
        const out = {
          category: r.category || undefined,
          question_en: r.question_en,
          question_ae: r.question_ae || undefined,
          question_type: r.question_type || "text",
          is_required: Number(r.is_required) ? 1 : 0,
          display_order: i + 1,
        };
        if (SUPPORTS_OPTIONS.includes(out.question_type)) {
          const opts = (r.options || [])
            .filter((o) => o.value && o.label_en)
            .map((o) => ({ value: o.value, label_en: o.label_en, label_ae: o.label_ae || undefined }));
          if (opts.length < 2) {
            out.__error = `Row ${i + 1}: choice questions need at least 2 options`;
          } else {
            out.options = opts;
          }
        }
        Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
        return out;
      });

    if (cleaned.length === 0) {
      notifyError("Add at least one question with English text");
      return;
    }
    const firstError = cleaned.find((r) => r.__error);
    if (firstError) {
      notifyError(firstError.__error);
      return;
    }
    cleaned.forEach((r) => delete r.__error);

    setBulkSaving(true);
    simplePostCallAuth(
      configWeb.POST_RECRUITING_QUESTIONNAIRE_BULK,
      JSON.stringify({
        career_job_id: Number(bulkJobId),
        replace_existing: !!bulkReplace,
        questions: cleaned,
      })
    )
      .then((res) => {
        if (!res?.error) {
          notifySuccess(`Imported ${res?.count ?? cleaned.length} question(s)`);
          bulkHandlers.close();
          if (selectedJob && Number(selectedJob) === Number(bulkJobId)) {
            loadItems();
          } else if (!selectedJob) {
            loadItems();
          }
        } else {
          notifyError(
            Array.isArray(res?.message) ? res.message[0] : res?.message || "Bulk import failed"
          );
        }
      })
      .catch(() => notifyError("Bulk import failed"))
      .finally(() => setBulkSaving(false));
  };

  // ---- duplicate from another job ----
  const onDuplicateClick = () => {
    setDupSourceJob("");
    setDupTargetJob(selectedJob || "");
    setDupReplace(false);
    duplicateHandlers.open();
  };

  const onDuplicateSave = () => {
    if (!dupSourceJob || !dupTargetJob) {
      notifyError("Pick both source and target jobs");
      return;
    }
    if (Number(dupSourceJob) === Number(dupTargetJob)) {
      notifyError("Source and target jobs must be different");
      return;
    }
    setDupSaving(true);
    simplePostCallAuth(
      configWeb.POST_RECRUITING_QUESTIONNAIRE_DUPLICATE,
      JSON.stringify({
        source_career_job_id: Number(dupSourceJob),
        target_career_job_id: Number(dupTargetJob),
        replace_existing: !!dupReplace,
      })
    )
      .then((res) => {
        if (!res?.error) {
          notifySuccess(`Duplicated ${res?.count ?? ""} question(s)`);
          duplicateHandlers.close();
          loadItems();
        } else {
          notifyError(
            Array.isArray(res?.message) ? res.message[0] : res?.message || "Duplicate failed"
          );
        }
      })
      .catch(() => notifyError("Duplicate failed"))
      .finally(() => setDupSaving(false));
  };

  // ---- delete ----
  const onDelete = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    simpleDeleteCallAuth(configWeb.DELETE_RECRUITING_QUESTIONNAIRE(deleteId))
      .then((res) => {
        if (!res?.error) {
          notifySuccess("Question deleted");
          deleteHandlers.close();
          setDeleteId(null);
          loadItems();
        } else {
          notifyError(res?.message || "Failed to delete question");
        }
      })
      .catch(() => notifyError("Failed to delete question"))
      .finally(() => setDeleteLoading(false));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, selectedJob, pageSize]);

  const showOptionsEditor = SUPPORTS_OPTIONS.includes(form.question_type);
  const showMinMaxEditor = SUPPORTS_MIN_MAX.includes(form.question_type);

  return (
    <div className="hr-module">
      <div className="hr-page-header">
        <Row className="align-items-center g-3">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaClipboardList /></div>
              <div>
                <h4>Questionnaires</h4>
                <p>Manage bilingual questions for each open position</p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-wrap">
            <HRExportButtons
              rows={filtered}
              filename="hr-questionnaires"
              title="HR Questionnaires"
              sheetName="Questions"
              columns={[
                { header: "ID", accessor: (r) => r.id },
                { header: "Job", accessor: (r) => r.career_job?.title_en || "" },
                { header: "Category", accessor: (r) => r.category || "" },
                { header: "Question (EN)", accessor: (r) => r.question_en || "" },
                { header: "Question (AR)", accessor: (r) => r.question_ae || "" },
                { header: "Type", accessor: (r) => r.question_type || "" },
                { header: "Options", accessor: (r) => parseOptions(r.options).map((o) => o.value).join(", ") },
                { header: "Required", accessor: (r) => (r.is_required ? "Yes" : "No") },
                { header: "Order", accessor: (r) => r.display_order ?? "" },
                { header: "Status", accessor: (r) => (r.status === 1 ? "Active" : "Inactive") },
              ]}
            />
            <button className="hr-pill-button" style={{ background: "#0ea5e9", color: "#fff", border: "none" }} onClick={onDuplicateClick}>
              <FaCopy size={12} /> Duplicate
            </button>
            <button className="hr-pill-button" style={{ background: "#7c3aed", color: "#fff", border: "none" }} onClick={onBulkClick}>
              <FaLayerGroup size={12} /> Bulk Add
            </button>
            <button className="hr-pill-button primary" onClick={onCreateClick}>
              <FaPlus size={12} /> Add Question
            </button>
          </Col>
        </Row>
      </div>

      <div className="hr-filter-bar mx-1 mt-3">
        <Row className="align-items-end g-3">
          <Col lg={3} md={6}>
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
              <FaFilter size={10} className="me-1" /> Type
            </label>
            <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All</option>
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col lg={2} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Status
            </label>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: 10 }}>
              <option value="">All</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Form.Select>
          </Col>
          <Col lg={3} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 2 }} />
              <Form.Control
                type="text"
                placeholder="Search question, category, job..."
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
                <th>Category</th>
                <th>Question EN</th>
                <th>Question AR</th>
                <th>Type</th>
                <th>Required</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10}><div className="hr-loading"><Spinner animation="border" /></div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={10}><div className="hr-empty-state"><FaClipboardList size={34} /><p>No questionnaires found</p></div></td></tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.career_job?.title_en || "-"}</td>
                    <td>{row.category || "-"}</td>
                    <td>{row.question_en || "-"}</td>
                    <td dir="rtl">{row.question_ae || "-"}</td>
                    <td>
                      <span className="hr-badge" style={{ background: "#eef2ff", color: "#3730a3" }}>
                        {QUESTION_TYPES.find((t) => t.value === row.question_type)?.label || row.question_type || "-"}
                      </span>
                    </td>
                    <td>{Number(row.is_required) ? "Yes" : "No"}</td>
                    <td>{row.display_order || "-"}</td>
                    <td>
                      <span className="hr-badge" style={{ background: Number(row.status) ? "#dcfce7" : "#f1f5f9", color: Number(row.status) ? "#166534" : "#475569" }}>
                        {Number(row.status) ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="d-flex justify-content-center gap-2">
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

      {/* SINGLE CREATE / EDIT */}
      <Modal opened={openForm} onClose={formHandlers.close} title={editId ? "Edit Question" : "Create Question"} centered radius="lg" size="xl">
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>Job *</Form.Label>
            <Form.Select value={form.career_job_id} onChange={(e) => setForm({ ...form, career_job_id: e.target.value })}>
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Category</Form.Label>
            <Form.Control value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Experience" />
          </Col>
          <Col md={4}>
            <Form.Label>Question Type *</Form.Label>
            <Form.Select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Form.Select>
          </Col>

          <Col md={6}>
            <Form.Label>Question EN *</Form.Label>
            <Form.Control value={form.question_en} onChange={(e) => setForm({ ...form, question_en: e.target.value })} />
          </Col>
          <Col md={6}>
            <Form.Label>Question AR</Form.Label>
            <Form.Control dir="rtl" value={form.question_ae} onChange={(e) => setForm({ ...form, question_ae: e.target.value })} />
          </Col>

          <Col md={6}>
            <Form.Label>Help Text EN</Form.Label>
            <Form.Control value={form.help_text_en} onChange={(e) => setForm({ ...form, help_text_en: e.target.value })} />
          </Col>
          <Col md={6}>
            <Form.Label>Help Text AR</Form.Label>
            <Form.Control dir="rtl" value={form.help_text_ae} onChange={(e) => setForm({ ...form, help_text_ae: e.target.value })} />
          </Col>

          <Col md={6}>
            <Form.Label>Placeholder EN</Form.Label>
            <Form.Control value={form.placeholder_en} onChange={(e) => setForm({ ...form, placeholder_en: e.target.value })} />
          </Col>
          <Col md={6}>
            <Form.Label>Placeholder AR</Form.Label>
            <Form.Control dir="rtl" value={form.placeholder_ae} onChange={(e) => setForm({ ...form, placeholder_ae: e.target.value })} />
          </Col>

          {showMinMaxEditor && (
            <>
              <Col md={3}>
                <Form.Label>Min Value</Form.Label>
                <Form.Control type="number" value={form.min_value} onChange={(e) => setForm({ ...form, min_value: e.target.value })} />
              </Col>
              <Col md={3}>
                <Form.Label>Max Value</Form.Label>
                <Form.Control type="number" value={form.max_value} onChange={(e) => setForm({ ...form, max_value: e.target.value })} />
              </Col>
            </>
          )}

          {showOptionsEditor && (
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Options *</Form.Label>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOption}>
                  <FaPlus size={10} /> Add option
                </button>
              </div>
              {(form.options || []).length === 0 ? (
                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>No options yet — add at least 2.</div>
              ) : (
                form.options.map((opt, idx) => (
                  <Row key={idx} className="g-2 mb-2 align-items-end">
                    <Col md={3}>
                      <Form.Label style={{ fontSize: "0.72rem" }}>Value</Form.Label>
                      <Form.Control size="sm" value={opt.value || ""} onChange={(e) => updateOption(idx, "value", e.target.value)} placeholder="react" />
                    </Col>
                    <Col md={4}>
                      <Form.Label style={{ fontSize: "0.72rem" }}>Label EN</Form.Label>
                      <Form.Control size="sm" value={opt.label_en || ""} onChange={(e) => updateOption(idx, "label_en", e.target.value)} placeholder="React" />
                    </Col>
                    <Col md={4}>
                      <Form.Label style={{ fontSize: "0.72rem" }}>Label AR</Form.Label>
                      <Form.Control size="sm" dir="rtl" value={opt.label_ae || ""} onChange={(e) => updateOption(idx, "label_ae", e.target.value)} placeholder="ريأكت" />
                    </Col>
                    <Col md={1}>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeOption(idx)}>
                        <FaTimes />
                      </button>
                    </Col>
                  </Row>
                ))
              )}
            </Col>
          )}

          <Col md={4}>
            <Form.Label>Required</Form.Label>
            <Form.Select value={form.is_required} onChange={(e) => setForm({ ...form, is_required: Number(e.target.value) })}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Display Order</Form.Label>
            <Form.Control type="number" min="1" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
          </Col>
          <Col md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Form.Select>
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={formHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : editId ? "Save Changes" : "Create"}
          </button>
        </div>
      </Modal>

      {/* BULK CREATE */}
      <Modal opened={openBulk} onClose={bulkHandlers.close} title="Bulk Add Questions" centered radius="lg" size="xl">
        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Label>Job *</Form.Label>
            <Form.Select value={bulkJobId} onChange={(e) => setBulkJobId(e.target.value)}>
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <Form.Check
              type="switch"
              id="bulk-replace"
              label="Replace existing questions for this job"
              checked={bulkReplace}
              onChange={(e) => setBulkReplace(e.target.checked)}
            />
          </Col>
        </Row>

        <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
          {bulkRows.map((row, idx) => {
            const isChoice = SUPPORTS_OPTIONS.includes(row.question_type);
            return (
              <div key={idx} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>Question {idx + 1}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeBulkRow(idx)}>
                    <FaTimes size={11} /> Remove
                  </button>
                </div>
                <Row className="g-2">
                  <Col md={3}>
                    <Form.Label style={{ fontSize: "0.72rem" }}>Type</Form.Label>
                    <Form.Select size="sm" value={row.question_type} onChange={(e) => updateBulkRow(idx, "question_type", e.target.value)}>
                      {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label style={{ fontSize: "0.72rem" }}>Category</Form.Label>
                    <Form.Control size="sm" value={row.category} onChange={(e) => updateBulkRow(idx, "category", e.target.value)} placeholder="e.g. Skills" />
                  </Col>
                  <Col md={2}>
                    <Form.Label style={{ fontSize: "0.72rem" }}>Required</Form.Label>
                    <Form.Select size="sm" value={row.is_required} onChange={(e) => updateBulkRow(idx, "is_required", Number(e.target.value))}>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label style={{ fontSize: "0.72rem" }}>Question EN *</Form.Label>
                    <Form.Control size="sm" value={row.question_en} onChange={(e) => updateBulkRow(idx, "question_en", e.target.value)} />
                  </Col>
                  <Col md={12}>
                    <Form.Label style={{ fontSize: "0.72rem" }}>Question AR</Form.Label>
                    <Form.Control size="sm" dir="rtl" value={row.question_ae} onChange={(e) => updateBulkRow(idx, "question_ae", e.target.value)} />
                  </Col>

                  {isChoice && (
                    <Col md={12}>
                      <div className="d-flex justify-content-between align-items-center mt-2 mb-1">
                        <Form.Label style={{ fontSize: "0.72rem" }}>Options</Form.Label>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addBulkOption(idx)}>
                          <FaPlus size={9} /> Option
                        </button>
                      </div>
                      {(row.options || []).map((opt, oIdx) => (
                        <Row key={oIdx} className="g-1 mb-1 align-items-center">
                          <Col md={3}>
                            <Form.Control size="sm" placeholder="value" value={opt.value || ""} onChange={(e) => updateBulkOption(idx, oIdx, "value", e.target.value)} />
                          </Col>
                          <Col md={4}>
                            <Form.Control size="sm" placeholder="Label EN" value={opt.label_en || ""} onChange={(e) => updateBulkOption(idx, oIdx, "label_en", e.target.value)} />
                          </Col>
                          <Col md={4}>
                            <Form.Control size="sm" dir="rtl" placeholder="Label AR" value={opt.label_ae || ""} onChange={(e) => updateBulkOption(idx, oIdx, "label_ae", e.target.value)} />
                          </Col>
                          <Col md={1}>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeBulkOption(idx, oIdx)}>
                              <FaTimes size={10} />
                            </button>
                          </Col>
                        </Row>
                      ))}
                    </Col>
                  )}
                </Row>
              </div>
            );
          })}

          <button type="button" className="btn btn-sm btn-outline-primary w-100" onClick={addBulkRow}>
            <FaPlus size={11} /> Add another question
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{bulkRows.length} row(s) — max 100</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm" onClick={bulkHandlers.close}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={onBulkSave} disabled={bulkSaving}>
              {bulkSaving ? <Spinner size="sm" /> : "Import All"}
            </button>
          </div>
        </div>
      </Modal>

      {/* DUPLICATE FROM JOB */}
      <Modal opened={openDuplicate} onClose={duplicateHandlers.close} title="Duplicate Questions Between Jobs" centered radius="lg" size="md">
        <Row className="g-3">
          <Col md={12}>
            <Form.Label>Source Job *</Form.Label>
            <Form.Select value={dupSourceJob} onChange={(e) => setDupSourceJob(e.target.value)}>
              <option value="">Pick source job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Label>Target Job *</Form.Label>
            <Form.Select value={dupTargetJob} onChange={(e) => setDupTargetJob(e.target.value)}>
              <option value="">Pick target job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title_en || `Job #${job.id}`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Check
              type="switch"
              id="dup-replace"
              label="Replace target job's existing questions"
              checked={dupReplace}
              onChange={(e) => setDupReplace(e.target.checked)}
            />
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-sm" onClick={duplicateHandlers.close}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={onDuplicateSave} disabled={dupSaving}>
            {dupSaving ? <Spinner size="sm" /> : "Duplicate"}
          </button>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal opened={openDelete} onClose={deleteHandlers.close} title="Delete Question" centered size="sm" radius="lg">
        <p style={{ color: "#475569", fontSize: "0.9rem" }}>Are you sure you want to delete this question?</p>
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

export default HRQuestionnaires;
