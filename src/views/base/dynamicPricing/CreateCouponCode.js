import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import { Link, useParams , useNavigate} from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  multipartPostCall,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import Select from "react-select";
import { notifyError, notifySuccess } from "../../../components/notify/notify";

const CreateCouponCode = () => {
  const { id } = useParams();
  const navigate = useNavigate()
 const [editLoading, setEditLoading] = useState(id ? true : false);
  const [formData, setFormData] = useState({
    type: "daily",
    discount_type: "percentage",
    code: "",
    start_date: "",
    end_date: "",
    rate: "",
    cdw: "",
    scdw: "",
    pai: "",
    gps: "",
    baby_seat: "",
    driver: "",
    status: 1,
    car_ids: {
      all: false,
      ids: [],
    },
    city_ids: {
      all: false,
      ids: [],
    },
    group_ids: {
      all: false,
      ids: [],
    },
    location_ids: {
      all: false,
      ids: [],
    },
  });


  const getDetails = () => {
    return new Promise((resolve, reject) => {
     
    // setDeleteLoading(true);
      const url = configWeb.GET_DISCOUNT_COUPON_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            // setUserDetails(res);
            const data = res;

            // Map the response data to the formData structure
            setFormData((prevData) => ({
              ...prevData,
              type: data.type ,
              discount_type: data.discount_type ,
              note: data.note ,
              applicable_for: data.applicable_for,
              code: data.code ,
              start_date: data.start_date ,
              end_date: data.end_date,
              rate: data.rate ,
              cdw: data.cdw ,
              scdw: data.scdw ,
              pai: data.pai ,
              gps: data.gps ,
              baby_seat: data.baby_seat ,
              driver: data.driver ,
              status: data.status || prevData.status,
              car_ids: data.car_ids || prevData.car_ids,
              city_ids: data.city_ids || prevData.city_ids,
              group_ids: data.group_ids || prevData.group_ids,
              location_ids: data.location_ids || prevData.location_ids,
            }));
            
        
            resolve(true);
          } else if (res?.error) {
            notifyError(res?.message[0]);
          }
        })
        .catch((error) => {
          console.error("Banner failed:", error);
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
  const [carGroupArray, setCarGroupArray] = useState([]);
  const [locationArray, setLocationArray] = useState([]);
  const [citiesArray, setCitiesArray] = useState([]);
  const [carArray, setCarArray] = useState([]);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    car_ids: false,
    city_ids: false,
    group_ids: false,
    location_ids: false,
  });

  // Options for dropdowns
  const dropdownOptions = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "all", label: "All" },
  ];

  // Handle change for all text and number fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'applicable_for') {
      setFormData((prev) => {
        const current = prev.applicable_for || [];
        const updated = checked
          ? [...current, value]
          : current.filter((v) => v !== value);
  
        return { ...prev, applicable_for: updated };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle change for multi-select dropdowns
  const handleMultiSelectChange = (selectedOptions, fieldName) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    const isAllSelected = values.includes("all");
    const selectedIds = isAllSelected
      ? []
      : values.filter((id) => id !== "all");

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: {
        all: isAllSelected,
        ids: selectedIds,
      },
    }));

    // Set validation error if neither "all" nor any IDs are selected
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: !isAllSelected && selectedIds.length === 0,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      car_ids: !formData.car_ids.all && formData.car_ids.ids.length === 0,
      city_ids:
        !formData.city_ids.all && formData.city_ids.ids.length === 0,
      group_ids: !formData.group_ids.all && formData.group_ids.ids.length === 0,
      location_ids:
        !formData.location_ids.all && formData.location_ids.ids.length === 0,
    };
    setErrors(newErrors);

    // Return true if there are no validation errors
    return !Object.values(newErrors).includes(true);
  };
  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    setValidated(true);
   const validate =validateForm();
    if (event.currentTarget.checkValidity() === false || !validate) {
      event.stopPropagation();
      return;
    } else {
      handleFormSubmit();
      setValidated(false)
    }
  };

  const carGroupData = () => {
    const url = `${configWeb.GET_CAR_GROUPS}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setCarGroupArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  const carData = () => {
    const url = `${configWeb.GET_CAR}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setCarArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  const citiesData = () => {
    const url = `${configWeb.GET_CITIES}?page_size=9999`;

    simpleGetCallAuth(url)
      .then((res) => {
        setCitiesArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  const locationData = () => {
    const url = configWeb.GET_LOCATIONS;
    simpleGetCallAuth(url)
      .then((res) => {
        setLocationArray(res?.data || []);
      })
      .catch((errr) => {
        console.log("errr", errr);
      })
      .finally(() => {
        // set_loading(false);
      });
  };
  useEffect(() => {
    citiesData();
    carGroupData();
    carData();
    locationData();
  }, []);
  const [mappedCitiesArray, setMappedCitiesArray] = useState([]);
  useEffect(() => {
    if (citiesArray?.length > 0) {
      const citiesArrayTemp = citiesArray?.map((city) => ({
        value: city.id,
        label: city.name_en,
      }));
      setMappedCitiesArray([
        { value: "all", label: "All" },
        ...citiesArrayTemp,
      ]);
    }
  }, [citiesArray]);
  const [mappedLocationArray, setMappedLocationArray] = useState([
    /* {value:"all", label:"All"} */
  ]);
  
  // Filter locations based on selected Cities, Groups, and Cars
  const filteredLocationArray = useMemo(() => {
    if (!locationArray || locationArray.length === 0) {
      return [];
    }

    let filtered = [...locationArray];

    // Filter by Cities if selected
    if (!formData.city_ids.all && formData.city_ids.ids.length > 0) {
      filtered = filtered.filter((location) =>
        formData.city_ids.ids.includes(location.city_id)
      );
    }

    // Filter by Groups if selected (assuming locations have group_id or similar relationship)
    // Note: Adjust this based on your actual data structure
    if (!formData.group_ids.all && formData.group_ids.ids.length > 0) {
      // If locations have a direct group_id relationship, uncomment below:
      // filtered = filtered.filter((location) =>
      //   formData.group_ids.ids.includes(location.group_id)
      // );
      // For now, we'll keep all locations if groups are selected
      // This can be adjusted based on your API/data structure
    }

    // Filter by Cars if selected (assuming locations have car_id or similar relationship)
    // Note: Adjust this based on your actual data structure
    if (!formData.car_ids.all && formData.car_ids.ids.length > 0) {
      // If locations have a direct car_id relationship, uncomment below:
      // filtered = filtered.filter((location) =>
      //   formData.car_ids.ids.includes(location.car_id)
      // );
      // For now, we'll keep all locations if cars are selected
      // This can be adjusted based on your API/data structure
    }

    return filtered;
  }, [
    locationArray,
    formData.city_ids.all,
    formData.city_ids.ids,
    formData.group_ids.all,
    formData.group_ids.ids,
    formData.car_ids.all,
    formData.car_ids.ids,
  ]);

  useEffect(() => {
    if (filteredLocationArray?.length >= 0) {
      const locationArrayTemp = filteredLocationArray?.map((location) => ({
        value: location.id,
        label: location.name_en,
      }));
      setMappedLocationArray([
        { value: "all", label: "All" },
        ...locationArrayTemp,
      ]);

      // Only reset location selection if:
      // 1. Location data has loaded (locationArray is not empty)
      // 2. Not in edit mode loading state
      // 3. Selected locations are no longer in the filtered list
      if (
        locationArray.length > 0 && 
        !editLoading &&
        !formData.location_ids.all && 
        formData.location_ids.ids.length > 0
      ) {
        const availableLocationIds = filteredLocationArray.map((loc) => loc.id);
        const validSelectedIds = formData.location_ids.ids.filter((id) =>
          availableLocationIds.includes(id)
        );

        // If some selected locations are no longer available, update the selection
        if (validSelectedIds.length !== formData.location_ids.ids.length) {
          setFormData((prevData) => ({
            ...prevData,
            location_ids: {
              all: false,
              ids: validSelectedIds,
            },
          }));
        }
      }
    }
  }, [filteredLocationArray, locationArray.length, editLoading]);
  const [mappedCarArray, setMappedCarArray] = useState([]);
  useEffect(() => {
    if (carArray?.length > 0) {
      const carArrayTemp = carArray?.map((car) => ({
        value: car.id,
        label: car.name_en,
      }));
      setMappedCarArray([{ value: "all", label: "All" }, ...carArrayTemp]);
    }
  }, [carArray]);
  const [mappedCarGroupArray, setMappedCarGroupArray] = useState([]);
  useEffect(() => {
    if (carGroupArray?.length > 0) {
      const carGroupArrayTemp = carGroupArray?.map((car) => ({
        value: car.id,
        label: car.name_en,
      }));
      setMappedCarGroupArray([
        { value: "all", label: "All" },
        ...carGroupArrayTemp,
      ]);
    }
  }, [carGroupArray]);

  const handleFormSubmit = () => {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        type: formData.type,
        discount_type: formData.discount_type,
        code: formData.code,
        start_date: formData.start_date,
        end_date: formData.end_date,
        rate: formData.rate,
        cdw: formData.cdw,
        scdw: formData.scdw,
        pai: formData.pai,
        gps: formData.gps,
        baby_seat: formData.baby_seat,
        driver: formData.driver,
        car_ids: formData.car_ids,
        city_ids: formData.city_ids,
        group_ids: formData.group_ids,
        location_ids: formData.location_ids,
        status: formData.status,
        applicable_for: formData.applicable_for,
        note: formData.note
      });
      // const url = configWeb.POST_DISCOUNT_COUPON;
      // setLoading(true);
      // simplePostCallAuth(url, body)
      const url = id
      ? configWeb.PUT_DISCOUNT_COUPON(id)
      : configWeb.POST_DISCOUNT_COUPON;
    setLoading(true);
    const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
    apiCall(url, body)
        .then((res) => {
          if (res?.status === "success") {
            // setUserDetails(res);
            notifySuccess(id ? "Updated Successfully": "Created Successfully");

            resolve(true);
            // setFormData({
            //   type: "daily",
            //   discount_type: "percentage",
            //   code: "",
            //   start_date: "",
            //   end_date: "",
            //   rate: "",
            //   cdw: "",
            //   scdw: "",
            //   pai: "",
            //   gps: "",
            //   baby_seat: "",
            //   driver: "",
            //   status: 1,
            //   car_ids: {
            //     all: false,
            //     ids: [],
            //   },
            //   city_ids: {
            //     all: false,
            //     ids: [],
            //   },
            //   group_ids: {
            //     all: false,
            //     ids: [],
            //   },
            //   location_ids: {
            //     all: false,
            //     ids: [],
            //   },
            // });
           
              navigate("/dynamicpricing/coupon-code")
      
            // setCity([]);
            // setLocation([]);
            // // Clear the file input after successful form submission
          } else {
            if (Array.isArray(res?.message)) {
              notifyError(res?.message[0] || "Somthing is wrong.");
            } else {
              notifyError(res?.message || "Somthing is wrong.");
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
    <Container fluid className="py-4">
      {/* Header Section with Title and Action Buttons */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="py-3">
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <h4 className="mb-0 fw-bold text-primary">
                {id ? "Edit Coupon Code" : "Create New Coupon Code"}
              </h4>
              <small className="text-muted">
                {id ? "Update the coupon details below" : "Fill in the details to create a new discount coupon"}
              </small>
            </Col>
            <Col xs={12} md={6} className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Link to="/dynamicpricing/coupon-code" className="text-decoration-none">
                <Button 
                  variant="light"
                  className="border"
                  style={{ 
                    color: '#333333', 
                    borderColor: '#dee2e6',
                    fontWeight: '500'
                  }}
                >
                  Back to List
                </Button>
              </Link>
              <Button 
                type="submit" 
                form="coupon-form"
                variant="primary"
                disabled={loading || editLoading}
                className="px-4"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  id ? "Update Coupon" : "Create Coupon"
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {editLoading ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading coupon details...</p>
          </Card.Body>
        </Card>
      ) : (
        <Form
          id="coupon-form"
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
        >
          {/* Basic Information Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light border-0 py-3">
              <h6 className="mb-0 fw-semibold">Basic Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="code">
                    <Form.Label className="fw-medium">Coupon Code <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      placeholder="Enter coupon code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a code.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="status">
                    <Form.Label className="fw-medium">Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-medium">Applicable For</Form.Label>
                    <div className="d-flex gap-3 pt-2">
                      {['web', 'api', 'mobile'].map((item) => (
                        <Form.Check
                          key={`applicable_for-${item}`}
                          type="checkbox"
                          id={`applicable-${item}`}
                          name="applicable_for"
                          label={item.charAt(0).toUpperCase() + item.slice(1)}
                          value={item}
                          checked={formData.applicable_for?.includes(item)}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="note">
                    <Form.Label className="fw-medium">Note</Form.Label>
                    <Form.Control
                      type="text"
                      name="note"
                      placeholder="Optional note"
                      value={formData.note}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Date Range Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light border-0 py-3">
              <h6 className="mb-0 fw-semibold">Validity Period</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Group controlId="start_date">
                    <Form.Label className="fw-medium">Start Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
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
                  <Form.Group controlId="end_date">
                    <Form.Label className="fw-medium">End Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
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

          {/* Discount Rates Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light border-0 py-3">
              <h6 className="mb-0 fw-semibold">Discount Rates (%)</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="rate">
                    <Form.Label className="fw-medium">Rate <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="rate"
                      placeholder="0"
                      value={formData.rate}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a rate.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="cdw">
                    <Form.Label className="fw-medium">CDW <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="cdw"
                      placeholder="0"
                      value={formData.cdw}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter CDW.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="scdw">
                    <Form.Label className="fw-medium">SCDW <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="scdw"
                      placeholder="0"
                      value={formData.scdw}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter SCDW.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="pai">
                    <Form.Label className="fw-medium">PAI <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="pai"
                      placeholder="0"
                      value={formData.pai}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter PAI.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="gps">
                    <Form.Label className="fw-medium">GPS <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="gps"
                      placeholder="0"
                      value={formData.gps}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter GPS.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="baby_seat">
                    <Form.Label className="fw-medium">Baby Seat <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="baby_seat"
                      placeholder="0"
                      value={formData.baby_seat}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter Baby Seat.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={6} md={4} lg={3} className="mb-3">
                  <Form.Group controlId="driver">
                    <Form.Label className="fw-medium">Driver <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="driver"
                      placeholder="0"
                      value={formData.driver}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter Driver.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Applicability Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light border-0 py-3">
              <h6 className="mb-0 fw-semibold">Applicability</h6>
              <small className="text-muted">Select where this coupon applies. Choose "All" or specific items.</small>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="city_ids">
                    <Form.Label className="fw-medium">City <span className="text-danger">*</span></Form.Label>
                    <Select
                      isMulti
                      name="city_ids"
                      placeholder="Select Cities..."
                      value={mappedCitiesArray?.filter((option) =>
                        formData.city_ids.all
                          ? option.value === "all"
                          : formData.city_ids.ids.includes(option.value)
                      )}
                      options={mappedCitiesArray}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(selectedOptions, "city_ids")
                      }
                      className={`basic-multi-select ${errors.city_ids ? "is-invalid" : ""}`}
                      classNamePrefix="select"
                    />
                    {errors.city_ids && (
                      <div className="invalid-feedback d-block">
                        Please select at least one city or choose "All".
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="location_ids">
                    <Form.Label className="fw-medium">
                      Location <span className="text-danger">*</span>
                      {!formData.city_ids.all && formData.city_ids.ids.length > 0 && (
                        <small className="text-info ms-1">(Filtered by City)</small>
                      )}
                    </Form.Label>
                    <Select
                      isMulti
                      name="location_ids"
                      placeholder="Select Locations..."
                      value={mappedLocationArray.filter((option) =>
                        formData.location_ids.all
                          ? option.value === "all"
                          : formData.location_ids.ids.includes(option.value)
                      )}
                      options={mappedLocationArray}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(selectedOptions, "location_ids")
                      }
                      className={`basic-multi-select ${errors.location_ids ? "is-invalid" : ""}`}
                      classNamePrefix="select"
                      noOptionsMessage={() => 
                        !formData.city_ids.all && formData.city_ids.ids.length > 0 
                          ? "No locations in selected cities" 
                          : "No locations available"
                      }
                    />
                    {errors.location_ids && (
                      <div className="invalid-feedback d-block">
                        Please select at least one location or choose "All".
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="group_ids">
                    <Form.Label className="fw-medium">Car Group <span className="text-danger">*</span></Form.Label>
                    <Select
                      isMulti
                      name="group_ids"
                      placeholder="Select Groups..."
                      value={mappedCarGroupArray?.filter((option) =>
                        formData.group_ids.all
                          ? option.value === "all"
                          : formData.group_ids.ids.includes(option.value)
                      )}
                      options={mappedCarGroupArray}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(selectedOptions, "group_ids")
                      }
                      className={`basic-multi-select ${errors.group_ids ? "is-invalid" : ""}`}
                      classNamePrefix="select"
                    />
                    {errors.group_ids && (
                      <div className="invalid-feedback d-block">
                        Please select at least one group or choose "All".
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3} className="mb-3">
                  <Form.Group controlId="car_ids">
                    <Form.Label className="fw-medium">Car <span className="text-danger">*</span></Form.Label>
                    <Select
                      isMulti
                      name="car_ids"
                      placeholder="Select Cars..."
                      value={mappedCarArray?.filter((option) =>
                        formData.car_ids.all
                          ? option.value === "all"
                          : formData.car_ids.ids.includes(option.value)
                      )}
                      options={mappedCarArray}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(selectedOptions, "car_ids")
                      }
                      className={`basic-multi-select ${errors.car_ids ? "is-invalid" : ""}`}
                      classNamePrefix="select"
                    />
                    {errors.car_ids && (
                      <div className="invalid-feedback d-block">
                        Please select at least one car or choose "All".
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Form>
      )}
    </Container>
  );
};

export default CreateCouponCode;
