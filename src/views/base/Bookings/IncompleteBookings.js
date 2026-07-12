import React, { useEffect, useState } from "react";

import {
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
  Card,
  InputGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { simpleGetCallAuth } from "../../../components/config.js/Setup"
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import TooltipCell from "../../../components/CarExtrasCell";
import ToolTipCellForPayfort from "../../../components/ToolTipCellForPayfort";
import TurncateWithToolTip from "../CustomHooks/TurncateWithToolTip/TurncateWithToolTip";
import { stringToArray } from "../CustomHooks/reusableFunctions";
import { FaGlobe, FaMobileAlt, FaSearch, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import "./Bookings.css";


const IncompleteBookings = () => {

  const [loading, setLoading] = useState(true);

  const [incompleteBookings, setIncompleteBookings] = useState([]);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [paramsData, setParamsData] = useState({
    from: "",
    to: "",
    user_email: "",
  })

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParamsData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const clearDate = (name) => {
    setParamsData((prevData) => ({
      ...prevData,
      [name]: ""
    }))
  }

  const loadIncompleteBookings = () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (paramsData.from) params.append("from", paramsData.from);
    if (paramsData.to) params.append("to", paramsData.to);
    if (paramsData.user_email) params.append("user_email", paramsData.user_email);

    params.append("page", currentPage)
    params.append("page_size", pageSize)

    const url = `${configWeb.GET_INCOMPLETE_BOOKING}?${params.toString()}`;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setIncompleteBookings(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setIncompleteBookings([]);
          setTotalRecords(0);
        }

      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setIncompleteBookings([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadIncompleteBookings();
  }, [currentPage, pageSize,])

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
    setPageSize(newPageSize);
  };

  function formatDateTime(dateTimeString) {
    // Parse the input date string
    const date = new Date(dateTimeString);

    // Format the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    // Format the time
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Combine into the desired format
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }


  const handleSearchClick = () => {
    setCurrentPage(1);
    loadIncompleteBookings();
  }

  // Source icon renderer
  const renderSourceIcon = (source) => {
    if (!source) return "-";
    const lowerSource = source.toLowerCase();
    if (lowerSource === "web") {
      return (
        <span className="d-flex align-items-center gap-2">
          <FaGlobe style={{ color: "#3b82f6", fontSize: "1.1em" }} />
          <span>web</span>
        </span>
      );
    } else if (lowerSource === "mobile") {
      return (
        <span className="d-flex align-items-center gap-2">
          <FaMobileAlt style={{ color: "#10b981", fontSize: "1.1em" }} />
          <span>mobile</span>
        </span>
      );
    }
    return source;
  };

  // Truncate text with tooltip
  const TruncateWithTooltip = ({ text, maxLength = 15 }) => {
    if (!text) return "-";
    const truncated = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    
    if (text.length <= maxLength) {
      return <span>{text}</span>;
    }
    
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-${text}`}>{text}</Tooltip>}
      >
        <span style={{ cursor: "pointer", borderBottom: "1px dotted #666" }}>
          {truncated}
        </span>
      </OverlayTrigger>
    );
  };

  return (
    <Container fluid className="px-4">
      {/* Filter Card */}
      <Card className="mt-3 mb-4 shadow-sm border-0">
        <Card.Header className="bg-primary text-white py-3">
          <h5 className="mb-0 d-flex align-items-center">
            <FaSearch className="me-2" />
            Search Filters
          </h5>
        </Card.Header>
        <Card.Body className="bg-light">
          {/* Row 1: From and To dates */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="from">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <FaCalendarAlt className="me-2 text-primary" />
                  From Date
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="date"
                    name="from"
                    value={paramsData.from}
                    onChange={handleParamChange}
                    onMouseDown={(e) => e.target.showPicker()}
                    className="shadow-sm"
                  />
                  {paramsData.from && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => clearDate("from")}
                      title="Clear date"
                    >
                      ×
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="to">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <FaCalendarAlt className="me-2 text-primary" />
                  To Date
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="date"
                    name="to"
                    value={paramsData.to}
                    onChange={handleParamChange}
                    onMouseDown={(e) => e.target.showPicker()}
                    className="shadow-sm"
                  />
                  {paramsData.to && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => clearDate("to")}
                      title="Clear date"
                    >
                      ×
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          
          {/* Row 2: Email and Search button */}
          <Row className="align-items-end">
            <Col md={8}>
              <Form.Group controlId="email">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <FaEnvelope className="me-2 text-primary" />
                  User Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="user_email"
                  value={paramsData.user_email}
                  onChange={handleParamChange}
                  placeholder="Enter user email to search..."
                  className="shadow-sm"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button 
                className="btn-def w-100 py-2 d-flex align-items-center justify-content-center gap-2" 
                onClick={handleSearchClick}
                style={{ height: "38px" }}
              >
                <FaSearch />
                Search
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col>
          <div >
            <p>{calculatePaginationMessage()}</p>
          </div>
          <Table className="table table-responsive table-striped table-hover" style={{ fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Source</th>
                <th scope="col">Action</th>
                <th scope="col">ARC#</th>
                <th scope="col">Log#</th>
                <th scope="col">Type</th>
                <th scope="col">Payment</th>
                <th scope="col">Days</th>
                <th scope="col">Months</th>
                <th scope="col">Extra Days</th>
                <th scope="col">Booking Date</th>
                <th scope="col">User Name</th>
                <th scope="col">User Email</th>
                <th scope="col">User Phone</th>
                <th scope="col">Pickup</th>
                <th scope="col">Pickup Location</th>
                <th scope="col">Pickup Address</th>
                <th scope="col">Pickup Date Time</th>
                <th scope="col">Dropoff</th>
                <th scope="col">Dropoff Location</th>
                <th scope="col">Dropoff Address</th>
                <th scope="col">Dropoff Date Time</th>
                <th scope="col">Car</th>
                <th scope="col">Group</th>
                <th scope="col">Payment Triggered</th>
                <th scope="col">Payment Status</th>
                <th scope="col">Payfort ID</th>
                <th scope="col">Car Extras</th>
                <th scope="col">Payfort Response</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (<tr ><td className="text-center" colSpan={100}> <Spinner /></td> </tr>) : (
                Array.isArray(incompleteBookings) && incompleteBookings?.length > 0 && incompleteBookings?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{renderSourceIcon(item.booking_source)}</td>
                    <td>{item.action}</td>
                    <td>{item.booking_number}</td>
                    <td>{item.booking_log_number}</td>
                    <td>{item.type}</td>
                    <td>{item.payment_type}</td>
                    <td>{item.booking_days}</td>
                    <td>{item.booking_months}</td>
                    <td>{item.flexi_days}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{item.booking_date ? formatDateTime(item.booking_date) : ""}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{`${item.user_first_name || ''} ${item.user_last_name || ''}`}</td>
                    <td>{item.user_email}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{`${item.user_phone_code || ''} ${item.user_phone_number || ''}`}</td>

                    <td>{item.pickup_type}</td>
                    <td><TruncateWithTooltip text={item.pickup_location_name} maxLength={15} /></td>
                    <td>{<TurncateWithToolTip text={item.pickup_address} characterLimit={20} addressLink={`https://www.google.com/maps/place/${stringToArray(item.pickup_coordinates)?.[0]},${stringToArray(item.pickup_coordinates)?.[1]}`} />}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{item.pickup_date_time ? formatDateTime(item.pickup_date_time) : ""}</td>
                    <td>{item.dropoff_type}</td>
                    <td><TruncateWithTooltip text={item.dropoff_location_name} maxLength={15} /></td>
                    <td>{<TurncateWithToolTip text={item.dropoff_address} characterLimit={20} addressLink={`https://www.google.com/maps/place/${stringToArray(item.dropoff_coordinates)?.[0]},${stringToArray(item.dropoff_coordinates)?.[1]}`} />}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{item.dropoff_date_time ? formatDateTime(item.dropoff_date_time) : ""}</td>
                    <td>{item.car_name}</td>
                    <td>{item.group_name}</td>
                    <td>{item.payment_triggered}</td>
                    <td>{item.payment_status}</td>
                    <td>{item.payfort_id}</td>
                    <TooltipCell data={item.car_extras} />
                    <ToolTipCellForPayfort data={item?.payfort_response} />
                  </tr>
                ))
              )}
              {incompleteBookings?.length === 0 && !loading && <tr className="text-center"><td colSpan={100}>No Data Found.</td></tr>}


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

                <Form.Select aria-label="Default select example"
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



    </Container>

  )
}

export default IncompleteBookings
