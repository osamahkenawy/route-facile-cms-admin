import React, { useState, useEffect, useRef } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import { Link, useParams, useNavigate } from "react-router-dom";
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

const EditEmirate = () => {
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
    status: 1,
    buffer_hours: "",
    recipients: "",
    contact_number:"",
    location_opening_hours: Array.from({ length: 7 }, (_, dayIndex) => ({
      day: dayIndex + 1,
      shifts: [
        { shift: 1, from: "", to: "", is_closed: 0 },
        // { shift: 2, from: "", to: "", is_closed: 0 },
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
      // shift &&
      type &&
      name !== "timing_detail_ae" &&
      name !== "timing_detail_en"
    ) {
      
      setFormData((prevState) => {
        // Make a deep copy of the location_opening_hours array
        const updatedHours = prevState.location_opening_hours.map((dayObj) => {
        
          if (dayObj.day === parseInt(day)) {
            console.log("git it", dayObj)
            // Find the corresponding shift and update the type (from_hours or to_hours)
            return {
              ...dayObj,
              shifts: dayObj.shifts.map((shiftObj) => {
              
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
               }),
            };
          }
          return dayObj;
        });
        console.log("jj-->",day, shift, type, updatedHours)

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
    if (!formData.recipients) newErrors.recipients = "Recipients is required.";
    if (!formData.contact_number) newErrors.contact_number = "Contact number is required.";
    if (formData.buffer_hours === "" || formData.buffer_hours === null)  newErrors.buffer_hours = "Buffer Hours are required.";
     
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
        status: formData.status,
        buffer_hours: formData.buffer_hours,
        recipients: recipientsArray,
        contact_number : formData.contact_number,
        emirate_opening_hours: transformedOpeningHours,
      });

      const url = 
         configWeb.PUT_EMIRATE_UPDATE(id);
        
      setLoading(true);
      const apiCall = simplePutCallAuth
      apiCall(url, body)
        .then((res) => {
          if (res?.status === "success") {
            // setUserDetails(res);
            notifySuccess("Updated Successfully");

            resolve(true);

            // if (id) {
            navigate("/cms/emirates");
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
    console.log("inputArray-->",inputArray)
    // Helper to adjust "from_hours" and "to_hours" values
    async function adjustHours(hours) {
      // Simulate asynchronous adjustment logic (e.g., fetching from an API)
      return Promise.resolve(hours);
    }

    // Group by days
    const groupedByDays = await inputArray.reduce(async (accPromise, item) => {
      console.log("item-->", item)
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
      // setDeleteLoading(true);
      const url = configWeb.GET_EMIRATE_DETAILS(id);
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
                  res?.emirate_opening_hours
                );
                console.log("transformedData-->",transformedData)

             
                // Map the response data to the formData structure
                setFormData((prevData) => ({
                  ...prevData,
                  name_en: res?.name_en,
                  name_ae: res?.name_ae,
                  status: res?.status,
                  buffer_hours: res?.buffer_hours,
                  recipients: transformedRecipients,
                  contact_number: res?.contact_number,
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
  useEffect(() => {
    if (id) {
      getDetails();
    }
  }, [id]);

 
  return (
    <Container className="container">
      <div className="post_header">
        <Row>
          <Col
            lg="12"
            className="mt-4 d-flex justify-content-end align-items-center"
          >
            <Link to="/cms/emirates">
              <Button className="btn-def">Emirate List</Button>
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
        
          <Row className="mb-3">
            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="name_en" className="mb-3">
                <Form.Label>Name (EN)</Form.Label>
                <Form.Control
                  type="text"
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleChange}
                  isInvalid={!!errors.name_en}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name_en}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="name_ae" className="mb-3">
                <Form.Label>Name (AE)</Form.Label>
                <Form.Control
                  type="text"
                  name="name_ae"
                  value={formData.name_ae}
                  onChange={handleChange}
                  isInvalid={!!errors.name_ae}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name_ae}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

          

            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="status" className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  isInvalid={!!errors.status}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.status}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
       

            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="buffer_hours" className="mb-3">
                <Form.Label>Buffer Hours</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="buffer_hours"
                  value={formData.buffer_hours}
                  onChange={handleChange}
                  isInvalid={!!errors.buffer_hours}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.buffer_hours}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="contact_number" className="mb-3">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  isInvalid={!!errors.contact_number}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.contact_number}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4} xl={3}>
              <Form.Group controlId="recipients" className="mb-3">
                <Form.Label>Recipients</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="add mulitple with comma"
                  name="recipients"
                  value={formData.recipients}
                  onChange={handleChange}
                  isInvalid={!!errors.recipients}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.recipients}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

           
          </Row>
          {/* Weekly timing fields */}
          <h5>Emirate Opening Hours</h5>
       
          <Row className="mb-3-">
            {formData?.location_opening_hours?.map((day, dayIndex) => (
              <Col
                key={day.day}
                xs={12}
                md={6}
                lg={4} // 3 items per row for large screens
                className="mb-3"
              >
                
                <Row className="mb-">
                  <Col xs={12}>
                    <h6>{dayNames[dayIndex]}</h6> {/* Display day name */}
                    {day?.shifts?.map((shift, shiftIndex) => (
                      <Row className="align-items-center mb-3" key={shiftIndex}>
                        <Col xs={6} md={6}>
                          <Form.Group
                            controlId={`day${day.day}_shift${shift.shift}_from`}
                            className="mb-2"
                          >
                            <Form.Label>
                              {/* Shift {shift.shift} */} From Time
                            </Form.Label>
                            {console.log("shift.from-->",shift.from)}
                            <Form.Select
                              name={`${day.day}_${shift.shift}_from_hours`}
                              value={
                                shift.is_closed === 1 ? "is_closed" : shift.from
                              }

                              onChange={handleChange}
                              isInvalid={
                                !!errors[
                                  `day${day.day}_shift${shift.shift}_from`
                                ]
                              }
                            >
                              <option value="">Select Time</option>
                              <option value="is_closed">Closed</option>
                              {timings?.map((time, i) => (
                                <option key={i} value={i}>
                                  {time}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors[`day${day.day}_shift${shift.shift}_from`]}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col xs={6} md={6}>
                          <Form.Group
                            controlId={`day${day.day}_shift${shift.shift}_to`}
                            className="mb-2"
                          >
                            <Form.Label>{/* Shift {shift.shift} */} To Time</Form.Label>
                            <Form.Select
                              name={`${day.day}_${shift.shift}_to_hours`}
                              value={
                                shift.is_closed === 1 ? "is_closed" : shift.to
                              }
                              onChange={handleChange}
                              isInvalid={
                                !!errors[`day${day.day}_shift${shift.shift}_to`]
                              }
                            >
                              <option value="">Select Time</option>
                              <option value="is_closed">Closed</option>
                              {timings.map((time, i) => (
                                <option key={i} value={i}>
                                  {time}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors[`day${day.day}_shift${shift.shift}_to`]}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}
                  </Col>
                </Row>
              </Col>
            ))}
          </Row>

          <Button className="mb-3" type="submit" disabled={loading}>
            {loading ? <Spinner /> : id ? "Update" : "Submit"}
          </Button>
        </Form>
      )}
    </Container>
  );
};

export default EditEmirate;
