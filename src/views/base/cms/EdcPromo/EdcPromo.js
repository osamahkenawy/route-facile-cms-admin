import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";

const EdcPromo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    promo_code: "",
    discount_percentage: 0,
    discount_type: "percentage",
    fixed_discount_amount: 0,
    is_active: true,
    valid_from: "",
    valid_until: "",
    max_uses: 0,
    max_uses_per_user: 0,
    current_uses: 0,
    min_rental_days: 1,
    applicable_vehicles: "all",
    description_en: "",
    description_ar: "",
  });

  const [validated, setValidated] = useState(false);

  const getEdcPromo = () => {
    setLoading(true);
    const url = configWeb.GET_EDC_PROMO;

    simpleGetCallAuth(url)
      .then((res) => {
        if (res?.data) {
          const data = res.data;
          setFormData({
            promo_code: data.promo_code || "",
            discount_percentage: data.discount_percentage || 0,
            discount_type: data.discount_type || "percentage",
            fixed_discount_amount: data.fixed_discount_amount || 0,
            is_active: data.is_active ?? true,
            valid_from: data.valid_from ? data.valid_from.split("T")[0] : "",
            valid_until: data.valid_until ? data.valid_until.split("T")[0] : "",
            max_uses: data.max_uses || 0,
            max_uses_per_user: data.max_uses_per_user || 0,
            current_uses: data.current_uses || 0,
            min_rental_days: data.min_rental_days || 1,
            applicable_vehicles: data.applicable_vehicles || "all",
            description_en: data.description_en || "",
            description_ar: data.description_ar || "",
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching EDC promo:", error);
        notifyError("Failed to load EDC promo settings");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getEdcPromo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setSaving(true);
    const url = configWeb.PUT_EDC_PROMO;
    const body = JSON.stringify({
      ...formData,
      discount_percentage: Number(formData.discount_percentage),
      fixed_discount_amount: Number(formData.fixed_discount_amount),
      max_uses: Number(formData.max_uses),
      max_uses_per_user: Number(formData.max_uses_per_user),
      min_rental_days: Number(formData.min_rental_days),
      is_active: formData.is_active === true || formData.is_active === "true" || formData.is_active === 1,
    });

    simplePutCallAuth(url, body)
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("EDC Promo settings saved successfully");
        } else {
          notifyError(res?.message?.[0] || res?.message || "Failed to save settings");
        }
      })
      .catch((error) => {
        console.error("Error saving EDC promo:", error);
        notifyError("Something went wrong. Please try again.");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading EDC Promo Settings...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h4 className="mb-0">EDC Promo Code Management</h4>
          <small className="text-muted">
            Manage the exclusive promo code for Emirates Driving Company members
          </small>
        </Col>
      </Row>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        {/* Promo Code & Status */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Basic Settings</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} md={6} lg={4} className="mb-3">
                <Form.Group controlId="promo_code">
                  <Form.Label>Promo Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleChange}
                    placeholder="e.g., EDCVIP2025"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a promo code.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} lg={4} className="mb-3">
                <Form.Group controlId="is_active">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="is_active"
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_active: e.target.value === "true"
                    }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} lg={4} className="mb-3">
                <Form.Group controlId="current_uses">
                  <Form.Label>Current Uses</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.current_uses}
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    Read-only usage count
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Discount Settings */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Discount Settings</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} md={6} lg={4} className="mb-3">
                <Form.Group controlId="discount_type">
                  <Form.Label>Discount Type</Form.Label>
                  <Form.Select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {formData.discount_type === "percentage" ? (
                <Col xs={12} md={6} lg={4} className="mb-3">
                  <Form.Group controlId="discount_percentage">
                    <Form.Label>Discount Percentage (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="discount_percentage"
                      value={formData.discount_percentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid percentage (0-100).
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ) : (
                <Col xs={12} md={6} lg={4} className="mb-3">
                  <Form.Group controlId="fixed_discount_amount">
                    <Form.Label>Fixed Discount Amount (AED)</Form.Label>
                    <Form.Control
                      type="number"
                      name="fixed_discount_amount"
                      value={formData.fixed_discount_amount}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid amount.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}

              <Col xs={12} md={6} lg={4} className="mb-3">
                <Form.Group controlId="min_rental_days">
                  <Form.Label>Minimum Rental Days</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_rental_days"
                    value={formData.min_rental_days}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Minimum rental days must be at least 1.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Validity Period */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Validity Period</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="valid_from">
                  <Form.Label>Valid From</Form.Label>
                  <Form.Control
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleChange}
                    onMouseDown={(e) => e.target.showPicker()}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select a start date.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="valid_until">
                  <Form.Label>Valid Until</Form.Label>
                  <Form.Control
                    type="date"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleChange}
                    onMouseDown={(e) => e.target.showPicker()}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select an end date.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Usage Limits */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Usage Limits</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="max_uses">
                  <Form.Label>Max Total Uses</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_uses"
                    value={formData.max_uses}
                    onChange={handleChange}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Enter 0 for unlimited uses
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="max_uses_per_user">
                  <Form.Label>Max Uses Per User</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_uses_per_user"
                    value={formData.max_uses_per_user}
                    onChange={handleChange}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Enter 0 for unlimited uses per user
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Applicable Vehicles */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Applicable Vehicles</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} className="mb-3">
                <Form.Group controlId="applicable_vehicles">
                  <Form.Label>Vehicle Categories</Form.Label>
                  <Form.Select
                    name="applicable_vehicles"
                    value={formData.applicable_vehicles}
                    onChange={handleChange}
                  >
                    <option value="all">All Vehicles</option>
                    <option value="economy">Economy</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Description */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Description</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="description_en">
                  <Form.Label>Description (English)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleChange}
                    placeholder="e.g., Exclusive discount for EDC members"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6} className="mb-3">
                <Form.Group controlId="description_ar">
                  <Form.Label>Description (Arabic)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleChange}
                    placeholder="مثال: خصم حصري لأعضاء مؤسسة الإمارات للتعليم"
                    dir="rtl"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Submit Button */}
        <Row>
          <Col className="d-flex justify-content-end">
            <Button
              type="submit"
              className="btn-def"
              disabled={saving}
              style={{ minWidth: "150px" }}
            >
              {saving ? <Spinner size="sm" /> : "Save Settings"}
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default EdcPromo;







