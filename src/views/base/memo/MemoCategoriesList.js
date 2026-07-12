import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader, Modal, TextInput, Textarea, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTags,
  FaExclamationTriangle,
} from "react-icons/fa";
import StatusBadge from "./StatusBadge";
import { slugify, formatDate } from "./memoMockData";
import { useCategories } from "./memoStore";
import memoApi from "./memoApi";
import { notifySuccess, notifyError } from "../../../components/notify/notify";
import "./memo.css";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const emptyForm = { id: null, name: "", slug: "", description: "", status: "active" };

const MemoCategoriesList = () => {
  const { categories: rows, loading, error, reload } = useCategories();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return (rows || []).filter((r) => {
      if (q && !(r.name || "").toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, q, statusFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setErrors({});
    open();
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setSlugTouched(true);
    setErrors({});
    open();
  };

  const handleNameChange = (val) => {
    setForm((f) => ({
      ...f,
      name: val,
      slug: slugTouched ? f.slug : slugify(val),
    }));
  };

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name) e.name = "Name is required";
    if (!slug) e.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(slug))
      e.slug = "Lowercase letters, numbers and hyphens only";
    else if ((rows || []).some((r) => r.slug === slug && r.id !== form.id))
      e.slug = "Slug already exists";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || submitting) return;
    const clean = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: (form.description || "").trim(),
      status: form.status === "active" ? 1 : 0,
    };
    setSubmitting(true);
    try {
      if (form.id) {
        await memoApi.updateCategory(form.id, clean);
        notifySuccess("Category updated");
      } else {
        await memoApi.createCategory(clean);
        notifySuccess("Category created");
      }
      await reload();
      close();
    } catch (_) { /* toast already shown */ }
    finally { setSubmitting(false); }
  };

  const remove = async (row) => {
    if ((row.docs || row.documentsCount || 0) > 0) {
      notifyError("Cannot delete: this category is in use.");
      return;
    }
    if (!window.confirm(`Delete category "${row.name}"?`)) return;
    try {
      await memoApi.deleteCategory(row.id);
      notifySuccess("Category deleted");
      reload();
    } catch (_) { /* toast already shown */ }
  };

  return (
    <div className="memo-page">
      <div className="memo-page__header">
        <div>
          <h1 className="memo-page__title">Categories</h1>
          <p className="memo-page__subtitle">
            Group memos for easier discovery. {filtered.length} of {(rows || []).length} shown.
          </p>
        </div>
        <button className="memo-pillbtn memo-pillbtn--primary" onClick={openNew}>
          <FaPlus size={11} /> New Category
        </button>
      </div>

      <div className="memo-filterbar">
        <div className="memo-filterbar__search">
          <FaSearch className="memo-filterbar__search-icon" size={12} />
          <input
            placeholder="Search categories..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="memo-card p-0"
      >
        {loading ? (
          <div className="text-center py-5">
            <Loader color="indigo" />
            <p className="text-muted small mt-2 mb-0">Loading categories…</p>
          </div>
        ) : error ? (
          <div className="memo-empty">
            <div className="memo-empty__icon" style={{ color: "var(--memo-danger)" }}>
              <FaExclamationTriangle />
            </div>
            <h5>Could not load categories</h5>
            <p className="mb-3">{error.message || "Please try again."}</p>
            <button className="memo-pillbtn memo-pillbtn--primary" onClick={reload}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="memo-empty">
            <div className="memo-empty__icon"><FaTags /></div>
            <h5>No categories</h5>
            <p className="mb-0">Create your first category to get started.</p>
          </div>
        ) : (
          <table className="memo-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr
                  key={row.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  <td><strong>{row.name}</strong></td>
                  <td><code style={{ background: "#f1f4fa", padding: "2px 6px", borderRadius: 4 }}>{row.slug}</code></td>
                  <td>{row.docs ?? row.documentsCount ?? 0}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="memo-iconbtn" onClick={() => openEdit(row)} title="Edit">
                        <FaEdit size={12} />
                      </button>
                      <button className="memo-iconbtn memo-iconbtn--danger" onClick={() => remove(row)} title="Delete">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal
        opened={opened}
        onClose={close}
        title={form.id ? "Edit Category" : "New Category"}
        centered
        size="md"
      >
        <TextInput
          label="Name"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => handleNameChange(e.currentTarget.value)}
        />
        <TextInput
          label="Slug"
          required
          mt="sm"
          value={form.slug}
          error={errors.slug}
          description="Lowercase letters, numbers and hyphens"
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.currentTarget.value }));
          }}
        />
        <Textarea
          label="Description"
          mt="sm"
          autosize
          minRows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
        />
        <div className="d-flex align-items-center gap-2 mt-3">
          <label className="memo-switch">
            <input
              type="checkbox"
              checked={form.status === "active"}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))
              }
            />
            <span className="memo-switch__slider" />
          </label>
          <span className="text-muted small">{form.status === "active" ? "Active" : "Inactive"}</span>
        </div>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={close} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} color="indigo" loading={submitting}>
            {form.id ? "Save changes" : "Create category"}
          </Button>
        </Group>
      </Modal>
    </div>
  );
};

export default MemoCategoriesList;
