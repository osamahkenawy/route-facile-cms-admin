import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";
import { simpleGetCallAuth, simplePostCallAuth, simplePutCallAuth } from "../../../../components/config.js/Setup";

const Create = () => {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    name_en: "",
    name_ae: ""
  });

  const [errors, setErrors] = useState({});
  const [editorErrors, setEditorErrors] = useState({});

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prevData) => ({ ...prevData, [name]: value }));

    if (value) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if ((!formData[key] && formData[key] != "0") || (Array.isArray(formData[key]) && formData[key].length === 0)) {
        newErrors[key] = "This field is required";
      }
    });
    console.log("newErrors-->", newErrors)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formSubmitFunction = () => {

    const body = JSON.stringify({
      name_en: formData?.name_en,
      name_ae: formData?.name_ae,
      status: parseInt(formData?.status)
    })

    const url = id ? configWeb.PUT_CAR_GROUP(id) : configWeb.POST_CAR_GROUP;
    setLoading(true);
    const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
    apiCall(url, body)
      .then((res) => {
        if (res?.status === "success") {

          notifySuccess(id ? "Updated Successfully" : "Created Successfully");
          navigate("/car/group");


        } else {
          if (Array.isArray(res?.message)) {
            notifyError(res?.message[0]);
          } else {
            notifyError(res?.message);
          }

        }
      })
      .catch((error) => {
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


  useEffect(() => {
    return () => {
    }
  }, [])

  const getDetails = () => {
    return new Promise((resolve, reject) => {
      const url = configWeb.GET_CAR_GROUP_DETAIL(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              name_en: res?.name_en,
              name_ae: res?.name_ae
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
  }, [id])

  return (
    <Container className="container">
      <div className="post_header">
        <Row>
          <Col
            lg="12"
            className="mt-4 d-flex justify-content-end align-items-center"
          >
            <Link to="/car/group">
              <Button className="btn-def">Car Group List</Button>
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
                <Form.Label>Car Group Name (English)</Form.Label>
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
                <Form.Label>Car Group Name (Arabic)</Form.Label>
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

          <Button type="submit" disabled={loading} className="my-4 px-4 py-2 "> {loading ? <Spinner /> : "Submit"}</Button>
        </Form>
      )}
    </Container>

  )
}

export default Create