import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner } from "react-bootstrap";

import configWeb from "../../../components/config.js/ConfigWeb";
import { simplePutCallAuth } from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import { fetchData } from "../CustomHooks/reusableFunctions";

const OtherCharges = () => {
  const [editLoading, setEditLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    vat: false,
    delivery_charges: false,
    pay_now: false,
    collection_charges: false,
    monthly_pay_now_discount: false,
  });
  const [formData, setFormData] = useState({
    vat: "",
    delivery_charges: "",
    pay_now: "",
    collection_charges: "",
    monthly_pay_now_discount: "",
  });
  const [otherChargesList, setOtherChargesList] = useState([]);
  const [validated, setValidated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = (fieldName) => {
    // Validation can go here before triggering update logic
    if (formData[fieldName] === "") {
      setValidated(true);
      return;
    }
  };

  const handleSubmit = (e, type) => {
    e.preventDefault();
    if (formData[type] || formData[type] === 0) formSubmitFunction(type);
  };

  const formSubmitFunction = (type) => {
    let body = {};
    let array = otherChargesList?.filter((item) => item.key === type);

    const id = array[0]?.id;

    switch (type) {
      case "vat":
        body = {
          key: "vat",
          rate: formData.vat,
          id: id,
        };
        break;
      case "pay_now":
        body = {
          key: "pay_now",
          rate: formData.pay_now,
          id: id,
        };
        break;
      case "delivery_charges":
        body = {
          key: "delivery_charges",
          rate: formData.delivery_charges,
          id: id,
        };
        break;
      case "collection_charges":
        body = {
          key: "collection_charges",
          rate: formData.collection_charges,
          id: id,
        };
        break;
      case "monthly_pay_now_discount":
        body = {
          key: "monthly_pay_now_discount",
          rate: formData.monthly_pay_now_discount,
          id: id,
        };
        break;
    }

    setLoadingStates((prevState) => ({
      ...prevState,
      [type]: true,
    }));
    const url = configWeb.PUT_OTHER_CHARGES;
    const apiCall = simplePutCallAuth;
    apiCall(url, JSON.stringify(body))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(
            body.id ? "Updated Successfully" : "Created Successfully"
          );
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
        // Reset all loading states to false after the request is complete
        fetchData({
          url: configWeb.GET_OTHER_CHARGES_LIST,
          setter: setOtherChargesList,
        });
        setLoadingStates((prevState) => ({
          ...prevState,
          [type]: false,
        }));
      });
  };

  useEffect(() => {
    fetchData({
      url: configWeb.GET_OTHER_CHARGES_LIST,
      setter: setOtherChargesList,
      onFinally: () => setEditLoading(false),
    });
  }, []);

  useEffect(() => {
    if (otherChargesList) {
      const allowedKeys = [
        "vat",
        "delivery_charges",
        "pay_now",
        "collection_charges",
        "monthly_pay_now_discount",
      ];

      const updatedFormData = {};

      otherChargesList.forEach((item) => {
        if (allowedKeys.includes(item.key)) {
          updatedFormData[item.key] = item.rate;
        }
      });

      setFormData(updatedFormData);
    }

    return () => {};
  }, [otherChargesList]);

  return (
    <Container className="container">
      <div className="post_header">
        <Row></Row>
      </div>
      {editLoading ? (
        <div className="text-center">
          {" "}
          <Spinner />{" "}
        </div>
      ) : (
        <>
          <Form
            noValidate
            validated={validated}
            onSubmit={(e) => handleSubmit(e, "vat")}
          >
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="vat">
                <Form.Label>VAT Percentage</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter vat charges"
                  name="vat"
                  value={formData.vat}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please enter vat charges.
                </Form.Control.Feedback>
              </Form.Group>
              <Col md="auto" className="d-flex align-items-end">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => handleUpdate("vat")}
                  disabled={loadingStates.vat}
                >
                  {loadingStates.vat ? <Spinner /> : "Update"}
                </Button>
              </Col>
            </Row>
          </Form>

          <Form
            noValidate
            validated={validated}
            onSubmit={(e) => handleSubmit(e, "pay_now")}
          >
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="pay_now">
                <Form.Label>Pay Now Discount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter pay now discount"
                  name="pay_now"
                  value={formData.pay_now}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please enter pay now discount.
                </Form.Control.Feedback>
              </Form.Group>
              <Col md="auto" className="d-flex align-items-end">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => handleUpdate("pay_now")}
                  disabled={loadingStates.pay_now}
                >
                  {loadingStates.pay_now ? <Spinner /> : "Update"}
                </Button>
              </Col>
            </Row>
          </Form>
          <Form
            noValidate
            validated={validated}
            onSubmit={(e) => handleSubmit(e, "delivery_charges")}
          >
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="delivery_charges">
                <Form.Label>Delivery Charges</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter delivery charges"
                  name="delivery_charges"
                  value={formData.delivery_charges}
                  onChange={handleChange}
                  required
                  isInvalid={false}
                  isValid={false}
                />
                <Form.Control.Feedback type="invalid">
                  Please enter delivery charges.
                </Form.Control.Feedback>
              </Form.Group>
              <Col md="auto" className="d-flex align-items-end">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => handleUpdate("delivery_charges")}
                  disabled={loadingStates.delivery_charges}
                >
                  {loadingStates.delivery_charges ? <Spinner /> : "Update"}
                </Button>
              </Col>
            </Row>
          </Form>
          <Form
            noValidate
            validated={validated}
            onSubmit={(e) => handleSubmit(e, "collection_charges")}
          >
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="collection_charges">
                <Form.Label>Collection Charges</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter collection charges"
                  name="collection_charges"
                  value={formData.collection_charges}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please enter collection charges.
                </Form.Control.Feedback>
              </Form.Group>
              <Col md="auto" className="d-flex align-items-end">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => handleUpdate("collection_charges")}
                  disabled={loadingStates.collection_charges}
                >
                  {loadingStates.collection_charges ? <Spinner /> : "Update"}
                </Button>
              </Col>
            </Row>
          </Form>

          <Form
            noValidate
            validated={validated}
            onSubmit={(e) => handleSubmit(e, "monthly_pay_now_discount")}
          >
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="monthly_pay_now_discount">
                <Form.Label>Monthly Pay Now Discount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter monthly discount"
                  name="monthly_pay_now_discount"
                  value={formData.monthly_pay_now_discount}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please enter monthly pay now discount.
                </Form.Control.Feedback>
              </Form.Group>
              <Col md="auto" className="d-flex align-items-end">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => handleUpdate("monthly_pay_now_discount")}
                  disabled={loadingStates.monthly_pay_now_discount}
                >
                  {loadingStates.monthly_pay_now_discount ? (
                    <Spinner />
                  ) : (
                    "Update"
                  )}
                </Button>
              </Col>
            </Row>
          </Form>
          {}
        </>
      )}
    </Container>
  );
};

export default OtherCharges;
