import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Card,
  Table,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { LuClipboardPen } from "react-icons/lu";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { FaSortAmountDown, FaSortAmountUp, FaFilter, FaInfoCircle, FaSearch } from "react-icons/fa";
import "./HomepageBanner.css";

const HomePageBannerList = () => {
  const imageFileServer = process.env.REACT_APP_FILE_SERVER;

  const [loading, setLoading] = useState(false);
  const [locationListArray, setLocationListArray] = useState([]);
  const [allData, setAllData] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleCloseDel = () => setShowdel(false);

  const getCouponList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", 1);
    params.append("page_size", 1000);

    const url = `${configWeb.GET_HOMEPAGE_BANNER_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          let data = res?.data || [];
          setAllData(data);
          
          // Apply client-side filtering
          if (showActiveOnly) {
            data = data.filter(item => item.status === 1);
          } else if (status !== "") {
            if (status === "1") {
              data = data.filter(item => item.status === 1);
            } else if (status === "0") {
              data = data.filter(item => item.status !== 1);
            }
          }
          
          // Sort data
          if (data.length > 0) {
            data.sort((a, b) => {
              if (sortOrder === "asc") {
                return a.order - b.order;
              } else {
                return b.order - a.order;
              }
            });
          }
          
          setLocationListArray(data);
        } else {
          setLocationListArray([]);
          setAllData([]);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setLocationListArray([]);
        setAllData([]);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getCouponList();
  }, [sortOrder, showActiveOnly, status]);

  const deleteLocation = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_HOMEPAGE_BANNER(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            notifySuccess("Deleted Successfully");

            getCouponList();
            resolve(true);
          } else if (res?.error) {
            notifyError(res?.message[0]);
          }
        })
        .catch((error) => {
          console.error("Banner failed:", error);
          notifyError("Something went wrong. Please try again letter.");
          resolve(false);
        })
        .finally(() => {
          setDeleteLoading(false);
          handleCloseDel();
        });
    });
  };

  const handleEdit = (row) => {
    navigate(`/cms/edit-home-banner/${row.id}`);
  };

  const handleDelete = (row) => {
    setDeleteID(row.id);
    setShowdel(true);
  };

  const confirmDelete = () => {
    if (deleteID) {
      deleteLocation(deleteID);
    }
  };

  const handleChange = (e) => {
    setStatus(e.target.value);
  };
  
  const clearFilters = () => {
    setStatus("");
    setSortOrder("asc");
    setShowActiveOnly(false);
  };
  
  const hasActiveFilters = status !== "" || showActiveOnly || sortOrder !== "asc";

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...locationListArray];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.alt_text && item.alt_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.link && item.link.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.id && String(item.id).includes(searchTerm))
      );
    }
    
    // Sort by order
    filtered.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
    });
    
    return filtered;
  }, [locationListArray, searchTerm, sortOrder]);

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, sortOrder, status, showActiveOnly]);
  return (
    <Container>
      <Row>
        <Col lg="8" className="mt-4">
        
        </Col>
        <Col
          lg="4"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/create-home-banner">
            <Button className="btn-def">Add Banner</Button>
          </Link>
        </Col>
      </Row>

      <Card className="mt-2 mb-4 shadow-sm homepage-banner-filters">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            Filters & Sorting
            {hasActiveFilters && (
              <span className="ms-2 badge bg-primary">Active</span>
            )}
          </h5>
          {hasActiveFilters && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={clearFilters}
              className="d-flex align-items-center"
            >
              <span className="text-danger">✕</span>
              <span className="ms-1">Clear Filters</span>
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col lg="3">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Status Filter</Form.Label>
                <Form.Select 
                  name="status" 
                  value={status} 
                  onChange={handleChange}
                  disabled={showActiveOnly}
                  className="shadow-sm"
                >
                  <option value="">All Banners</option>
                  <option value="1">Active Only</option>
                  <option value="0">Inactive Only</option>
                </Form.Select>
             
              </Form.Group>
            </Col>

            <Col lg="3">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  {sortOrder === "asc" ? 
                    <FaSortAmountUp className="me-2 text-primary" /> : 
                    <FaSortAmountDown className="me-2 text-primary" />
                  }
                  Sort by Order
                </Form.Label>
                <Form.Select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="shadow-sm"
                >
                  <option value="asc">
                    ↑ Ascending (1, 2, 3...)
                  </option>
                  <option value="desc">
                    ↓ Descending (3, 2, 1...)
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col lg="3">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Quick Filters</Form.Label>
                <div className="mt-2">
                  <Form.Check
                    type="switch"
                    id="active-only-switch"
                    label={
                      <span className="d-flex align-items-center fw-semibold">
                        <span className={showActiveOnly ? "text-success" : ""}>
                          Show Active Only  
                        </span>
                      </span>
                    }
                    checked={showActiveOnly}
                    onChange={(e) => {
                      setShowActiveOnly(e.target.checked);
                      if (e.target.checked) {
                        setStatus(""); // Clear status filter when using active only
                      }
                    }}
                    className="custom-switch"
                    style={{ fontSize: "1rem" }}
                  />
                </div>
              </Form.Group>
            </Col>

            {/* Auto-apply filters is enabled - uncomment below to use manual apply */}
            {/* <Col lg="3" className="d-flex align-items-end">
              <div className="mb-3 w-100">
                <Button 
                  className="btn-def w-100 shadow-sm" 
                  type="button" 
                  onClick={handleSearchList}
                  style={{ height: "40px" }}
                >
                  <FaFilter className="me-2" />
                  Apply Filters
                </Button>
              </div>
            </Col> */}
          </Row>
        </Card.Body>
      </Card>

      {hasActiveFilters && (
        <Row className="mb-3">
          <Col>
            <div className="alert alert-info py-2 d-flex align-items-center">
              <FaFilter className="me-2" />
              <strong>Active Filters:</strong>
              <span className="ms-2">
                {showActiveOnly && "Active Banners Only   • "}
                {status === "1" && !showActiveOnly && "Active Status   • "}
                {status === "0" && "Inactive Status (Status ≠ 1) • "}
                {sortOrder === "desc" && "Sorted by Order (Descending) • "}
                {sortOrder === "asc" && "Sorted by Order (Ascending)"}
              </span>
            </div>
          </Col>
        </Row>
      )}

      <Col className="w-100">
        {/* Search Bar */}
        <Row className="mb-3">
          <Col lg="4">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by Alt Text, URL, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col lg="2" className="d-flex align-items-center">
            <div className="d-flex align-items-center">
              <span className="me-2">Show</span>
              <Form.Select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                style={{ width: '80px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
              <span className="ms-2">entries</span>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive">
          <Table striped bordered hover className="w-100">
            <thead className="table-light">
              <tr>
                <th style={{ width: "10%" }}>#</th>
                <th style={{ width: "30%" }}>Image</th>
                <th style={{ width: "15%" }}>Alt Text</th>
                <th style={{ width: "10%" }}>URL</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "15%" }}>Order</th>
                <th style={{ width: "5%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    No Data Found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td className="text-center">
                      {row?.desktop ? (
                        <div className="car-listing-img-div text-center">
                          <img
                            className="car-listing-img"
                            src={`${imageFileServer}admin/banner/${row.desktop}`}
                            alt={row.alt_text || ""}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted small">No image</span>
                      )}
                    </td>
                    <td>{row.alt_text || ""}</td>
                    <td>
                      <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                        {row.link}
                      </a>
                    </td>
                    <td className="text-center">
                      <div className={`px-4 py-2 font-size-14px d-flex align-items-center justify-content-center ${row.status === 1 ? "active_box" : "inactive_box"}`}>
                        {row.status === 1 ? (
                          <>
                            <span className="me-1">✓</span> Active
                          </>
                        ) : (
                          <>
                            <span className="me-1">✗</span> Inactive
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${sortOrder === "asc" ? "bg-info" : "bg-warning"} fs-6`}
                        style={{
                          boxShadow: 'none',
                          textShadow: 'none',
                          filter: 'none',
                          WebkitTextStroke: '0',
                          border: 'none'
                        }}
                      >
                        {row.order}
                      </span>
                    </td>
                    <td className="text-center">
                      <LuClipboardPen
                        onClick={() => handleEdit(row)}
                        style={{
                          cursor: 'pointer',
                          height: '1.5em',
                          width: '1.5em',
                          stroke: 'orange',
                        }}
                        title="Edit"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && totalRecords > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} entries
            </div>
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
          </div>
        )}
      </Col>
      <Modal show={showdel} onHide={handleCloseDel}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Banner !</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this banner ?</Modal.Body>
        <Modal.Footer>
          <Button
            className="btn-def"
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <Spinner /> : "Delete"}
          </Button>
          <Button className="btn-def" onClick={handleCloseDel}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HomePageBannerList;


