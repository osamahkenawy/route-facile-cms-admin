import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import ViewDocumentPopup from "./ViewDocumentPopup";

const DocumentList = () => {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModalDoc, setShowModalDoc] = useState(false);
  const [viewDocLink, setViewDocLink] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isPDF, setIsPDF] = useState(false);
  const [email, setEmail] = useState("");
  const [documentListArray, setDocumentListArray] = useState([]);

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

  const getDocumentList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (email) params.append("user_email", email);
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_USER_DOCUMENT_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setDocumentListArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setDocumentListArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setDocumentListArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getDocumentList();
  }, [currentPage, pageSize]);

  function isPdfUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.toLowerCase().endsWith("pdf");
    } catch (error) {
      return false;
    }
  }

  const handleViewDocument = (link, name) => {
    setViewDocLink(link);
    setDocumentName(name);
    setShowModalDoc(true);
    const isPDF = isPdfUrl(link);
    setIsPDF(isPDF);
  };
  const handleSearchClick = () => {
    setCurrentPage(1);
    getDocumentList();
  };

  return (
    <Container>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        ></Col>
      </Row>
      <Row className="mt-2 mb-4">
        <div className="calender-field-width col-lg-12">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="text"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="calender-field-width">
          <div className="hidden-search-text">Search</div>
          <Button className="btn-def btn-icon" onClick={handleSearchClick}>
            Search
          </Button>
        </div>
      </Row>
      <Col>
        <div>
          <p>{calculatePaginationMessage()}</p>
        </div>
        <Table
          className="table table-responsive table-striped"
          style={{ whiteSpace: "nowrap" }}
        >
          <thead className="">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Username</th>
              <th>Documents3</th>
            </tr>
          </thead>

          <tbody className="table table-striped">
            {loading ? (
              <tr>
                <td className="text-center" colSpan={100}>
                  {" "}
                  <Spinner />
                </td>{" "}
              </tr>
            ) : (
              Array.isArray(documentListArray) &&
              documentListArray?.length > 0 &&
              documentListArray?.map((user, index) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.user_name}</td>
                  <td>
                    {user.documents
                      ? JSON.parse(user.documents)?.map((doc, index) => (
                          <div className="p-0" key={index}>
                            <span
                              className="view-doc-txt"
                              onClick={() =>
                                handleViewDocument(
                                  doc.front_image,
                                  doc.doc_type.replace(/_/g, " ")
                                )
                              }
                            >
                              <strong>{doc.doc_type.replace(/_/g, " ")}</strong>
                            </span>{" "}
                          </div>
                        ))
                      : "-"}
                  </td>
                </tr>
              ))
            )}
            {documentListArray?.length === 0 && !loading && (
              <tr className="text-center">
                <td colSpan={100}>No Data Found.</td>
              </tr>
            )}
          </tbody>
        </Table>
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
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </div>
      </Col>

      <ViewDocumentPopup
        show={showModalDoc}
        handleClose={() => setShowModalDoc(false)}
        link={viewDocLink}
        documentName={documentName}
        isPDF={isPDF}
      />
    </Container>
  );
};

export default DocumentList;
