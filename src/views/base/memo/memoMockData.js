// Centralized mock data + helpers for the Memo Portal.
// Replace these with memoApi calls when the backend is wired up.

export const MEMO_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const memoStatusLabel = (s) =>
  ({
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  }[s] || s);

export const memoCategories = [
  { id: 1, name: "HR Policies",       slug: "hr-policies",       status: "active",   docs: 12, createdAt: "2026-01-12" },
  { id: 2, name: "Finance",           slug: "finance",           status: "active",   docs: 8,  createdAt: "2026-01-15" },
  { id: 3, name: "IT & Security",     slug: "it-security",       status: "active",   docs: 17, createdAt: "2026-02-01" },
  { id: 4, name: "Operations",        slug: "operations",        status: "active",   docs: 9,  createdAt: "2026-02-09" },
  { id: 5, name: "Marketing",         slug: "marketing",         status: "active",   docs: 6,  createdAt: "2026-02-22" },
  { id: 6, name: "Legal & Compliance",slug: "legal-compliance",  status: "active",   docs: 4,  createdAt: "2026-03-04" },
  { id: 7, name: "Archived 2024",     slug: "archived-2024",     status: "inactive", docs: 0,  createdAt: "2024-11-30" },
];

const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const memoDocuments = [
  {
    id: 101,
    title: "Q2 2026 Performance Review Cycle",
    description: "Process, deadlines and rubric for the upcoming Q2 review cycle.",
    category: "HR Policies",
    version: 3,
    status: "published",
    publishedAt: daysAgo(2),
    uploadedBy: "Maria Khalil",
    views: 248,
    tags: ["review", "Q2", "process"],
  },
  {
    id: 102,
    title: "Updated Travel Expense Policy",
    description: "New per-diem rates and reimbursement workflow effective May 1.",
    category: "Finance",
    version: 5,
    status: "published",
    publishedAt: daysAgo(5),
    uploadedBy: "Omar Yusuf",
    views: 189,
    tags: ["expenses", "travel"],
  },
  {
    id: 103,
    title: "Information Security Awareness Pack",
    description: "Mandatory annual security training deck and FAQ.",
    category: "IT & Security",
    version: 2,
    status: "published",
    publishedAt: daysAgo(8),
    uploadedBy: "Layla Hassan",
    views: 412,
    tags: ["security", "training"],
  },
  {
    id: 104,
    title: "Branch Operations Handbook 2026",
    description: "Daily operating procedures for all rental branches.",
    category: "Operations",
    version: 7,
    status: "published",
    publishedAt: daysAgo(12),
    uploadedBy: "Hamad Al Mansoori",
    views: 156,
    tags: ["operations", "handbook"],
  },
  {
    id: 105,
    title: "Brand Guidelines v3 (Draft)",
    description: "Refreshed colors, logos and tone of voice. Pending CMO sign-off.",
    category: "Marketing",
    version: 1,
    status: "draft",
    publishedAt: null,
    uploadedBy: "Salma Adel",
    views: 12,
    tags: ["brand", "draft"],
  },
  {
    id: 106,
    title: "Vendor Code of Conduct",
    description: "Compliance requirements for all third-party vendors.",
    category: "Legal & Compliance",
    version: 2,
    status: "published",
    publishedAt: daysAgo(20),
    uploadedBy: "Maria Khalil",
    views: 87,
    tags: ["legal", "compliance"],
  },
  {
    id: 107,
    title: "2024 End of Year Memo (Archived)",
    description: "Year-end communication from CEO. Kept for record only.",
    category: "Archived 2024",
    version: 1,
    status: "archived",
    publishedAt: daysAgo(180),
    uploadedBy: "Hamad Al Mansoori",
    views: 933,
    tags: ["ceo", "year-end"],
  },
  {
    id: 108,
    title: "Public Holiday Schedule 2026",
    description: "All Moroccan public holidays and Route Facile-specific observances.",
    category: "HR Policies",
    version: 1,
    status: "published",
    publishedAt: daysAgo(30),
    uploadedBy: "Maria Khalil",
    views: 521,
    tags: ["holidays", "calendar"],
  },
];

export const memoActivity = [
  { id: 1, actor: "Maria Khalil",       action: "document.publish",     entity: "Q2 2026 Performance Review Cycle", at: daysAgo(0) },
  { id: 2, actor: "Omar Yusuf",         action: "version.upload",       entity: "Updated Travel Expense Policy",    at: daysAgo(0) },
  { id: 3, actor: "Layla Hassan",       action: "access.assign",        entity: "Information Security Awareness Pack", at: daysAgo(1) },
  { id: 4, actor: "Hamad Al Mansoori",  action: "document.update",      entity: "Branch Operations Handbook 2026",  at: daysAgo(1) },
  { id: 5, actor: "Salma Adel",         action: "document.create",      entity: "Brand Guidelines v3 (Draft)",      at: daysAgo(2) },
  { id: 6, actor: "Maria Khalil",       action: "version.set-current",  entity: "Vendor Code of Conduct",           at: daysAgo(3) },
  { id: 7, actor: "system",             action: "document.view",        entity: "Public Holiday Schedule 2026",     at: daysAgo(3) },
  { id: 8, actor: "Hamad Al Mansoori",  action: "document.archive",     entity: "2024 End of Year Memo",            at: daysAgo(4) },
  { id: 9, actor: "Layla Hassan",       action: "access.revoke",        entity: "Vendor Code of Conduct",           at: daysAgo(5) },
  { id: 10, actor: "Omar Yusuf",        action: "document.delete",      entity: "Old Q1 Draft",                     at: daysAgo(6) },
];

export const ACTION_LABELS = {
  "document.create":      { label: "created document",    color: "#0ea5e9" },
  "document.update":      { label: "updated document",    color: "#6366f1" },
  "document.publish":     { label: "published document",  color: "#10b981" },
  "document.archive":     { label: "archived document",   color: "#f59e0b" },
  "document.delete":      { label: "deleted document",    color: "#ef4444" },
  "document.view":        { label: "viewed document",     color: "#94a3b8" },
  "version.upload":       { label: "uploaded version",    color: "#8b5cf6" },
  "version.set-current":  { label: "set current version", color: "#0d9488" },
  "access.assign":        { label: "granted access to",   color: "#0d9488" },
  "access.revoke":        { label: "revoked access from", color: "#ef4444" },
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const timeAgo = (iso) => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 0) return formatDate(iso);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
};

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
