import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { LuClipboardPen } from "react-icons/lu";
import { ImBin } from "react-icons/im";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";

const EdcTerms = () => {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [termsArray, setTermsArray] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [validated, setValidated] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  const [formData, setFormData] = useState({
    text_en: "",
    text_ar: "",
    is_active: true,
    sort_order: 0,
  });

  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleShowDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditMode(false);
    setEditId(null);
    setValidated(false);
    setFormData({
      text_en: "",
      text_ar: "",
      is_active: true,
      sort_order: 0,
    });
  };

  const handleShowFormModal = () => {
    setEditMode(false);
    setFormData({
      text_en: "",
      text_ar: "",
      is_active: true,
      sort_order: termsArray.length + 1,
    });
    setShowFormModal(true);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const calculatePaginationMessage = () => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  const getTermsList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_EDC_TERMS}?${params.toString()}`;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setTermsArray(res?.data || []);
          setTotalRecords(res?.total_records || res?.data?.length || 0);
        } else {
          setTermsArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching EDC terms:", error);
        notifyError("Something went wrong, please try again later");
        setTermsArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getTermsList();
  }, [currentPage, pageSize]);

  const handleDelete = () => {
    setDeleteLoading(true);
    const url = configWeb.DELETE_EDC_TERM(deleteId);

    simpleDeleteCallAuth(url)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Term deleted successfully");
          getTermsList();
        } else {
          notifyError(res?.message?.[0] || res?.message || "Failed to delete term");
        }
      })
      .catch((error) => {
        console.error("Delete failed:", error);
        notifyError("Something went wrong. Please try again.");
      })
      .finally(() => {
        setDeleteLoading(false);
        handleCloseDeleteModal();
      });
  };

  const handleEdit = (item) => {
    setEditMode(true);
    setEditId(item.id);
    setFormData({
      text_en: item.text_en || "",
      text_ar: item.text_ar || "",
      is_active: item.is_active ?? true,
      sort_order: item.sort_order || 0,
    });
    setShowFormModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setSaveLoading(true);
    const url = editMode
      ? configWeb.PUT_EDC_TERM(editId)
      : configWeb.POST_EDC_TERM;

    const body = JSON.stringify({
      text_en: formData.text_en,
      text_ar: formData.text_ar,
      is_active: formData.is_active === true || formData.is_active === "true" || formData.is_active === 1,
      sort_order: Number(formData.sort_order),
    });

    const apiCall = editMode ? simplePutCallAuth : simplePostCallAuth;

    apiCall(url, body)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(editMode ? "Term updated successfully" : "Term created successfully");
          handleCloseFormModal();
          getTermsList();
        } else {
          notifyError(res?.message?.[0] || res?.message || "Failed to save term");
        }
      })
      .catch((error) => {
        console.error("Save failed:", error);
        notifyError("Something went wrong. Please try again.");
      })
      .finally(() => {
        setSaveLoading(false);
      });
  };

  const handleReorder = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === termsArray.length - 1)
    ) {
      return;
    }

    const newArray = [...termsArray];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    // Swap items
    [newArray[index], newArray[swapIndex]] = [newArray[swapIndex], newArray[index]];

    // Update sort_order values
    const reorderedItems = newArray.map((item, idx) => ({
      id: item.id,
      sort_order: idx + 1,
    }));

    setReorderLoading(true);
    setTermsArray(newArray);

    const url = configWeb.PUT_EDC_TERMS_REORDER;
    const body = JSON.stringify({ items: reorderedItems });

    simplePutCallAuth(url, body)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Order updated successfully");
        } else {
          notifyError("Failed to update order");
          getTermsList(); // Revert on failure
        }
      })
      .catch((error) => {
        console.error("Reorder failed:", error);
        notifyError("Something went wrong. Please try again.");
        getTermsList(); // Revert on failure
      })
      .finally(() => {
        setReorderLoading(false);
      });
  };

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <h4 className="mb-0">EDC Terms & Conditions</h4>
          <small className="text-muted">
            Manage terms and conditions for EDC promotional offer
          </small>
        </Col>
        <Col lg="auto" className="d-flex align-items-center">
          <Button className="btn-def" onClick={handleShowFormModal}>
            + Add Term
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg="12">
          <div>
            <p>{calculatePaginationMessage()}</p>
          </div>
          <div className="table-responsive" style={{ width: "100%" }}>
          <Table className="table table-striped" style={{ width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "35%" }}>Term (English)</th>
                <th style={{ width: "35%" }}>Term (Arabic)</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "15%" }} className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center" colSpan={5}>
                    <Spinner />
                  </td>
                </tr>
              ) : (
                Array.isArray(termsArray) &&
                termsArray.length > 0 &&
                termsArray.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.sort_order || index + 1}</td>
                    <td>{item.text_en}</td>
                    <td dir="rtl">{item.text_ar}</td>
                    <td>
                      <div
                        className={item.is_active ? "active_box" : "inactive_box"}
                      >
                        {item.is_active ? "Active" : "Hidden"}
                      </div>
                    </td>
                    <td className="text-center">
                      <FaArrowUp
                        onClick={() => !reorderLoading && handleReorder(index, "up")}
                        className="me-2"
                        style={{
                          cursor: index === 0 || reorderLoading ? "not-allowed" : "pointer",
                          opacity: index === 0 ? 0.3 : 1,
                          height: "0.9em",
                          width: "0.9em",
                          color: "#6c757d",
                        }}
                      />
                      <FaArrowDown
                        onClick={() => !reorderLoading && handleReorder(index, "down")}
                        className="me-2"
                        style={{
                          cursor: index === termsArray.length - 1 || reorderLoading ? "not-allowed" : "pointer",
                          opacity: index === termsArray.length - 1 ? 0.3 : 1,
                          height: "0.9em",
                          width: "0.9em",
                          color: "#6c757d",
                        }}
                      />
                      <LuClipboardPen
                        onClick={() => handleEdit(item)}
                        className="me-2"
                        style={{
                          cursor: "pointer",
                          height: "1.1em",
                          width: "1.1em",
                          stroke: "orange",
                        }}
                      />
                      <ImBin
                        onClick={() => handleShowDeleteModal(item.id)}
                        style={{
                          cursor: "pointer",
                          height: "1.1em",
                          width: "1.1em",
                          fill: "#ff6b6b",
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
              {termsArray.length === 0 && !loading && (
                <tr className="text-center">
                  <td colSpan={5}>No Data Found.</td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
            <Col lg="2">
              <Form.Group className="mb-3">
                <Form.Select
                  aria-label="Default select example"
                  name="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </div>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Term</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this term?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <Spinner size="sm" /> : "Delete"}
          </Button>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Term Modal */}
      <Modal show={showFormModal} onHide={handleCloseFormModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Term" : "Add New Term"}</Modal.Title>
        </Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col xs={12} className="mb-3">
                <Form.Group controlId="text_en">
                  <Form.Label>Term (English)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="text_en"
                    value={formData.text_en}
                    onChange={handleChange}
                    placeholder="e.g., Valid EDC Student ID required"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter the term in English.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} className="mb-3">
                <Form.Group controlId="text_ar">
                  <Form.Label>Term (Arabic)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="text_ar"
                    value={formData.text_ar}
                    onChange={handleChange}
                    placeholder="مثال: مطلوب بطاقة طالب EDC صالحة"
                    dir="rtl"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="is_active">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="is_active"
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Hidden</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="sort_order">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleChange}
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseFormModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-def"
              disabled={saveLoading}
            >
              {saveLoading ? <Spinner size="sm" /> : editMode ? "Update Term" : "Save Term"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default EdcTerms;

