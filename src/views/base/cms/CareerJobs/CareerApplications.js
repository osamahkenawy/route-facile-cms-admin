import React, { useEffect, useState, useMemo } from "react";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import {
  FaSearch,
  FaEye,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
} from "react-icons/fa";
import { simpleGetCallAuth } from "../../../../components/config.js/Setup";
import { notifyError } from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import "./career.css";

const STATUS_MAP = {
  0: { label: "Pending", css: "pending" },
  1: { label: "Reviewing", css: "reviewing" },
  2: { label: "Shortlisted", css: "shortlisted" },
  3: { label: "Interviewed", css: "interviewed" },
  4: { label: "Rejected", css: "rejected" },
  5: { label: "Hired", css: "hired" },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Reviewing" },
  { value: "2", label: "Shortlisted" },
  { value: "3", label: "Interviewed" },
  { value: "4", label: "Rejected" },
  { value: "5", label: "Hired" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const CareerApplications = () => {
  const [loading, setLoading] = useState(false);
  const [applicationList, setApplicationList] = useState([]);
  const [jobList, setJobList] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterJob, setFilterJob] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const getApplicationList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.append("status", filterStatus);
    if (filterJob) params.append("job_id", filterJob);
    params.append("page", 1);
    params.append("page_size", 1000);

    const url = `${configWeb.GET_CAREER_APPLICATION_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setApplicationList(res?.data || []);
        } else {
          setApplicationList([]);
        }
      })
      .catch(() => {
        notifyError("Something went wrong, please try again later");
        setApplicationList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getJobDropdown = () => {
    const url = `${configWeb.GET_CAREER_JOB_LIST}?page_size=9999`;
    simpleGetCallAuth(url)
      .then((res) => {
        setJobList(res?.data || []);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  useEffect(() => {
    getJobDropdown();
  }, []);

  useEffect(() => {
    getApplicationList();
  }, [filterStatus, filterJob]);

  const filteredData = useMemo(() => {
    let filtered = [...applicationList];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.first_name && item.first_name.toLowerCase().includes(term)) ||
          (item.last_name && item.last_name.toLowerCase().includes(term)) ||
          (item.email && item.email.toLowerCase().includes(term)) ||
          (item.phone_number && item.phone_number.toLowerCase().includes(term)) ||
          (item.id && String(item.id).includes(searchTerm))
      );
    }
    return filtered;
  }, [applicationList, searchTerm]);

  const stats = useMemo(() => {
    const total = applicationList.length;
    const pending = applicationList.filter((a) => a.status === 0).length;
    const hired = applicationList.filter((a) => a.status === 5).length;
    const rejected = applicationList.filter((a) => a.status === 4).length;
    return { total, pending, hired, rejected };
  }, [applicationList]);

  const totalRecords = filteredData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterJob]);

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
                <FaUsers />
              </div>
              <div>
                <h4 className="career-header-title">Career Applications</h4>
                <p className="career-header-subtitle">
                  Review and manage all incoming job applications
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Stat Cards */}
      <Row className="mb-4 px-2">
        {[
          { label: "Total", value: stats.total, icon: <FaUsers />, color: "blue" },
          { label: "Pending", value: stats.pending, icon: <FaClock />, color: "amber" },
          { label: "Hired", value: stats.hired, icon: <FaCheckCircle />, color: "green" },
          { label: "Rejected", value: stats.rejected, icon: <FaTimesCircle />, color: "red" },
        ].map((stat, i) => (
          <Col xs={6} lg={3} key={stat.label} className="mb-3">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={i}>
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

      {/* Filter Bar */}
      <motion.div
        className="career-filter-bar mx-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Row className="align-items-end g-3">
          <Col lg={3} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Filter by Job
            </label>
            <Form.Select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              style={{ borderRadius: "10px" }}
            >
              <option value="">All Jobs</option>
              {jobList.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title_en}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={3} md={6}>
            <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "#64748b" }}>
              <FaFilter size={10} className="me-1" /> Filter by Status
            </label>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ borderRadius: "10px" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={4} md={8}>
            <div style={{ position: "relative" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  zIndex: 2,
                }}
              />
              <Form.Control
                type="text"
                placeholder="Search by name, email, phone or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "40px", borderRadius: "10px" }}
              />
            </div>
          </Col>
          <Col lg={2} md={4}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}>Show</span>
              <Form.Select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                style={{ width: "80px", borderRadius: "10px" }}
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

      {/* Table */}
      <motion.div
        className="career-table-card mx-2 mt-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
      >
        <div className="table-responsive">
          <table className="career-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Job Title</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="career-loading">
                        <Spinner animation="border" />
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="career-empty-state">
                        <FaUsers size={40} />
                        <p>No applications found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      variants={fadeUp}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20 }}
                      layout
                    >
                      <td>
                        <span style={{ fontWeight: 600, color: "#475569" }}>{row.id}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{`${row.first_name || ""} ${row.last_name || ""}`.trim() || "—"}</span>
                      </td>
                      <td style={{ color: "#64748b" }}>{row.email || "—"}</td>
                      <td style={{ color: "#64748b" }}>{row.phone_number ? `+${row.phone_code || ""} ${row.phone_number}` : "—"}</td>
                      <td>{row.career_job?.title_en || "—"}</td>
                      <td style={{ color: "#64748b" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                      <td>
                        <span className={`career-badge ${STATUS_MAP[row.status]?.css || "pending"}`}>
                          {STATUS_MAP[row.status]?.label || "N/A"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <motion.button
                          className="career-action-btn view"
                          onClick={() => navigate(`/career/application/${row.id}`)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          title="View Details"
                        >
                          <FaEye />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>

        {!loading && totalRecords > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 px-2 pb-2">
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing {startIndex + 1} – {Math.min(startIndex + pageSize, totalRecords)} of{" "}
              {totalRecords} entries
            </span>
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CareerApplications;
