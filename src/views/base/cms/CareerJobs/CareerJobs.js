import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { LuClipboardPen } from "react-icons/lu";
import { ImBin } from "react-icons/im";
import {
  FaSearch,
  FaPlus,
  FaBriefcase,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import "./career.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const CareerJobs = () => {
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toggleLoading, setToggleLoading] = useState(null);
  const handleCloseDel = () => setShowdel(false);

  const getJobList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", 1);
    params.append("page_size", 1000);

    const url = `${configWeb.GET_CAREER_JOB_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setJobList(res?.data || []);
        } else {
          setJobList([]);
        }
      })
      .catch(() => {
        notifyError("Something went wrong, please try again later");
        setJobList([]);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getJobList();
  }, [status]);

  const deleteJob = (id) => {
    setDeleteLoading(true);
    const url = configWeb.DELETE_CAREER_JOB(id);
    simpleDeleteCallAuth(url)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Deleted Successfully");
          getJobList();
        } else if (res?.error) {
          notifyError(res?.message?.[0] || "Delete failed");
        }
      })
      .catch(() => {
        notifyError("Something went wrong. Please try again later.");
      })
      .finally(() => {
        setDeleteLoading(false);
        handleCloseDel();
      });
  };

  const handleToggleStatus = (row) => {
    setToggleLoading(row.id);
    const newStatus = row.status ? 0 : 1;
    const url = configWeb.PUT_CAREER_JOB_UPDATE(row.id);
    simplePutCallAuth(url, JSON.stringify({ status: newStatus }))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Status updated");
          getJobList();
        } else {
          notifyError(res?.message?.[0] || "Status update failed");
        }
      })
      .catch(() => {
        notifyError("Something went wrong. Please try again later.");
      })
      .finally(() => {
        setToggleLoading(null);
      });
  };

  const handleEdit = (row) => navigate(`/career/edit-job/${row.id}`);
  const handleDelete = (row) => { setDeleteID(row.id); setShowdel(true); };
  const confirmDelete = () => { if (deleteID) deleteJob(deleteID); };

  const filteredData = useMemo(() => {
    let filtered = [...jobList];
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          (item.title_en?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.location_en?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.id && String(item.id).includes(searchTerm))
      );
    }
    return filtered;
  }, [jobList, searchTerm]);

  const totalRecords = filteredData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const activeCount = jobList.filter((j) => j.status).length;
  const inactiveCount = jobList.filter((j) => !j.status).length;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, status]);

  return (
    <div className="career-module">
      {/* Header */}
      <motion.div
        className="career-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="career-header-icon me-3">
                <FaBriefcase />
              </div>
              <div>
                <h4 className="career-header-title">Career Jobs</h4>
                <p className="career-header-subtitle">
                  Manage job listings, toggle availability, and track openings
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <Link to="/career/create-job">
              <motion.button
                className="career-btn-primary"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaPlus size={13} /> Add New Job
              </motion.button>
            </Link>
          </Col>
        </Row>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <Row className="mb-4 px-2">
          {[
            { label: "Total Jobs", value: jobList.length, icon: <FaBriefcase />, color: "blue" },
            { label: "Active", value: activeCount, icon: <FaCheckCircle />, color: "green" },
            { label: "Inactive", value: inactiveCount, icon: <FaTimesCircle />, color: "red" },
          ].map((stat, i) => (
            <Col md={4} key={stat.label} className="mb-3">
              <motion.div variants={fadeUp} custom={i}>
                <div className={`career-stat-card ${stat.color}`}>
                  <div className={`stat-icon-wrap ${stat.color}`}>{stat.icon}</div>
                  <div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        className="career-filter-bar mx-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Row className="align-items-end g-3">
          <Col lg={3}>
            <Form.Label className="small fw-semibold text-secondary mb-1">Status Filter</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Form.Select>
          </Col>
          <Col lg={4}>
            <Form.Label className="small fw-semibold text-secondary mb-1">Quick Search</Form.Label>
            <InputGroup>
              <InputGroup.Text className="career-search-icon">
                <FaSearch size={13} />
              </InputGroup.Text>
              <Form.Control
                className="career-search-input"
                type="text"
                placeholder="Search title, location, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col lg="auto" className="ms-auto">
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-medium">Show</span>
              <Form.Select
                className="career-entries-select"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Job List */}
      <motion.div
        className="mx-2 mt-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
      >
        <div className="career-table-card">
          {loading ? (
            <div className="career-loading">
              <Spinner animation="border" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="career-empty-state">
              <div className="empty-icon"><FaBriefcase /></div>
              <p>No jobs found. Create your first job listing!</p>
            </div>
          ) : (
            <>
              <div className="career-list-header">
                <span className="career-list-col career-list-col-id">#</span>
                <span className="career-list-col career-list-col-title">Job Title</span>
                <span className="career-list-col career-list-col-location">Location</span>
                <span className="career-list-col career-list-col-exp">Experience</span>
                <span className="career-list-col career-list-col-expiry">Expiry Date</span>
                <span className="career-list-col career-list-col-status">Status</span>
                <span className="career-list-col career-list-col-actions">Actions</span>
              </div>

              <AnimatePresence>
                {paginatedData.map((row, idx) => (
                  <motion.div
                    className="career-list-row"
                    key={row.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    layout
                  >
                    <span className="career-list-col career-list-col-id">
                      <span className="career-row-id">{row.id}</span>
                    </span>

                    <span className="career-list-col career-list-col-title">
                      <div className="career-row-title-wrap">
                        <div className="career-row-title-icon">
                          <FaBriefcase />
                        </div>
                        <div>
                          <div className="career-row-title">{row.title_en || "—"}</div>
                          {row.title_ae && (
                            <div className="career-row-title-ar" dir="rtl">{row.title_ae}</div>
                          )}
                        </div>
                      </div>
                    </span>

                    <span className="career-list-col career-list-col-location">
                      <div className="career-row-meta">
                        <FaMapMarkerAlt className="career-row-meta-icon" />
                        {row.location_en || "—"}
                      </div>
                    </span>

                    <span className="career-list-col career-list-col-exp">
                      <div className="career-row-meta">
                        <FaClock className="career-row-meta-icon" />
                        {row.experience_years != null ? `${row.experience_years} yrs` : "—"}
                      </div>
                    </span>

                    <span className="career-list-col career-list-col-expiry">
                      <div className="career-row-meta">
                        <FaCalendarAlt className="career-row-meta-icon" />
                        {row.expiry_date || "—"}
                      </div>
                    </span>

                    <span className="career-list-col career-list-col-status">
                      <div className="career-toggle d-inline-flex align-items-center gap-2">
                        <Form.Check
                          type="switch"
                          id={`status-switch-${row.id}`}
                          checked={!!row.status}
                          onChange={() => handleToggleStatus(row)}
                          disabled={toggleLoading === row.id}
                        />
                        <span className={`career-badge ${row.status ? "active" : "inactive"}`}>
                          <span className="badge-dot" />
                          {row.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </span>

                    <span className="career-list-col career-list-col-actions">
                      <div className="d-flex gap-2">
                        <motion.button
                          className="career-action-btn edit"
                          onClick={() => handleEdit(row)}
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.92 }}
                          title="Edit"
                        >
                          <LuClipboardPen />
                        </motion.button>
                        <motion.button
                          className="career-action-btn delete"
                          onClick={() => handleDelete(row)}
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.92 }}
                          title="Delete"
                        >
                          <ImBin />
                        </motion.button>
                      </div>
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {totalRecords > 0 && (
                <div className="career-pagination-wrap">
                  <span className="career-pagination-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} jobs
                  </span>
                  <CustomPagination
                    recordsPerPage={pageSize}
                    totalRecords={totalRecords}
                    onPageChange={(p) => setCurrentPage(p)}
                    currentPage={currentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Delete Modal */}
      <Modal show={showdel} onHide={handleCloseDel} centered className="career-delete-modal">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaExclamationTriangle className="text-danger" /> Delete Job
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this job listing? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button className="career-btn-secondary" onClick={handleCloseDel}>
            Cancel
          </Button>
          <Button className="career-btn-danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <Spinner size="sm" /> : "Delete Job"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CareerJobs;
