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
import {simpleGetCallAuth} from "../../../components/config.js/Setup"
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
const BookingLogs = () => {

const [loading, setLoading] = useState(false);
const [priceListArray, setPriceListArray] = useState([]);
const [pageSize, setPageSize] = useState(25);
const [totalRecords, setTotalRecords] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [email, setEmail] = useState("");
const [bookingNumber, setBookingNumber] = useState("");

const getPriceList =()=>{
  // return new Promise((resolve, reject)=>{
    setLoading(true);
    const body = JSON.stringify({

    })
    const params = new URLSearchParams();
    // Add parameters only if they exist
    if (email) params.append("email", email);
    if (bookingNumber) params.append("booking_number", bookingNumber);
    params.append("page", currentPage)
    params.append("page_size", pageSize)
  
  
    const url = `${configWeb.GET_REFUNDS}?${params.toString()}`;
   

    simpleGetCallAuth(url)
    .then((res)=>{
      if(!res?.error){
        setPriceListArray(res?.data || []);
        setTotalRecords(res?.total_records || 0);
      } else{
        setPriceListArray([]);
        setTotalRecords( 0);
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

  useEffect(()=>{

getPriceList();
  },[currentPage, pageSize,])

const handleSearchList = ()=>{
  setCurrentPage(1);
 
   getPriceList();
}


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



  return (
    <Container className="bg-red">
    <Row className="justify-content-between">
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          {/* <Link to="/pricing/upload-daily-pricing">
          <Button className="btn-def" onClick={handleShowCat}>
            Upload Price
          </Button>
          </Link> */}
        </Col>
      </Row>
      <Row className="mt-2 mb-4">
      
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Booking Number</Form.Label>
            <Form.Control
                  type="text"
                  name="bookingNumber"
                  value={bookingNumber}
                  onChange={(e)=>setBookingNumber(e.target.value)}
                 
                />
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
                  type="text"
                  name="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                 
                />
          </Form.Group>
        </Col>
       
       
        <Col className="mt-auto mb-3">
          <Button className="btn-def " type="button" onClick={handleSearchList}>Search</Button>
        </Col>
      </Row>
      <Col>
      <div >
      <p>{calculatePaginationMessage()}</p>

      </div>
        <Table className="table table-responsive table-striped table-hover--">
        <thead>
  <tr>
   
    <th scope="col">#</th>
      <th scope="col">ARC#</th>
      <th scope="col">Log#</th>
      <th scope="col">Type</th>
      <th scope="col">Name</th>
      <th scope="col">Phone</th>
      <th scope="col">Email</th>
      <th scope="col">Total Amount</th>
      <th scope="col">Previous Total Amount</th>
      <th scope="col">Time</th>
      <th scope="col">Action</th>
      <th scope="col">Reason</th>
     </tr>
</thead>
        
          <tbody>
{loading ? (<tr ><td className="text-center" colSpan={100}> <Spinner/></td> </tr>) : (
Array.isArray(priceListArray) && priceListArray?.length > 0 && priceListArray?.map((item, index)=>(
  <tr key={item.id}>
 <td>{item.id}</td>
      <td>{item.booking_number}</td>
      <td>{item.booking_log_number}</td>
      <td>{item.type}</td>
      <td>{item.user_name}</td>
      <td>{item.user_phone}</td>
      <td>{item.user_email}</td>
      <td>{item.total_amount}</td>
      <td>{item.previous_total_amount}</td>
      <td>{formatDateTime(item.time)}</td>
      <td>
        <div className={`${item.action}_box`}>
            {item.action }
        </div>
      </td>
      <td>{item.cancellation_reason}</td>
      </tr>
))
)}
{priceListArray?.length === 0 && !loading &&  <tr  className="text-center"><td colSpan={100}>No Data Found.</td></tr>}

         
          </tbody>
       
        </Table>
        <div className="d-flex justify-content-between align-items-center">
        <CustomPagination
          recordsPerPage={pageSize}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          currentPage= {currentPage}
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

export default BookingLogs
