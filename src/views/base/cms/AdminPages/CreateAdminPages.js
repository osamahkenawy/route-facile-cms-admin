import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner, Tabs, Tab } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CKEditorComponent from "../../../../components/CKEditor/CKEditor";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";

const CreateAdminPages = () => {
  const { id } = useParams();
  // const imageFileServer = process.env.REACT_APP_FILE_SERVER;
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title_en: "",
    title_ae: "",
    type: "",
    status: "",
    description_en: "",
    description_ae: "",
  });

  

  const [errors, setErrors] = useState({});
  const [editorErrors, setEditorErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if ((name === "mobile" || name === "desktop") && files[0]) {
      const file = files[0]; // Only allow one file
      const img = new Image();

      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (name === "desktop") {
          if (img.width === 800 && img.height === 403) {
            setFormData({
              ...formData,
              [name]: files[0],
            });
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: "Image must be exactly 800x403 pixels",
            }));
          }
        } else if (name === "mobile") {
          if (img.width === 390 && img.height === 196) {
            setFormData({
              ...formData,
              [name]: files[0],
            });
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: "Image must be exactly 390x196 pixels",
            }));
          }
        }
      };
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
      if (
        (!formData[key] && formData[key] != "0") ||
        (Array.isArray(formData[key]) && formData[key].length === 0)
      ) {
        newErrors[key] = "This field is required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formSubmitFunction = () => {
    const body = JSON.stringify({
      title_en: formData?.title_en,
      title_ae: formData?.title_ae,
      content_en: formData?.description_en,
      content_ae: formData?.description_ae,
      type: formData?.type,
      status: formData?.status,
    });

    const url = id
      ? configWeb.PUT_ADMIN_PAGES_UPDATE(id)
      : configWeb.POST_ADMIN_PAGES_CREATE;
    setLoading(true);
    const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
    apiCall(url, body)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(id ? "Updated Successfully" : "Created Successfully");
          navigate("/cms/admin-pages");
        } else {
          if (Array.isArray(res?.message)) {
            notifyError(res?.message[0]);
          } else {
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
      const url = configWeb.GET_ADMIN_PAGES_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              title_en: res?.title_en,
              title_ae: res?.title_ae,
              description_en: res?.content_en,
              description_ae: res?.content_ae,
              type: res?.type,
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
  useEffect(() => {
    if (id) {
      getDetails();
    }
  }, [id]);

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
            <Link to="/cms/admin-pages">
              <Button className="btn-def">Page List</Button>
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
                <Form.Label>Title (English)</Form.Label>
                <Form.Control
                  type="text"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleChange}
                  isInvalid={!!errors.title_en}
                />
                {errors.title_en && (
                  <span className="custom_error">{errors.title_en}</span>
                )}
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
                {errors.title_ae && (
                  <span className="custom_error">{errors.title_ae}</span>
                )}
              </Form.Group>
            </Col>
            <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  isInvalid={!!errors.type}
                />
                {errors.type && (
                  <span className="custom_error">{errors.type}</span>
                )}
              </Form.Group>
            </Col>
            <Col sm={12} md={6} lg={4} xl={3} className="mb-4">
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData?.status}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
                {errors.status && (
                  <span className="custom_error">{errors.status}</span>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* <Row>
      <Col sm={12} md={6} lg={4} className="mb-4">
          <Form.Group>
          <Form.Label>Mobile Offer Image ( size - 396*196 px)</Form.Label>
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
          <Form.Label>Desktop Offer Image( size - 800*403 px)</Form.Label>
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
    

      </Row> */}

 {/* Error messages above tabs */}
 
       {/* Tabs */}
       <Row className="mt-4 pt-4">
        <div className="col-6">
       {errors.description_en && (
                  <span className="custom_error">{errors.description_en}</span>
                )}
                </div>
        <div className="col-6">
        {errors.description_ae && (
                  <span className="custom_error">{errors.description_ae}</span>
                )}
                </div>
       <Tabs defaultActiveKey="english" id="language-tabs" className="mb-3 admin-page-tabs ">
        {/* English Tab */}
     
        <Tab eventKey="english" title="English Content" tabClassName="w-100"  >
       
        <Row>
            <Col>
              <Form.Group>
                <Form.Label>Content (EN)</Form.Label>
                <CKEditorComponent
                  language="en"
                  onContentChange={(content) =>
                    handleEditorChange("description_en", content)
                  }
                  contentW={formData?.description_en}
                  // contentW={tempContent}
                />
                {/* {errors.description_en && (
                  <span className="custom_error">{errors.description_en}</span>
                )} */}
              </Form.Group>
            </Col>
          </Row>
          </Tab>
        
            {/* Arabic Tab */}
        <Tab eventKey="arabic" title="Arabic Content" tabClassName="w-100">
        <Row>
            <Col className="mt-3">
              <Form.Group>
                <Form.Label>Content (AE)</Form.Label>
                <CKEditorComponent
                  language="ae"
                  onContentChange={(content) =>
                    handleEditorChange("description_ae", content)
                  }
                  contentW={formData?.description_ae}
                />
                {/* {errors.description_ae && (
                  <span className="custom_error">{errors.description_ae}</span>
                )} */}
              </Form.Group>
            </Col>
          </Row> 

        </Tab>
       
          </Tabs>
          </Row>

          {/* <Row>
            <Col>
              <Form.Group>
                <Form.Label>Content (EN)</Form.Label>
                <CKEditorComponent
                  language="en"
                  onContentChange={(content) =>
                    handleEditorChange("description_en", content)
                  }
                  contentW={formData?.description_en}
                  // contentW={tempContent}
                />
                {errors.description_en && (
                  <span className="custom_error">{errors.description_en}</span>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col className="mt-3">
              <Form.Group>
                <Form.Label>Content (AE)</Form.Label>
                <CKEditorComponent
                  language="en"
                  onContentChange={(content) =>
                    handleEditorChange("description_ae", content)
                  }
                  contentW={formData?.description_ae}
                />
                {errors.description_ae && (
                  <span className="custom_error">{errors.description_ae}</span>
                )}
              </Form.Group>
            </Col>
          </Row> */}

          <Button type="submit" disabled={loading} className="my-4 px-4 py-2 ">
            {" "}
            {loading ? <Spinner /> : id ? "Update" : "Submit"}
          </Button>
        </Form>
      )}
    </Container>
  );
};

export default CreateAdminPages;
