import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
  InputGroup,
  Card,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { LuClipboardPen } from "react-icons/lu";
import { ImBin } from "react-icons/im";
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaPlus,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaListAlt,
  FaCalendarAlt,
  FaRegClock,
  FaInbox,
  FaTrashAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";
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
import "./PromoTicker.css";

const SPEED_MAP = { 45: "Very Slow", 30: "Slow", 20: "Medium", 12: "Fast", 7: "Very Fast" };
const getSpeedLabel = (v) => SPEED_MAP[v] || (v > 30 ? "Very Slow" : v > 20 ? "Slow" : v > 12 ? "Medium" : v > 7 ? "Fast" : "Very Fast");

const PromoTickerList = () => {
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]);
  const [showDel, setShowDel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const handleCloseDel = () => setShowDel(false);

  /* ---------- helpers ---------- */
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isLive = (row) =>
    row.status === 1 &&
    new Date(row.start_date) <= today &&
    new Date(row.end_date) >= today;

  const isScheduled = (row) =>
    row.status === 1 && new Date(row.start_date) > today;

  const isExpired = (row) =>
    row.status === 1 && new Date(row.end_date) < today;

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = allData.length;
    const active = allData.filter((r) => isLive(r)).length;
    const scheduled = allData.filter((r) => isScheduled(r)).length;
    const expired = allData.filter(
      (r) => r.status !== 1 || isExpired(r)
    ).length;
    return { total, active, scheduled, expired };
  }, [allData, today]);

  /* ---------- API ---------- */
  const getTickerList = () => {
    setLoading(true);
    const url = `${configWeb.GET_PROMO_TICKER_LIST}?page=1&page_size=1000`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setAllData(res?.data || []);
        } else {
          setAllData([]);
        }
      })
      .catch(() => {
        notifyError("Something went wrong, please try again later");
        setAllData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getTickerList();
  }, []);

  const deleteTicker = (id) => {
    setDeleteLoading(true);
    simpleDeleteCallAuth(configWeb.DELETE_PROMO_TICKER(id))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Promo ticker deleted");
          getTickerList();
        } else {
          notifyError(res?.message?.[0] || "Failed to delete");
        }
      })
      .catch(() => notifyError("Something went wrong. Please try again later."))
      .finally(() => {
        setDeleteLoading(false);
        handleCloseDel();
      });
  };

  const toggleStatus = async (row) => {
    const newStatus = row.status === 1 ? 0 : 1;
    try {
      const res = await simplePutCallAuth(
        configWeb.PUT_PROMO_TICKER_UPDATE(row.id),
        JSON.stringify({
          text_en: row.text_en,
          text_ae: row.text_ae,
          status: newStatus,
          start_date: row.start_date,
          end_date: row.end_date,
          sort_order: row.sort_order,
          scroll_speed: row.scroll_speed,
        })
      );
      if (res?.status === "success") {
        notifySuccess(
          `Ticker ${newStatus === 1 ? "activated" : "deactivated"}`
        );
        getTickerList();
      } else {
        notifyError(res?.message?.[0] || "Failed to update status");
      }
    } catch {
      notifyError("Something went wrong. Please try again later.");
    }
  };

  /* ---------- filters & sort ---------- */
  const filteredData = useMemo(() => {
    let list = [...allData];

    // status / active-only
    if (showActiveOnly) {
      list = list.filter((r) => r.status === 1);
    } else if (statusFilter === "1") {
      list = list.filter((r) => r.status === 1);
    } else if (statusFilter === "0") {
      list = list.filter((r) => r.status !== 1);
    }

    // search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          (r.text_en && r.text_en.toLowerCase().includes(q)) ||
          (r.text_ae && r.text_ae.includes(searchTerm)) ||
          (r.id && String(r.id).includes(searchTerm))
      );
    }

    // sort
    list.sort((a, b) => {
      const diff = (a.sort_order || 0) - (b.sort_order || 0);
      return sortOrder === "asc" ? diff : -diff;
    });

    return list;
  }, [allData, searchTerm, sortOrder, statusFilter, showActiveOnly]);

  // pagination
  const totalRecords = filteredData.length;
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIdx, startIdx + pageSize);

  useEffect(() => setCurrentPage(1), [searchTerm, sortOrder, statusFilter, showActiveOnly]);

  const clearFilters = () => {
    setStatusFilter("");
    setSortOrder("asc");
    setShowActiveOnly(false);
    setSearchTerm("");
  };

  const hasActiveFilters =
    statusFilter !== "" || showActiveOnly || sortOrder !== "asc" || searchTerm !== "";

  /* ---------- skeleton rows ---------- */
  const SkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="skeleton-row">
        <td><span className="skeleton w-25" /></td>
        <td><span className="skeleton w-75" /></td>
        <td className="text-center"><span className="skeleton pill mx-auto" /></td>
        <td><span className="skeleton w-50" /><span className="skeleton w-50 mt-1" /></td>
        <td className="text-center"><span className="skeleton circle mx-auto" /></td>
        <td className="text-center"><span className="skeleton pill mx-auto" /></td>
        <td className="text-center"><span className="skeleton w-50 mx-auto" /></td>
      </tr>
    ));

  /* ======================= RENDER ======================= */
  return (
    <Container fluid className="px-lg-4 pb-5">
      {/* -------- Page Header -------- */}
      <div className="promo-ticker-page-header d-flex flex-wrap align-items-center justify-content-between mt-3">
        <div>
          <h4>Promo Ticker</h4>
          <p>Manage the scrolling news bar displayed on the website</p>
        </div>
        <Link to="/cms/create-promo-ticker">
          <button className="btn-add-ticker">
            <FaPlus /> Add Ticker
          </button>
        </Link>
      </div>

      {/* -------- Stat Cards -------- */}
      <div className="promo-stat-cards">
        <div className="promo-stat-card">
          <div className="stat-icon total">
            <FaListAlt />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <span>Total Tickers</span>
          </div>
        </div>
        <div className="promo-stat-card">
          <div className="stat-icon active">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <span>Live Now</span>
          </div>
        </div>
        <div className="promo-stat-card">
          <div className="stat-icon scheduled">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <h3>{stats.scheduled}</h3>
            <span>Scheduled</span>
          </div>
        </div>
        <div className="promo-stat-card">
          <div className="stat-icon expired">
            <FaRegClock />
          </div>
          <div className="stat-info">
            <h3>{stats.expired}</h3>
            <span>Expired / Off</span>
          </div>
        </div>
      </div>

      {/* -------- Filters -------- */}
      <Card className="promo-ticker-filters">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span className="d-flex align-items-center fw-bold" style={{ fontSize: "0.9rem" }}>
            <FaFilter className="me-2 text-primary" />
            Filters
            {hasActiveFilters && (
              <span
                className="ms-2 badge rounded-pill"
                style={{ background: "#2d5f8a", fontSize: "0.7rem" }}
              >
                Active
              </span>
            )}
          </span>
          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              onClick={clearFilters}
              className="btn-clear-filters text-danger text-decoration-none"
            >
              Clear All
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end gx-3">
            <Col lg={3} md={6} className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={showActiveOnly}
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Form.Select>
            </Col>
            <Col lg={3} md={6} className="mb-2">
              <Form.Label>
                {sortOrder === "asc" ? (
                  <FaSortAmountUp className="me-1" />
                ) : (
                  <FaSortAmountDown className="me-1" />
                )}
                Sort Order
              </Form.Label>
              <Form.Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending (1, 2, 3…)</option>
                <option value="desc">Descending (…3, 2, 1)</option>
              </Form.Select>
            </Col>
            <Col lg={3} md={6} className="mb-2">
              <Form.Label>Quick Toggle</Form.Label>
              <div className="mt-1">
                <Form.Check
                  type="switch"
                  id="active-only-switch"
                  label={
                    <span className={`fw-semibold ${showActiveOnly ? "text-success" : ""}`}>
                      Show Active Only
                    </span>
                  }
                  checked={showActiveOnly}
                  onChange={(e) => {
                    setShowActiveOnly(e.target.checked);
                    if (e.target.checked) setStatusFilter("");
                  }}
                />
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-2">
              <Form.Label>Entries</Form.Label>
              <Form.Select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* -------- Search + Table -------- */}
      <div className="promo-ticker-table-wrapper">
        {/* Search */}
        <div className="p-3 promo-search-bar d-flex flex-wrap align-items-center justify-content-between gap-2">
          <InputGroup style={{ maxWidth: 360 }}>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search text or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <span className="showing-text">
            {totalRecords} ticker{totalRecords !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table className="promo-ticker-table mb-0">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "30%" }}>Text (EN)</th>
                <th style={{ width: "10%", textAlign: "center" }}>Status</th>
                <th style={{ width: "18%" }}>Date Range</th>
                <th style={{ width: "8%", textAlign: "center" }}>Order</th>
                <th style={{ width: "10%", textAlign: "center" }}>Speed</th>
                <th style={{ width: "12%", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="promo-empty-state">
                      <div className="empty-icon"><FaInbox /></div>
                      <h5>No tickers found</h5>
                      <p>
                        {searchTerm || hasActiveFilters
                          ? "Try adjusting your filters or search term."
                          : "Create your first promo ticker to get started."}
                      </p>
                      {!searchTerm && !hasActiveFilters && (
                        <Link to="/cms/create-promo-ticker">
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2"
                            style={{ borderRadius: 10 }}
                          >
                            <FaPlus className="me-1" /> Add Ticker
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const live = isLive(row);
                  return (
                    <tr
                      key={row.id}
                      className={live ? "row-live" : ""}
                    >
                      <td className="fw-semibold text-muted">{row.id}</td>

                      {/* Text */}
                      <td>
                        <div className="ticker-text-cell">
                          <div className="d-flex align-items-start gap-2">
                            {live && <span className="live-dot mt-1" title="Currently live on website" />}
                            <span className="ticker-text" title={row.text_en}>
                              {row.text_en || "—"}
                            </span>
                          </div>
                          {row.link && (
                            <span className="ticker-link">
                              <FaExternalLinkAlt size={10} /> {row.link}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span
                          className={`status-pill ${row.status === 1 ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(row)}
                          title="Click to toggle"
                        >
                          <span className="toggle-dot" />
                          {row.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Date Range */}
                      <td>
                        <div className="date-range-cell">
                          <div>
                            <span className="date-label">From </span>
                            <span className="date-value">{formatDate(row.start_date)}</span>
                          </div>
                          <div>
                            <span className="date-label">To </span>
                            <span className="date-value">{formatDate(row.end_date)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="text-center">
                        <span className="sort-order-badge">{row.sort_order ?? 0}</span>
                      </td>

                      {/* Speed */}
                      <td className="text-center">
                        <span className="speed-badge" title={`${row.scroll_speed || 20}s per cycle`}>
                          <FaTachometerAlt size={11} className="me-1" />
                          {getSpeedLabel(row.scroll_speed || 20)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="action-btn edit"
                            onClick={() => navigate(`/cms/edit-promo-ticker/${row.id}`)}
                            title="Edit ticker"
                          >
                            <LuClipboardPen />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => {
                              setDeleteID(row.id);
                              setShowDel(true);
                            }}
                            title="Delete ticker"
                          >
                            <ImBin />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalRecords > 0 && (
          <div className="promo-pagination-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="showing-text">
              Showing {startIdx + 1}–{Math.min(startIdx + pageSize, totalRecords)} of{" "}
              {totalRecords}
            </span>
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={(p) => setCurrentPage(p)}
              currentPage={currentPage}
            />
          </div>
        )}
      </div>

      {/* -------- Delete Modal -------- */}
      <Modal
        show={showDel}
        onHide={handleCloseDel}
        centered
        className="promo-delete-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem" }}>
            <FaExclamationTriangle className="me-2" />
            Delete Promo Ticker
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="delete-icon-wrapper"><FaTrashAlt /></div>
          <h6 className="fw-bold mb-2">Are you sure?</h6>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            This ticker will be removed and will no longer appear on the website.
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            className="btn-cancel"
            onClick={handleCloseDel}
          >
            Cancel
          </Button>
          <Button
            className="btn-confirm-delete"
            onClick={() => deleteID && deleteTicker(deleteID)}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PromoTickerList;







