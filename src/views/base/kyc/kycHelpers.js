// Helpers shared by KYC admin pages.

export const getAccessToken = () => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch (e) {
    return null;
  }
};

export const authHeaders = () => {
  const token = getAccessToken();
  const apiKey = process.env.REACT_APP_API_KEY;
  const headers = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
};

export const fetchKycJson = async (url, options = {}) => {
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: { ...authHeaders(), "Content-Type": "application/json", ...(options.headers || {}) },
    body: options.body,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { ok: res.ok, status: res.status, data: json };
};

export const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "-";
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDateTime = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
};

export const documentTypeLabel = (type) => {
  switch (type) {
    case "cities_id":
      return "National ID";
    case "cities_id_front":
      return "National ID — Front";
    case "cities_id_back":
      return "National ID — Back";
    case "passport_visa":
      return "Passport / Visa (optional)";
    case "uae_driving_license":
      return "Driving License";
    case "uae_driving_license_front":
      return "Driving License — Front";
    case "uae_driving_license_back":
      return "Driving License — Back";
    default:
      return type || "-";
  }
};

// Ordered list of "slots" the admin UI renders as tiles. Each required slot
// has a `legacy` fallback type to honour older submissions that uploaded a
// single side per document. Optional slots render only when present.
export const DOCUMENT_SLOTS = [
  {
    key: "cities_id_front",
    label: "National ID — Front",
    required: true,
    legacy: "cities_id",
  },
  {
    key: "cities_id_back",
    label: "National ID — Back",
    required: true,
    legacy: "cities_id",
  },
  {
    key: "uae_driving_license_front",
    label: "Driving License — Front",
    required: true,
    legacy: "uae_driving_license",
  },
  {
    key: "uae_driving_license_back",
    label: "Driving License — Back",
    required: true,
    legacy: "uae_driving_license",
  },
  {
    key: "passport_visa",
    label: "Passport / Visa (optional)",
    required: false,
  },
];

// Resolve every UI slot to either a real attachment or a "missing" marker.
// Legacy single-side uploads are reused for both front and back slots and
// flagged so the UI can render a "Legacy single-side upload" badge.
export const resolveDocumentSlots = (attachments) => {
  const list = Array.isArray(attachments) ? attachments : [];
  const byType = list.reduce((acc, att) => {
    if (att && att.document_type) acc[att.document_type] = att;
    return acc;
  }, {});
  return DOCUMENT_SLOTS.map((slot) => {
    const direct = byType[slot.key];
    if (direct) return { slot, attachment: direct, legacy: false };
    if (slot.legacy && byType[slot.legacy]) {
      return { slot, attachment: byType[slot.legacy], legacy: true };
    }
    return { slot, attachment: null, legacy: false };
  });
};

// "Documents complete" rule per spec: all 4 required (EID front+back,
// DL front+back) OR both legacy single-side uploads present.
export const isDocumentsComplete = (attachments) => {
  const list = Array.isArray(attachments) ? attachments : [];
  const has = (t) => list.some((a) => a && a.document_type === t);
  const allNew =
    has("cities_id_front") &&
    has("cities_id_back") &&
    has("uae_driving_license_front") &&
    has("uae_driving_license_back");
  const allLegacy = has("cities_id") && has("uae_driving_license");
  return allNew || allLegacy;
};

// Count required slots that are satisfied (used for the list column "X / 4").
export const documentsCompletion = (attachments) => {
  const list = Array.isArray(attachments) ? attachments : [];
  const has = (t) => list.some((a) => a && a.document_type === t);
  const requiredSlots = DOCUMENT_SLOTS.filter((s) => s.required);
  const total = requiredSlots.length;
  const filled = requiredSlots.reduce((n, s) => {
    if (has(s.key)) return n + 1;
    if (s.legacy && has(s.legacy)) return n + 1;
    return n;
  }, 0);
  return { filled, total, complete: isDocumentsComplete(list) };
};

// Visible options in the list filter. "Under Review" is intentionally
// omitted from the dropdown but is still recognised when set via URL.
export const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const REVIEWABLE_STATUSES = ["submitted", "under_review", "approved", "rejected"];

export const STATUS_META = {
  draft: { label: "Draft", className: "draft" },
  submitted: { label: "Submitted", className: "submitted" },
  under_review: { label: "Under Review", className: "under_review" },
  approved: { label: "Approved", className: "approved" },
  rejected: { label: "Rejected", className: "rejected" },
};

export const statusMeta = (status) =>
  STATUS_META[status] || { label: status || "-", className: "draft" };

export const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const filenameFromDisposition = (dispo, fallback) => {
  if (!dispo) return fallback;
  const m =
    /filename\*=UTF-8''([^;]+)/i.exec(dispo) ||
    /filename="?([^";]+)"?/i.exec(dispo);
  if (m && m[1]) {
    try {
      return decodeURIComponent(m[1]);
    } catch (e) {
      return m[1];
    }
  }
  return fallback;
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
