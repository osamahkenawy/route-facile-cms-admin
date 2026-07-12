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
import { notifyError, notifySuccess } from "../../../components/notify/notify";

import { Link } from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { formatDateTimeUAE } from "../CustomHooks/reusableFunctions";

const Dailypricelist = () => {
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
const [carName, setCarName] = useState("");
const [pageSize, setPageSize] = useState(25);
const [totalRecords, setTotalRecords] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const years = [
 
  {value: 2024, name: "2024" },
  {value: 2025, name: "2025" },
  {value: 2026, name: "2026" },
  {value: 2027, name: "2027" },
  {value: 2028, name: "2028" },
  {value: 2029, name: "2029" },
  {value: 2030, name: "2030" },
]

const emiratesData = () => {
  const url = `${configWeb.GET_EMIRATES}?page_size=9999`
  
  simpleGetCallAuth(url)
    .then((res) => {
      setEmiratesArray(res?.data || []) ;
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
      setCarGroupArray(res?.data || []) ;
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
  emiratesData();
  carGroupData();
  carData();
},[])
const getPriceList =()=>{
  // return new Promise((resolve, reject)=>{
    setLoading(true);
    const body = JSON.stringify({

    })
    const params = new URLSearchParams();
    // Add parameters only if they exist
    if (carName) params.append("car_id", carName);
    if (year) params.append("year", year);
    if (carGroup) params.append("group_id", carGroup);
    if (emirateID) params.append("emirate_id", emirateID);
    params.append("page", currentPage)
    params.append("page_size", pageSize)
  
    const url = `${configWeb.GET_DAILY_PRICE}?${params.toString()}`;
   

    simpleGetCallAuth(url)
    .then((res)=>{
      if(!res?.error){
        setPriceListArray(res?.data || []);
        setTotalRecords(res?.total_records || 0);
      }else{
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

  useEffect(()=>{
  
getPriceList();
  },[currentPage, pageSize])

const handleSearchList = ()=>{
  setCurrentPage(1);
 
   getPriceList();
}

const calculateTotal = (item) => {
  return (
    (item.rate || 0) +
    (item.cdw || 0) +
    (item.scdw || 0) +
    (item.pai || 0) +
    (item.driver || 0) +
    (item.baby_seat || 0) +
    (item.gps || 0)
  );
};

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
            <Form.Label>Year</Form.Label>
            <Form.Select aria-label="Default select example"
            name="year"
            value={year}
            onChange={(e)=>setYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {years?.map((year)=>(
            <option key={year.value} value={year.value}> {year.name}</option>
          ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Emirate</Form.Label>
            <Form.Select aria-label="Default select example"
            name="emirateID"
            value={emirateID}
            onChange={(e)=>setEmirateID(e.target.value)}
            >
              
              <option value="">Select Emirate</option>
             {emiratesArray?.length > 0 && emiratesArray?.map((item)=>(
              <option key={item.id} value={item.id} >{item.name_en} </option>
             ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Group</Form.Label>
            <Form.Select aria-label="Default select example"
            name="carGroup"
            value={carGroup}
            onChange={(e)=>setCarGroup(e.target.value)}
            >
              <option value="">Select Group</option>
             {carGroupArray?.length > 0 && carGroupArray?.map((item)=>(
              <option key={item.id} value={item.id}>{item.name_en}</option>
             ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Car</Form.Label>
            <Form.Select aria-label="Default select example"
            name="carName"
            value={carName}
            onChange={(e)=>setCarName(e.target.value)}
            >
              <option value="">Select Car</option>
             {carArray?.length > 0 && carArray?.map((item)=>(
              <option key={item.id} value={item.id}>{item.name_en}</option>
             ))}
            </Form.Select>
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
    {/* <th scope="col" rowSpan="2">#</th> */}
    <th scope="col" rowSpan="2">Year</th>
    <th scope="col" rowSpan="2">Emirate</th>
    <th scope="col" rowSpan="2">Group</th>
    <th scope="col" rowSpan="2">Month</th>
    <th scope="col" >Car Name</th>
   
   
   
    <th scope="col">Rate</th>
    <th scope="col">CDW</th>
    <th scope="col">SCDW</th>
    <th scope="col">PAI</th>
    <th scope="col">Driver Fee</th>
    <th scope="col">Baby Seat</th>
    <th scope="col">GPS</th>
    <th scope="col">Rate</th>
    <th scope="col">Date</th>
    <th scope="col">Created By</th>
    <th scope="col">Created At</th>
    
   
   

   
  </tr>
</thead>
        
          <tbody>
{loading ? (<tr ><td className="text-center" colSpan={100}> <Spinner/></td> </tr>) : (
Array.isArray(priceListArray) && priceListArray?.length > 0 && priceListArray?.map((item, index)=>(
  <tr key={item.id}>
 {/* <td scope="row">{item.id}</td> */}
              <td> {item.year}</td>
              <td>
             {item.emirate.name_en}
              </td>
              <td>{item.car_group.name_en}</td>
              <td>{item.month}</td>
              <td>
               {item.car.name_en}
              </td>
             
              <td>{item.rate}</td>
              <td>
              {item.cdw}
              </td>
              <td>{item.scdw}</td>
              <td>
              {item.pai}
              </td>
              <td>{item.driver}</td>
              <td>{item.baby_seat}</td>
              <td>{item.gps}</td>
              <td>{item.rate}</td>
              <td>{item.date}</td>
              <td>{item?.created_by_admin?.first_name}</td>
              <td>{formatDateTimeUAE(item?.created_at)}</td>
              
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
  )
}

export default Dailypricelist
