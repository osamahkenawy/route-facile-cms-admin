import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CKEditorComponent from "../../../../components/CKEditor/CKEditor";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { multipartPostCall, multipartPutWithAuthCall, simpleGetCallAuth } from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";

const CreateSpecialOffers = () => {
  const { id } = useParams();
  const imageFileServer = process.env.REACT_APP_FILE_SERVER
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    featured: "",
    title_en: "",
    title_ae: "",
    description_en: "",
    description_ae: "",
    start_date: "",
    end_date: "",
    image_alt_text: "",
    emirate_id: "",
    mobile: "",
    desktop: "",
   
  });
  const [emiratesArray, setEmiratesArray] = useState([]);


  const [errors, setErrors] = useState({});
  const [editorErrors, setEditorErrors] = useState({});

  const handleChange = (e) => {
  
    const { name, value, type, checked, files } = e.target;

     if ((name === 'mobile' || name === "desktop") && files[0]) {
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
    appendFormData.append("image_alt_text", formData?.image_alt_text)
    appendFormData.append("title_en", formData?.title_en)
    appendFormData.append("title_ae", formData?.title_ae)
    appendFormData.append("featured", formData?.featured)
    appendFormData.append("description_en", formData?.description_en)
    appendFormData.append("description_ae", formData?.description_ae)
    appendFormData.append("start_date", formData?.start_date)
    appendFormData.append("end_date", formData?.end_date)
    appendFormData.append("emirate_id", formData?.emirate_id)
    appendFormData.append("mobile", formData?.mobile)
    appendFormData.append("desktop", formData?.desktop)
    appendFormData.append("status", formData?.status)
  
    const url = id ? configWeb.PUT_SPECIAL_OFFER_UPDATE(id) : configWeb.POST_SPECIAL_OFFER_CREATE;
      setLoading(true);
        const apiCall = id ? multipartPutWithAuthCall : multipartPostCall;
        apiCall(url, appendFormData)
        .then((res) => {
          if (res?.status === "success") {
            
            notifySuccess( id ? "Updated Successfully" : "Created Successfully");
            navigate("/cms/special-offers");

           
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
      const url = configWeb.GET_SPECIAL_OFFER_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              image_alt_text: res?.image_alt_text,
              featured: res?.featured,
              title_en: res?.title_en,
              title_ae: res?.title_ae,
              description_en: res?.description_en,
              description_ae: res?.description_ae,
              start_date: res?.start_date,
              end_date: res?.end_date,
              emirate_id: res?.emirate_id,
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
  
const emiratesData = () => {
  const url = `${configWeb.GET_EMIRATES}?page_size=9999`;

  simpleGetCallAuth(url)
    .then((res) => {
      setEmiratesArray(res?.data || []);
    })
    .catch((errr) => {
      console.log("errr", errr);
    })
    .finally(() => {
      // set_loading(false);
    });
};
useEffect(() => {
  emiratesData();
}, []);

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
          <Link to="/cms/special-offers">
            <Button className="btn-def">Offer List</Button>
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
            <Form.Label>Featured</Form.Label>
            <Form.Select name="featured" value={formData?.featured} onChange={handleChange}>
              <option value="">Select</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </Form.Select>
            {errors.featured && <span className="custom_error">{errors.featured}</span>}
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
            <Form.Label>Image Alt Text</Form.Label>
            <Form.Control
                  type="text"
                  name="image_alt_text"
                  value={formData.image_alt_text}
                  onChange={handleChange}
                  isInvalid={!!errors.image_alt_text}
                />
            {errors.image_alt_text && <span className="custom_error">{errors.image_alt_text}</span>}
          </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
        <Form.Group>
          <Form.Label >Start Date</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                id="start_date"
              
                value={formData.start_date}
                onChange={handleChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {errors.start_date && <span className="custom_error">{errors.start_date}</span>}
            </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
        <Form.Group>
          <Form.Label >End Date</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                id="end_date"
              
                value={formData.end_date}
                onChange={handleChange}
                  onMouseDown={(e) => e.target.showPicker()} 
               
              />
                {errors.end_date && <span className="custom_error">{errors.end_date}</span>}
            </Form.Group>
        </Col>
        <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Form.Group>
          <Form.Label>Emirate</Form.Label>
                <Form.Select
                  name="emirate_id"
                  value={formData.emirate_id}
                  onChange={handleChange}
                  isInvalid={!!errors.emirate_id}
                >
                  <option value="">Select Emirate</option>
                  {emiratesArray?.length > 0 &&
                    emiratesArray?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name_en}{" "}
                      </option>
                    ))}
                </Form.Select>
            {errors.emirate_id && <span className="custom_error">{errors.emirate_id}</span>}
          </Form.Group>
        </Col>
      </Row>
       
      <Row>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>Mobile Offer Image</Form.Label>
        <Form.Control
          type="file"
          name="mobile"
          accept="image/*"
        
          onChange={handleChange}
          isInvalid={!!errors.mobile}
        />
        {formData.mobile && (
          <div style={{ marginTop: '1rem' }}>
            <img
            src={
              formData.mobile instanceof File 
                ? URL?.createObjectURL(formData.mobile) // Local preview
                : `${imageFileServer}admin/offer/${formData.mobile}` // Server URL
            }
              alt="Preview"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
        )}
        {errors.mobile && <span className="custom_error">{errors.mobile}</span>}
      </Form.Group>
         
        </Col>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>Desktop Offer Image</Form.Label>
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
                  : `${imageFileServer}admin/offer/${formData.desktop}` // Server URL
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

export default CreateSpecialOffers