import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import { Link, useNavigate, useParams } from "react-router-dom";
import configWeb from "../../../components/config.js/ConfigWeb";
import {
  multipartPostCall,
  simpleGetCallAuth,
  simplePostCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import Select from "react-select";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
// import useFilterByIds from "../CustomHooks/useFilterById";

const CreateSurge = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(id ? true : false);
 
  const [formData, setFormData] = useState({
   
    name_en: "",
    name_ar: "",
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

  const getDetails = () => {
    return new Promise((resolve, reject) => {
     
    // setDeleteLoading(true);
      const url = configWeb.GET_SURGE_DETAILS(id);
      simpleGetCallAuth(url)
        .then((res) => {
          if (res) {
            // setUserDetails(res);
            const data = res;

            // Map the response data to the formData structure
            setFormData((prevData) => ({
              ...prevData,
              name_en: data.name_en,
    name_ar: data.name_ae,
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
  // Options for dropdowns
  const dropdownOptions = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "all", label: "All" },
  ];

  // Handle change for all text and number fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
    const validate = validateForm();
    if (event.currentTarget.checkValidity() === false || !validate) {
      event.stopPropagation();
      return;
    } else {
      handleFormSubmit();
      setValidated(false);
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

  // const city = useMemo(() => {
  //   return formData.city_ids.all 
  //     ? mappedCitiesArray.filter(option => option.value !== "all") // Exclude "all"
  //     : mappedCitiesArray?.filter(option => formData.city_ids.ids.includes(option.value));
  // }, [formData.city_ids, mappedCitiesArray]);

  // const selectedIds = useMemo(() => city?.map((loc) => loc.value), [city]);

  //  const filteredLocationArray = useFilterByIds(locationArray, selectedIds);

  useEffect(() => {
    if (locationArray?.length > 0) {
      const locationArrayTemp = locationArray?.map((location) => ({
        value: location.id,
        label: location.name_en,
      }));
      setMappedLocationArray([
        { value: "all", label: "All" },
        ...locationArrayTemp,
      ]);
    }
  }, [locationArray]);
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
        name_en: formData.name_en,
        name_ae: formData.name_ar,

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
      });
      // const url = configWeb.POST_SURGE;
      // setLoading(true);
      // simplePostCallAuth(url, body)
      const url = id
      ? configWeb.PUT_SURGE(id)
      : configWeb.POST_SURGE;
    setLoading(true);
    const apiCall = id ? simplePutCallAuth : simplePostCallAuth;
    apiCall(url, body)
        .then((res) => {
          if (res?.status === "success") {

            // setUserDetails(res);
            if(id){
            notifySuccess("Updated Successfully");
            } else{
              notifySuccess("Created Successfully");
            }

            resolve(true);
            setFormData({
              type: "daily",
              discount_type: "percentage",
              name_en: "",
              name_ar: "",
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
            // setCity([]);
            // setLocation([]);
            // // Clear the file input after successful form submission
            if(id){
              navigate("/dynamic-pricing/surge-pricing")
            }
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
    <Container className="container">
      <div className="post_header">
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
          <Link to="/dynamic-pricing/surge-pricing">
            <Button className="btn-def">Surge List</Button>
          </Link>
        </Col>
      </Row>
      </div>
      {editLoading ? <div className="text-center"> <Spinner /> </div>: (
      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
        className="form"
      >
        <Row className="mb-3">
          <Col xs={12} md={6} lg={4} className="mb-3">
            <Form.Group controlId="name_en">
              <Form.Label>Name English</Form.Label>
              <Form.Control
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleChange}
                required
              />

              <Form.Control.Feedback type="invalid">
                Please enter english name.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col xs={12} md={6} lg={4} className="mb-3">
            <Form.Group controlId="name_ar">
              <Form.Label>Name Arabic</Form.Label>
              <Form.Control
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleChange}
                required
              />

              <Form.Control.Feedback type="invalid">
                Please enter arabic name.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          {/* </Row> */}

          {/* <Row className="mb-3"> */}
          {/* <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="code">
              <Form.Label>Code</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a code.
              </Form.Control.Feedback>
            </Form.Group>
          </Col> */}

          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="status">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Please select a status.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          {/* </Row> */}

          {/* <Row className="mb-3"> */}
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="start_date">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please select a start date.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="end_date">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please select an end date.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          {/* </Row> */}

          {/* <Row className="mb-3"> */}
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="rate">
              <Form.Label>Rate</Form.Label>
              <Form.Control
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a rate.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="cdw">
              <Form.Label>CDW</Form.Label>
              <Form.Control
                type="number"
                name="cdw"
                value={formData.cdw}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a CDW.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="scdw">
              <Form.Label>SCDW</Form.Label>
              <Form.Control
                type="number"
                name="scdw"
                value={formData.scdw}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a SCDW.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="pai">
              <Form.Label>PAI</Form.Label>
              <Form.Control
                type="number"
                name="pai"
                value={formData.pai}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a PAI.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="gps">
              <Form.Label>GPS</Form.Label>
              <Form.Control
                type="number"
                name="gps"
                value={formData.gps}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a GPS.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="baby_seat">
              <Form.Label>Baby Seat</Form.Label>
              <Form.Control
                type="number"
                name="baby_seat"
                value={formData.baby_seat}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a baby seat.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="baby_seat">
              <Form.Label>Driver</Form.Label>
              <Form.Control
                type="number"
                name="driver"
                value={formData.driver}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a Driver.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          {/* </Row> */}

          {/* Separate Multi-Select Dropdowns for car_ids, city_ids, group_ids, location_ids */}
          {/* <Row className="mb-3"> */}
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="car_ids">
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
                // className="basic-multi-select"
                className={`basic-multi-select ${errors.car_ids ? "is-invalid" : ""}`}
                // classNamePrefix="select"
              />
              {errors.car_ids && (
                <div className="invalid-feedback custom_error---">
                  Please select at least one car or choose "All".
                </div>
              )}
            </Form.Group>
          </Col>

          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="city_ids">
              <Form.Label>City</Form.Label>
              <Select
                isMulti
                name="city_ids"
                value={mappedCitiesArray?.filter((option) =>
                  formData.city_ids.all
                    ? option.value === "all"
                    : formData.city_ids.ids.includes(option.value)
                )}
                options={mappedCitiesArray}
                onChange={(selectedOptions) =>
                  handleMultiSelectChange(selectedOptions, "city_ids")
                }
                // className="basic-multi-select"
                className={`basic-multi-select ${errors.city_ids ? "is-invalid" : ""}`}
                classNamePrefix="select"
              />
              {errors.city_ids && (
                <div className="invalid-feedback custom_error---">
                  Please select at least one city or choose "All".
                </div>
              )}
            </Form.Group>
          </Col>
          {/* </Row> */}

          {/* <Row className="mb-3"> */}
          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="group_ids">
              <Form.Label>Group</Form.Label>
              <Select
                isMulti
                name="group_ids"
                value={mappedCarGroupArray?.filter((option) =>
                  formData.group_ids.all
                    ? option.value === "all"
                    : formData.group_ids.ids.includes(option.value)
                )}
                options={mappedCarGroupArray}
                onChange={(selectedOptions) =>
                  handleMultiSelectChange(selectedOptions, "group_ids")
                }
                // className="basic-multi-select"
                className={`basic-multi-select ${errors.group_ids ? "is-invalid" : ""}`}
                classNamePrefix="select"
              />
              {errors.group_ids && (
                <div className="invalid-feedback custom_error---">
                  Please select at least one group or choose "All".
                </div>
              )}
            </Form.Group>
          </Col>

          <Col className="mb-3" xs={12} md={6} lg={4}>
            <Form.Group controlId="location_ids">
              <Form.Label>Location</Form.Label>
              <Select
                isMulti
                name="location_ids"
                value={mappedLocationArray.filter((option) =>
                  formData.location_ids.all
                    ? option.value === "all"
                    : formData.location_ids.ids.includes(option.value)
                )}
                options={mappedLocationArray}
                onChange={(selectedOptions) =>
                  handleMultiSelectChange(selectedOptions, "location_ids")
                }
                className={`basic-multi-select ${errors.location_ids ? "is-invalid" : ""}`} // Add invalid class
                classNamePrefix="select"
              />
              {errors.location_ids && (
                <div className="invalid-feedback custom_error---">
                  Please select at least one location or choose "All".
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : "Submit"}
        </Button>
      </Form>
      )}
     </Container>
  );
};

export default CreateSurge;
