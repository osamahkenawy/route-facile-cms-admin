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
import {simpleGetCallAuth} from "../../../components/config.js/Setup"
import { notifyError } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import TooltipCell from "../../../components/CarExtrasCell";
import ToolTipCellForPayfort from "../../../components/ToolTipCellForPayfort";
import TurncateWithToolTip from "../CustomHooks/TurncateWithToolTip/TurncateWithToolTip";
import { stringToArray } from "../CustomHooks/reusableFunctions";
const BookingLogs = () => {
  
const [loading, setLoading] = useState(true);

const [priceListArray, setPriceListArray] = useState([]);
const [pageSize, setPageSize] = useState(25);
const [totalRecords, setTotalRecords] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [email, setEmail] = useState("");
const [bookingNumber, setBookingNumber] = useState("");
const [logNumber, setLogNumber] = useState("");
const [payment_type, set_payment_type] = useState("");

// const [dateData, setDateData] = useState({
//   booking_start_date : "", booking_end_date : "",
//   pickup_start_date : "", pickup_end_date : "",
// })


const getPriceList =()=>{
  // return new Promise((resolve, reject)=>{
    setLoading(true);
    const body = JSON.stringify({

    })
    const params = new URLSearchParams();
    // Add parameters only if they exist
    if (email) params.append("user_email", email);
    if (payment_type) params.append("payment_type", payment_type);
    if (bookingNumber) params.append("booking_number", bookingNumber);
    if (logNumber) params.append("booking_log_number", logNumber);
   
 
    params.append("page", currentPage)
    params.append("page_size", pageSize)
  
  
    const url = `${configWeb.GET_BOOKING_LOGS}?${params.toString()}`;
   

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
    // const url =`${configWeb.GET_MONTHLY_PRICE}?page=${currentPage}&page_size=${pageSize}`
getPriceList();
  },[currentPage, pageSize,])

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


// const handleDateChange =(e)=>{
// const { name , value} = e.target;
// setDateData((prevData)=>({
//   ...prevData,
//   [name] :value ,
// }))
// }
// const clearDate =(name)=>{
// // const { name , value} = e.target;
// setDateData((prevData)=>({
//   ...prevData,
//  [name] : ""
// }))
// }

const handleSearchClick =()=>{
  setCurrentPage(1);
  getPriceList();
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
      <div className="calender-field-width col-lg-2">
            <Form.Group className="mb-3">
              <Form.Label>Payment type</Form.Label>
              <Form.Select aria-label="Default select example"
              name="payment_type"
              value={payment_type}
              onChange={(e)=>set_payment_type(e.target.value)}
              >
                <option value=''>Select</option>
                <option key='now' value='now'>Pay Now</option>
                <option key='later' value='later'>Pay Later</option>
              </Form.Select>
              </Form.Group>
              </div>
              <div className="calender-field-width col-lg-2">
          <Form.Group className="mb-3">
            <Form.Label>Booking Number</Form.Label>
            <Form.Control
                  type="text"
                  name="bookingNumber"
                  value={bookingNumber}
                  onChange={(e)=>setBookingNumber(e.target.value)}
                 
                />
          </Form.Group>
       </div>
              <div className="calender-field-width col-lg-2">
          <Form.Group className="mb-3">
            <Form.Label>Log Number</Form.Label>
            <Form.Control
                  type="text"
                  name="logNumber"
                  value={logNumber}
                  onChange={(e)=>setLogNumber(e.target.value)}
                 
                />
          </Form.Group>
       </div>
       <div className="calender-field-width col-lg-2">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
                  type="text"
                  name="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                 
                />
          </Form.Group>
      </div>
      {/* <div className="calender-field-width col-lg-2">
        <Form.Group controlId="booking_start_date" className="mb-3">
              <Form.Label >Booking Start Date</Form.Label>
              <Form.Control
                type="date"
                name="booking_start_date"
                id="booking_start_date"
              
                value={dateData.booking_start_date}
                onChange={handleDateChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {dateData.booking_start_date && (
                  <div className="clear-btn">
              <Button variant="outline-secondary mt-1 " onClick={()=>clearDate("booking_start_date")} size="sm" >
                Clear
              </Button>
              </div>
            )}
            </Form.Group>
            </div>
      <div className="calender-field-width col-lg-2">
        <Form.Group controlId="booking_end_date" className="mb-3">
              <Form.Label >Booking End Date</Form.Label>
              <Form.Control
                type="date"
                name="booking_end_date"
                id="booking_end_date"
              
                value={dateData.booking_end_date}
                onChange={handleDateChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {dateData.booking_end_date && (
                   <div className="clear-btn">
              <Button variant="outline-secondary mt-1 " onClick={()=>clearDate("booking_end_date")} size="sm">
                Clear
              </Button>
              </div>
            )}
            </Form.Group>
            </div>
      <div className="calender-field-width col-lg-2">
        <Form.Group controlId="pickup_start_date" className="mb-3">
              <Form.Label >Pickup Start Date</Form.Label>
              <Form.Control
                type="date"
                name="pickup_start_date"
                id="pickup_start_date"
              
                value={dateData.pickup_start_date}
                onChange={handleDateChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {dateData.pickup_start_date && (
                   <div className="clear-btn">
              <Button variant="outline-secondary mt-1 " onClick={()=>clearDate("pickup_start_date")} size="sm" >
                Clear
              </Button>
              </div>
            )}
            </Form.Group>
            </div>
      <div className="calender-field-width col-lg-2">
        <Form.Group controlId="pickup_end_date" className="mb-3">
              <Form.Label >Pickup End Date</Form.Label>
              <Form.Control
                type="date"
                name="pickup_end_date"
                id="pickup_end_date"
              
                value={dateData.pickup_end_date}
                onChange={handleDateChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {dateData.pickup_end_date && (
                   <div className="clear-btn">
              <Button variant="outline-secondary mt-1 " onClick={()=>clearDate("pickup_end_date")} size="sm">
                Clear
              </Button>
              </div>
            )}
            </Form.Group>
            </div> */}
            <div className="calender-field-width">
           <div className="hidden-search-text">Search</div>
              <Button className="btn-def btn-icon" onClick={handleSearchClick}><ion-icon className="search-icon" name="search-outline"></ion-icon>Search</Button>
             
           
              </div>
      
      </Row>
      <Col>
      <div >
      <p>{calculatePaginationMessage()}</p>

      </div>
        <Table className="table table-responsive table-striped table-hover--">
        <thead>
  <tr>
    {/* <th scope="col" rowSpan="2">#</th> */}
    
   
    <th scope="col">ID</th>
      <th scope="col">Source</th>
      <th scope="col">Action</th>
      {/* <th scope="col">Parent ID</th> */}
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
      {/* <th scope="col">Car Extras</th> */}
      {/* <th scope="col">Car Rate Total</th>
      <th scope="col">Car Extras Rate Total</th>
      <th scope="col">Per Month Rate</th>
      <th scope="col">Flexi Days Rate</th>
      <th scope="col">Monthly Mileage</th>
      <th scope="col">Extra KMs Total Rate</th>
      <th scope="col">Total Amount</th>
      <th scope="col">VAT Percentage</th>
      <th scope="col">VAT Amount</th> */}
      <th scope="col">Payment Triggered</th> 
      <th scope="col">Payment Status</th> 
      <th scope="col">Payfort ID</th> 
      <th scope="col">Car Extras</th> 
      <th scope="col">Payfort Response</th> 
   
    {/* <th scope="col">Total</th> */}
   
   

   
  </tr>
</thead>
        
          <tbody>
{loading ? (<tr ><td className="text-center" colSpan={100}> <Spinner/></td> </tr>) : (
Array.isArray(priceListArray) && priceListArray?.length > 0 && priceListArray?.map((item, index)=>(
  <tr key={item.id}>
 {/* <td scope="row">{item.id}</td> */}
 <td>{item.id}</td>
      <td>{item.booking_source}</td>
      <td>{item.action}</td>
      {/* <td>{item.parent_id}</td> */}
      <td>{item.booking_number}</td>
      <td>{item.booking_log_number}</td>
      <td>{item.type}</td>
      <td>{item.payment_type}</td>
      <td>{item.booking_days}</td>
      <td>{item.booking_months}</td>
      <td>{item.flexi_days}</td>
      <td style={{whiteSpace: "nowrap"}}>{item.booking_date ? formatDateTime(item.booking_date): ""}</td>
      <td style={{whiteSpace: "nowrap"}}>{`${item.user_first_name} ${item.user_last_name}`}</td>
      <td>{item.user_email}</td>
      <td style={{whiteSpace: "nowrap"}}>{`${item.user_phone_code} ${item.user_phone_number}`}</td>
     
      <td>{item.pickup_type}</td>
      <td>{item.pickup_location_name}</td>
      <td>{<TurncateWithToolTip text={item.pickup_address} characterLimit={30}  addressLink={`https://www.google.com/maps/place/${stringToArray(item.pickup_coordinates)?.[0]},${stringToArray(item.pickup_coordinates)?.[1]}`}/>}</td>
      <td style={{whiteSpace: "nowrap"}}>{item.pickup_date_time ? formatDateTime(item.pickup_date_time) : "" }</td>
      <td>{item.dropoff_type}</td>
      <td>{item.dropoff_location_name}</td>
      <td>{<TurncateWithToolTip text={item.dropoff_address} characterLimit={30}  addressLink={`https://www.google.com/maps/place/${stringToArray(item.dropoff_coordinates)?.[0]},${stringToArray(item.dropoff_coordinates)?.[1]}`}/>}</td>
      <td style={{whiteSpace: "nowrap"}}>{item.dropoff_date_time ? formatDateTime(item.dropoff_date_time) : ""}</td>
      <td>{item.car_name}</td>
      <td>{item.group_name}</td>
    
      {/* <td>{item.car_rate_total}</td>
      <td>{item.car_extras_rate_total}</td>
      <td>{item.per_month_rate}</td>
      <td>{item.flexi_days_rate}</td>
      <td>{item.monthly_mileage}</td>
      <td>{item.extra_kms_total_rate}</td>
      <td>{item.total_amount}</td>
      <td>{item.vat_percentage}</td>
      <td>{item.vat_amount}</td> */}
      <td>{item.payment_triggered}</td> 
      <td>{item.payment_status}</td> 
      <td>{item.payfort_id}</td> 
      {/* <td>{item.car_extras}</td>  */}
      <TooltipCell data={item.car_extras} />
      {/* <TooltipCell data={item.payfort_response} /> */}
      <ToolTipCellForPayfort data={item?.payfort_response} />
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
