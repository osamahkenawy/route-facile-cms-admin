import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Spinner,
  Modal,
} from "react-bootstrap";

import configWeb from "../../../components/config.js/ConfigWeb";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import { fetchData } from "../CustomHooks/reusableFunctions";

const InterCityCharges = () => {
  const [editLoading, setEditLoading] = useState(true);

  const [pickupCitiesArray, setPickupCitiesArray] = useState(false);
  const [showdel, setShowdel] = useState(false);
  const handleShowDel = (id) => {
    setDeleteID(id);
    setShowdel(true);
  };
  const handleCloseDel = () => setShowdel(false);
  const [loadingStates, setLoadingStates] = useState({
    // rental_price: [],
    cdw: [],
  });

  const [formRows_cdw, setFormRows_cdw] = useState([
    { pickup_city_id: "", dropoff_city_id: "", charges: "", type: "cdw" },
  ]);

  // Handle form field change for a specific row
  const handleChange = (e, index, type) => {
    const { name, value } = e.target;

    switch (type) {
      case "cdw":
        const updatedRows2 = [...formRows_cdw];
        updatedRows2[index][name] = value;
        setFormRows_cdw(updatedRows2);
        break;
    }
  };
  // Add a new row of inputs
  const handleAddRow = (type) => {
    switch (type) {
      case "cdw":
        setFormRows_cdw([
          ...formRows_cdw,
          { pickup_city_id: "", dropoff_city_id: "", charges: "" },
        ]);
        break;
    }
  };

  // Remove a row of inputs
  const handleRemoveRow = (index, type, id) => {
    if (id) {
      handleShowDel(id);
    } else {
      switch (type) {
        case "cdw":
          const updatedRows2 = formRows_cdw.filter((_, i) => i !== index);
          setFormRows_cdw(updatedRows2);
          break;
      }
    }
  };

  // Form submit handler (basic validation and logging for now)
  const handleSubmit = (e, index, type) => {
    e.preventDefault();

    formSubmitFunction(index, type);
  };
  const formSubmitFunction = (index, type) => {
    let body = {};
    // Dynamically set loading for the specific type and index
    setLoadingStates((prevState) => {
      // Clone the existing state and update the clicked index
      const updatedState = [...prevState[type]]; // Create a copy of the array for that type
      updatedState[index] = true; // Set the specific index to true (loading)

      return {
        ...prevState,
        [type]: updatedState, // Return updated state
      };
    });
    switch (type) {
      case "cdw":
        body = {
          pickup_city_id: formRows_cdw[index].pickup_city_id,
          dropoff_city_id: formRows_cdw[index].dropoff_city_id,
          charges: formRows_cdw[index].charges,
        };
        if (formRows_cdw[index].id) {
          body.id = formRows_cdw[index].id;
        }

        break;
    }

    const url = configWeb.PUT_INTER_CITY_CHARGES;
    const apiCall = simplePutCallAuth;
    apiCall(url, JSON.stringify(body))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess(
            body.id ? "Updated Successfully" : "Created Successfully"
          );

          // navigate("/cms/homepagebanners");
        } else {
          if (Array.isArray(res?.message)) {
            notifyError(res?.message[0]);
          } else {
            notifyError(res?.message);
          }
          if (res.status === "error") {
            notifyError(res?.error?.driverError?.sqlMessage);
          }
        }
      })
      .catch((error) => {
        notifyError("Something went wrong. Please try again letter.");
      })
      .finally(() => {
        // Reset all loading states to false after the request is complete
        getChargesList();
        setLoadingStates((prevState) => {
          const resetState = { ...prevState };
          resetState[type] = resetState[type]?.map(() => false); // Reset all indices for that type
          return resetState;
        });
      });
  };

  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(9999999);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceListArray, setPriceListArray] = useState([]);

  const getChargesList = () => {
    // return new Promise((resolve, reject)=>{

    const params = new URLSearchParams();
    // Add parameters only if they exist

    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_INTER_CITY_CHARGES_LIST}?${params.toString()}`;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setPriceListArray(res?.data || []);
          // setTotalRecords(res?.total_records || 0);
        } else {
          setPriceListArray([]);
          // setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setPriceListArray([]);
        // setTotalRecords(0);
      })
      .finally(() => {
        setEditLoading(false);
        handleCloseDel();
      });
    // });
  };

  useEffect(() => {
    getChargesList();
  }, [currentPage, pageSize]);

  const processData = (data) => {
    const cdwData = [];

    data.forEach((item) => {
      const { pickup_city_id, dropoff_city_id, charges, id } = item;

      const row = {
        pickup_city_id,
        dropoff_city_id,
        charges,
        type: "cdw",
        id,
      };

      cdwData.push(row);
    });

    setFormRows_cdw(
      cdwData.length
        ? cdwData
        : [
            {
              pickup_city_id: "",
              dropoff_city_id: "",
              charges: "",
              type: "cdw",
            },
          ]
    );
  };

  useEffect(() => {
    if (Array.isArray(priceListArray)) {
      processData(priceListArray);
    }

    return () => {};
  }, [priceListArray]);
  const [deleteID, setDeleteID] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const deleteCharges = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_INTER_CITY_CHARGES(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            notifySuccess("Deleted Successfully");

            getChargesList();
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
          setDeleteLoading(false);
        });
    });
  };

  const handleDelete = () => {
    deleteCharges(deleteID);
  };

  useEffect(() => {
    fetchData({
      url: `${configWeb.GET_CITIES}?page_size=9999`,
      setter: setPickupCitiesArray,
    });
  }, []);

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
          {Array.isArray(formRows_cdw) &&
            formRows_cdw?.map((row, index) => (
              <Form onSubmit={(e) => handleSubmit(e, index, "cdw")} key={index}>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>Pickup City</Form.Label>
                      <Form.Select
                        aria-label="Default select example"
                        name="pickup_city_id"
                        value={row.pickup_city_id}
                        onChange={(e) => handleChange(e, index, "cdw")}
                      >
                        <option value="">Select</option>
                        {pickupCitiesArray?.length > 0 &&
                          pickupCitiesArray?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name_en}{" "}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>Dropoff City</Form.Label>
                      <Form.Select
                        aria-label="Default select example"
                        name="dropoff_city_id"
                        value={row.dropoff_city_id}
                        onChange={(e) => handleChange(e, index, "cdw")}
                      >
                        <option value="">Select</option>
                        {pickupCitiesArray?.length > 0 &&
                          pickupCitiesArray?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name_en}{" "}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`charges-${index}`}>
                      <Form.Label>Charges</Form.Label>
                      <Form.Control
                        type="number"
                        name="charges"
                        value={row.charges}
                        onChange={(e) => handleChange(e, index, "cdw")}
                        // isInvalid={!row.discount || isNaN(row.discount)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  {index === 0 && (
                    <Col className="d-flex align-items-end">
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handleAddRow("cdw")}
                        className="me-2"
                      >
                        +
                      </Button>
                    </Col>
                  )}

                  {/* Add remove button for each row */}
                  {index !== 0 && (
                    <Col className="d-flex align-items-end">
                      <Button
                        variant="danger"
                        type="button"
                        onClick={() => handleRemoveRow(index, "cdw", row.id)}
                        disabled={formRows_cdw.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.cdw[index]}
                    >
                      {loadingStates.cdw[index] ? (
                        <Spinner />
                      ) : row?.id ? (
                        "Update"
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            ))}

          <div className="border-line"></div>

          {/* Button to add more rows */}

          {/* Submit button */}
          <Modal show={showdel} onHide={handleCloseDel}>
            <Modal.Header closeButton>
              <Modal.Title>Delete !</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to delete this entry ?
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="btn-def"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Spinner /> : "Delete"}
              </Button>
              <Button className="btn-def" onClick={handleCloseDel}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Container>
  );
};

export default InterCityCharges;
