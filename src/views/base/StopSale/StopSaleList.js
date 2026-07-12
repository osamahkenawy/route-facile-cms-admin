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
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { ImBin } from "react-icons/im";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import { LuClipboardPen } from "react-icons/lu";
import { formatDateTimeUAE } from "../CustomHooks/reusableFunctions";

const StopSaleList = () => {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stopSaleListArray, setStopSaleListArray] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCloseDel = () => setShowdel(false);

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

  const getStopSaleList = () => {
    setLoading(true);
    const body = JSON.stringify({});
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_STOP_SALE_LIST}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setStopSaleListArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setStopSaleListArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setStopSaleListArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getStopSaleList();
  }, [currentPage, pageSize]);

  const deleteStopSale = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_STOP_SALE(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            notifySuccess("Deleted Successfully");

            getStopSaleList();
            resolve(true);
          } else if (res?.error) {
            notifyError(res?.message[0]);
          }
        })
        .catch((error) => {
          console.error("api failed:", error);
          notifyError("Something went wrong. Please try again letter.");
          resolve(false);
        })
        .finally(() => {
          setDeleteLoading(false);
          handleCloseDel();
        });
    });
  };

  const handleDelete = () => {
    deleteStopSale(deleteID);
  };

  const handleEdit = (id) => {
    navigate(`/stop-sale/edit-stop-sale/${id}`);
  };

  const handleShowDel = (id) => {
    setDeleteID(id);
    setShowdel(true);
  };
  return (
    <Container>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/stop-sale/create-stop-sale">
            <Button className="btn-def">Add Stop Sale</Button>
          </Link>
        </Col>
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
              <th scope="col">#</th>
              <th scope="col">Start Date</th>
              <th scope="col">End Date</th>

              <th scope="col">Emirate</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Cars</th>

              <th scope="col" style={{ paddingRight: "30px" }}>
                Action
              </th>
              <th scope="col">Created By</th>
              <th scope="col">Created At</th>
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
              Array.isArray(stopSaleListArray) &&
              stopSaleListArray?.length > 0 &&
              stopSaleListArray?.map((item, index) => (
                <tr key={item.id}>
                  <td scope="row">{item.id}</td>
                  <td>{formatDateTimeUAE(item?.start_date)}</td>

                  <td>{formatDateTimeUAE(item?.end_date)}</td>

                  <td>{item?.emirate?.name_en}</td>
                  <td>{item?.location?.name_en}</td>
                  <td className="text-center-">
                    <div
                      className={`px-4 py-2 font-size-14px ${item.status ? "active_box" : "inactive_box"}`}
                    >
                      {item.status ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td>
                    {item?.car_ids.all ? "All" : item?.car_ids.ids.toString()}
                  </td>

                  <td>
                    <LuClipboardPen
                      onClick={() => handleEdit(item.id)}
                      className="me-4"
                      style={{
                        cursor: "pointer",
                        height: "1.5em",
                        width: "1.5em",
                        stroke: "orange",
                      }}
                    />
                    <ImBin
                      onClick={() => handleShowDel(item.id)}
                      style={{
                        cursor: "pointer",
                        height: "1.5em",
                        width: "1.5em",
                        fill: "#ff6b6b",
                      }}
                    />
                  </td>
                  <td>{item.created_by}</td>
                  <td>{formatDateTimeUAE(item.created_at)}</td>
                </tr>
              ))
            )}
            {stopSaleListArray?.length === 0 && !loading && (
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
          <Modal.Title>Delete Stop Sale !</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this stop sale ?
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn-def"
            onClick={handleDelete}
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

export default StopSaleList;
