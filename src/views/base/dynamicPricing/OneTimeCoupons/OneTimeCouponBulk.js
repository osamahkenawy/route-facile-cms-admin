import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import {
  TfiArrowLeft,
  TfiLayersAlt,
  TfiPlus,
  TfiDownload,
  TfiCheck,
  TfiAlert,
  TfiInfoAlt,
} from "react-icons/tfi";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
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

const CHARSETS = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numeric: "0123456789",
};
const previewCode = (prefix, length, charset = "alphanumeric") => {
  const pool = CHARSETS[charset] || CHARSETS.alphanumeric;
  const need = Math.max((length || 10) - (prefix?.length || 0), 0);
  let out = "";
  for (let i = 0; i < need; i++) out += pool[Math.floor(Math.random() * pool.length)];
  return `${prefix || ""}${out}`;
};

const csvDownload = (filename, rows, header) => {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const OneTimeCouponBulk = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("generate");
  const [formData, setFormData] = useState(initialForm);
  const [count, setCount] = useState(50);
  const [prefix, setPrefix] = useState("");
  const [codeLength, setCodeLength] = useState(10);
  const [charset, setCharset] = useState("alphanumeric");
  const [pasted, setPasted] = useState("");
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  // lookups
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

  const opts = (arr, labelKey = "name_en") => [
    { value: "all", label: "All" },
    ...(arr || []).map((x) => ({ value: x.id, label: x[labelKey] })),
  ];
  const emirateOpts = useMemo(() => opts(emiratesArray), [emiratesArray]);
  const carOpts = useMemo(() => opts(carArray), [carArray]);
  const groupOpts = useMemo(() => opts(carGroupArray), [carGroupArray]);
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

  // Reconcile location_ids when the emirate scope narrows.
  useEffect(() => {
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
  }, [filteredLocations, locationArray.length]);

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleScope = (selected, fieldName, actionMeta) => {
    const justPicked = actionMeta?.option?.value;
    let values = selected ? selected.map((o) => o.value) : [];
    if (justPicked === "all") {
      values = ["all"];
    } else if (justPicked && values.includes("all")) {
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

  // pasted codes parser
  const parsedCodes = useMemo(() => {
    if (!pasted) return [];
    const split = pasted
      .split(/[\n,;\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(split));
  }, [pasted]);

  // preview generator (memoized so it doesn't reshuffle on every keystroke unrelated to it)
  const examples = useMemo(() => {
    return [previewCode(prefix, codeLength, charset), previewCode(prefix, codeLength, charset), previewCode(prefix, codeLength, charset)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, codeLength, charset]);

  // dirty state for navigation guard
  const isDirty = useMemo(() => {
    if (result) return false; // result panel handles its own warning
    return Boolean(
      pasted ||
      prefix ||
      formData.note ||
      formData.start_date ||
      formData.end_date ||
      Number(count) !== 50 ||
      Number(codeLength) !== 10
    );
  }, [pasted, prefix, formData, result, count, codeLength]);

  // Submit gate — disables the create button when the codes input is invalid
  const canSubmit = useMemo(() => {
    if (tab === "generate") {
      const c = Number(count);
      const l = Number(codeLength);
      return c >= 1 && c <= 5000 && l >= 4 && l <= 32;
    }
    return parsedCodes.length > 0 && parsedCodes.length <= 5000;
  }, [tab, count, codeLength, parsedCodes.length]);

  useEffect(() => {
    const handler = (e) => {
      if (isDirty || (result && !csvDownloaded && (result?.created?.length ?? 0) > 0)) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, result, csvDownloaded]);

  const validate = () => {
    const e = {};
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

    if (tab === "generate") {
      if (!count || count < 1 || count > 5000) e.count = "Count must be 1..5000";
      if (codeLength < 4 || codeLength > 32) e.code_length = "Code length must be 4..32";
      if (prefix && !/^[A-Za-z0-9_-]{0,32}$/.test(prefix))
        e.prefix = "Prefix may contain A-Z, a-z, 0-9, _ and -";
      if (prefix && prefix.length >= codeLength)
        e.prefix = "Prefix must be shorter than code length";
    } else {
      if (parsedCodes.length === 0) e.codes = "Paste at least one code";
      if (parsedCodes.length > 5000) e.codes = "Maximum 5000 codes per batch";
    }

    ["car_ids", "emirate_ids", "group_ids", "location_ids"].forEach((k) => {
      if (!formData[k].all && (formData[k].ids?.length ?? 0) === 0) e[k] = true;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setValidated(true);
    if (!validate()) return;

    const base = {
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

    const payload =
      tab === "generate"
        ? {
            ...base,
            count: Number(count),
            prefix: prefix || undefined,
            code_length: Number(codeLength),
            charset,
          }
        : { ...base, codes: parsedCodes };

    setSubmitting(true);
    simplePostCallAuth(configWeb.POST_ONE_TIME_COUPON_BULK, JSON.stringify(payload))
      .then((res) => {
        // Backend returns { created: [...], skipped: [...] } on success.
        // Anything else (no created/skipped arrays) is treated as an error.
        const hasResult =
          res && (Array.isArray(res.created) || Array.isArray(res.skipped));
        if (!hasResult) {
          notifyError(
            (Array.isArray(res?.message) ? res?.message[0] : res?.message) ||
              res?.error ||
              "Bulk create failed"
          );
          return;
        }
        const created = res?.created || [];
        const skipped = res?.skipped || [];
        setResult({ created, skipped });
        setCsvDownloaded(false);
        notifySuccess(`Created ${created.length} coupon(s)`);
      })
      .catch(() => notifyError("Bulk create failed. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const downloadCreated = () => {
    if (!result?.created?.length) return;
    csvDownload(
      `one_time_coupons_${Date.now()}.csv`,
      result.created.map((c) => [c]),
      ["code"]
    );
    setCsvDownloaded(true);
  };
  const downloadSkipped = () => {
    if (!result?.skipped?.length) return;
    csvDownload(
      `one_time_coupons_skipped_${Date.now()}.csv`,
      result.skipped.map((s) => [s.code, s.reason]),
      ["code", "reason"]
    );
  };

  const resetForm = () => {
    if (
      result?.created?.length &&
      !csvDownloaded &&
      !window.confirm(
        "You have not downloaded the CSV of created codes. Continue anyway?"
      )
    )
      return;
    setFormData(initialForm);
    setCount(50);
    setPrefix("");
    setCodeLength(10);
    setPasted("");
    setValidated(false);
    setErrors({});
    setResult(null);
    setCsvDownloaded(false);
  };

  const goBack = (e) => {
    if (
      result?.created?.length &&
      !csvDownloaded &&
      !window.confirm(
        "You have not downloaded the CSV of created codes. Leave anyway?"
      )
    ) {
      e.preventDefault();
      return;
    }
  };

  return (
    <div className="otc-page">
      <div className="otc-hero">
        <div className="otc-hero-inner">
          <div>
            <span className="otc-hero-pill">
              <TfiLayersAlt /> Bulk create
            </span>
            <h1>
              Generate <span className="otc-hero-accent">campaigns at scale</span>
            </h1>
            <p>
              Create up to 5000 single-use coupons in one shot. Generate codes
              automatically or paste your own list, then download the CSV.
            </p>
          </div>
          <div className="otc-hero-actions">
            <Link to="/admin/one-time-coupons" className="otc-btn otc-btn-ghost" onClick={goBack}>
              <TfiArrowLeft /> Back to list
            </Link>
            {!result && (
              <button
                type="submit"
                form="otc-bulk-form"
                disabled={submitting || !canSubmit}
                className="otc-btn otc-btn-primary"
              >
                {submitting ? <span className="otc-spin" /> : <TfiPlus />}{" "}
                Create batch
              </button>
            )}
          </div>
        </div>
      </div>

      {result ? (
        <>
          <div
            className="otc-card otc-section"
            style={{ borderColor: "#bbf7d0" }}
          >
            <div className="otc-card-header" style={{ background: "linear-gradient(180deg,#ecfdf5,#fff)" }}>
              <div>
                <p className="otc-card-title" style={{ color: "#065f46" }}>
                  <TfiCheck /> Batch processed
                </p>
                <p className="otc-card-sub">
                  {result.created.length} created · {result.skipped.length} skipped
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="otc-btn otc-btn-primary"
                  onClick={downloadCreated}
                  disabled={!result.created.length}
                >
                  <TfiDownload /> Download created (CSV)
                </button>
                <button
                  type="button"
                  className="otc-btn otc-btn-outline"
                  onClick={downloadSkipped}
                  disabled={!result.skipped.length}
                >
                  <TfiDownload /> Download skipped
                </button>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-result-grid">
                <div className="otc-result-card is-success">
                  <div className="otc-result-head">
                    <span><TfiCheck /> Created ({result.created.length})</span>
                  </div>
                  <div className="otc-result-body">
                    {result.created.length === 0 ? (
                      <div className="otc-empty" style={{ padding: 20 }}>
                        <p>No new coupons were created in this batch.</p>
                      </div>
                    ) : (
                      <table>
                        <tbody>
                          {result.created.map((c) => (
                            <tr key={c}>
                              <td className="code">{c}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="otc-result-card is-warn">
                  <div className="otc-result-head">
                    <span><TfiAlert /> Skipped ({result.skipped.length})</span>
                  </div>
                  <div className="otc-result-body">
                    {result.skipped.length === 0 ? (
                      <div className="otc-empty" style={{ padding: 20 }}>
                        <p>Nothing was skipped — clean run.</p>
                      </div>
                    ) : (
                      <table>
                        <tbody>
                          {result.skipped.map((s, i) => (
                            <tr key={`${s.code}-${i}`}>
                              <td className="code">{s.code}</td>
                              <td style={{ color: "#9a3412" }}>{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              <div className="otc-footer-actions" style={{ marginTop: 18 }}>
                <button type="button" className="otc-btn otc-btn-outline" onClick={resetForm}>
                  <TfiPlus /> Create another batch
                </button>
                <Link
                  to="/admin/one-time-coupons"
                  className="otc-btn otc-btn-dark"
                  onClick={goBack}
                >
                  Back to list
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form id="otc-bulk-form" onSubmit={onSubmit} noValidate>
          {/* Codes section */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Codes</p>
                <p className="otc-card-sub">
                  Auto-generate random codes or paste your own list.
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-tabs">
                <button
                  type="button"
                  className={tab === "generate" ? "is-active" : ""}
                  onClick={() => setTab("generate")}
                >
                  Generate codes
                </button>
                <button
                  type="button"
                  className={tab === "paste" ? "is-active" : ""}
                  onClick={() => setTab("paste")}
                >
                  Paste codes
                </button>
              </div>

              {tab === "generate" ? (
                <div className="otc-form-grid">
                  <div className="otc-field span-3">
                    <label className="otc-label">
                      Count<span className="req">*</span>
                    </label>
                    <input
                      className={`otc-input ${
                        validated && errors.count ? "is-invalid" : ""
                      }`}
                      type="number"
                      min={1}
                      max={5000}
                      step={1}
                      value={count}
                      onChange={(e) =>
                        setCount(
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                    />
                    <div className="otc-help">1 to 5000 codes per batch.</div>
                    {validated && errors.count && (
                      <div className="otc-error">{errors.count}</div>
                    )}
                  </div>
                  <div className="otc-field span-3">
                    <label className="otc-label">Prefix</label>
                    <input
                      className={`otc-input ${
                        validated && errors.prefix ? "is-invalid" : ""
                      }`}
                      type="text"
                      maxLength={32}
                      placeholder="e.g. MAY26-"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                    />
                    <div className="otc-help">A–Z, a–z, 0–9, _ and -.</div>
                    {validated && errors.prefix && (
                      <div className="otc-error">{errors.prefix}</div>
                    )}
                  </div>
                  <div className="otc-field span-3">
                    <label className="otc-label">Code length</label>
                    <input
                      className={`otc-input ${
                        validated && errors.code_length ? "is-invalid" : ""
                      }`}
                      type="number"
                      min={4}
                      max={32}
                      step={1}
                      value={codeLength}
                      onChange={(e) =>
                        setCodeLength(
                          e.target.value === ""
                            ? ""
                            : Math.max(4, Math.min(32, parseInt(e.target.value, 10) || 10))
                        )
                      }
                    />
                    <div className="otc-help">Total length 4 to 32.</div>
                    {validated && errors.code_length && (
                      <div className="otc-error">{errors.code_length}</div>
                    )}
                  </div>
                  <div className="otc-field span-3">
                    <label className="otc-label">Suffix charset</label>
                    <select
                      className="otc-input"
                      value={charset}
                      onChange={(e) => setCharset(e.target.value)}
                    >
                      <option value="alphanumeric">Alphanumeric (A-Z, 0-9)</option>
                      <option value="alpha">Letters only (A-Z)</option>
                      <option value="numeric">Numbers only (0-9)</option>
                    </select>
                    <div className="otc-help">
                      Charset used for the auto-generated portion after the prefix.
                    </div>
                  </div>
                  <div className="otc-field span-3">
                    <label className="otc-label">&nbsp;</label>
                    <div className="otc-preview">
                      <span className="lbl"><TfiInfoAlt /> Live preview</span>
                      {examples.map((ex, i) => (
                        <span key={i} className="otc-preview-code">{ex}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="otc-form-grid">
                  <div className="otc-field span-12">
                    <label className="otc-label">
                      Paste codes<span className="req">*</span>
                    </label>
                    <textarea
                      className={`otc-textarea ${
                        validated && errors.codes ? "is-invalid" : ""
                      }`}
                      style={{ minHeight: 160 }}
                      placeholder={"VIP-001\nVIP-002\nVIP-003"}
                      value={pasted}
                      onChange={(e) => setPasted(e.target.value)}
                    />
                    <div className="otc-help">
                      One per line, or comma/semicolon separated. Whitespace is
                      trimmed and duplicates are de-duplicated.
                    </div>
                    <div
                      className="otc-help"
                      style={{
                        marginTop: 6,
                        color:
                          parsedCodes.length > 5000
                            ? "#b91c1c"
                            : parsedCodes.length > 0
                            ? "#047857"
                            : "#64748b",
                      }}
                    >
                      <strong>{parsedCodes.length}</strong> unique code
                      {parsedCodes.length === 1 ? "" : "s"} detected
                      {parsedCodes.length > 5000 ? " — exceeds maximum (5000)" : ""}.
                    </div>
                    {validated && errors.codes && (
                      <div className="otc-error">{errors.codes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Common settings */}
          <div className="otc-card otc-section">
            <div className="otc-card-header">
              <div>
                <p className="otc-card-title">Settings (applied to every code)</p>
                <p className="otc-card-sub">
                  These values are written to each coupon in the batch.
                </p>
              </div>
            </div>
            <div className="otc-card-body">
              <div className="otc-form-grid">
                <div className="otc-field span-3">
                  <label className="otc-label">Type</label>
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
                  <label className="otc-label">Discount type</label>
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
                <div className="otc-field span-3">
                  <label className="otc-label">
                    Usage limit per code<span className="req">*</span>
                  </label>
                  <input
                    className={`otc-input ${
                      validated && errors.usage_limit ? "is-invalid" : ""
                    }`}
                    type="number"
                    min={1}
                    step={1}
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setField(
                        "usage_limit",
                        e.target.value === ""
                          ? ""
                          : Math.max(1, parseInt(e.target.value, 10) || 1)
                      )
                    }
                  />
                  <div className="otc-help">Default 1 (single-use).</div>
                  {validated && errors.usage_limit && (
                    <div className="otc-error">{errors.usage_limit}</div>
                  )}
                </div>

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

                <div className="otc-field span-12">
                  <label className="otc-label">
                    Rate<span className="req">*</span>
                  </label>
                  <input
                    className="otc-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setField("rate", e.target.value)}
                  />
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
                  <label className="otc-label">Emirates</label>
                  <Select
                    isMulti
                    options={emirateOpts}
                    value={valueFor("emirate_ids", emirateOpts)}
                    onChange={(s, m) => handleScope(s, "emirate_ids", m)}
                    placeholder={`Pick from ${emiratesArray.length} emirate(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">Locations</label>
                  <Select
                    isMulti
                    options={locationOpts}
                    value={valueFor("location_ids", locationOpts)}
                    onChange={(s, m) => handleScope(s, "location_ids", m)}
                    placeholder={`Pick from ${filteredLocations.length} location(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">Car groups</label>
                  <Select
                    isMulti
                    options={groupOpts}
                    value={valueFor("group_ids", groupOpts)}
                    onChange={(s, m) => handleScope(s, "group_ids", m)}
                    placeholder={`Pick from ${carGroupArray.length} car group(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                </div>
                <div className="otc-field span-6">
                  <label className="otc-label">Cars</label>
                  <Select
                    isMulti
                    options={carOpts}
                    value={valueFor("car_ids", carOpts)}
                    onChange={(s, m) => handleScope(s, "car_ids", m)}
                    placeholder={`Pick from ${carArray.length} car(s)…`}
                    classNamePrefix="select" menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed" styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                  />
                </div>
                <div className="otc-field span-12">
                  <label className="otc-label">Note (optional)</label>
                  <textarea
                    className="otc-textarea"
                    placeholder="Campaign reference, internal note…"
                    value={formData.note}
                    onChange={(e) => setField("note", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="otc-footer-actions">
            <Link
              to="/admin/one-time-coupons"
              className="otc-btn otc-btn-outline"
              onClick={goBack}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="otc-btn otc-btn-dark"
            >
              {submitting ? <span className="otc-spin" /> : <TfiLayersAlt />}{" "}
              Create batch
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OneTimeCouponBulk;
