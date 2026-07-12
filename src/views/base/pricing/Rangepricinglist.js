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
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";

import { Link } from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import { array } from "prop-types";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { formatDateTimeUAE } from "../CustomHooks/reusableFunctions";

const Rangepricinglist = () => {
  const [show, setShow] = useState(false);
  const [showdel, setShowdel] = useState(false);
  const [showdcat, setShowdcat] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleCloseDel = () => setShowdel(false);
  const handleShowDel = () => setShowdel(true);

  const handleCloseCat = () => setShowdcat(false);
  const handleShowCat = () => setShowdcat(true);

  const [loading, setLoading] = useState(false);

  const [emiratesArray, setEmiratesArray] = useState([]);
  const [carGroupArray, setCarGroupArray] = useState([]);
  const [carArray, setCarArray] = useState([]);
  const [priceListArray, setPriceListArray] = useState([]);
  const [year, setYear] = useState("");
  const [emirateID, setEmirateID] = useState("");
  const [carGroup, setCarGroup] = useState("");
  const [location, setLocation] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [locationArray, setLocationArray] = useState([]);
  const years = [
    { value: 2024, name: "2024" },
    { value: 2025, name: "2025" },
    { value: 2026, name: "2026" },
    { value: 2027, name: "2027" },
    { value: 2028, name: "2028" },
    { value: 2029, name: "2029" },
    { value: 2030, name: "2030" },
  ];

  const emiratesData = () => {
    const url = `${configWeb.GET_EMIRATES}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setEmiratesArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };

  const locationData = () => {
    const url = configWeb.GET_LOCATIONS;
    simpleGetCallAuth(url)
      .then((res) => {
        setLocationArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  const carGroupData = () => {
    const url = `${configWeb.GET_CAR_GROUPS}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setCarGroupArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  const carData = () => {
    const url = `${configWeb.GET_CAR}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setCarArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  useEffect(() => {
    emiratesData();
    carGroupData();
    locationData();
    // carData();
  }, []);
  const getPriceList = () => {
    // return new Promise((resolve, reject)=>{
    setLoading(true);
    const body = JSON.stringify({});
    const params = new URLSearchParams();
    // Add parameters only if they exist

    if (carGroup) params.append("group_id", carGroup);
    if (emirateID) params.append("emirate_id", emirateID);
    if (location) params.append("location_id", location);
    if (dateData.start_date) params.append("start_date", dateData.start_date);
    if (dateData.end_date) params.append("end_date", dateData.end_date);
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_RANGE_PRICE}?${params.toString()}`;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setPriceListArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setPriceListArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setPriceListArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
    // });
  };

  useEffect(() => {
    // const url =`${configWeb.GET_MONTHLY_PRICE}?page=${currentPage}&page_size=${pageSize}`
    getPriceList();
  }, [currentPage, pageSize]);

  const handleSearchList = () => {
    setCurrentPage(1);

    getPriceList();
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

  // Call this function whenever pageSize changes to update currentPage if necessary
  const handlePageSizeChange = (newPageSize) => {
    // Calculate the new current page based on existing records range
    // const newCurrentPage = Math.ceil(((currentPage - 1) * pageSize + 1) / newPageSize);
    setPageSize(newPageSize);
    // setCurrentPage(newCurrentPage);
  };

  const [dateData, setDateData] = useState({
    start_date: "",
    end_date: "",
  });
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const clearDate = (name) => {
    // const { name , value} = e.target;
    setDateData((prevData) => ({
      ...prevData,
      [name]: "",
    }));
  };

  return (
    <Container>
      <Row className="justify-content-between">
        <Row>
          <Col
            lg="12"
            className="mt-4 d-flex justify-content-end align-items-center"
          >
            <Link to="/pricing/upload-daily-pricing">
              <Button className="btn-def" onClick={handleShowCat}>
                Upload Price
              </Button>
            </Link>
          </Col>
        </Row>

        <Row className="mt-2 mb-4">
          <Col lg="2">
            <Form.Group className="mb-3">
              <Form.Label>Emirate</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="emirateID"
                value={emirateID}
                onChange={(e) => setEmirateID(e.target.value)}
              >
                <option value="">Select Emirate</option>
                {emiratesArray?.length > 0 &&
                  emiratesArray?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}{" "}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="2">
            <Form.Group className="mb-3">
              <Form.Label>Group</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="carGroup"
                value={carGroup}
                onChange={(e) => setCarGroup(e.target.value)}
              >
                <option value="">Select Group</option>
                {carGroupArray?.length > 0 &&
                  carGroupArray?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col lg="2">
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {locationArray?.length > 0 &&
                  locationArray?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="2">
            <Form.Group controlId="start_date" className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                id="start_date"
                value={dateData.start_date}
                onChange={handleDateChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
              {dateData.start_date && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("start_date")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
          </Col>

          <Col lg="2">
            <Form.Group controlId="end_date" className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                value={dateData.end_date}
                onChange={handleDateChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
              {dateData.end_date && (
                <Button
                  variant="outline-secondary mt-1 "
                  onClick={() => clearDate("end_date")}
                  size="sm"
                  style={{ marginLeft: "5px" }}
                >
                  Clear
                </Button>
              )}
            </Form.Group>
          </Col>

          <Col className="mt-lg-4 pt-lg-2 mb-3 ">
            <Button
              className="btn-def "
              type="button"
              onClick={handleSearchList}
            >
              Search
            </Button>
          </Col>
        </Row>

        <Col>
          <div>
            <p>{calculatePaginationMessage()}</p>
          </div>
          <Table className="table table-responsive">
            <thead>
              <tr>
                {/* <th scope="col">#</th> */}

                <th scope="col">Car Group</th>
                <th scope="col">Location</th>
                <th scope="col">Emirate</th>
                <th scope="col">Start Date</th>
                <th scope="col">End Date</th>
                <th scope="col">Start Day</th>
                <th scope="col">End Day</th>
                <th scope="col">Total Amount</th>
                <th scope="col">Created By</th>
                <th scope="col">Created At</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center" colSpan={100}>
                    {" "}
                    <Spinner />
                  </td>{" "}
                </tr>
              ) : (
                Array.isArray(priceListArray) &&
                priceListArray?.length > 0 &&
                priceListArray?.map((item, index) => (
                  <tr key={item.id}>
                    {/* <td scope="row">{item.id}</td> */}

                    <td>{item.car_group.name_en}</td>
                    <td>{item.location_id}</td>
                    <td>{item.emirate.name_en}</td>
                    <td>{item.start_date}</td>

                    <td>{item.end_date}</td>
                    <td>{item.from}</td>
                    <td>{item.to}</td>
                    <td>{item.rate}</td>
                    <td>{item?.created_by_admin?.first_name}</td>
                    <td>{formatDateTimeUAE(item?.created_at)}</td>
                  </tr>
                ))
              )}
              {priceListArray?.length === 0 && !loading && (
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
      </Row>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (English)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (Arabic)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select>
              <option>Active</option>
              <option>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showdel} onHide={handleCloseDel}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this entry ?</Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleClose}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showdcat} onHide={handleCloseCat}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (English)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (Arabic)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select>
              <option>Active</option>
              <option>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleCloseCat}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Rangepricinglist;
