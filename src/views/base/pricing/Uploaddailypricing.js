import React, { useState , useEffect, useRef} from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import { Link } from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import { multipartPostCall, simpleGetCallAuth } from "../../../components/config.js/Setup";
import Select from 'react-select';
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import Pricing_Master_sample from "../../../assets/Files/Pricing_Master_sample.xlsx"

const Uploaddailypricing = () => {
  const [emiratesArray, setEmiratesArray] = useState([]);
     const handleEmirateChange =(selectedOptions)=>{
      setEmirateError(!selectedOptions/*  || selectedOptions?.value?.length === 0 */);
      setEmirate(selectedOptions);

     }
  const [formData, setFormData] = useState({
    year: "",
    emirate: [],
    excel_file: "",
  
  });
  const [emirate, setEmirate] = useState([]);

  const [previews, setPreviews] = useState({
    mainImage: "",
    thumbnailImage: "",
  });
  const [emirateError, setEmirateError] = useState(false);
 
const [loading,  setLoading]= useState(false);
  const [validated, setValidated] = useState(false);
   // Ref for the file input
   const fileInputRef = useRef(null);

  const years = [
    {value: 2021, name: "2021" },
    {value: 2022, name: "2022" },
    {value: 2023, name: "2023" },
    {value: 2024, name: "2024" },
    {value: 2025, name: "2025" },
    {value: 2026, name: "2026" },
    {value: 2027, name: "2027" },
    {value: 2028, name: "2028" },
    {value: 2029, name: "2029" },
    {value: 2030, name: "2030" },
  ]

  // Common handleChange function for inputs
  const handleChange = (e) => {
    const { name, value, type } = e.target || {};

  
      // Handle other input types
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    
  };

  

  // Special handler for file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: file,
      }));

      // Create a preview URL for the uploaded image
      setPreviews((prevPreviews) => ({
        ...prevPreviews,
        [name]: URL?.createObjectURL(file),
      }));
    }
  };

 const handleSampleDownload =()=>{
  const file = Pricing_Master_sample;
  const link = document.createElement("a");
  link.href =file;
  link.download="Pricing_Master_sample.xlsx";
  link.click();
 }
  

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let valid = true;
   
  

    if (form.checkValidity() === false || !valid || emirate.length === 0) {
      e.stopPropagation();
      setValidated(true);
      setEmirateError(emirate.length === 0); // Show error if emirate is empty
    } else {
      // Handle form submission
      setEmirateError(false);
      handleFormSubmit()
      setValidated(false);
       
    }
    // setValidated(true);
  };


  const emiratesData = () => {
    const url = configWeb.GET_EMIRATES;
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
  useEffect(()=>{
    emiratesData();
  },[])
  const [mappedEmiratesArray, setMappedEmiratesArray]= useState([]);
  useEffect(()=>{
if(emiratesArray?.length > 0){
const emiratesArrayTemp = emiratesArray?.map((emirate)=>({
  value : emirate.id, label: emirate.name_en
}));
setMappedEmiratesArray(emiratesArrayTemp);
}
  },[emiratesArray])
   
  const handleFormSubmit = () => {
    return new Promise((resolve, reject) => {
      const appendFormData = new FormData();
      appendFormData.append("year", formData?.year);
      appendFormData.append("file", formData?.excel_file);
      appendFormData.append("emirate_ids", emirate?.map((item)=>item.value));
      const url = configWeb.POST_DAILY_PRICE;
      setLoading(true);
      multipartPostCall(url, appendFormData)
        .then((res) => {
          if (res?.status === true) {
            // setUserDetails(res);
            notifySuccess("Uploaded Successfully");

            resolve(true);
            setFormData({
             year: "" ,
             emirate :[],
             excel_file : ""
            });
            setEmirate([]);
             // Clear the file input after successful form submission
        setFormData((prevData) => ({ ...prevData, excel_file: "" }));
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset the file input field
        }
          } else  {
            if(Array.isArray(res?.message)){
              notifyError(res?.message[0]);
            }else{
              notifyError(res?.message);
            }
            resolve(false);
          }
        })
        .catch((error) => {
          console.error("Banner failed:", error);
          notifyError("Something went wrong. Please try again letter.");
          resolve(false);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  return(
    <Container className="container">
    <div className="post_header">
    

    </div>
  <Form noValidate validated={validated} onSubmit={handleSubmit} className="form">
    <Row className="mb-3">
      <Col sm={12} md={12} lg={6}>
        <Form.Group controlId="year">
          <Form.Label>Year</Form.Label>
          <Form.Select
         
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          >
            <option value="">Select year</option>
          {years?.map((year)=>(
            <option key={year.value} value={year.value}> {year.name}</option>
          ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a year.
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
     
    </Row>
    <Row className="mb-3">
    <Col sm={12} md={12} lg={6}>
        <Form.Group controlId="emirate">
          <Form.Label>Emirate</Form.Label>
          {/* <Form.Select
          name="emirate"
          value={formData.emirate} // Directly use the array here
          onChange={handleChange}
          multiple // Enable multiple selection
          required
        >
          <option value="">Select Emirate</option>
          {emiratesArray?.map((emirate) => (
            <option key={emirate.id} value={emirate.id}>
              {emirate.name_en}
            </option>
          ))}
        </Form.Select> */}
         <Select 
  
  // value={mappedEmiratesArray.filter((option) => formData.emirate.includes(option.value))}
  value={emirate}
  isMulti
    name="emirate"
    
    options= {mappedEmiratesArray}
    isSearchable
    className="basic-multi-select"
    // classNamePrefix="select"
    required
    
    // defaultValue="Select Emirate"
    // onChange={(selectedOptions) =>
    //   handleChange({ target: { name: 'emirate', value: selectedOptions } })
    // }
    onChange={handleEmirateChange}
  />
            {emirateError && (
              <div className="custom_error">Please select at least one emirate.</div>
            )}
        </Form.Group>
      </Col>
      </Row>

 
    <Row className="mb-3">
      <Col sm={12} md={8} lg={6} className="mb-3 mb-lg-0">
        <Form.Group controlId="excel_file">
          <Form.Label>Upload Excel File</Form.Label>
          <Form.Control
        ref={fileInputRef} // Attach the ref to the input
            type="file"
            name="excel_file"
            onChange={handleFileChange}
            required
          />
          <Form.Control.Feedback type="invalid">
            Please upload the excel file.
          </Form.Control.Feedback>
        
        </Form.Group>
      </Col>
    
      <Col sm={12} md={4} lg={3} className="d-flex">
        <Button className="align-self-end form-control sample_download_Button " onClick={handleSampleDownload}> 
          Sample Download
        </Button>

      </Col>
     
    </Row>

  

    <Button type="submit" className="mt-3" disabled={loading}>
      {loading ? <Spinner/> : "Submit"}
   
    </Button>
  </Form>
 
</Container>

  )
}

export default Uploaddailypricing
