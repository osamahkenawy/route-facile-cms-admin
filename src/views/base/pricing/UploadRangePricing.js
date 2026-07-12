import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";

import configWeb from "../../../components/config.js/ConfigWeb";
import {
  multipartPostCall,
  simpleGetCallAuth,
} from "../../../components/config.js/Setup";
import Select from "react-select";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import daily_range_bms_template from "../../../assets/Files/daily_range_bms_template.xlsx";
import useFilterById from "../CustomHooks/useFilterById";

const UploadRangePricing = () => {
  const [emiratesArray, setEmiratesArray] = useState([]);
  const [locationArray, setLocationArray] = useState([]);
  const handleEmirateChange = (selectedOptions) => {
    setEmirateError(
      !selectedOptions /*  || selectedOptions?.value?.length === 0 */
    );
    setEmirate(selectedOptions);
  };
  const handleLocationChange = (selectedOptions) => {
    
    setLocationError(
      !selectedOptions /*  || selectedOptions?.value?.length === 0 */
    );
    setLocation(selectedOptions);
  };
  const [formData, setFormData] = useState({
    year: "",
    emirate: [],
    excel_file: "",
    emiratesRate: false,
    start_date: "",
    end_date: "",
  });
  const [emirate, setEmirate] = useState([]);
  const [location, setLocation] = useState([]);

  const [emirateError, setEmirateError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [dateError, setDateError] = useState("");

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  // Ref for the file input
  const fileInputRef = useRef(null);

 

  // Common handleChange function for inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target || {};

    if (name === "emiratesRate") {
     
      setFormData((prevData) => ({
        ...prevData,
        emiratesRate: !prevData.emiratesRate,
      }));
      setLocation([]);
      setLocationError(false); // Clear location error when toggling delivery rates
    } else{
    // Handle other input types
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }
  };

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

  const handleSampleDownload = (type) => {
    if (type === "simple") {
      // Generate simple CSV template (for use with form dates)
      const csvContent = "CAR GROUP,START DAY,END DAY,AMOUNT\n";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "daily_range_bms_simple_template.csv";
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Full template (original)
      const file = daily_range_bms_template;
      const link = document.createElement("a");
      link.href = file;
      link.download = "daily_range_bms_template.xlsx";
      link.click();
    }
  };

  // Validate date fields: both must be provided together, end >= start
  const validateDates = () => {
    const { start_date, end_date } = formData;
    if (start_date && !end_date) {
      return "End Date is required when Start Date is provided.";
    }
    if (!start_date && end_date) {
      return "Start Date is required when End Date is provided.";
    }
    if (start_date && end_date && end_date < start_date) {
      return "End Date must be equal to or after Start Date.";
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let valid = true;
    let locationValidation = formData?.emiratesRate
      ? true
      : location.length > 0
      ? true
      : false;

    // Validate dates
    const dateValidationError = validateDates();
    setDateError(dateValidationError);

    if (
      form.checkValidity() === false ||
      !valid ||
      emirate.length === 0 ||
      !locationValidation ||
      dateValidationError
    ) {
      e.stopPropagation();
      setValidated(true);
      setEmirateError(emirate.length === 0);
      setLocationError(location.length === 0);
    } else {
      // Handle form submission
      setEmirateError(false);
      setLocationError(false);
      setDateError("");
      handleFormSubmit();
      setValidated(false);
    }
  };

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
  const locationData = () => {
    // Fetch all locations including virtual ones by not specifying is_virtual parameter
    // or you can add ?page_size=9999 to get all locations
    const url = `${configWeb.GET_LOCATIONS}?page_size=9999`;
    simpleGetCallAuth(url)
      .then((res) => {
         setLocationArray(res?.data || []) ;
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
    locationData();
  }, []);
  const [mappedEmiratesArray, setMappedEmiratesArray] = useState([]);
  const [mappedLocationArray, setMappedLocationArray] = useState([]);

  const selectedIds = useMemo(() => emirate?.map((loc) => loc.value), [emirate]);


  const filteredLocationArray = useFilterById(locationArray, selectedIds);



  useEffect(() => {
    if (filteredLocationArray?.length >= 0) {
      const activeLocations =
        filteredLocationArray?.filter((location) => {
          const status = location?.status;
          return status === 1 || status === "1" || status === true;
        }) || [];

      const locationArrayTemp = activeLocations.map((location) => ({
        value: location.id,
        label: location.is_virtual ? `${location.name_en} (Virtual)` : location.name_en,
        isVirtual: location.is_virtual,
      }));
      setMappedLocationArray(locationArrayTemp);
      setLocation(locationArrayTemp); // Auto-select all locations by default
      setLocationError(false);
    }
  }, [filteredLocationArray]);
  useEffect(() => {
    if (emiratesArray?.length > 0) {
      const emiratesArrayTemp = emiratesArray?.map((emirate) => ({
        value: emirate.id,
        label: emirate.name_en,
      }));
      setMappedEmiratesArray(emiratesArrayTemp);
    }
  }, [emiratesArray]);

  const handleFormSubmit = () => {
    return new Promise((resolve, reject) => {
      const appendFormData = new FormData();

      appendFormData.append("file", formData?.excel_file);
      appendFormData.append(
        "emirate_ids",
        emirate?.map((item) => item.value)
      );

      !formData.emiratesRate &&
        appendFormData.append(
          "location_ids",
          location?.map((item) => item.value)
        );

      // Append optional date fields if provided
      if (formData.start_date) {
        appendFormData.append("start_date", formData.start_date);
      }
      if (formData.end_date) {
        appendFormData.append("end_date", formData.end_date);
      }

      const url = configWeb.POST_RANGE_PRICE;
      setLoading(true);
      multipartPostCall(url, appendFormData)
        .then((res) => {
          if (res?.status === true) {
            notifySuccess("Uploaded Successfully");

            resolve(true);
            setFormData({
              year: "",
              emirate: [],
              excel_file: "",
              emiratesRate: false,
              start_date: "",
              end_date: "",
            });
            setEmirate([]);
            setLocation([]);
            setDateError("");
            // Clear the file input after successful form submission
            setFormData((prevData) => ({ ...prevData, excel_file: "" }));
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
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
          notifyError("Something went wrong. Please try again later.");
          resolve(false);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
 
 

  return (
    <Container className="container">
      <div className="post_header"></div>
      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
        className="form"
      >
        <Row className="mb-3">
          <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="emirate">
              <Form.Label>Emirate</Form.Label>
             
              <Select
                value={emirate}
                isMulti
                name="emirate"
                options={mappedEmiratesArray}
                isSearchable
                className="basic-multi-select"
                // classNamePrefix="select"
                required
               
                onChange={handleEmirateChange}
              />
              {emirateError && (
                <div className="custom_error">
                  Please select at least one emirate.
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>
      
        <Row className="mb-3">
          <Col sm={12} md={12} lg={6}>
            <Form.Group controlId="emiratesRate">
              <Form.Check
                type="checkbox"
                name="emiratesRate"
                label="Delivery Rates"
                checked={formData.emiratesRate}
                onChange={handleChange}
                isValid={false}
             
              />
            </Form.Group>
          </Col>
        </Row>
       
        <Row className="mb-3">
          <Col sm={12} md={12} lg={6}>
            <Form.Group controlId="location">
              <Form.Label>Locations</Form.Label>
             
              <Select
                value={location}
                isMulti
                name="location"
                options={mappedLocationArray?.length > 0 ? mappedLocationArray   : [{ value: "", label: "Please select emirate first", isDisabled: true }]}
                // options={filteredLocationArray}
                isSearchable
                className="basic-multi-select"
                // classNamePrefix="select"
                placeholder={mappedLocationArray?.length > 0 ? "Select locations (includes virtual locations)" : "Please select emirate first"}
                required={!formData.emiratesRate}
                isDisabled={formData.emiratesRate}
                            
                onChange={handleLocationChange}
              />
              {locationError && !formData.emiratesRate && (
                <div className="custom_error">
                  Please select at least one location.
                </div>
              )}
              {!formData.emiratesRate && mappedLocationArray?.length > 0 && (
                <Form.Text className="text-muted">
                  Virtual locations are marked with (Virtual) suffix
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col sm={12} md={6} lg={3} className="mb-2">
            <Form.Group controlId="start_date">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
            </Form.Group>
          </Col>
          <Col sm={12} md={6} lg={3} className="mb-2">
            <Form.Group controlId="end_date">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                onMouseDown={(e) => e.target.showPicker()}
                min={formData.start_date || undefined}
              />
            </Form.Group>
          </Col>
          {dateError && (
            <Col sm={12} md={12} lg={6}>
              <div className="custom_error">{dateError}</div>
            </Col>
          )}
          <Col sm={12} lg={6}>
            <Form.Text className="text-muted">
              Optional. When provided, these dates apply to all rows in the
              Excel file and override any dates in the file.
            </Form.Text>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col sm={12} md={8} lg={6} className="mb-3 mb-lg-0">
            <Form.Group controlId="excel_file">
              <Form.Label>Upload Excel File</Form.Label>
              <Form.Control
                ref={fileInputRef}
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
            <Dropdown className="align-self-end w-100">
              <Dropdown.Toggle
                variant="primary"
                className="form-control sample_download_Button"
              >
                Sample Download
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleSampleDownload("simple")}>
                  Simple Template (with form dates)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSampleDownload("full")}>
                  Full Template (dates in Excel)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>

        <Button type="submit" className="mt-3" disabled={loading}>
          {loading ? <Spinner /> : "Submit"}
        </Button>
      </Form>
    </Container>
  );


};

export default UploadRangePricing;
