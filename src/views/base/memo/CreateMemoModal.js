import React, { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  TagsInput,
  Button,
  Group,
  Stepper,
  Loader,
  rem,
} from "@mantine/core";
import {
  FaInfoCircle,
  FaCloudUploadAlt,
  FaUserShield,
  FaCheckCircle,
} from "react-icons/fa";
import { addDocument, fetchActiveCategories, uploadDocumentFile } from "./memoStore";
import memoApi from "./memoApi";
import { notifySuccess, notifyError } from "../../../components/notify/notify";

/**
 * Compact 4-step Create Memo wizard. The full BRD wizard (file upload with
 * progress, access control matrix, publish) needs the backend; this version
 * captures metadata + a mock file + a publish toggle and feeds the local
 * memoStore so every page reflects the new memo.
 */
const CreateMemoModal = ({ opened, onClose, onCreated }) => {
  const [active, setActive] = useState(0);
  const [meta, setMeta] = useState({
    title: "",
    description: "",
    category: "",
    tags: [],
  });
  const [file, setFile] = useState(null);
  const [access, setAccess] = useState("ALL");
  const [accessRoles, setAccessRoles] = useState([]); // string[] of role codes
  const [accessUsers, setAccessUsers] = useState([]); // [{value:id, label:name}]
  const [accessUserOptions, setAccessUserOptions] = useState([]); // dropdown options (selected + search results)
  const [accessUserQuery, setAccessUserQuery] = useState("");
  const [accessUserLoading, setAccessUserLoading] = useState(false);
  const [accessEmails, setAccessEmails] = useState([]); // string[]
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const ROLE_OPTIONS = [
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR" },
    { value: "kyc", label: "KYC" },
    { value: "counter", label: "Counter" },
    { value: "accounts", label: "Accounts" },
  ];
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (!opened) return;
    fetchActiveCategories().then(setCategories).catch(() => setCategories([]));
  }, [opened]);

  const reset = () => {
    setActive(0);
    setMeta({ title: "", description: "", category: "", tags: [] });
    setFile(null);
    setAccess("ALL");
    setAccessRoles([]);
    setAccessUsers([]);
    setAccessUserOptions([]);
    setAccessUserQuery("");
    setAccessEmails([]);
    setErrors({});
  };

  // Debounced admin-user search
  useEffect(() => {
    if (access !== "USER") return;
    const q = (accessUserQuery || "").trim();
    if (q.length < 2) return;
    let cancelled = false;
    setAccessUserLoading(true);
    const t = setTimeout(async () => {
      try {
        const resp = await memoApi.lookupAdminUsers(q);
        const raw = Array.isArray(resp)
          ? resp
          : resp?.items || resp?.data || resp?.users || [];
        const opts = raw
          .map((u) => {
            const id = u.id ?? u._id ?? u.userId;
            const name =
              u.name ||
              [u.first_name, u.last_name].filter(Boolean).join(" ") ||
              u.email ||
              `User ${id}`;
            const email = u.email ? ` (${u.email})` : "";
            return id != null
              ? { value: String(id), label: `${name}${email}` }
              : null;
          })
          .filter(Boolean);
        if (!cancelled) {
          // Merge: keep currently selected entries so labels stay rendered.
          const merged = [...accessUsers];
          opts.forEach((o) => {
            if (!merged.some((m) => m.value === o.value)) merged.push(o);
          });
          setAccessUserOptions(merged);
        }
      } catch (_) {
        // notify already raised
      } finally {
        if (!cancelled) setAccessUserLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [accessUserQuery, access, accessUsers]);

  const close = () => {
    reset();
    onClose();
  };

  const validateStep1 = () => {
    const e = {};
    if (!meta.title.trim()) e.title = "Title is required";
    if (meta.title.length > 255) e.title = "Max 255 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAccessStep = () => {
    if (access === "ROLE" && accessRoles.length === 0) {
      notifyError("Pick at least one user type");
      return false;
    }
    if (access === "USER" && accessUsers.length === 0) {
      notifyError("Pick at least one admin user");
      return false;
    }
    if (access === "EMAIL") {
      if (accessEmails.length === 0) {
        notifyError("Add at least one email address");
        return false;
      }
      const bad = accessEmails.find((e) => !EMAIL_REGEX.test(e));
      if (bad) {
        notifyError(`"${bad}" is not a valid email`);
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (active === 0 && !validateStep1()) return;
    if (active === 1 && !file) {
      notifyError("Please choose a file before continuing");
      return;
    }
    if (active === 2 && !validateAccessStep()) return;
    setActive((a) => Math.min(a + 1, 3));
  };

  const back = () => setActive((a) => Math.max(a - 1, 0));

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowed.includes(f.type)) {
      notifyError("Unsupported file type");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      notifyError("Max file size is 25 MB");
      return;
    }
    setFile(f);
  };

  const submit = async (publishNow) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const tagsStr = (meta.tags || []).join(",");
      if (tagsStr.length > 500) {
        notifyError("Tags must be 500 characters or fewer in total");
        setSubmitting(false);
        return;
      }

      // 1) Create document metadata. Backend expects category_id, not name.
      const matchedCat = (categories || []).find(
        (c) => c.name === meta.category || c.id === meta.category
      );
      const createBody = {
        title: meta.title.trim(),
        description: meta.description.trim(),
        tags: tagsStr,
      };
      if (matchedCat?.id) createBody.category_id = matchedCat.id;

      const doc = await addDocument(createBody);
      const newId = doc?.id;
      if (!newId) {
        notifyError("Could not read new document id from response");
        return;
      }

      // 2) Upload the file (sets current_version_id).
      if (file) {
        try {
          await uploadDocumentFile(newId, file, "Initial upload");
        } catch (_) {
          // toast already raised; bail before publishing/granting access
          return;
        }
      }

      // 3) Grant access entries based on the selected mode.
      const entries = (() => {
        if (access === "ROLE") {
          return accessRoles.map((role) => ({
            target_type: "ROLE",
            role,
            target_value: role,
          }));
        }
        if (access === "USER") {
          return accessUsers.map((u) => ({
            target_type: "USER",
            user_id: isNaN(Number(u.value)) ? u.value : Number(u.value),
            target_value: u.value,
          }));
        }
        if (access === "EMAIL") {
          return accessEmails.map((email) => ({
            target_type: "EMAIL",
            email,
            target_value: email,
          }));
        }
        return [{ target_type: "ALL" }];
      })();

      try {
        await memoApi.setAccess(newId, entries);
      } catch (_) { /* toast raised; continue so publish still tries */ }

      // 4) Publish if requested.
      if (publishNow) {
        try {
          await memoApi.publishDocument(newId);
        } catch (_) {
          // toast raised; doc still exists as draft
          notifyError("Memo created but could not be published");
          onCreated?.(doc);
          close();
          return;
        }
      }

      notifySuccess(publishNow ? "Memo published" : "Draft saved");
      onCreated?.({ ...doc, id: newId });
      close();
    } catch (_) {
      // memoApi.wrap already raised the toast.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Create new memo"
      centered
      size="lg"
    >
      <Stepper
        active={active}
        onStepClick={setActive}
        size="sm"
        iconSize={28}
        styles={{ steps: { marginBottom: rem(20) } }}
        allowNextStepsSelect={false}
      >
        <Stepper.Step
          label="Metadata"
          description="Title & details"
          icon={<FaInfoCircle size={12} />}
        >
          <TextInput
            label="Title"
            required
            placeholder="e.g. Q3 Operations Update"
            value={meta.title}
            error={errors.title}
            onChange={(e) => setMeta({ ...meta, title: e.currentTarget.value })}
          />
          <Textarea
            label="Description"
            mt="sm"
            autosize
            minRows={2}
            maxRows={5}
            placeholder="Optional summary"
            value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.currentTarget.value })}
          />
          <Select
            label="Category"
            mt="sm"
            placeholder={categories.length ? "Pick a category" : "No categories yet"}
            data={categories.map((c) => ({ value: c.name, label: c.name }))}
            value={meta.category || null}
            onChange={(v) => setMeta({ ...meta, category: v || "" })}
            clearable
          />
          <TagsInput
            label="Tags"
            mt="sm"
            placeholder="Press enter to add"
            value={meta.tags}
            onChange={(tags) => setMeta({ ...meta, tags })}
          />
        </Stepper.Step>

        <Stepper.Step
          label="Upload"
          description="File & version"
          icon={<FaCloudUploadAlt size={12} />}
        >
          <div
            onClick={() => document.getElementById("memo-file-input")?.click()}
            style={{
              border: "2px dashed var(--memo-border)",
              borderRadius: 12,
              padding: "2.5rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              background: "#fafbfe",
              transition: "all 0.2s",
            }}
          >
            <FaCloudUploadAlt size={32} style={{ color: "var(--memo-primary)" }} />
            <div className="mt-2 fw-semibold">
              {file ? file.name : "Click or drop a file here"}
            </div>
            <div className="text-muted small">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type || "unknown"}`
                : "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX · max 25 MB"}
            </div>
            <input
              id="memo-file-input"
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={onPickFile}
            />
          </div>
        </Stepper.Step>

        <Stepper.Step
          label="Access"
          description="Who can view"
          icon={<FaUserShield size={12} />}
        >
          <div className="d-grid gap-2">
            {[
              { value: "ALL", title: "Everyone", sub: "All admin and portal users with the link" },
              { value: "ROLE", title: "By user type", sub: "Admin / HR / KYC / Counter / Accounts" },
              { value: "USER", title: "Specific admin users", sub: "Pick one or more from the directory" },
              { value: "EMAIL", title: "Specific portal users", sub: "By @trasealla.com email address" },
            ].map((opt) => {
              const selected = access === opt.value;
              return (
                <div key={opt.value}>
                  <button
                    onClick={() => setAccess(opt.value)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.85rem 1rem",
                      border: `1px solid ${selected ? "var(--memo-primary)" : "var(--memo-border)"}`,
                      borderRadius: 12,
                      background: selected ? "var(--memo-primary-soft)" : "#fff",
                      color: "var(--memo-text)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div className="fw-semibold">{opt.title}</div>
                    <div className="text-muted small">{opt.sub}</div>
                  </button>

                  {selected && opt.value === "ROLE" && (
                    <div style={{ padding: "0.75rem 0.25rem 0.25rem" }}>
                      <MultiSelect
                        label="Pick user types"
                        placeholder="Choose roles that can view"
                        data={ROLE_OPTIONS}
                        value={accessRoles}
                        onChange={setAccessRoles}
                        searchable
                        clearable
                        nothingFoundMessage="No roles"
                      />
                    </div>
                  )}

                  {selected && opt.value === "USER" && (
                    <div style={{ padding: "0.75rem 0.25rem 0.25rem" }}>
                      <MultiSelect
                        label="Pick admin users"
                        placeholder="Type 2+ characters to search"
                        data={accessUserOptions}
                        value={accessUsers.map((u) => u.value)}
                        onChange={(values) => {
                          // Keep label info from accessUserOptions for selected ids.
                          const next = values.map((v) => {
                            const opt =
                              accessUserOptions.find((o) => o.value === v) ||
                              accessUsers.find((u) => u.value === v) ||
                              { value: v, label: v };
                            return { value: opt.value, label: opt.label };
                          });
                          setAccessUsers(next);
                        }}
                        searchable
                        searchValue={accessUserQuery}
                        onSearchChange={setAccessUserQuery}
                        clearable
                        nothingFoundMessage={
                          accessUserLoading
                            ? "Searching..."
                            : (accessUserQuery || "").trim().length < 2
                              ? "Type at least 2 characters"
                              : "No matching admin users"
                        }
                        rightSection={accessUserLoading ? <Loader size="xs" /> : null}
                      />
                    </div>
                  )}

                  {selected && opt.value === "EMAIL" && (
                    <div style={{ padding: "0.75rem 0.25rem 0.25rem" }}>
                      <TagsInput
                        label="Portal user emails"
                        placeholder="Type an email and press enter"
                        value={accessEmails}
                        onChange={setAccessEmails}
                        splitChars={[",", " ", ";"]}
                        clearable
                      />
                      {accessEmails.some((e) => !EMAIL_REGEX.test(e)) && (
                        <div className="text-danger small mt-1">
                          One or more entries are not valid email addresses.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Stepper.Step>

        <Stepper.Completed>
          <div
            className="p-3"
            style={{
              border: "1px solid var(--memo-border)",
              borderRadius: 12,
              background: "#fafbfe",
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaCheckCircle size={20} style={{ color: "var(--memo-success)" }} />
              <strong>Ready to publish</strong>
            </div>
            <dl className="row mb-0 small">
              <dt className="col-4 text-muted">Title</dt>
              <dd className="col-8">{meta.title}</dd>
              <dt className="col-4 text-muted">Category</dt>
              <dd className="col-8">{meta.category || "—"}</dd>
              <dt className="col-4 text-muted">Tags</dt>
              <dd className="col-8">{meta.tags.join(", ") || "—"}</dd>
              <dt className="col-4 text-muted">File</dt>
              <dd className="col-8">{file ? file.name : "—"}</dd>
              <dt className="col-4 text-muted">Access</dt>
              <dd className="col-8">
                {access === "ALL" && "Everyone"}
                {access === "ROLE" &&
                  `By user type — ${accessRoles
                    .map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label || r)
                    .join(", ") || "—"}`}
                {access === "USER" &&
                  `Specific admin users — ${accessUsers.map((u) => u.label).join(", ") || "—"}`}
                {access === "EMAIL" &&
                  `Specific portal users — ${accessEmails.join(", ") || "—"}`}
              </dd>
            </dl>
          </div>
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="lg">
        <Button variant="default" onClick={close} disabled={submitting}>
          Cancel
        </Button>
        <Group gap="xs">
          {active > 0 && (
            <Button variant="default" onClick={back} disabled={submitting}>
              Back
            </Button>
          )}
          {active < 3 ? (
            <Button color="indigo" onClick={next} disabled={submitting}>
              Next
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={() => submit(false)} loading={submitting}>
                Save as draft
              </Button>
              <Button color="indigo" onClick={() => submit(true)} loading={submitting}>
                Publish now
              </Button>
            </>
          )}
        </Group>
      </Group>
    </Modal>
  );
};

export default CreateMemoModal;
