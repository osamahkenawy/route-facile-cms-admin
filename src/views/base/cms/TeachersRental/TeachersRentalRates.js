import React, { useState, useRef } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import Teachers_Sample from "../../../../assets/Files/Teachers.xlsx"
import configWeb from "../../../../components/config.js/ConfigWeb";
import { multipartPostCall } from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";

const TeachersRentalRates = () => {

  const [formData, setFormData] = useState({
    excel_file: "",

  });

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  // Ref for the file input
  const fileInputRef = useRef(null);

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

  const handleSampleDownload = () => {
    const file = Teachers_Sample;
    const link = document.createElement("a");
    link.href = file;
    link.download = "Teachers_Sample.xlsx";
    link.click();
  }


  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let valid = true;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
    } else {
      // Handle form submission
      handleFormSubmit()
      setValidated(false);
    }
  };

  const handleFormSubmit = () => {
    return new Promise((resolve, reject) => {
      const appendFormData = new FormData();
      appendFormData.append("file", formData?.excel_file);
      const url = configWeb.TEACHERS_RATE;
      setLoading(true);
      multipartPostCall(url, appendFormData)
        .then((res) => {
          if (res?.status === true) {
            notifySuccess("Uploaded Successfully");
            resolve(true);
            setFormData({
              excel_file: ""
            });
            // Clear the file input after successful form submission
            setFormData((prevData) => ({ ...prevData, excel_file: "" }));
            if (fileInputRef.current) {
              fileInputRef.current.value = ""; // Reset the file input field
            }
          } else {
            if (Array.isArray(res?.message)) {
              notifyError(res?.message[0]);
            } else {
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

  return (
    <Container className="container">
        <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/cms/teachers-rental">
            <Button className="btn-def">Back</Button>
          </Link>
        </Col>
      </Row>
      <div className="post_header">

      </div>
      <Form noValidate validated={validated} onSubmit={handleSubmit} className="form">

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
          {loading ? <Spinner /> : "Submit"}

        </Button>
      </Form>

    </Container>

  )
}

export default TeachersRentalRates