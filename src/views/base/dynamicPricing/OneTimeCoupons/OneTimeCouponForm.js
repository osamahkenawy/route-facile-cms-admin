import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import {
  TfiSave,
  TfiArrowLeft,
  TfiInfoAlt,
  TfiAlert,
} from "react-icons/tfi";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import "./oneTimeCoupons.css";


const blankScope = { all: true, ids: [] };

const initialForm = {
  type: "daily",
  discount_type: "percentage",
  code: "",
  start_date: "",
  end_date: "",
  rate: 0,
  status: 1,
  note: "",
  usage_limit: 1,
  car_ids: { ...blankScope },
  emirate_ids: { ...blankScope },
  group_ids: { ...blankScope },
  location_ids: { ...blankScope },
};

const OneTimeCouponForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [usageCount, setUsageCount] = useState(0);
  const [editLoading, setEditLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [warnRegular, setWarnRegular] = useState(false);

  // Lookup data
  const [emiratesArray, setEmiratesArray] = useState([]);
  const [carArray, setCarArray] = useState([]);
  const [carGroupArray, setCarGroupArray] = useState([]);
  const [locationArray, setLocationArray] = useState([]);

  useEffect(() => {
    simpleGetCallAuth(`${configWeb.GET_EMIRATES}?page_size=9999`)
      .then((r) => setEmiratesArray(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(`${configWeb.GET_CAR}?page_size=9999`)
      .then((r) => setCarArray(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(`${configWeb.GET_CAR_GROUPS}?page_size=9999`)
      .then((r) => setCarGroupArray(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(configWeb.GET_LOCATIONS)
      .then((r) => setLocationArray(r?.data || []))
      .catch(() => {});
  }, []);

  // Load coupon for edit
  useEffect(() => {
    if (!isEdit) return;
    setEditLoading(true);
    simpleGetCallAuth(configWeb.GET_ONE_TIME_COUPON_DETAILS(id))
      .then((res) => {
        if (!res || res?.error) {
          notifyError("Could not load coupon");
          return;
        }
        if (res?.usage_limit === null || res?.usage_limit === undefined) {
          setWarnRegular(true);
          return;
        }
        setFormData({
          type: res.type || "daily",
          discount_type: res.discount_type || "percentage",
          code: res.code || "",
          start_date: (res.valid_from || res.start_date || "").slice(0, 10),
          end_date: (res.valid_to || res.end_date || "").slice(0, 10),
          rate: res.discount_value ?? res.rate ?? 0,
          status: Number(res.status ?? 1),
          note: res.note || "",
          usage_limit: Number(res.usage_limit ?? 1),
          car_ids: res.car_ids || { ...blankScope },
          emirate_ids: res.emirate_ids || { ...blankScope },
          group_ids: res.group_ids || { ...blankScope },
          location_ids: res.location_ids || { ...blankScope },
        });
        setUsageCount(Number(res.usage_count ?? 0));
      })
      .catch(() => notifyError("Could not load coupon"))
      .finally(() => setEditLoading(false));
  }, [id, isEdit]);

  const opts = (arr, labelKey = "name_en") => [
    { value: "all", label: "All" },
    ...(arr || []).map((x) => ({ value: x.id, label: x[labelKey] })),
  ];

  const emirateOpts = useMemo(() => opts(emiratesArray), [emiratesArray]);
  const carOpts = useMemo(() => opts(carArray), [carArray]);
  const groupOpts = useMemo(() => opts(carGroupArray), [carGroupArray]);

  // Filter locations by selected emirates (matches existing form behavior)
  const filteredLocations = useMemo(() => {
    if (!locationArray?.length) return [];
    if (formData.emirate_ids.all) return locationArray;
    if (formData.emirate_ids.ids?.length) {
      return locationArray.filter((l) =>
        formData.emirate_ids.ids.includes(l.emirate_id)
      );
    }
    return locationArray;
  }, [locationArray, formData.emirate_ids.all, formData.emirate_ids.ids]);

  const locationOpts = useMemo(() => opts(filteredLocations), [filteredLocations]);

  // Reconcile location_ids when the emirate scope narrows so previously-selected
  // locations that are no longer visible in the dropdown are also dropped from
  // form state. Skip while still loading the coupon for edit (initial hydrate).
  useEffect(() => {
    if (editLoading) return;
    if (!locationArray.length) return;
    if (formData.location_ids.all) return;
    if (!formData.location_ids.ids?.length) return;
    const visible = new Set(filteredLocations.map((l) => l.id));
    const kept = formData.location_ids.ids.filter((id) => visible.has(id));
    if (kept.length !== formData.location_ids.ids.length) {
      setFormData((prev) => ({
        ...prev,
        location_ids: { all: false, ids: kept },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations, locationArray.length, editLoading]);

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleScope = (selected, fieldName, actionMeta) => {
    const justPicked = actionMeta?.option?.value;
    let values = selected ? selected.map((o) => o.value) : [];
    if (justPicked === "all") {
      // Picking "All" wipes specifics
      values = ["all"];
    } else if (justPicked && values.includes("all")) {
      // Picking a specific item while "All" was selected -> drop "All"
      values = values.filter((v) => v !== "all");
    }
    const all = values.includes("all");
    const ids = all ? [] : values.filter((v) => v !== "all");
    setField(fieldName, { all, ids });
    setErrors((p) => ({ ...p, [fieldName]: !all && ids.length === 0 }));
  };

  const valueFor = (field, options) =>
    options.filter((o) =>
      formData[field].all
        ? o.value === "all"
        : formData[field].ids.includes(o.value)
    );

  const validate = () => {
    const e = {};
    if (!formData.code?.trim()) e.code = "Code is required";
    if (!formData.start_date) e.start_date = "Start date is required";
    if (!formData.end_date) e.end_date = "End date is required";
    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    )
      e.end_date = "End date must be on or after start date";
    if (!formData.usage_limit || Number(formData.usage_limit) < 1)
      e.usage_limit = "Usage limit must be at least 1";
    if (
      isEdit &&
      Number(formData.usage_limit) < Number(usageCount)
    )
      e.usage_limit = `Usage limit cannot be less than already used (${usageCount})`;
    if (formData.rate === "" || formData.rate === null)
      e.rate = "Rate is required";

    ["car_ids", "emirate_ids", "group_ids", "location_ids"].forEach((k) => {
      if (!formData[k].all && (formData[k].ids?.length ?? 0) === 0)
        e[k] = true;
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setValidated(true);
    if (!validate()) return;

    const payload = {
      code: formData.code.trim(),
      type: formData.type,
      discount_type: formData.discount_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      rate: Number(formData.rate) || 0,
      cdw: 0,
      scdw: 0,
      pai: 0,
      gps: 0,
      driver: 0,
      baby_seat: 0,
      status: Number(formData.status),
      note: formData.note || "",
      usage_limit: Number(formData.usage_limit),
      car_ids: formData.car_ids,
      emirate_ids: formData.emirate_ids,
      group_ids: formData.group_ids,
      location_ids: formData.location_ids,
    };

    setSubmitting(true);
    const apiCall = isEdit ? simplePutCallAuth : simplePostCallAuth;
    const url = isEdit
      ? configWeb.PUT_ONE_TIME_COUPON(id)
      : configWeb.POST_ONE_TIME_COUPON;

    apiCall(url, JSON.stringify(payload))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(isEdit ? "Coupon updated" : "Coupon created");
          navigate("/admin/one-time-coupons");
        } else {
          notifyError(
            (Array.isArray(res?.message) ? res?.message[0] : res?.message) ||
              "Something went wrong"
          );
        }
      })
      .catch(() => notifyError("Something went wrong. Please try again."))
      .finally(() => setSubmitting(false));
  };

  if (warnRegular) {
    return (
      <div className="otc-page">
        <div className="otc-warning">
          <TfiAlert size={20} />
          <div>
            <strong>This coupon belongs to the regular Discount Coupons section.</strong>
            <div>
              It does not have a usage limit, so it can not be edited from the One-Time
              Coupons module. Please use the regular Discount Coupons pages instead.
            </div>
          </div>
        </div>
        <Link to="/admin/one-time-coupons" className="otc-btn otc-btn-outline">
          <TfiArrowLeft /> Back to list
        </Link>
      </div>
    );
  }

  const remaining = Math.max(
    Number(formData.usage_limit || 0) - Number(usageCount || 0),
    0
  );

  return (
    <div className="otc-page">
      <div className="otc-hero">
        <div className="otc-hero-inner">
          <div>
            <span className="otc-hero-pill">
              <TfiInfoAlt /> {isEdit ? "Edit" : "Create"} one-time coupon
            </span>
            <h1>
              {isEdit ? "Edit" : "New"}{" "}
              <span className="otc-hero-accent">
                {isEdit ? "coupon" : "single-use coupon"}
              </span>
            </h1>
            <p>
              Coupons created here are limited by usage count. Set a code,
              validity, rates, scope, and a usage limit (default 1).
            </p>
          </div>
          <div className="otc-hero-actions">
            <Link to="/admin/one-time-coupons" className="otc-btn otc-btn-ghost">
              <TfiArrowLeft /> Back to list
            </Link>
            <button
              type="submit"
              form="otc-form"
              disabled={submitting || editLoading}
              className="otc-btn otc-btn-primary"
            >
              {submitting ? <span className="otc-spin" /> : <TfiSave />}{" "}
              {isEdit ? "Update coupon" : "Create coupon"}
            </button>
          </div>
        </div>
      </div>

      {editLoading ? (
        <div className="otc-card">
          <div className="otc-loader">
            <Spinner animation="border" /> Loading coupon…
          </div>
        </div>
      ) : (
        <form id="otc-form" onSubmit={onSubmit} noValidate>
          {/* Basic */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Basic information</p>
                <p className="otc-card-sub">Identify the coupon and its mode.</p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-3">
                  <label className="otc-label">
                    Type<span className="req">*</span>
                  </label>
                  <select
                    className="otc-select"
                    value={formData.type}
                    onChange={(e) => setField("type", e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="otc-field span-3">
                  <label className="otc-label">
                    Discount type<span className="req">*</span>
                  </label>
                  <select
                    className="otc-select"
                    value={formData.discount_type}
                    onChange={(e) => setField("discount_type", e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="value">Fixed amount</option>
                  </select>
                </div>
                <div className="otc-field span-3">
                  <label className="otc-label">
                    Coupon code<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      validated && errors.code ? "is-invalid" : ""
                    }`}
                    type="text"
                    placeholder="e.g. VIP-001"
                    value={formData.code}
                    onChange={(e) => setField("code", e.target.value)}
                  />
                  {validated && errors.code && (
                    <div className="otc-error">{errors.code}</div>
                  )}
                </div>
                <div className="otc-field span-3">
                  <label className="otc-label">Status</label>
                  <select
                    className="otc-select"
                    value={formData.status}
                    onChange={(e) => setField("status", Number(e.target.value))}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Validity period</p>
                <p className="otc-card-sub">Window in which the coupon can be redeemed.</p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-6">
                  <label className="otc-label">
                    Start date<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      validated && errors.start_date ? "is-invalid" : ""
                    }`}
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setField("start_date", e.target.value)}
                  />
                  {validated && errors.start_date && (
                    <div className="otc-error">{errors.start_date}</div>
                  )}
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">
                    End date<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      validated && errors.end_date ? "is-invalid" : ""
                    }`}
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setField("end_date", e.target.value)}
                  />
                  {validated && errors.end_date && (
                    <div className="otc-error">{errors.end_date}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Discount</p>
                <p className="otc-card-sub">
                  {formData.discount_type === "percentage"
                    ? "Value is interpreted as a percentage."
                    : "Value is interpreted as a fixed amount."}
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-3">
                  <label className="otc-label">
                    Rate<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      validated && errors.rate ? "is-invalid" : ""
                    }`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setField("rate", e.target.value)}
                  />
                  {validated && errors.rate && (
                    <div className="otc-error">{errors.rate}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Applicability scope</p>
                <p className="otc-card-sub">
                  Choose <em>All</em> or pick specific items in each dimension.
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-6">
                  <label className="otc-label">
                    Emirates<span className="req">*</span>
                  </label>
                  <Select
                    isMulti
                    options={emirateOpts}
                    value={valueFor("emirate_ids", emirateOpts)}
                    onChange={(s, m) => handleScope(s, "emirate_ids", m)}
                    placeholder={`Pick from ${emiratesArray.length} emirate(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                  {validated && errors.emirate_ids && (
                    <div className="otc-error">Select at least one or "All".</div>
                  )}
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">
                    Locations<span className="req">*</span>
                  </label>
                  <Select
                    isMulti
                    options={locationOpts}
                    value={valueFor("location_ids", locationOpts)}
                    onChange={(s, m) => handleScope(s, "location_ids", m)}
                    placeholder={`Pick from ${filteredLocations.length} location(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                  {validated && errors.location_ids && (
                    <div className="otc-error">Select at least one or "All".</div>
                  )}
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">
                    Car groups<span className="req">*</span>
                  </label>
                  <Select
                    isMulti
                    options={groupOpts}
                    value={valueFor("group_ids", groupOpts)}
                    onChange={(s, m) => handleScope(s, "group_ids", m)}
                    placeholder={`Pick from ${carGroupArray.length} car group(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                  {validated && errors.group_ids && (
                    <div className="otc-error">Select at least one or "All".</div>
                  )}
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">
                    Cars<span className="req">*</span>
                  </label>
                  <Select
                    isMulti
                    options={carOpts}
                    value={valueFor("car_ids", carOpts)}
                    onChange={(s, m) => handleScope(s, "car_ids", m)}
                    placeholder={`Pick from ${carArray.length} car(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                  {validated && errors.car_ids && (
                    <div className="otc-error">Select at least one or "All".</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Redemption */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">
                  Redemption{" "}
                  <span
                    className="otc-pill"
                    style={{
                      background: "#fff7ed",
                      color: "#b45309",
                      marginLeft: 8,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      fontWeight: 700,
                    }}
                  >
                    One-time use
                  </span>
                </p>
                <p className="otc-card-sub">
                  How many successful bookings this code allows.
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-4">
                  <label className="otc-label">
                    Usage limit<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      (validated || (isEdit && Number(formData.usage_limit) < Number(usageCount))) && errors.usage_limit
                        ? "is-invalid"
                        : ""
                    }`}
                    type="number"
                    min={isEdit ? Math.max(1, Number(usageCount) || 1) : 1}
                    step={1}
                    value={formData.usage_limit}
                    onChange={(e) => {
                      const next =
                        e.target.value === ""
                          ? ""
                          : Math.max(1, parseInt(e.target.value, 10) || 1);
                      setField("usage_limit", next);
                      // Live validation against usage_count for edit
                      setErrors((prev) => {
                        const e2 = { ...prev };
                        if (isEdit && next !== "" && Number(next) < Number(usageCount)) {
                          e2.usage_limit = `Usage limit cannot be less than already used (${usageCount})`;
                        } else if (next === "" || Number(next) < 1) {
                          e2.usage_limit = "Usage limit must be at least 1";
                        } else {
                          delete e2.usage_limit;
                        }
                        return e2;
                      });
                    }}
                  />
                  <div className="otc-help">
                    Coupon becomes invalid after this many successful bookings.
                    Use 1 for a true single-use code.
                    {isEdit && Number(usageCount) > 0 && (
                      <> Cannot be less than already used ({usageCount}).</>
                    )}
                  </div>
                  {errors.usage_limit && (
                    <div className="otc-error">{errors.usage_limit}</div>
                  )}
                </div>

                {isEdit && (
                  <>
                    <div className="otc-field span-4">
                      <label className="otc-label">Used so far</label>
                      <input
                        className="otc-input"
                        type="text"
                        value={usageCount}
                        readOnly
                      />
                    </div>
                    <div className="otc-field span-4">
                      <label className="otc-label">Remaining</label>
                      <input
                        className="otc-input"
                        type="text"
                        value={remaining}
                        readOnly
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Note (optional)</p>
                <p className="otc-card-sub">
                  Internal note for your team — not shown to customers.
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <textarea
                className="otc-textarea"
                placeholder="Anything you want to remember about this coupon…"
                value={formData.note}
                onChange={(e) => setField("note", e.target.value)}
              />
            </div>
          </div>

          <div className="otc-footer-actions">
            <Link to="/admin/one-time-coupons" className="otc-btn otc-btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="otc-btn otc-btn-dark"
            >
              {submitting ? <span className="otc-spin" /> : <TfiSave />}{" "}
              {isEdit ? "Update coupon" : "Create coupon"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OneTimeCouponForm;
