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
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { LuClipboardPen } from "react-icons/lu";
import { ImBin } from "react-icons/im";
import { formatDateTimeUAE } from "../../CustomHooks/reusableFunctions";

const MonthlyCouponCodeList = () => {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [couponListArray, setCouponListArray] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCloseDel = () => setShowdel(false);
  const handleShowDel = (id) => {
    setDeleteID(id);
    setShowdel(true);
  };
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Call this function whenever pageSize changes to update currentPage if necessary
  const handlePageSizeChange = (newPageSize) => {
    // Calculate the new current page based on existing records range
    // const newCurrentPage = Math.ceil(((currentPage - 1) * pageSize + 1) / newPageSize);
    setPageSize(newPageSize);
    // setCurrentPage(newCurrentPage);
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

  function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const getCouponList = () => {
    // return new Promise((resolve, reject)=>{
    setLoading(true);
    const body = JSON.stringify({});
    const params = new URLSearchParams();
    // // Add parameters only if they exist
    // if (carName) params.append("car_id", carName);
    // if (year) params.append("year", year);
    // if (carGroup) params.append("group_id", carGroup);
    // if (cityID) params.append("city_id", cityID);
    params.append("type", "monthly");
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_MONTHLY_DISCOUNT_COUPON_LIST}?${params.toString()}`;
    // const url = configWeb.GET_DISCOUNT_COUPON;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setCouponListArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setCouponListArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setCouponListArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
    // });
  };

  useEffect(() => {
    // const url =`${configWeb.GET_MONTHLY_PRICE}?page=${currentPage}&page_size=${pageSize}`
    getCouponList();
  }, [currentPage, pageSize]);

  const deleteDiscountCoupon = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_DISCOUNT_COUPON(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            // setUserDetails(res);
            notifySuccess("Deleted Successfully");
            // set_driver_id(null);
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
        });
    });
  };

  const handleDelete = () => {
    deleteDiscountCoupon(deleteID);
  };

  const handleEdit = (id) => {
    navigate(`/dynamicpricing/edit-monthly-coupon-code/${id}`);
  };
  return (
    <Container>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/dynamicpricing/create-monthly-coupon-code">
            <Button className="btn-def">Add Coupon</Button>
          </Link>
        </Col>
      </Row>

      <Col>
        <div>
          <p>{calculatePaginationMessage()}</p>
        </div>
        <Table className="table table-responsive">
          <thead className="text-center">
            <tr>
              {/* <th scope="col">#</th> */}
              <th scope="col">Code</th>
              <th scope="col" colSpan={3}>
                From Date
              </th>
              <th scope="col">To Date</th>
              {/* <th scope="col">Type</th> */}
              <th scope="col">Status</th>
              <th scope="col">CDW</th>
              <th scope="col">SCDW</th>
              <th scope="col">PAI</th>
              <th scope="col">GPS</th>
              <th scope="col">Baby Seat</th>
              <th scope="col">Driver</th>
              <th scope="col">Rate</th>
              <th scope="col">Created By</th>
              <th scope="col">Created At</th>
              <th scope="col" style={{ paddingRight: "30px" }}>
                Action
              </th>
              {/* <th scope="col">Cars</th>
              <th scope="col">Cities</th>
              <th scope="col">Groups</th>
              <th scope="col">Locatios</th> */}
            </tr>
          </thead>

          <tbody className="text-center">
            {loading ? (
              <tr>
                <td className="text-center" colSpan={100}>
                  {" "}
                  <Spinner />
                </td>{" "}
              </tr>
            ) : (
              Array.isArray(couponListArray) &&
              couponListArray?.length > 0 &&
              couponListArray?.map((item, index) => (
                <tr key={item.id}>
                  {/* <td scope="row">{item.id}</td> */}
                  <td> {item.code}</td>
                  <td colSpan={3}>{item.start_date}</td>
                  <td>{item.end_date}</td>
                  {/* <td>{item.discount_type}</td> */}
                  <td>
                    <div
                      className={item.status ? "active_box" : "inactive_box"}
                    >
                      {item.status ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td>{item.cdw}</td>
                  <td>{item.scdw}</td>
                  <td>{item.pai}</td>
                  <td>{item.gps}</td>
                  <td>{item.baby_seat}</td>
                  <td>{item.driver}</td>
                  <td>{item.rate}</td>
                  <td>{item.created_by}</td>
                  <td>{formatDateTimeUAE(item?.created_at)}</td>
                  {/* <td>
           {item.car_ids.all ? "All" : item.car_ids.ids.join(", ")}
              </td>
              <td>
           {item.city_ids.all ? "All" : item.city_ids.ids.join(", ")}
              </td>
              <td>
           {item.group_ids.all ? "All" : item.group_ids.ids.join(", ")}
              </td>
              <td>
           {item.location_ids.all ? "All" : item.location_ids.ids.join(", ")}
              </td> */}
                  <td>
                    <LuClipboardPen
                      onClick={() => handleEdit(item.id)}
                      className="me-2"
                      style={{
                        cursor: "pointer",
                        height: "1.1em",
                        width: "1.1em",
                        stroke: "orange",
                      }}
                    />
                    <ImBin
                      onClick={() => handleShowDel(item.id)}
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
            {couponListArray?.length === 0 && !loading && (
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
          <Modal.Title>Delete Coupon !</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this entry ?</Modal.Body>
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

export default MonthlyCouponCodeList;
