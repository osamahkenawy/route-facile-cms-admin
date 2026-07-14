import React, { useState, useEffect, useRef } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  multipartPostCall,
  simpleGetCallAuth,
  simplePostCall,
  simplePostCallAll,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import Select from "react-select";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import { Link, useNavigate, useParams } from "react-router-dom";

const CreateStopSale = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [editLoading, setEditLoading] = useState(id ? true : false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    city_id: "",

    car_ids: {
      all: false,
      ids: [],
    },
    location_id: null,

    status: 1,
  });
  const [errors, setErrors] = useState({
    car_ids: false,
  });
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [mappedCarArray, setMappedCarArray] = useState([]);
  const [carArray, setCarArray] = useState([]);
  const [locationArray, setLocationArray] = useState([]);
  const [citiesArray, setCitiesArray] = useState([]);

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

  useEffect(() => {
    if (carArray?.length > 0) {
      const carArrayTemp = carArray?.map((car) => ({
        value: car.id,
        label: car.name_en,
      }));
      setMappedCarArray([{ value: "all", label: "All" }, ...carArrayTemp]);
    }
  }, [carArray]);
  // Ref for the file input
  const handleChange = (e) => {
    const { name, value, type } = e.target || {};

    // Handle other input types
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const validateForm = () => {
    const newErrors = {
      car_ids: !formData.car_ids.all && formData.car_ids.ids.length === 0,
    };
    setErrors(newErrors);

    // Return true if there are no validation errors
    return !Object.values(newErrors).includes(true);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const validate = validateForm();

    if (form.checkValidity() === false || !validate) {
      e.stopPropagation();
      setValidated(true);
    } else {
      // Handle form submission
      handleFormSubmit();
      setValidated(false);
    }
    // setValidated(true);
  };

  const handleFormSubmit = () => {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        start_date: formData?.start_date,
        end_date: formData?.end_date,
        city_id: formData?.city_id,
        location_id: formData?.location_id,
        car_ids: formData?.car_ids,
        status: formData?.status,
      });

      const url = id
        ? configWeb.PUT_UPDATE_STOP_SALE(id)
        : configWeb.POST_CREATE_STOP_SALE;
      setLoading(true);
      const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
      apiCall(url, body)
        .then((res) => {
          if (res?.status === "success") {
            // setUserDetails(res);
            notifySuccess(
              `${id ? "Updated Successfully" : "Created Successfully"} `
            );
            navigate("/stop-sale/stop-sale-list");
            resolve(true);
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
          console.error("api failed:", error);
          notifyError("Something went wrong. Please try again letter.");
          resolve(false);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

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
    carData();
    citiesData();
    locationData();
  }, []);
  const getDetails = () => {
    return new Promise((resolve, reject) => {
      const url = configWeb.GET_DETAIL_STOP_SALE(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            setFormData((prevData) => ({
              ...prevData,
              status: res?.status,
              start_date: res?.start_date,
              end_date: res?.end_date,
              city_id: res?.city_id,
              location_id: res?.location_id,
              car_ids: res?.car_ids,
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
  return (
    <Container className="container">
      <div className="post_header">
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/stop-sale/stop-sale-list">
            <Button className="btn-def">Stop Sale List</Button>
          </Link>
        </Col>
      </div>
      {editLoading ? (
        <div className="text-center">
          {" "}
          <Spinner />
        </div>
      ) : (
        <Form
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
          className="form"
        >
          <Row className="mb-3">
            <Col sm={12} md={6} lg={6} className="mb-2">
              <Form.Group className="mb-3">
                <Form.Label> Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  onMouseDown={(e) => e.target.showPicker()}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please select start date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col sm={12} md={6} lg={6} className="mb-2">
              <Form.Group className="mb-3">
                <Form.Label> End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  id="end_date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  onMouseDown={(e) => e.target.showPicker()}
                />
                <Form.Control.Feedback type="invalid">
                  Please select end date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col sm={12} md={6} lg={6} className="mb-2">
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select City</option>
                  {citiesArray?.length > 0 &&
                    citiesArray?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name_en}{" "}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select city.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col sm={12} md={6} lg={6} className="mb-2">
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Select
                  name="location_id"
                  value={formData?.location_id}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  {locationArray?.length > 0 &&
                    locationArray?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name_en}{" "}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select location.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={12} md={6} lg={6} className="mb-2">
              <Form.Group>
                <Form.Label>Car</Form.Label>
                <Select
                  isMulti
                  name="car_ids"
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
                />
                {errors.car_ids && (
                  <div className="invalid-feedback custom_error---">
                    Please select at least one car or choose "All".
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col sm={12} md={6} lg={6} className="mb-2">
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

          <Button type="submit" className="mt-3" disabled={loading}>
            {loading ? <Spinner /> : "Submit"}
          </Button>
        </Form>
      )}
    </Container>
  );
};

export default CreateStopSale;
