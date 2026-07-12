import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Modal, Row, Spinner, Table} from "react-bootstrap";
import { Link } from "react-router-dom";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { simpleGetCallAuth} from "../../../../components/config.js/Setup";
import { notifyError } from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";

const TeachersRental = () => {

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teachersRateArray, setTeachersRateArray] = useState([]);
  const [showdel, setShowdel] = useState(false);

  const handleCloseDel = () => setShowdel(false);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate the pagination message based on the current values
  const calculatePaginationMessage = () => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  const getTeachersRate = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.TEACHERS_RATE}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setTeachersRateArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setTeachersRateArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setTeachersRateArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getTeachersRate();
  }, [currentPage, pageSize]);


  return (
    <Container>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/teachers-rental-upload">
            <Button className="btn-def">Add Rates</Button>
          </Link>
        </Col>
      </Row>
      <Col>
        <div>
          <p>{calculatePaginationMessage()}</p>
        </div>
        <Table
          className="table table-responsive table-striped"
        >
          <thead className="">
            <tr>
              <th width="10%" scope="col">
                Car ID
              </th>
              <th width="30%" scope="col">
                Car Name
              </th>
              <th width="15%" scope="col">
                Rate
              </th>
            </tr>
          </thead>

          <tbody className="">
            {loading ? (
              <tr>
                <td className="text-center" colSpan={100}>
                  {" "}
                  <Spinner />
                </td>{" "}
              </tr>
            ) : (
              Array.isArray(teachersRateArray) &&
              teachersRateArray?.length > 0 &&
              teachersRateArray?.map((item, index) => (
                <tr key={item.id}>
                  <td scope="row">{item.car_id}</td>
                  <td className="">
                    {item.car.name_en}
                  </td>
                  <td>{item.rate}</td>
                </tr>
              ))
            )}
            {teachersRateArray?.length === 0 && !loading && (
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
      <Modal show={showdel} onHide={handleCloseDel}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Banner !</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this banner ?</Modal.Body>
      </Modal>
    </Container>
  );
};

export default TeachersRental;
