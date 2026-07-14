import React, { useState , useEffect, useRef} from "react";
import {
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";

import { Link } from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import { multipartPostCall, simpleGetCallAuth } from "../../../components/config.js/Setup";
import Select from 'react-select';
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import Monthly_Pricing_Master_Sample from "../../../assets/Files/Monthly_Pricing_Master_Sample.xlsx";

const Uploadmonthlypricing = () => {
  const [citiesArray, setCitiesArray] = useState([]);
  const handleCityChange =(selectedOptions)=>{
   setCityError(!selectedOptions/*  || selectedOptions?.value?.length === 0 */);
   setCity(selectedOptions);

  }
const [formData, setFormData] = useState({
 year: "",
 vehicle_model_year: "",
 city: [],
 excel_file: "",
 start_date: "",
 end_date: "",
});
const [city, setCity] = useState([]);
const [dateError, setDateError] = useState("");

const vehicleModelYears = [
 {value: 2020, name: "2020" },
 {value: 2021, name: "2021" },
 {value: 2022, name: "2022" },
 {value: 2023, name: "2023" },
 {value: 2024, name: "2024" },
 {value: 2025, name: "2025" },
 {value: 2026, name: "2026" },
];


const [cityError, setCityError] = useState(false);

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

   
 }
};

const handleSampleDownload = (type) => {
  if (type === "simple") {
    const csvContent = "CAR GROUP,AMOUNT\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Monthly_Pricing_Simple_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const file = Monthly_Pricing_Master_Sample;
    const link = document.createElement("a");
    link.href = file;
    link.download = "Monthly_Pricing_Master_Sample.xlsx";
    link.click();
  }
};

const validateDates = () => {
  const { start_date, end_date } = formData;
  if (start_date && !end_date) {
    return "End Date is required when Start Date is provided.";
  }
  if (!start_date && end_date) {
    return "Start Date is required when End Date is provided.";
  }
  if (start_date && end_date && end_date < start_date) {
    return "End Date must be equal to or after Start Date.";
  }
  return "";
};

const handleSubmit = (e) => {
 e.preventDefault();
 const form = e.currentTarget;
 let valid = true;

 const dateValidationError = validateDates();
 setDateError(dateValidationError);

 if (form.checkValidity() === false || !valid || city.length === 0 || dateValidationError) {
   e.stopPropagation();
   setValidated(true);
   setCityError(city.length === 0);
 } else {
   setCityError(false);
   setDateError("");
   handleFormSubmit();
   setValidated(false);
 }
};


const citiesData = () => {
 const url = configWeb.GET_CITIES;
 simpleGetCallAuth(url)
   .then((res) => {
     setCitiesArray(res?.data || []) ;
   })
   .catch((errr) => {
     console.log("errr", errr);
   })
   .finally(() => {
     // set_loading(false);
   });
};
useEffect(()=>{
 citiesData();
},[])
const [mappedCitiesArray, setMappedCitiesArray]= useState([]);
useEffect(()=>{
if(citiesArray?.length > 0){
const citiesArrayTemp = citiesArray?.map((city)=>({
value : city.id, label: city.name_en
}));
setMappedCitiesArray(citiesArrayTemp);
}
},[citiesArray])

const handleFormSubmit = () => {
 return new Promise((resolve, reject) => {
   const appendFormData = new FormData();
   appendFormData.append("year", formData?.year);
   appendFormData.append("vehicle_model_year", formData?.vehicle_model_year);
   appendFormData.append("file", formData?.excel_file);
   appendFormData.append("city_ids", city?.map((item)=>item.value));

   if (formData.start_date) {
     appendFormData.append("start_date", formData.start_date);
   }
   if (formData.end_date) {
     appendFormData.append("end_date", formData.end_date);
   }

   const url = configWeb.POST_MONTHLY_PRICE;
   setLoading(true);
   multipartPostCall(url, appendFormData)
     .then((res) => {
       if (res?.status === true) {
         notifySuccess("Uploaded Successfully");

         resolve(true);
         setFormData({
          year: "",
          vehicle_model_year: "",
          city: [],
          excel_file: "",
          start_date: "",
          end_date: "",
         });
         setCity([]);
         setDateError("");
         setFormData((prevData) => ({ ...prevData, excel_file: "" }));
         if (fileInputRef.current) {
           fileInputRef.current.value = "";
         }
       } else {
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
       notifyError("Something went wrong. Please try again later.");
       resolve(false);
     })
     .finally(() => {
       setLoading(false);
     });
 });
};

  return (
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
        <Form.Group controlId="vehicle_model_year">
          <Form.Label>Model Year (Vehicle Year)</Form.Label>
          <Form.Select
            name="vehicle_model_year"
            value={formData.vehicle_model_year}
            onChange={handleChange}
          >
            <option value="">Select Model Year (Optional)</option>
          {vehicleModelYears?.map((modelYear)=>(
            <option key={modelYear.value} value={modelYear.value}> {modelYear.name}</option>
          ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
    <Row className="mb-3">
    <Col sm={12} md={12} lg={6}>
        <Form.Group controlId="city">
          <Form.Label>City</Form.Label>
          {/* <Form.Select
          name="city"
          value={formData.city} // Directly use the array here
          onChange={handleChange}
          multiple // Enable multiple selection
          required
        >
          <option value="">Select City</option>
          {citiesArray?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_en}
            </option>
          ))}
        </Form.Select> */}
         <Select 
  
  // value={mappedCitiesArray.filter((option) => formData.city.includes(option.value))}
  value={city}
  isMulti
    name="city"
    
    options= {mappedCitiesArray}
    isSearchable
    className="basic-multi-select"
    // classNamePrefix="select"
    required
    
    // defaultValue="Select City"
    // onChange={(selectedOptions) =>
    //   handleChange({ target: { name: 'city', value: selectedOptions } })
    // }
    onChange={handleCityChange}
  />
            {cityError && (
              <div className="custom_error">Please select at least one city.</div>
            )}
        </Form.Group>
      </Col>
      </Row>

    <Row className="mb-3">
      <Col sm={12} md={6} lg={3} className="mb-2">
        <Form.Group controlId="start_date">
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            onMouseDown={(e) => e.target.showPicker()}
          />
        </Form.Group>
      </Col>
      <Col sm={12} md={6} lg={3} className="mb-2">
        <Form.Group controlId="end_date">
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            onMouseDown={(e) => e.target.showPicker()}
            min={formData.start_date || undefined}
          />
        </Form.Group>
      </Col>
      {dateError && (
        <Col sm={12} md={12} lg={6}>
          <div className="custom_error">{dateError}</div>
        </Col>
      )}
      <Col sm={12} lg={6}>
        <Form.Text className="text-muted">
          Optional. When provided, these dates apply to all rows in the
          Excel file and override any dates in the file.
        </Form.Text>
      </Col>
    </Row>

    <Row className="mb-3">
      <Col sm={12} md={8} lg={6} className="mb-3 mb-lg-0">
        <Form.Group controlId="excel_file">
          <Form.Label>Upload Excel File</Form.Label>
          <Form.Control
            ref={fileInputRef}
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
        <Dropdown className="align-self-end w-100">
          <Dropdown.Toggle
            variant="primary"
            className="form-control sample_download_Button"
          >
            Sample Download
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleSampleDownload("simple")}>
              Simple Template (with form dates)
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSampleDownload("full")}>
              Full Template (dates in Excel)
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Col>
    </Row>

  

    <Button type="submit" className="mt-3" disabled={loading}>
      {loading ? <Spinner/> : "Submit"}
   
    </Button>
  </Form>
 
</Container>
  )
}

export default Uploadmonthlypricing
