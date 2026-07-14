import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Row, Col, Form, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { Tabs, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaBriefcase, FaArrowLeft, FaSave, FaGlobe, FaCheckCircle } from "react-icons/fa";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CKEditorComponent from '../../../components/CKEditor/CKEditor';
import JobKeywordsManager from "./JobKeywordsManager";
import JobShareButtons from "./JobShareButtons";
import "./hr.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const HRJobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stagedKeywords, setStagedKeywords] = useState([]);
  const [shareOpen, shareHandlers] = useDisclosure(false);
  const [createdJob, setCreatedJob] = useState(null);

  // Warn if user closes/refreshes tab with unsaved staged keywords (create mode only)
  useEffect(() => {
    if (isEdit) return undefined;
    const handler = (e) => {
      if (stagedKeywords.length === 0) return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [stagedKeywords.length, isEdit]);

  const [formData, setFormData] = useState({
    title_en: "",
    title_ae: "",
    description_en: "",
    description_ae: "",
    location_en: "",
    location_ae: "",
    experience_years: "",
    expiry_date: "",
    status: 1,
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      simpleGetCallAuth(configWeb.GET_CAREER_JOB_DETAILS(id))
        .then((res) => {
          if (res && !res.error) {
            setFormData({
              title_en: res.title_en || "",
              title_ae: res.title_ae || "",
              description_en: res.description_en || "",
              description_ae: res.description_ae || "",
              location_en: res.location_en || "",
              location_ae: res.location_ae || "",
              experience_years: res.experience_years ?? "",
              expiry_date: res.expiry_date ? res.expiry_date.split("T")[0] : "",
              status: res.status ?? 1,
            });
          } else {
            notifyError("Failed to load job details");
          }
        })
        .catch(() => notifyError("Something went wrong"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title_en || !formData.description_en || !formData.location_en || !formData.expiry_date) {
      return notifyError("Please fill in all required English fields");
    }
    setSaving(true);
    // Arabic fields are optional — fall back to the English value so the API
    // always receives non-empty bilingual fields (matches backend validation).
    const body = JSON.stringify({
      title_en: formData.title_en,
      title_ae: (formData.title_ae || "").trim() || formData.title_en,
      description_en: formData.description_en,
      description_ae: (formData.description_ae || "").trim() || formData.description_en,
      location_en: formData.location_en,
      location_ae: (formData.location_ae || "").trim() || formData.location_en,
      experience_years: Number(formData.experience_years) || 0,
      expiry_date: formData.expiry_date,
      status: Number(formData.status),
    });

    const promise = isEdit
      ? simplePutCallAuth(configWeb.PUT_CAREER_JOB_UPDATE(id), body)
      : simplePostCallAuth(configWeb.POST_CAREER_JOB_CREATE, body);

    promise
      .then(async (res) => {
        if (res && !res.error) {
          // On create, persist any locally-staged keywords against the new job id
          let newJobId = isEdit
            ? Number(id)
            : Number(
                res?.data?.id ??
                res?.id ??
                res?.data?.job?.id ??
                res?.job?.id ??
                res?.career_job?.id ??
                res?.data?.career_job?.id
              );

          // Fallback: API didn't echo the id — look it up by matching title
          if (!isEdit && !newJobId) {
            try {
              const list = await simpleGetCallAuth(
                `${configWeb.GET_CAREER_JOB_LIST}?page=1&page_size=20`
              );
              const rows = list?.data || [];
              const match = rows.find((r) => (r.title_en || "").trim() === (formData.title_en || "").trim());
              const latest = rows.reduce((m, r) => (Number(r.id) > Number(m?.id || 0) ? r : m), null);
              newJobId = Number(match?.id || latest?.id || 0) || null;
            } catch {
              /* ignore — share link will fall back to careers home */
            }
          }
          if (!isEdit && newJobId && stagedKeywords.length) {
            try {
              await Promise.all(
                stagedKeywords.map((k) =>
                  simplePostCallAuth(
                    configWeb.POST_RECRUITING_KEYWORD_CREATE,
                    JSON.stringify({
                      career_job_id: newJobId,
                      keyword: k.keyword,
                      keyword_type: k.keyword_type,
                      weight: Number(k.weight) || 1,
                      status: 1,
                    })
                  )
                )
              );
            } catch (e) {
              notifyError("Job saved, but some keywords could not be created");
            }
          }
          notifySuccess(isEdit ? "Job updated successfully" : "Job created successfully");
          if (isEdit) {
            navigate("/hr/jobs");
          } else {
            setCreatedJob({ id: newJobId, title: formData.title_en });
            shareHandlers.open();
          }
        } else {
          notifyError(Array.isArray(res?.message) ? res.message[0] : res?.message || "Operation failed");
        }
      })
      .catch(() => notifyError("Something went wrong"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="hr-module">
        <div className="hr-loading"><Spinner animation="border" /></div>
      </div>
    );
  }

  return (
    <div className="hr-module">
      {/* Header */}
      <motion.div className="hr-page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="hr-header-icon me-3"><FaBriefcase /></div>
              <div>
                <h4>{isEdit ? "Edit Job Posting" : "Create New Job"}</h4>
                <p>{isEdit ? "Update the job details below" : "Fill in the details to publish a new job"}</p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <motion.button
              className="btn"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 8 }}
              onClick={() => navigate("/hr/jobs")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaArrowLeft size={12} /> Back to Jobs
            </motion.button>
          </Col>
        </Row>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Row className="g-3 px-1">
          {/* Bilingual Fields */}
          <Col lg={8}>
            <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <Tabs defaultValue="english" variant="pills" radius="lg">
                <Tabs.List mb="lg">
                  <Tabs.Tab value="english" leftSection={<FaGlobe size={12} />}>English</Tabs.Tab>
                  <Tabs.Tab value="arabic" leftSection={<FaGlobe size={12} />}>Arabic <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: 4 }}>(optional)</span></Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="english">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Job Title (EN) *</Form.Label>
                    <Form.Control
                      value={formData.title_en}
                      onChange={(e) => handleChange("title_en", e.target.value)}
                      placeholder="e.g. Software Engineer"
                      style={{ borderRadius: 10 }}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Description (EN) *</Form.Label>
                    <CKEditorComponent
                      contentW={formData.description_en}
                      onContentChange={(val) => handleChange("description_en", val)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Location (EN) *</Form.Label>
                    <Form.Control
                      value={formData.location_en}
                      onChange={(e) => handleChange("location_en", e.target.value)}
                      placeholder="e.g. Casablanca"
                      style={{ borderRadius: 10 }}
                      required
                    />
                  </Form.Group>
                </Tabs.Panel>

                <Tabs.Panel value="arabic">
                  <div style={{
                    background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af",
                    borderRadius: 10, padding: "8px 12px", fontSize: "0.78rem", marginBottom: 12,
                  }}>
                    Arabic fields are optional. Leave any blank and the English value will be used automatically.
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Job Title (AR) <span style={{ color: "#94a3b8", fontWeight: 500 }}>— optional</span></Form.Label>
                    <Form.Control
                      value={formData.title_ae}
                      onChange={(e) => handleChange("title_ae", e.target.value)}
                      placeholder="عنوان الوظيفة"
                      style={{ borderRadius: 10, direction: "rtl" }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Description (AR) <span style={{ color: "#94a3b8", fontWeight: 500 }}>— optional</span></Form.Label>
                    <CKEditorComponent
                      contentW={formData.description_ae}
                      onContentChange={(val) => handleChange("description_ae", val)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Location (AR) <span style={{ color: "#94a3b8", fontWeight: 500 }}>— optional</span></Form.Label>
                    <Form.Control
                      value={formData.location_ae}
                      onChange={(e) => handleChange("location_ae", e.target.value)}
                      placeholder="الموقع"
                      style={{ borderRadius: 10, direction: "rtl" }}
                    />
                  </Form.Group>
                </Tabs.Panel>
              </Tabs>
            </motion.div>
          </Col>

          {/* Side Panel */}
          <Col lg={4}>
            <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <h6 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaBriefcase size={14} style={{ color: "#228be6" }} /> Job Settings
              </h6>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Experience Years</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => handleChange("experience_years", e.target.value)}
                  placeholder="e.g. 3"
                  style={{ borderRadius: 10 }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Expiry Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleChange("expiry_date", e.target.value)}
                  style={{ borderRadius: 10 }}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold" style={{ fontSize: "0.82rem", color: "#475569" }}>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  style={{ borderRadius: 10 }}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </Form.Select>
              </Form.Group>

              <motion.button
                type="submit"
                className="btn w-100"
                style={{ background: "#228be6", color: "#fff", borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: "0.9rem", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {saving ? <Spinner size="sm" /> : <><FaSave size={14} /> {isEdit ? "Update Job" : "Publish Job"}</>}
              </motion.button>
            </motion.div>
          </Col>

          {/* AI Keywords */}
          <Col lg={12}>
            <motion.div className="hr-detail-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <JobKeywordsManager
                jobId={isEdit ? id : null}
                onChange={isEdit ? undefined : setStagedKeywords}
              />
            </motion.div>
          </Col>
        </Row>
      </form>

      <Modal
        opened={shareOpen}
        onClose={() => { shareHandlers.close(); navigate("/hr/jobs"); }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaCheckCircle style={{ color: "#16a34a", fontSize: "1.2rem" }} />
            <span style={{ fontWeight: 700 }}>Job published — share it now</span>
          </div>
        }
        centered
        size="lg"
        radius="lg"
      >
        <p style={{ color: "#475569", fontSize: "0.88rem", marginBottom: 16 }}>
          Your job posting is live. Spread the word across your channels to attract more candidates.
        </p>
        <JobShareButtons jobId={createdJob?.id} title={createdJob?.title} />
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => { shareHandlers.close(); navigate(`/hr/jobs/${createdJob?.id}`); }}
            style={{ borderRadius: 10, padding: "8px 14px", fontWeight: 600 }}
          >
            View Job
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => { shareHandlers.close(); navigate("/hr/jobs"); }}
            style={{ borderRadius: 10, padding: "8px 14px", fontWeight: 600 }}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HRJobForm;
