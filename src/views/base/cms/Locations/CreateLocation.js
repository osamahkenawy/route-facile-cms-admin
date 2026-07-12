import React, { useState, useEffect, useRef } from "react";
import { Badge, Breadcrumb, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import { Link, useParams, useNavigate } from "react-router-dom";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";

const CreateLocation = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_en: "",
    name_ae: "",
    address_en: "",
    address_ae: "",
    status: 1,
    is_virtual: 0,
    order: 0,
    buffer_hours: "",
    pickup: 1,
    dropoff: 1,
    recipients: "",
    lat: "",
    long: "",
    contact_number: "",
    timing_detail_en: "",
    timing_detail_ae: "",
    parking_charges: "",
    emirate_id: "",

    location_opening_hours: Array.from({ length: 7 }, (_, dayIndex) => ({
      day: dayIndex + 1,
      shifts: [
        { shift: 1, from: "", to: "", is_closed: 0 },
        { shift: 2, from: "", to: "", is_closed: 0 },
      ],
    })),
  });

  const [errors, setErrors] = useState({});
  const timings = Array.from({ length: 25 }, (_, i) => `${i + 0}:00`);
  const [emiratesArray, setEmiratesArray] = useState([]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    const [day, shift, type] = name.split("_");

    if (
      day &&
      shift &&
      type &&
      name !== "timing_detail_ae" &&
      name !== "timing_detail_en"
    ) {
      setFormData((prevState) => {
        // Make a deep copy of the location_opening_hours array
        const updatedHours = prevState.location_opening_hours.map((dayObj) => {
          if (dayObj.day === parseInt(day)) {
            // Find the corresponding shift and update the type (from_hours or to_hours)
            return {
              ...dayObj,
              shifts: dayObj.shifts.map((shiftObj) => {
                if (shiftObj.shift === parseInt(shift)) {
                  // Handle "Is Closed" logic
                  if (value === "is_closed") {
                    return {
                      ...shiftObj,
                      is_closed: 1,
                      from: "", // Clear the from field
                      to: "", // Clear the to field
                    };
                  }
                  return {
                    ...shiftObj,
                    [type]: value, // update the correct field (from_hours or to_hours)
                    is_closed: 0, // Ensure "Is Closed" is reset when not selected
                  };
                }
                return shiftObj;
              }),
            };
          }
          return dayObj;
        });

        return { ...prevState, location_opening_hours: updatedHours };
      });
    } else {
      // Handle other form fields not related to location_opening_hours

      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // Validate the form
  const validate = () => {
    const newErrors = {};
    // Validate other fields in the formData object
    if (!formData.name_en) newErrors.name_en = "Name (EN) is required.";
    if (!formData.name_ae) newErrors.name_ae = "Name (AE) is required.";
    if (!formData.address_en)
      newErrors.address_en = "Address (EN) is required.";
    if (!formData.address_ae)
      newErrors.address_ae = "Address (AE) is required.";
    if (!formData.recipients) newErrors.recipients = "Recipients is required.";
    // if (!formData.status) newErrors.status = "Status is required.";
    // if (!formData.is_virtual) newErrors.is_virtual = "required.";
    if (!formData.timing_detail_en)
      newErrors.timing_detail_en = "Timing Detail (EN) is required.";
    if (!formData.timing_detail_ae)
      newErrors.timing_detail_ae = "Timing Detail (AE) is required.";
    if (formData.order === "" || formData.order === null)
      newErrors.order = "Order is required.";
    if (formData.buffer_hours === "" || formData.buffer_hours === null)
      newErrors.buffer_hours = "Buffer Hours are required.";
    // if (formData.pickup === "" || formData.pickup === null)
    //   newErrors.pickup = "Pickup is required.";
    // if (formData.dropoff === "" || formData.dropoff === null)
    //   newErrors.dropoff = "Dropoff is required.";
    if (!formData.lat) newErrors.lat = "Latitude is required.";
    if (!formData.long) newErrors.long = "Longitude is required.";
    if (!formData.contact_number)
      newErrors.contact_number = "Contact Number is required.";
    if (!formData.emirate_id) newErrors.emirate_id = "Emirate ID is required.";

    formData.location_opening_hours.forEach((day) => {
      if (!day.shifts[0].from && !day.shifts[0]?.is_closed)
        newErrors[`day${day.day}_shift${day.shifts[0].shift}_from`] = "Required";
      if (!day.shifts[0].to && !day.shifts[0]?.is_closed)
        newErrors[`day${day.day}_shift${day.shifts[0].shift}_to`] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      const recipientsArray = formData?.recipients
        ?.split(",")
        .map((item) => item.trim());
      const transformedOpeningHours = formData.location_opening_hours.flatMap(
        (day) => {
          return day.shifts.map((shift) => {
            // Function to convert time string (e.g., "4:00" or "3") to hours in 24-hour format
            const convertToHours = (time) => {
              if (!time) return 0; // Return 0 if the time is empty

              // Ensure time has minutes if it's just an hour (e.g., "3" becomes "3:00")
              if (!time.includes(":")) {
                time = time + ":00"; // Add minutes if missing
              }

              const [hour, minute] = time.split(":").map(Number);
              return hour + minute / 60; // Convert to decimal hours (e.g., 4:30 becomes 4.5)
            };

            // Creating a new object for each shift with the transformed format
            return {
              day: day.day, // Keep the original day
              shift: shift.shift, // Keep the original shift number
              from_hours: convertToHours(shift.from), // Convert 'from' time to hours
              to_hours: convertToHours(shift.to), // Convert 'to' time to hours
              is_closed: shift.is_closed, // Keep the original closed status
            };
          });
        }
      );

      const body = JSON.stringify({
        name_en: formData.name_en,
        name_ae: formData.name_ae,
        address_en: formData.address_en,
        address_ae: formData.address_ae,
        status: formData.status,
        is_virtual: formData.is_virtual,
        order: formData.order,
        buffer_hours: formData.buffer_hours,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        recipients: recipientsArray,
        lat: formData.lat,
        long: formData.long,
        contact_number: formData.contact_number,
        timing_detail_en: formData.timing_detail_en,
        timing_detail_ae: formData.timing_detail_ae,
        parking_charges: formData.parking_charges,
        emirate_id: formData.emirate_id,
        // created_by: formData.created_by,
        // updated_by: formData.updated_by,
        // deleted_by: formData.deleted_by,
        location_opening_hours: transformedOpeningHours,
      });

      const url = id
        ? configWeb.PUT_LOCATION(id)
        : configWeb.POST_CREATE_LOCATION;
      setLoading(true);
      const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
      apiCall(url, body)
        .then((res) => {
          if (res?.status === "success") {
            // setUserDetails(res);
            notifySuccess(id ? "Updated Successfully" : "Created Successfully");

            resolve(true);

            // if (id) {
            navigate("/cms/locations");
            // }
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      handleFormSubmit();
      // Submit form data
    } else {
      console.log("Validation errors:", errors);
    }
  };

  async function transformOpeningHours(inputArray) {
    // Helper to adjust "from_hours" and "to_hours" values
    async function adjustHours(hours) {
      // Simulate asynchronous adjustment logic (e.g., fetching from an API)
      return Promise.resolve(hours);
    }

    // Group by days
    const groupedByDays = await inputArray.reduce(async (accPromise, item) => {
     
      const acc = await accPromise;
      let dayEntry = acc.find((day) => day.day === item.day);

      if (!dayEntry) {
        dayEntry = {
          day: item.day,
          shifts: [],
        };
        acc.push(dayEntry);
      }

      // Add the shift for the current day
      const from = await adjustHours(item.from_hours);
      const to = await adjustHours(item.to_hours);

      dayEntry.shifts.push({
        shift: item.shift,
        from: String(from),
        to: String(to),
        is_closed: item.is_closed,
      });

      return acc;
    }, Promise.resolve([]));

    return groupedByDays;
  }

  const getDetails = () => {
    return new Promise((resolve, reject) => {
      const url = configWeb.GET_LOCATION_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            // setUserDetails(res);
            const data = res;
            // Transform the data
            (async () => {
              var transformedData; // Declare in a broader scope

              try {
                const arrayToCommaSeparatedString = (arr) => arr.join(", ");
                const transformedRecipients = arrayToCommaSeparatedString(
                  res?.recipients
                );
                transformedData = await transformOpeningHours(
                  res?.location_opening_hours
                );

             
                // Map the response data to the formData structure
                setFormData((prevData) => ({
                  ...prevData,
                  name_en: res?.name_en,
                  name_ae: res?.name_ae,
                  address_en: res?.address_en,
                  address_ae: res?.address_ae,
                  status: res?.status,
                  is_virtual: res?.is_virtual,
                  order: res?.order,
                  buffer_hours: res?.buffer_hours,
                  pickup: res?.pickup,
                  dropoff: res?.dropoff,
                  recipients: transformedRecipients,
                  lat: res?.lat,
                  long: res?.long,
                  contact_number: res?.contact_number,
                  timing_detail_en: res?.timing_detail_en,
                  timing_detail_ae: res?.timing_detail_ae,
                  parking_charges: res?.parking_charges,
                  emirate_id: res?.emirate_id,

                  location_opening_hours: transformedData,
                }));
              } catch (error) {
                console.error("Error transforming opening hours:", error);
              }
            })();

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

  const [exception_hours, setExceptionHours] = useState([]);

  const getExceptionHours = (location_id) => {
    return new Promise((resolve, reject) => {
      const url = configWeb.GET_LOCATION_EXCEPTION_HOURS(location_id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            const data = res.data;
            setExceptionHours(data || []);
            resolve(true);
          } else if (res?.error) {
            notifyError(res?.message[0]);
          }
        })
        .catch((error) => {
          console.error("Exception hours fetch failed:", error);
          resolve(false);
        });
    });
  };

  const handleAddRow = () => {
    setExceptionHours([
      ...exception_hours,
      {
        start_date: "",
        end_date: "",
        day: 1,
        shift: 1,
        from_hours: 0,
        to_hours: 0,
        is_closed: 1,
        location_id: id,
      },
    ]);
  };

  const handleRemoveRow = async (index) => {
    const row = exception_hours[index];

    if (row.id) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this exception hour?"
      );
      if (!confirmed) return;

      try {
        const url = configWeb.DELETE_LOCATION_EXCEPTION_HOURS(row.id);
        const res = await simpleDeleteCallAuth(url);
        if (res?.status === "success") {
          notifySuccess("Deleted successfully!");
          getExceptionHours(id); // Refresh list
        } else {
          notifyError(res?.message?.[0] || "Could not delete record.");
        }
      } catch (err) {
        console.error(err);
        notifyError("Something went wrong.");
      }
    } else {
      // Just remove from state
      const updatedRows = exception_hours.filter((_, i) => i !== index);
      setExceptionHours(updatedRows);
    }
  };

  const handleExceptionHourChange = (e, index) => {
    const { name, value } = e.target;
    const updatedHours = [...exception_hours];
    if ((name === "from_hours" || name === "to_hours") && value === "is_closed") {
      updatedHours[index] = {
        ...updatedHours[index],
        is_closed: 1,
        from_hours: "00",
        to_hours: "00",
      };
    } else {
      updatedHours[index] = {
        ...updatedHours[index],
        [name]: value,
        ...(name === "from_hours" && updatedHours[index].is_closed
          ? { is_closed: 0 }
          : {}),
        ...(name === "to_hours" && updatedHours[index].is_closed
          ? { is_closed: 0 }
          : {}),
      };
    }

    setExceptionHours(updatedHours);
  };

  const handleExceptionHourSubmit = async (e, index) => {
    e.preventDefault();
    const row = exception_hours[index];
    const payload = {
      start_date: row.start_date,
      end_date: row.end_date,
      day: row.day * 1,
      shift: row.shift * 1,
      from_hours: row.is_closed ? 0 : row.from_hours * 1,
      to_hours: row.is_closed ? 0 : row.to_hours * 1,
      is_closed: row.is_closed,
      location_id: id,
    };

    try {
      let res;
      if (row.id) {
        const url = configWeb.PUT_LOCATION_EXCEPTION_HOURS(row.id);
        res = await simplePutCallAuth(url, JSON.stringify(payload));
      } else {
        const url = configWeb.POST_LOCATION_EXCEPTION_HOURS(id);
        res = await simplePostCallAuth(url, JSON.stringify(payload));
      }

      if (res?.status === "success") {
        notifySuccess("Saved successfully!");
        getExceptionHours(id); // Refresh list
      } else {
        notifyError(res?.message?.[0] || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      notifyError("Something went wrong. Please try again later.");
    }
  };
  

  useEffect(() => {
    if (id) {
      getDetails();
      getExceptionHours(id);
    }
  }, []);

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

  return (
    <Container className="container">
      <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
        <Breadcrumb style={{ fontSize: "14px", marginBottom: 0 }}>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/cms/locations" }}>Locations</Breadcrumb.Item>
          <Breadcrumb.Item active>{id ? "Edit Location" : "Create Location"}</Breadcrumb.Item>
        </Breadcrumb>
        <Link to="/cms/locations">
          <Button variant="outline-primary" size="sm" style={{ borderRadius: "8px", fontWeight: 600 }}>
            Location List
          </Button>
        </Link>
      </div>
      {editLoading ? (
        <div className="text-center py-5">
          <Spinner />
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          {/* Section 1: Basic Information */}
          <Card className="mb-4" style={{ border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
            <Card.Header style={{ background: "linear-gradient(135deg, #4b6cb7, #182848)", color: "#fff", padding: "14px 24px" }}>
              <h6 className="mb-0" style={{ fontWeight: 600 }}>Basic Information</h6>
            </Card.Header>
            <Card.Body style={{ padding: "24px" }}>
              <Row>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="name_en" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Name (EN)</Form.Label>
                    <Form.Control type="text" name="name_en" value={formData.name_en} onChange={handleChange} isInvalid={!!errors.name_en} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.name_en}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="name_ae" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Name (AE)</Form.Label>
                    <Form.Control type="text" name="name_ae" value={formData.name_ae} onChange={handleChange} isInvalid={!!errors.name_ae} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.name_ae}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="address_en" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Address (EN)</Form.Label>
                    <Form.Control type="text" name="address_en" value={formData.address_en} onChange={handleChange} isInvalid={!!errors.address_en} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.address_en}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="address_ae" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Address (AE)</Form.Label>
                    <Form.Control type="text" name="address_ae" value={formData.address_ae} onChange={handleChange} isInvalid={!!errors.address_ae} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.address_ae}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="emirate_id" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Emirate</Form.Label>
                    <Form.Select name="emirate_id" value={formData.emirate_id} onChange={handleChange} isInvalid={!!errors.emirate_id} style={{ borderRadius: "8px" }}>
                      <option value="">Select Emirate</option>
                      {emiratesArray?.length > 0 && emiratesArray?.map((item) => (
                        <option key={item.id} value={item.id}>{item.name_en}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.emirate_id}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="status" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Status</Form.Label>
                    <Form.Select name="status" value={formData.status} onChange={handleChange} isInvalid={!!errors.status} style={{ borderRadius: "8px" }}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="is_virtual" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Virtual Location</Form.Label>
                    <Form.Select name="is_virtual" value={formData.is_virtual} onChange={handleChange} isInvalid={!!errors.is_virtual} style={{ borderRadius: "8px" }}>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.is_virtual}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="order" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Order</Form.Label>
                    <Form.Control type="number" min="0" name="order" value={formData.order} onChange={handleChange} isInvalid={!!errors.order} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.order}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Section 2: Service & Contact */}
          <Card className="mb-4" style={{ border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
            <Card.Header style={{ background: "linear-gradient(135deg, #2d8659, #1a5c3a)", color: "#fff", padding: "14px 24px" }}>
              <h6 className="mb-0" style={{ fontWeight: 600 }}>Service & Contact</h6>
            </Card.Header>
            <Card.Body style={{ padding: "24px" }}>
              <Row>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="pickup" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Pickup</Form.Label>
                    <Form.Select name="pickup" value={formData.pickup} onChange={handleChange} isInvalid={!!errors.pickup} style={{ borderRadius: "8px" }}>
                      <option value="1">Available</option>
                      <option value="0">Not Available</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.pickup}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="dropoff" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Dropoff</Form.Label>
                    <Form.Select name="dropoff" value={formData.dropoff} onChange={handleChange} isInvalid={!!errors.dropoff} style={{ borderRadius: "8px" }}>
                      <option value="1">Available</option>
                      <option value="0">Not Available</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.dropoff}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="buffer_hours" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Buffer Hours</Form.Label>
                    <Form.Control type="number" min="0" name="buffer_hours" value={formData.buffer_hours} onChange={handleChange} isInvalid={!!errors.buffer_hours} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.buffer_hours}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="parking_charges" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Parking Charges</Form.Label>
                    <Form.Control type="number" min="0" name="parking_charges" value={formData.parking_charges} onChange={handleChange} isInvalid={!!errors.parking_charges} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.parking_charges}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="contact_number" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Contact Number</Form.Label>
                    <Form.Control type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} isInvalid={!!errors.contact_number} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.contact_number}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={8} xl={6}>
                  <Form.Group controlId="recipients" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Recipients</Form.Label>
                    <Form.Control type="text" placeholder="Add multiple emails separated by commas" name="recipients" value={formData.recipients} onChange={handleChange} isInvalid={!!errors.recipients} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.recipients}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Section 3: Location & Map */}
          <Card className="mb-4" style={{ border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
            <Card.Header style={{ background: "linear-gradient(135deg, #c0392b, #8e2420)", color: "#fff", padding: "14px 24px" }}>
              <h6 className="mb-0" style={{ fontWeight: 600 }}>Location & Timing Details</h6>
            </Card.Header>
            <Card.Body style={{ padding: "24px" }}>
              <Row>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="lat" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Latitude</Form.Label>
                    <Form.Control type="text" name="lat" value={formData.lat} onChange={handleChange} isInvalid={!!errors.lat} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.lat}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="long" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Longitude</Form.Label>
                    <Form.Control type="text" name="long" value={formData.long} onChange={handleChange} isInvalid={!!errors.long} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.long}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="timing_detail_en" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Timing Detail (EN)</Form.Label>
                    <Form.Control type="text" name="timing_detail_en" value={formData.timing_detail_en} onChange={handleChange} isInvalid={!!errors.timing_detail_en} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.timing_detail_en}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4} xl={3}>
                  <Form.Group controlId="timing_detail_ae" className="mb-3">
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>Timing Detail (AE)</Form.Label>
                    <Form.Control type="text" name="timing_detail_ae" value={formData.timing_detail_ae} onChange={handleChange} isInvalid={!!errors.timing_detail_ae} style={{ borderRadius: "8px" }} />
                    <Form.Control.Feedback type="invalid">{errors.timing_detail_ae}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Section 4: Opening Hours */}
          <Card className="mb-4" style={{ border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
            <Card.Header style={{ background: "linear-gradient(135deg, #e67e22, #d35400)", color: "#fff", padding: "14px 24px" }}>
              <h6 className="mb-0" style={{ fontWeight: 600 }}>Weekly Opening Hours</h6>
            </Card.Header>
            <Card.Body style={{ padding: "24px", backgroundColor: "#fafbfc" }}>
              <Row>
                {formData?.location_opening_hours?.map((day, dayIndex) => (
                  <Col key={day.day} xs={12} md={6} lg={4} className="mb-3">
                    <Card style={{ border: "1px solid #eee", borderRadius: "10px" }}>
                      <Card.Header
                        className="text-center"
                        style={{
                          backgroundColor: dayIndex >= 5 ? "#fff3e0" : "#e8f0fe",
                          fontWeight: 700,
                          fontSize: "14px",
                          color: dayIndex >= 5 ? "#e67e22" : "#4b6cb7",
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {dayNames[dayIndex]}
                        {dayIndex >= 5 && <span style={{ fontSize: "11px", marginLeft: "6px", opacity: 0.7 }}></span>}
                      </Card.Header>
                      <Card.Body style={{ padding: "16px" }}>
                        {day?.shifts?.map((shift, shiftIndex) => (
                          <Row className="align-items-center mb-2 g-2" key={shiftIndex}>
                            <Col xs={6}>
                              <Form.Group controlId={`day${day.day}_shift${shift.shift}_from`}>
                                <Form.Label style={{ fontSize: "11px", fontWeight: 600, color: "#888", margin: 0 }}>
                                  Shift {shift.shift} From
                                </Form.Label>
                                <Form.Select
                                  size="sm"
                                  name={`${day.day}_${shift.shift}_from_hours`}
                                  value={shift.is_closed === 1 ? "is_closed" : shift.from}
                                  onChange={handleChange}
                                  isInvalid={!!errors[`day${day.day}_shift${shift.shift}_from`]}
                                  style={{ borderRadius: "6px", fontSize: "13px" }}
                                >
                                  <option value="">Select</option>
                                  <option value="is_closed">Closed</option>
                                  {timings?.map((time, i) => (
                                    <option key={i} value={i}>{time}</option>
                                  ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                  {errors[`day${day.day}_shift${shift.shift}_from`]}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col xs={6}>
                              <Form.Group controlId={`day${day.day}_shift${shift.shift}_to`}>
                                <Form.Label style={{ fontSize: "11px", fontWeight: 600, color: "#888", margin: 0 }}>
                                  Shift {shift.shift} To
                                </Form.Label>
                                <Form.Select
                                  size="sm"
                                  name={`${day.day}_${shift.shift}_to_hours`}
                                  value={shift.is_closed === 1 ? "is_closed" : shift.to}
                                  onChange={handleChange}
                                  isInvalid={!!errors[`day${day.day}_shift${shift.shift}_to`]}
                                  style={{ borderRadius: "6px", fontSize: "13px" }}
                                >
                                  <option value="">Select</option>
                                  <option value="is_closed">Closed</option>
                                  {timings.map((time, i) => (
                                    <option key={i} value={i}>{time}</option>
                                  ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                  {errors[`day${day.day}_shift${shift.shift}_to`]}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            {shiftIndex === 0 && day?.shifts?.length > 1 && (
                              <Col xs={12}><hr style={{ margin: "8px 0", borderColor: "#eee" }} /></Col>
                            )}
                          </Row>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-end mb-4">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              style={{
                borderRadius: "10px",
                padding: "10px 40px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #4b6cb7, #182848)",
                border: "none",
              }}
            >
              {loading ? <Spinner size="sm" /> : id ? "Update Location" : "Create Location"}
            </Button>
          </div>
        </Form>
      )}

      {/* Exception Hours Section — only show when editing an existing location */}
      {id && !editLoading && <Card className="mt-4 mb-4" style={{ border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" }}>
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(135deg, #4b6cb7, #182848)",
            color: "#fff",
            padding: "16px 24px",
          }}
        >
          <div>
            <h5 className="mb-0" style={{ fontWeight: 600 }}>
              Exception Hours
            </h5>
            <small style={{ opacity: 0.8 }}>
              Manage special operating hours for holidays, Ramadan, and other events
            </small>
          </div>
          <Button
            variant="light"
            size="sm"
            onClick={() => handleAddRow()}
            style={{ fontWeight: 600, borderRadius: "8px", padding: "6px 16px" }}
          >
            + Add Exception
          </Button>
        </Card.Header>
        <Card.Body style={{ padding: "24px", backgroundColor: "#fafbfc" }}>
          {exception_hours?.length === 0 && (
            <div
              className="text-center py-5"
              style={{ color: "#999" }}
            >
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>&#128197;</div>
              <p className="mb-0">No exception hours configured</p>
              <small>Click "+ Add Exception" to set special operating hours</small>
            </div>
          )}

          {exception_hours?.map((row, index) => (
            <Form
              onSubmit={(e) => handleExceptionHourSubmit(e, index)}
              key={row.id || `new-${index}`}
            >
              <Card
                className="mb-3"
                style={{
                  border: row.id ? "1px solid #d4edda" : "1px solid #cce5ff",
                  borderRadius: "10px",
                  borderLeft: row.id ? "4px solid #28a745" : "4px solid #007bff",
                }}
              >
                <Card.Body style={{ padding: "20px" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <strong style={{ fontSize: "14px", color: "#555" }}>
                        #{index + 1}
                      </strong>
                      {row.id ? (
                        <Badge bg="success" pill style={{ fontSize: "11px" }}>
                          Saved
                        </Badge>
                      ) : (
                        <Badge bg="primary" pill style={{ fontSize: "11px" }}>
                          New
                        </Badge>
                      )}
                      {row.is_closed === 1 && (
                        <Badge bg="danger" pill style={{ fontSize: "11px" }}>
                          Closed
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      style={{ borderRadius: "8px", padding: "4px 12px" }}
                    >
                      Remove
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col xs={12} sm={6} md={4} lg={2}>
                      <Form.Group controlId={`start_date-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          Start Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="start_date"
                          value={row.start_date}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          onMouseDown={(e) => e.target.showPicker()}
                          required
                          style={{ borderRadius: "8px" }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} sm={6} md={4} lg={2}>
                      <Form.Group controlId={`end_date-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          End Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="end_date"
                          value={row.end_date}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          onMouseDown={(e) => e.target.showPicker()}
                          required
                          min={row.start_date || undefined}
                          style={{ borderRadius: "8px" }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} sm={6} md={4} lg={2}>
                      <Form.Group controlId={`day-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          Day
                        </Form.Label>
                        <Form.Select
                          name="day"
                          value={row.day}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          style={{ borderRadius: "8px" }}
                        >
                          {dayNames?.map((item, i) => (
                            <option key={`${item}_${i}`} value={i + 1}>
                              {item}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={6} sm={3} md={2} lg={1}>
                      <Form.Group controlId={`shift-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          Shift
                        </Form.Label>
                        <Form.Select
                          name="shift"
                          value={row.shift}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          style={{ borderRadius: "8px" }}
                        >
                          <option value="1">First</option>
                          <option value="2">Second</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={6} sm={3} md={3} lg={2}>
                      <Form.Group controlId={`from_hours-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          From
                        </Form.Label>
                        <Form.Select
                          name="from_hours"
                          value={row?.is_closed ? "is_closed" : row?.from_hours}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          style={{ borderRadius: "8px" }}
                        >
                          <option value="is_closed">Closed</option>
                          {timings.map((time, i) => (
                            <option key={i} value={i}>
                              {time}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={6} sm={3} md={3} lg={1}>
                      <Form.Group controlId={`to_hours-${index}`}>
                        <Form.Label style={{ fontSize: "12px", fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
                          To
                        </Form.Label>
                        <Form.Select
                          name="to_hours"
                          value={row.is_closed ? "is_closed" : row.to_hours}
                          onChange={(e) => handleExceptionHourChange(e, index)}
                          style={{ borderRadius: "8px" }}
                        >
                          <option value="is_closed">Closed</option>
                          {timings.map((time, i) => (
                            <option key={i} value={i}>
                              {time}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={6} sm={3} md={2} lg={2} className="d-flex align-items-end">
                      <Button
                        variant={row?.id ? "outline-primary" : "primary"}
                        type="submit"
                        className="w-100"
                        style={{ borderRadius: "8px", fontWeight: 600 }}
                      >
                        {row?.id ? "Update" : "Save"}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form>
          ))}
        </Card.Body>
      </Card>}
    </Container>
  );
};

export default CreateLocation;
