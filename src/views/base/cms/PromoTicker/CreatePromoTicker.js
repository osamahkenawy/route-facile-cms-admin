import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Spinner,
  Card,
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaClock, FaPen, FaFileAlt, FaCog, FaTachometerAlt } from "react-icons/fa";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simplePostCallAuth,
  simplePutCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import "./PromoTicker.css";

const CreatePromoTicker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(!!id);
  const [loading, setLoading] = useState(false);

  const SPEED_OPTIONS = [
    { value: 45, label: "Very Slow", desc: "Gentle, leisurely scroll" },
    { value: 30, label: "Slow", desc: "Relaxed, easy to read" },
    { value: 20, label: "Medium", desc: "Balanced pace" },
    { value: 12, label: "Fast", desc: "Quick and attention-grabbing" },
    { value: 7, label: "Very Fast", desc: "Rapid scrolling" },
  ];

  const [formData, setFormData] = useState({
    text_en: "",
    text_ae: "",
    description_en: "",
    description_ae: "",
    link: "",
    status: "1",
    sort_order: 1,
    scroll_speed: 20,
    start_date: "",
    end_date: "",
  });

  const [errors, setErrors] = useState({});

  /* ---------- handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (value) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const setStatus = (val) =>
    setFormData((prev) => ({ ...prev, status: val }));

  /* ---------- validation ---------- */
  const validateForm = () => {
    const errs = {};

    if (!formData.text_en?.trim())
      errs.text_en = "English text is required";
    else if (formData.text_en.length > 255)
      errs.text_en = "Must be under 255 characters";

    if (!formData.text_ae?.trim())
      errs.text_ae = "Arabic text is required";
    else if (formData.text_ae.length > 255)
      errs.text_ae = "Must be under 255 characters";

    if (!formData.start_date) errs.start_date = "Start date is required";
    if (!formData.end_date) errs.end_date = "End date is required";

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date))
        errs.end_date = "End date must be on or after start date";
    }

    if (!["0", "1", 0, 1].includes(formData.status))
      errs.status = "Status is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      text_en: formData.text_en,
      text_ae: formData.text_ae,
      description_en: formData.description_en || null,
      description_ae: formData.description_ae || null,
      link: formData.link || null,
      status: parseInt(formData.status),
      sort_order: parseInt(formData.sort_order) || 1,
      scroll_speed: parseInt(formData.scroll_speed) || 20,
      start_date: formData.start_date,
      end_date: formData.end_date,
    };

    const url = id
      ? configWeb.PUT_PROMO_TICKER_UPDATE(id)
      : configWeb.POST_PROMO_TICKER_CREATE;
    const apiCall = id ? simplePutCallAuth : simplePostCallAuth;

    setLoading(true);
    apiCall(url, JSON.stringify(payload))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(id ? "Ticker updated" : "Ticker created");
          navigate("/cms/promo-ticker");
        } else {
          notifyError(
            Array.isArray(res?.message)
              ? res.message[0]
              : res?.message || "Something went wrong"
          );
        }
      })
      .catch(() => notifyError("Something went wrong. Please try again later."))
      .finally(() => setLoading(false));
  };

  /* ---------- fetch details (edit) ---------- */
  useEffect(() => {
    if (!id) return;
    simpleGetCallAuth(configWeb.GET_PROMO_TICKER_DETAILS(id))
      .then((res) => {
        if (res && !res.error) {
          setFormData({
            text_en: res.text_en || "",
            text_ae: res.text_ae || "",
            description_en: res.description_en || "",
            description_ae: res.description_ae || "",
            link: res.link || "",
            status: String(res.status ?? 1),
            sort_order: res.sort_order || 1,
            scroll_speed: res.scroll_speed || 20,
            start_date: res.start_date || "",
            end_date: res.end_date || "",
          });
        } else {
          notifyError(res?.message?.[0] || "Failed to load details");
        }
      })
      .catch(() => notifyError("Something went wrong. Please try again later."))
      .finally(() => setEditLoading(false));
  }, [id]);

  /* ---------- helpers ---------- */
  const charCountClass = (cur, max) => {
    const pct = (cur / max) * 100;
    if (pct >= 100) return "danger";
    if (pct >= 80) return "warning";
    return "";
  };

  const durationDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return null;
    const s = new Date(formData.start_date);
    const e = new Date(formData.end_date);
    if (e < s) return null;
    return Math.round((e - s) / 86400000) + 1;
  }, [formData.start_date, formData.end_date]);

  /* ======================= RENDER ======================= */
  return (
    <Container fluid className="px-lg-4 pb-5 promo-ticker-form">
      {/* -------- Page Header -------- */}
      <div className="promo-ticker-page-header d-flex flex-wrap align-items-center justify-content-between mt-3">
        <div>
          <h4>{id ? "Edit" : "Create"} Promo Ticker</h4>
          <p>
            {id
              ? "Update the promotional ticker details below"
              : "Add a new promotional scrolling banner message"}
          </p>
        </div>
        <Link to="/cms/promo-ticker">
          <button className="btn-add-ticker">
            <FaArrowLeft /> Back to List
          </button>
        </Link>
      </div>

      {editLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading ticker details…</p>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          {/* ======== Promotional Text ======== */}
          <Card className="section-card">
            <Card.Header>
              <h6>
                <FaPen className="text-primary" /> Promotional Text
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={12} md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label className="required">Text (English)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="text_en"
                      placeholder="e.g., Premium Fleet Now Available — Book Today!"
                      value={formData.text_en}
                      onChange={handleChange}
                      isInvalid={!!errors.text_en}
                      maxLength={255}
                    />
                    <div
                      className={`char-count ${charCountClass(
                        formData.text_en.length,
                        255
                      )}`}
                    >
                      {formData.text_en.length} / 255
                    </div>
                    {errors.text_en && (
                      <span className="validation-error">{errors.text_en}</span>
                    )}
                  </Form.Group>
                </Col>

                <Col sm={12} md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label className="required">Text (Arabic)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="text_ae"
                      placeholder="أدخل النص العربي هنا"
                      value={formData.text_ae}
                      onChange={handleChange}
                      isInvalid={!!errors.text_ae}
                      maxLength={255}
                      className="arabic-input"
                      dir="rtl"
                    />
                    <div
                      className={`char-count ${charCountClass(
                        formData.text_ae.length,
                        255
                      )}`}
                    >
                      {formData.text_ae.length} / 255
                    </div>
                    {errors.text_ae && (
                      <span className="validation-error">{errors.text_ae}</span>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* Live Preview */}
              {(formData.text_en || formData.text_ae) && (
                <div className="preview-section">
                  <div className="preview-header">
                    <span>Live Preview (English)</span>
                    <span>
                      <FaTachometerAlt className="me-1" />
                      {SPEED_OPTIONS.find(s => s.value === Number(formData.scroll_speed))?.label || "Medium"}
                    </span>
                  </div>
                  <div className="preview-track">
                    <span
                      className="ticker-preview"
                      style={{ animationDuration: `${formData.scroll_speed}s` }}
                    >
                      {formData.text_en || "Enter English text above…"}
                    </span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* ======== Description (Optional) ======== */}
          <Card className="section-card">
            <Card.Header>
              <h6>
                <FaFileAlt className="text-secondary" /> Description{" "}
                <span
                  className="fw-normal text-muted"
                  style={{ fontSize: "0.8rem" }}
                >
                  (Optional)
                </span>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={12} md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label>Description (English)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description_en"
                      placeholder="Additional context or tooltip text"
                      value={formData.description_en}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col sm={12} md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label>Description (Arabic)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description_ae"
                      placeholder="اختياري: أضف المزيد من التفاصيل"
                      value={formData.description_ae}
                      onChange={handleChange}
                      className="arabic-input"
                      dir="rtl"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ======== Settings ======== */}
          <Card className="section-card">
            <Card.Header>
              <h6>
                <FaCog className="text-muted" /> Settings
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                {/* Link */}
                <Col sm={12} md={6} lg={4} className="mb-4">
                  <Form.Group>
                    <Form.Label>Link (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="link"
                      placeholder="e.g., /offers or https://..."
                      value={formData.link}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                      URL the text links to when clicked
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Start Date */}
                <Col sm={12} md={6} lg={4} className="mb-4">
                  <Form.Group>
                    <Form.Label className="required">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      onMouseDown={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      isInvalid={!!errors.start_date}
                    />
                    {errors.start_date && (
                      <span className="validation-error">
                        {errors.start_date}
                      </span>
                    )}
                  </Form.Group>
                </Col>

                {/* End Date */}
                <Col sm={12} md={6} lg={4} className="mb-4">
                  <Form.Group>
                    <Form.Label className="required">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      onMouseDown={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      isInvalid={!!errors.end_date}
                      min={formData.start_date}
                    />
                    {errors.end_date && (
                      <span className="validation-error">
                        {errors.end_date}
                      </span>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* Duration info */}
              {durationDays && (
                <div className="mb-4">
                  <span className="duration-info">
                    <FaClock size={12} />
                    {durationDays} day{durationDays > 1 ? "s" : ""} duration
                  </span>
                </div>
              )}

              <Row>
                {/* Sort Order */}
                <Col sm={12} md={6} lg={4} className="mb-4">
                  <Form.Group>
                    <Form.Label>Sort Order</Form.Label>
                    <Form.Control
                      type="number"
                      name="sort_order"
                      min={0}
                      value={formData.sort_order}
                      onChange={handleChange}
                      placeholder="1"
                    />
                    <Form.Text className="text-muted">
                      Lower number appears first in the scrolling bar
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Scroll Speed */}
                <Col sm={12} md={6} lg={4} className="mb-4">
                  <Form.Group>
                    <Form.Label>
                      <FaTachometerAlt className="me-1 text-primary" />
                      Scroll Speed
                    </Form.Label>
                    <div className="speed-selector">
                      {SPEED_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          className={`speed-option ${
                            Number(formData.scroll_speed) === opt.value
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              scroll_speed: opt.value,
                            }))
                          }
                        >
                          <span className="speed-option-label">{opt.label}</span>
                          <span className="speed-option-desc">{opt.desc}</span>
                        </div>
                      ))}
                    </div>
                    <Form.Text className="text-muted">
                      Controls how fast the text scrolls on the website
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Status */}
                <Col sm={12} md={6} lg={8} className="mb-4">
                  <Form.Group>
                    <Form.Label className="required">Status</Form.Label>
                    <div className="status-radio-group">
                      <div
                        className={`status-option ${
                          formData.status === "1" ? "active-selected" : ""
                        }`}
                        onClick={() => setStatus("1")}
                      >
                        <span className="status-dot green" />
                        <div>
                          <div className="status-label">Active</div>
                          <div className="status-desc">
                            Visible on the website
                          </div>
                        </div>
                        <Form.Check
                          type="radio"
                          name="status"
                          value="1"
                          checked={formData.status === "1"}
                          onChange={handleChange}
                          className="ms-auto"
                          style={{ pointerEvents: "none" }}
                        />
                      </div>
                      <div
                        className={`status-option ${
                          formData.status === "0" ? "inactive-selected" : ""
                        }`}
                        onClick={() => setStatus("0")}
                      >
                        <span className="status-dot red" />
                        <div>
                          <div className="status-label">Inactive</div>
                          <div className="status-desc">
                            Hidden from the website
                          </div>
                        </div>
                        <Form.Check
                          type="radio"
                          name="status"
                          value="0"
                          checked={formData.status === "0"}
                          onChange={handleChange}
                          className="ms-auto"
                          style={{ pointerEvents: "none" }}
                        />
                      </div>
                    </div>
                    {errors.status && (
                      <span className="validation-error">{errors.status}</span>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ======== Submit ======== */}
          <div className="submit-area">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  {id ? "Updating…" : "Saving…"}
                </>
              ) : (
                <>
                  <FaSave />
                  {id ? "Update Ticker" : "Create Ticker"}
                </>
              )}
            </button>
            <Link to="/cms/promo-ticker">
              <Button variant="outline-secondary" className="btn-cancel">
                Cancel
              </Button>
            </Link>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default CreatePromoTicker;

