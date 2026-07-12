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
import { notifyError} from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";

const OfferRequest = () => {
  
  
const [loading, setLoading] = useState(false);

const [priceListArray, setPriceListArray] = useState([]);
const [pageSize, setPageSize] = useState(25);
const [totalRecords, setTotalRecords] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [offerName, setOfferName] = useState("");
const [carArray, setCarArray] = useState([]);
const [email, setEmail] = useState("");

const getPriceList =()=>{
  // return new Promise((resolve, reject)=>{
    setLoading(true);
    const params = new URLSearchParams();
    // Add parameters only if they exist
    if (offerName) params.append("offer_id", offerName);
    if (email) params.append("email", email);
    
    params.append("page", currentPage)
    params.append("page_size", pageSize)
  
    const url = `${configWeb.GET_OFFER_LIST}?${params.toString()}`;
   

    simpleGetCallAuth(url)
    .then((res)=>{
      if(!res?.error){
        setPriceListArray(res?.data || []);
        setTotalRecords(res?.total_records || 0);
      }else{
        setPriceListArray([]);
        setTotalRecords(0);
      if (Array.isArray(res?.message)){
        notifyError(res.message[0])
      } else {
        notifyError(res?.message)
      }
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
  },[currentPage, pageSize])


const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};

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

function formatDate(isoString) {
  const date = new Date(isoString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0');
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;

}


const offerData = () => {
  const url = `${configWeb.GET_SPECIAL_OFFER_LIST}?page_size=9999`;
  
  simpleGetCallAuth(url)
    .then((res) => {
      setCarArray(res?.data || []) ;
    })
    .catch((errr) => {
      console.log("errr", errr);
    })
    .finally(() => {
      // set_loading(false);
    });
};
useEffect(()=>{
offerData();
},[])

const handleSearchList = ()=>{
  setCurrentPage(1);
 
   getPriceList();
}

  return (
    <Container>
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
            <Form.Label>Offer</Form.Label>
            <Form.Select aria-label="Default select example"
            name="offerName"
            value={offerName}
            onChange={(e)=>setOfferName(e.target.value)}
            >
              <option value="">Select Offer</option>
             {carArray?.length > 0 && carArray?.map((item)=>(
              <option key={item.id} value={item.id}>{item.title_en}</option>
             ))}
            </Form.Select>
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
        <Table className="table table-responsive">
        <thead>
          
  <tr>
    <th scope="col" rowSpan="2">#</th>
    <th scope="col" rowSpan="2">Name</th>
    <th scope="col" rowSpan="2">Number</th>
    <th scope="col" rowSpan="2">Email</th>
    <th scope="col" rowSpan="2">Address</th>
    <th scope="col" >Offer</th>
    <th scope="col">Date</th>
   </tr>
</thead>
        
          <tbody>
{loading ? (<tr ><td className="text-center" colSpan={100}> <Spinner/></td> </tr>) : (
Array.isArray(priceListArray) && priceListArray?.length > 0 && priceListArray?.map((item, index)=>(
  <tr key={item.id}>
 <td>{item.id}</td>
              <td> {`${item.first_name} ${item.last_name}`}</td>
              <td>
             {`${item.phone_code} ${item.phone_number}`}
              </td>
              <td>{item.email}</td>
              <td>{item.address}</td>
              <td>
               {item.offer?.title_en}
              </td>
            
              <td>
              {formatDate(item.created_at)}
              </td>
            
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

export default OfferRequest
