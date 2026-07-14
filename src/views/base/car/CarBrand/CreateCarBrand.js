import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./CreateCarBrand.css";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { multipartPostCall, multipartPutWithAuthCall, simpleGetCallAuth } from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";

const CreateCarBrand = () => {
  const { id } = useParams();
  const imageFileServer = process.env.REACT_APP_FILE_SERVER
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    name_en: "",
    name_ae: "",
    image: null,
  
  });

  const [errors, setErrors] = useState({});
 
  const handleChange = (e) => {
  
    const { name, value, type, checked, files } = e.target;
   if ((name === 'image') && files[0]) {
      const file = files[0]; // Only allow one file
    
      
      setFormData({
        ...formData,
        [name]: files[0],
      });
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
   
  

    
    } 
     else {
    
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }

    if (value) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
  };

 

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if ((!formData[key] && formData[key] != "0" ) || (Array.isArray(formData[key]) && formData[key].length === 0)) {
        newErrors[key] = "This field is required";
      }
    });
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formSubmitFunction = ()=>{
    const appendFormData = new FormData();
    appendFormData.append("name_en", formData?.name_en)
    appendFormData.append("name_ae", formData?.name_ae)
    appendFormData.append("image", formData?.image)
    appendFormData.append("status", formData?.status)
      const url = id ? configWeb.PUT_CAR_BRAND_UPDATE(id) : configWeb.POST_CAR_BRANDS;
      setLoading(true);
        const apiCall = id ? multipartPutWithAuthCall : multipartPostCall;
        apiCall(url, appendFormData)
        .then((res) => {
          if (res?.status === "success") {
            
            notifySuccess( id ? "Updated Successfully" : "Created Successfully");
            navigate("/car/brand");

           
          } else  {
            if(Array.isArray(res?.message)){
              notifyError(res?.message[0]);
            }else{
              notifyError(res?.message);
            }
           
          }
        })
        .catch((error) => {
          // console.log("ERROR-->", error)
          notifyError("Something went wrong. Please try again letter.");
         
        })
        .finally(() => {
          setLoading(false);
        });
    
  };
  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
    formSubmitFunction();
   
  };


  const getDetails = () => {
    return new Promise((resolve, reject) => {
      const url = configWeb.GET_CAR_BRAND_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              name_en: res?.name_en,
              name_ae: res?.name_ae,
              image: res?.image,
           
            }));
            
        
            resolve(true);
          } else if (res?.error) {
            notifyError(res?.message[0]);
          }
        })
        .catch((error) => {
          notifyError("Something went wrong. Please try again letter.");
          resolve(false);
        })
        .finally(() => {
          setEditLoading(false);
        });
    });
  };
useEffect(()=>{
if(id){
  getDetails();
}
},[id])
  

  return (
    <Container className="rf-form-page">
      <div className="rf-page-header">
        <div className="rf-page-heading">
          <h3 className="rf-page-title">
            <span className="rf-title-bar" /> {id ? "Edit" : "Add"} Car Brand
          </h3>
          <p className="rf-page-sub">Fill in the brand details below</p>
        </div>
        <Link to="/car/brand">
          <Button className="rf-outline-btn">&#8592;&nbsp; Brand List</Button>
        </Link>
      </div>
    {editLoading ? (
      <div className="text-center">
        {" "}
        <Spinner />{" "}
      </div>
    ) : (
      <Form onSubmit={handleSubmit} className="rf-form-card">
      <Row>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={formData?.status} onChange={handleChange}>
              <option value="">Select</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Form.Select>
            {errors.status && <span className="custom_error">{errors.status}</span>}
          </Form.Group>
        </Col>
      
        <Col sm={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group>
            <Form.Label>Brand Name (English)</Form.Label>
            <Form.Control
                  type="text"
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleChange}
                  isInvalid={!!errors.name_en}
                />
            {errors.name_en && <span className="custom_error">{errors.name_en}</span>}
          </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group>
            <Form.Label>Brand Name (Arabic)</Form.Label>
            <Form.Control
                  type="text"
                  name="name_ae"
                  value={formData.name_ae}
                  onChange={handleChange}
                  isInvalid={!!errors.name_ae}
                />
            {errors.name_ae && <span className="custom_error">{errors.name_ae}</span>}
          </Form.Group>
        </Col>
       
      </Row>
      <Row>
      <Col sm={12} md={6} lg={4} className="mb-3">
          <Form.Group>
          <Form.Label>Brand Image</Form.Label>
        <Form.Control
          type="file"
          name="image"
          accept="image/*"
        
          onChange={handleChange}
          isInvalid={!!errors.image}
        />
        {formData.image && (
          <div style={{ marginTop: '1rem' }}>
            <img
            src={
              formData.image instanceof File 
                ? URL.createObjectURL(formData.image) // Local preview
                : `${imageFileServer}admin/car/brand/${formData.image}` // Server URL
            }
              alt="Preview"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
        )}
        {errors.image && <span className="custom_error">{errors.image}</span>}
      </Form.Group>
         
        </Col>
   

      </Row>
    

      <div className="rf-form-actions">
        <Button type="submit" disabled={loading} className="rf-submit-btn"> {loading ? <Spinner size="sm" /> : "Submit"}</Button>
      </div>
    </Form>
    )}
   </Container>

  )
}

export default CreateCarBrand