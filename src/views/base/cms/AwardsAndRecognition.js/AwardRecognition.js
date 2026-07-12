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
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { LuClipboardPen } from "react-icons/lu";
import { FaSearch } from "react-icons/fa";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";

const AwardsAndRecognition = () => {
  const imageFileServer = process.env.REACT_APP_FILE_SERVER;

  const [loading, setLoading] = useState(false);
  const [locationListArray, setLocationListArray] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const handleCloseDel = () => setShowdel(false);

  const getCouponList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    params.append("page", 1);
    params.append("page_size", 1000);

    const url = `${configWeb.GET_AWARDS_AND_CERTIFICATE_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setLocationListArray(res?.data || []);
        } else {
          setLocationListArray([]);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setLocationListArray([]);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getCouponList();
  }, [status, type]);

  const deleteLocation = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_AWARDS_AND_CERTIFICATE(id);
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
    navigate(`/cms/edit-awards-and-recognition/${row.id}`);
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
    const { name } = e.target;
    if (name === "status") {
      setStatus(e.target.value);
    } else {
      setType(e.target.value);
    }
  };
  const handleSearchList = () => {
    getCouponList();
  };

  // Filtered data
  const filteredData = useMemo(() => {
    let filtered = [...locationListArray];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.title_en && item.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.link && item.link.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.id && String(item.id).includes(searchTerm))
      );
    }
    
    return filtered;
  }, [locationListArray, searchTerm]);

  // Pagination
  const totalRecords = filteredData.length;
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
    setCurrentPage(1);
  }, [searchTerm, status, type]);
  return (
    <Container>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/create-awards-and-recognition">
            <Button className="btn-def">Add Award And Recognition</Button>
          </Link>
        </Col>
      </Row>

      <Row className="mt-2 mb-4">
        <Col lg="3">
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={status} onChange={handleChange}>
              <option value="">Select</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="3">
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select name="type" value={type} onChange={handleChange}>
              <option value="">Select</option>
              <option value="award">Award</option>
              <option value="certificate">Certificate</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col className="mt-auto mb-3">
          <Button className="btn-def " type="button" onClick={handleSearchList}>
            Search
          </Button>
        </Col>
      </Row>

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
                placeholder="Search by Title, Type, Link, or ID..."
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
                <th>#</th>
                <th>Image</th>
                <th>Title</th>
                <th>Type</th>
                <th>Link</th>
                <th>Status</th>
                <th>Action</th>
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
                            src={`${imageFileServer}admin/awards_and_certificates/${row.desktop}`}
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
                    <td>{row.title_en || ""}</td>
                    <td>{row.type || ""}</td>
                    <td>
                      {row.link ? (
                        <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {row.link}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-center">
                      <div className={`px-4 py-2 font-size-14px text-center ${row.status ? "active_box" : "inactive_box"}`}>
                        {row.status ? "Active" : "Inactive"}
                      </div>
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
          <Modal.Title>Delete Award/Certificate !</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this entry ?</Modal.Body>
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

export default AwardsAndRecognition;
