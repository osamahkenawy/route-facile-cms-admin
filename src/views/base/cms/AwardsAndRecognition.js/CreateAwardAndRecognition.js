import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CKEditorComponent from "../../../../components/CKEditor/CKEditor";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { multipartPostCall, multipartPutWithAuthCall, simpleGetCallAuth } from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";

const CreateAwardsAndRecognition = () => {
  const { id } = useParams();
  const imageFileServer = process.env.REACT_APP_FILE_SERVER
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    type: "award",
    title_en: "",
    title_ae: "",
    description_en: "",
    description_ae: "",
    link: "",
    alt_text: "",
    mobile: "",
    desktop: "",
   
  });
  const mobileFileInputRef = useRef(null);  
  const desktopFileInputRef = useRef(null);  

  const handleResetFileInput = () => {
    if (mobileFileInputRef.current || desktopFileInputRef.current) {
      mobileFileInputRef.current.value = ''; 
      desktopFileInputRef.current.value ='';
    } 
  };
  const [errors, setErrors] = useState({});
  const [editorErrors, setEditorErrors] = useState({});

  const handleChange = (e) => {
  
    const { name, value, type, checked, files } = e.target;

     if ((name === 'mobile' || name === "desktop") && files[0]) {
      const file = files[0]; // Only allow one file
      const img = new Image();
      
      img.src = URL.createObjectURL(file); 
      img.onload = () => {
        if(name === 'desktop'){
          const imageWidth = formData.type === 'award' ? 304 : 350 ;
          const imageHeight = formData.type === 'award' ? 304 : 540 ;
        if (img.width === imageWidth && img.height === imageHeight) {
      
      setFormData({
        ...formData,
        [name]: files[0],
      }); /* taleeb */
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: `Image must be exactly ${imageWidth}x${imageHeight} pixels`,
      }));
    }
  } else if (name === "mobile") {
    const imageWidth = formData.type === 'award' ? 250 : 350 ;
    const imageHeight = formData.type === 'award' ? 304 : 540 ;
    if (img.width === imageWidth && img.height === imageHeight) {
      
      setFormData({
        ...formData,
        [name]: files[0],
      });
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: `Image must be exactly ${imageWidth}x${imageHeight} pixels`,
      }));
    }


  }

    }
    }  
     else {
    
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
    if(name === "type"){
      setFormData((prevData) => ({ ...prevData, 
        mobile: "",
        desktop:"" 
      }));
      handleResetFileInput();
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
    appendFormData.append("title_en", formData?.title_en)
    appendFormData.append("title_ae", formData?.title_ae)
    appendFormData.append("type", formData?.type)
    appendFormData.append("description_en", formData?.description_en)
    appendFormData.append("description_ae", formData?.description_ae)
    appendFormData.append("link", formData?.link)
    appendFormData.append("mobile", formData?.mobile)
    appendFormData.append("desktop", formData?.desktop)
    appendFormData.append("status", formData?.status)
  
    const url = id ? configWeb.PUT_AWARDS_AND_CERTIFICATE_UPDATE(id) : configWeb.POST_AWARDS_AND_CERTIFICATE_CREATE;
      setLoading(true);
        const apiCall = id ? multipartPutWithAuthCall : multipartPostCall;
        apiCall(url, appendFormData)
        .then((res) => {
          if (res?.status === "success") {
            
            notifySuccess( id ? "Updated Successfully" : "Created Successfully");
            navigate("/cms/awards-and-recognition");

           
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
      const url = configWeb.GET_AWARDS_AND_CERTIFICATE_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              alt_text: res?.alt_text,
              type: res?.type,
              title_en: res?.title_en,
              title_ae: res?.title_ae,
              description_en: res?.description_en,
              description_ae: res?.description_ae,
              link: res?.link,
              mobile: res?.mobile,
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
  

const handleEditorChange = (name, content) => {
  setFormData((prevData) => ({ ...prevData, [name]: content }));
  if (content) {
    setEditorErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  }

  if (content) {
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  }
};
  return (
    <Container className="container">
    <div className="post_header">
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/awards-and-recognition">
            <Button className="btn-def">Award List</Button>
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
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
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
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select name="type" value={formData?.type} onChange={handleChange}>
              {/* <option value="">Select</option> */}
              <option value="award">award</option>
              <option value="certificate">certificate</option>
            </Form.Select>
            {errors.type && <span className="custom_error">{errors.type}</span>}
          </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Form.Group>
            <Form.Label>Title (English)</Form.Label>
            <Form.Control
                  type="text"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleChange}
                  isInvalid={!!errors.title_en}
                />
            {errors.title_en && <span className="custom_error">{errors.title_en}</span>}
          </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Form.Group>
            <Form.Label>Title (Arabic)</Form.Label>
            <Form.Control
                  type="text"
                  name="title_ae"
                  value={formData.title_ae}
                  onChange={handleChange}
                  isInvalid={!!errors.title_ae}
                />
            {errors.title_ae && <span className="custom_error">{errors.title_ae}</span>}
          </Form.Group>
        </Col>

     
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
        <Form.Group>
          <Form.Label >Link</Form.Label>
              <Form.Control
                type="text"
                name="link"
                id="link"
              
                value={formData.link}
                onChange={handleChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {errors.link && <span className="custom_error">{errors.link}</span>}
            </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
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
     
     
      </Row>
       
      <Row>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>{`Mobile ${formData.type === "award" ? "Award" : "Certificate"} Image ( size - ${formData.type === "award" ? "250*304 px" : "350*540 px" } )`}</Form.Label>
        <Form.Control
          type="file"
          name="mobile"
          accept="image/*"
             
          onChange={handleChange}
          isInvalid={!!errors.mobile}
          ref={mobileFileInputRef}
        />
        {formData.mobile && (
          <div style={{ marginTop: '1rem' }}>
            <img
            src={
              formData.mobile instanceof File 
                ? URL?.createObjectURL(formData.mobile) // Local preview
                : `${imageFileServer}admin/awards_and_certificates${formData.mobile}` // Server URL
            }
              alt="Preview"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
        )}
        {errors.mobile && <span className="custom_error">{errors.mobile}</span>}
      </Form.Group>
         {/* taleeb */}
        </Col>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>{`Desktop ${formData.type === "award" ? "Award" : "Certificate"} Image ( size - ${formData.type === "award" ? "304*304 px" : "350*540 px" } )`}</Form.Label>
        <Form.Control
          type="file"
          name="desktop"
          accept="image/*"
          onChange={handleChange}
          isInvalid={!!errors.desktop}
          ref={desktopFileInputRef}
        />
        {formData.desktop && (
          <div style={{ marginTop: '1rem' }}>
            <img
              src={
                formData.desktop instanceof File 
                  ? URL.createObjectURL(formData.desktop) // Local preview
                  : `${imageFileServer}admin/awards_and_certificates/${formData.desktop}` // Server URL
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

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Description (EN)</Form.Label>
            <CKEditorComponent
              language="en"
              onContentChange={(content) => handleEditorChange("description_en", content)}
              contentW={formData?.description_en}
            />
            {errors.description_en && <span className="custom_error">{errors.description_en}</span>}
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col className="mt-3">
          <Form.Group>
            <Form.Label>Description (AE)</Form.Label>
            <CKEditorComponent
              language="en"
              onContentChange={(content) => handleEditorChange("description_ae", content)}
              contentW={formData?.description_ae}
            />
            {errors.description_ae && <span className="custom_error">{errors.description_ae}</span>}
          </Form.Group>
        </Col>
      </Row>
   
      <Button type="submit"  disabled={loading} className="my-4 px-4 py-2 "> {loading ? <Spinner/> :( id ? "Update" : "Submit")}</Button>
    </Form>
    )}

   </Container>

  )
}

export default CreateAwardsAndRecognition