// ======================== HR MODULE — SHARED CONSTANTS ========================

export const APPLICATION_STATUS = {
  0: { label: "Pending", color: "gray", bg: "#f1f5f9", text: "#64748b" },
  1: { label: "Reviewing", color: "blue", bg: "#eff6ff", text: "#2563eb" },
  2: { label: "Shortlisted", color: "orange", bg: "#fff7ed", text: "#ea580c" },
  3: { label: "Interviewed", color: "violet", bg: "#e7f5ff", text: "#7c3aed" },
  4: { label: "Rejected", color: "red", bg: "#fef2f2", text: "#dc2626" },
  5: { label: "Hired", color: "green", bg: "#f0fdf4", text: "#16a34a" },
};

export const APPLICATION_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Reviewing" },
  { value: "2", label: "Shortlisted" },
  { value: "3", label: "Interviewed" },
  { value: "4", label: "Rejected" },
  { value: "5", label: "Hired" },
];

export const INTERVIEW_STATUS = {
  0: { label: "Scheduled", color: "blue", bg: "#eff6ff", text: "#2563eb" },
  1: { label: "Completed", color: "green", bg: "#f0fdf4", text: "#16a34a" },
  2: { label: "Cancelled", color: "gray", bg: "#f1f5f9", text: "#64748b" },
  3: { label: "No-Show", color: "red", bg: "#fef2f2", text: "#dc2626" },
  4: { label: "Rescheduled", color: "orange", bg: "#fff7ed", text: "#ea580c" },
};

export const INTERVIEW_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "0", label: "Scheduled" },
  { value: "1", label: "Completed" },
  { value: "2", label: "Cancelled" },
  { value: "3", label: "No-Show" },
  { value: "4", label: "Rescheduled" },
];

export const INTERVIEW_TYPES = [
  { value: "in-person", label: "In-Person" },
  { value: "phone", label: "Phone" },
  { value: "video", label: "Video" },
];

export const JOB_STATUS = {
  0: { label: "Inactive", color: "gray" },
  1: { label: "Active", color: "green" },
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getApplicantName = (row) =>
  `${row?.first_name || ""} ${row?.last_name || ""}`.trim() || "N/A";

export const getApplicantPhone = (row) =>
  row?.phone_number ? `+${row.phone_code || ""} ${row.phone_number}` : "—";

export const getInitials = (row) => {
  const f = (row?.first_name || "?")[0];
  const l = (row?.last_name || "")[0] || "";
  return `${f}${l}`.toUpperCase();
};
