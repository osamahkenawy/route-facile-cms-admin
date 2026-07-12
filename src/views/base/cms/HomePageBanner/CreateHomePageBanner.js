import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CKEditorComponent from "../../../../components/CKEditor/CKEditor";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { multipartPostCall, multipartPutWithAuthCall, simpleGetCallAuth } from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";

const CreateHomePageBanner = () => {
  const { id } = useParams();
  const imageFileServer = process.env.REACT_APP_FILE_SERVER
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    alt_text: "",
    link: "",
    order: 0,
    image: null,
    desktop: null,
   
  });

  const [errors, setErrors] = useState({});
  const [editorErrors, setEditorErrors] = useState({});

  const handleChange = (e) => {
  
    const { name, value, type, checked, files } = e.target;

    if ((name === 'image' || name === "desktop") && files[0]) {
      // Accept any image without size restrictions
      setFormData({
        ...formData,
        [name]: files[0],
      });
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    } else {
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
    appendFormData.append("alt_text", formData?.alt_text)
    appendFormData.append("link", formData?.link)
    appendFormData.append("mobile", formData?.image)
    appendFormData.append("desktop", formData?.desktop)
    appendFormData.append("status", formData?.status)
    appendFormData.append("order", formData?.order)
  
    const url = id ? configWeb.PUT_HOMEPAGE_BANNER_UPDATE(id) : configWeb.POST_HOMEPAGE_BANNER_CREATE;
      setLoading(true);
        const apiCall = id ? multipartPutWithAuthCall : multipartPostCall;
        apiCall(url, appendFormData)
        .then((res) => {
          if (res?.status === "success") {
            
            notifySuccess( id ? "Updated Successfully" : "Created Successfully");
            navigate("/cms/homepagebanners");

           
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
      const url = configWeb.GET_HOMEPAGE_BANNER_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              order: res?.order,
              alt_text: res?.alt_text,
              link: res?.link,
              image: res?.mobile,
              desktop: res?.desktop,
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
    <Container className="container">
    <div className="post_header">
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/homepagebanners">
            <Button className="btn-def">Banner List</Button>
          </Link>
        </Col>
      </Row>
    </div>
    {editLoading ? (
      <div className="text-center">
        {" "}
        <Spinner />{" "}
      </div>
    ) : (
      <Form onSubmit={handleSubmit}>
      <Row>
        <Col sm={12} md={6} lg={4} xl={4} className="mb-4">
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

        <Col sm={12} md={6} lg={4} xl={4} className="mb-4">
          <Form.Group>
            <Form.Label>Order</Form.Label>
            <Form.Control
                  type="number"
                  name="order"
                  min={1}
                  value={formData.order}
                  onChange={handleChange}
                  isInvalid={!!errors.order}
                />
            {errors.order && <span className="custom_error">{errors.order}</span>}
          </Form.Group>
        </Col>

        <Col sm={12} md={6} lg={4} xl={4} className="mb-4">
          <Form.Group>
            <Form.Label>Image Alt Text</Form.Label>
            <Form.Control
                  type="text"
                  name="alt_text"
                  value={formData.alt_text}
                  onChange={handleChange}
                  isInvalid={!!errors.alt_text}
                />
            {errors.alt_text && <span className="custom_error">{errors.alt_text}</span>}
          </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Form.Group>
            <Form.Label>URL</Form.Label>
            <Form.Control
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  isInvalid={!!errors.link}
                />
            {errors.link && <span className="custom_error">{errors.link}</span>}
          </Form.Group>
        </Col>
      </Row>
       
      <Row>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>Mobile Image</Form.Label>
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
                : `${imageFileServer}admin/banner/${formData.image}` // Server URL
            }
              alt="Preview"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
        )}
        {errors.image && <span className="custom_error">{errors.image}</span>}
      </Form.Group>
         
        </Col>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>Desktop Image</Form.Label>
        <Form.Control
          type="file"
          name="desktop"
          accept="image/*"
          onChange={handleChange}
          isInvalid={!!errors.desktop}
        />
        {formData.desktop && (
          <div style={{ marginTop: '1rem' }}>
            <img
              src={
                formData.desktop instanceof File 
                  ? URL.createObjectURL(formData.desktop) // Local preview
                  : `${imageFileServer}admin/banner/${formData.desktop}` // Server URL
              }
              alt="Preview"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
        )}
        {errors.desktop && <span className="custom_error">{errors.desktop}</span>}
      </Form.Group>
         
        </Col>
    

      </Row>
   
      <Button type="submit"  disabled={loading} className="my-4 px-4 py-2 "> {loading ? <Spinner/> :( id ? "Update" : "Submit")}</Button>
    </Form>
    )}
   </Container>

  )
}

export default CreateHomePageBanner