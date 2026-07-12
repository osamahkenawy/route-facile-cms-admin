import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Menu, Tooltip, Modal, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaSearch,
  FaThLarge,
  FaList,
  FaEllipsisV,
  FaEye,
  FaUpload,
  FaUserShield,
  FaCheck,
  FaArchive,
  FaTrash,
  FaPlus,
  FaFileAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import StatusBadge from "./StatusBadge";
import { formatDate } from "./memoMockData";
import {
  useDocuments,
  publishDocument,
  archiveDocument,
  deleteDocument as deleteDoc,
  fetchActiveCategories,
} from "./memoStore";
import CreateMemoModal from "./CreateMemoModal";
import { notifySuccess } from "../../../components/notify/notify";
import "./memo.css";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const PAGE_SIZES = [10, 25, 50];

const RowActions = ({ doc, onAction }) => (
  <Menu shadow="md" width={210} position="bottom-end" withinPortal>
    <Menu.Target>
      <button
        className="memo-iconbtn"
        aria-label="Actions"
        onClick={(e) => e.stopPropagation()}
      >
        <FaEllipsisV size={12} />
      </button>
    </Menu.Target>
    <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
      <Menu.Item leftSection={<FaEye size={12} />} onClick={() => onAction("view", doc)}>View Details</Menu.Item>
      <Menu.Item leftSection={<FaUpload size={12} />} onClick={() => onAction("upload", doc)}>Upload New Version</Menu.Item>
      <Menu.Item leftSection={<FaUserShield size={12} />} onClick={() => onAction("access", doc)}>Manage Access</Menu.Item>
      <Menu.Divider />
      {doc.status !== "published" && (
        <Menu.Item leftSection={<FaCheck size={12} />} color="green" onClick={() => onAction("publish", doc)}>Publish</Menu.Item>
      )}
      {doc.status === "published" && (
        <Menu.Item leftSection={<FaArchive size={12} />} color="orange" onClick={() => onAction("archive", doc)}>Archive</Menu.Item>
      )}
      <Menu.Item leftSection={<FaTrash size={12} />} color="red" onClick={() => onAction("delete", doc)}>Delete</Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

const MemoDocumentsList = () => {
  const navigate = useNavigate();
  const { documents: docs, loading, error, reload } = useDocuments();

  const [view, setView] = useState("grid"); // grid | list
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, createH] = useDisclosure(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchActiveCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(() => {
    let list = [...(docs || [])];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (d) =>
          (d.title || "").toLowerCase().includes(needle) ||
          (d.description || "").toLowerCase().includes(needle) ||
          (d.tags || []).some((t) => t.toLowerCase().includes(needle))
      );
    }
    if (category) list = list.filter((d) => d.category === category);
    if (status) list = list.filter((d) => d.status === status);

    if (sort === "newest")
      list.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    if (sort === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sort === "views") list.sort((a, b) => (b.views || 0) - (a.views || 0));
    return list;
  }, [docs, q, category, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onAction = (key, doc) => {
    if (key === "view" || key === "upload" || key === "access")
      return navigate(`/memo/documents/${doc.id}`);
    if (key === "publish") {
      setConfirm({
        title: "Publish memo",
        body: `"${doc.title}" will become visible to all assigned users.`,
        color: "indigo",
        confirmLabel: "Publish",
        action: async () => {
          await publishDocument(doc.id);
          notifySuccess("Memo published");
        },
      });
    }
    if (key === "archive") {
      setConfirm({
        title: "Archive memo",
        body: `"${doc.title}" will be hidden from end users.`,
        color: "orange",
        confirmLabel: "Archive",
        action: async () => {
          await archiveDocument(doc.id);
          notifySuccess("Memo archived");
        },
      });
    }
    if (key === "delete") {
      setConfirm({
        title: "Delete memo",
        body: `"${doc.title}" will be permanently removed.`,
        color: "red",
        confirmLabel: "Delete",
        action: async () => {
          await deleteDoc(doc.id);
          notifySuccess("Memo deleted");
        },
      });
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try { await confirm.action?.(); }
    catch { /* toast already raised by memoApi.wrap */ }
    finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="memo-page">
      <div className="memo-page__header">
        <div>
          <h1 className="memo-page__title">Documents</h1>
          <p className="memo-page__subtitle">
            {filtered.length} memo{filtered.length === 1 ? "" : "s"} match your filters
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="d-flex" style={{ background: "#fff", border: "1px solid var(--memo-border)", borderRadius: 10, padding: 4 }}>
            <Tooltip label="Grid view">
              <button
                className="memo-iconbtn"
                style={{
                  border: "none",
                  width: 32,
                  height: 30,
                  background: view === "grid" ? "var(--memo-primary-soft)" : "transparent",
                  color: view === "grid" ? "var(--memo-primary)" : "var(--memo-text-soft)",
                }}
                onClick={() => setView("grid")}
              >
                <FaThLarge size={12} />
              </button>
            </Tooltip>
            <Tooltip label="List view">
              <button
                className="memo-iconbtn"
                style={{
                  border: "none",
                  width: 32,
                  height: 30,
                  background: view === "list" ? "var(--memo-primary-soft)" : "transparent",
                  color: view === "list" ? "var(--memo-primary)" : "var(--memo-text-soft)",
                }}
                onClick={() => setView("list")}
              >
                <FaList size={12} />
              </button>
            </Tooltip>
          </div>
          <button className="memo-pillbtn memo-pillbtn--primary" onClick={createH.open}>
            <FaPlus size={11} /> Create Memo
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="memo-filterbar">
        <div className="memo-filterbar__search">
          <FaSearch className="memo-filterbar__search-icon" size={12} />
          <input
            placeholder="Search title, description, tags..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id || c.slug || c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="newest">Newest first</option>
          <option value="title">Title A → Z</option>
          <option value="views">Most viewed</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="memo-card text-center py-5">
          <Loader color="indigo" />
          <p className="text-muted small mt-2 mb-0">Loading memos…</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="memo-card memo-empty">
          <div className="memo-empty__icon" style={{ color: "var(--memo-danger)" }}>
            <FaExclamationTriangle />
          </div>
          <h5>Could not load memos</h5>
          <p className="mb-3">{error.message || "Please try again."}</p>
          <button className="memo-pillbtn memo-pillbtn--primary" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && paged.length === 0 && (
        <div className="memo-card memo-empty">
          <div className="memo-empty__icon"><FaFileAlt /></div>
          <h5>No memos found</h5>
          <p className="mb-3">Try adjusting your filters or create a new memo.</p>
          <button className="memo-pillbtn memo-pillbtn--primary" onClick={createH.open}>
            <FaPlus size={11} /> Create Memo
          </button>
        </div>
      )}

      {/* Grid view */}
      {!loading && !error && view === "grid" && paged.length > 0 && (
        <div className="row g-3">
          <AnimatePresence mode="popLayout">
            {paged.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                custom={i}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                variants={fadeUp}
                className="col-12 col-sm-6 col-lg-4 col-xl-3"
              >
                <div
                  className="memo-doc-card"
                  onClick={() => navigate(`/memo/documents/${d.id}`)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="memo-doc-card__thumb">PDF</div>
                    <RowActions doc={d} onAction={onAction} />
                  </div>
                  <div className="memo-doc-card__title" title={d.title}>{d.title}</div>
                  <div className="memo-doc-card__meta">
                    <StatusBadge status={d.status} />{" "}
                    <span className="ms-1">v{d.version}</span>
                  </div>
                  <p className="text-muted small mb-2" style={{ minHeight: 36 }}>
                    {d.description?.slice(0, 90)}
                    {d.description?.length > 90 ? "…" : ""}
                  </p>
                  <div>
                    {(d.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="memo-chip">#{t}</span>
                    ))}
                  </div>
                  <div className="memo-doc-card__footer">
                    <span>{d.category}</span>
                    <span><FaEye size={10} /> {d.views}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* List view */}
      {!loading && !error && view === "list" && paged.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="memo-card p-0"
        >
          <table className="memo-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Version</th>
                <th>Status</th>
                <th>Published</th>
                <th>Uploaded By</th>
                <th>Views</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => (
                <tr
                  key={d.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/memo/documents/${d.id}`)}
                >
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="memo-doc-card__thumb"
                        style={{ width: 32, height: 38, marginBottom: 0, fontSize: "0.65rem" }}
                      >
                        PDF
                      </div>
                      <div className="fw-semibold">{d.title}</div>
                    </div>
                  </td>
                  <td>{d.category}</td>
                  <td>v{d.version}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{formatDate(d.publishedAt)}</td>
                  <td>{d.uploadedBy}</td>
                  <td><FaEye size={10} className="text-muted" /> {d.views}</td>
                  <td><RowActions doc={d} onAction={onAction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Rows per page:</span>
            <select
              className="memo-pillbtn"
              style={{ padding: "0.25rem 0.5rem" }}
              value={pageSize}
              onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="memo-pillbtn"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="text-muted small">Page {safePage} of {totalPages}</span>
            <button
              className="memo-pillbtn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <CreateMemoModal
        opened={createOpen}
        onClose={createH.close}
        onCreated={(doc) => doc?.id && navigate(`/memo/documents/${doc.id}`)}
      />

      <Modal
        opened={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        centered
        size="sm"
        title={confirm?.title}
      >
        <p className="text-muted mb-3">{confirm?.body}</p>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
          <Button color={confirm?.color || "red"} loading={busy} onClick={runConfirm}>
            {confirm?.confirmLabel || "Confirm"}
          </Button>
        </Group>
      </Modal>
    </div>
  );
};

export default MemoDocumentsList;
