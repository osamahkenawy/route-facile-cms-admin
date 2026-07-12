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
import { Link, useNavigate, useParams } from "react-router-dom";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";

const CreateRangePricing = () => {
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(false);
  const [showdel, setShowdel] = useState(false);
  const handleShowDel = (id) => {
    setDeleteID(id);
    setShowdel(true);
  };
  const handleCloseDel = () => setShowdel(false);
  const [loadingStates, setLoadingStates] = useState({
    // rental_price: [],
    cdw: [],
    scdw: [],
    pai: [],
    gps: [],
    baby_seat: [],
    additional_driver: [],
  });
  // const [errors, setErrors] = useState({});

  // const [formRows, setFormRows] = useState([
  //   { fromDays: "", toDays: "", discount: "", type: "rental_price" },
  // ]);
  const [formRows_cdw, setFormRows_cdw] = useState([
    { fromDays: "", toDays: "", discount: "", type: "cdw" },
  ]);
  const [formRows_scdw, setFormRows_scdw] = useState([
    { fromDays: "", toDays: "", discount: "", type: "scdw" },
  ]);
  const [formRows_pai, setFormRows_pai] = useState([
    { fromDays: "", toDays: "", discount: "", type: "pai" },
  ]);
  const [formRows_gps, setFormRows_gps] = useState([
    { fromDays: "", toDays: "", discount: "", type: "gps" },
  ]);
  const [formRows_baby_seat, setFormRows_baby_seat] = useState([
    { fromDays: "", toDays: "", discount: "", type: "baby_seat" },
  ]);
  const [formRows_additional_driver, setFormRows_additional_driver] = useState([
    { fromDays: "", toDays: "", discount: "", type: "driver" },
  ]);

  // Handle form field change for a specific row
  const handleChange = (e, index, type) => {
    const { name, value } = e.target;

    switch (type) {
      // case "rental_price":
      //   const updatedRows = [...formRows];
      //   updatedRows[index][name] = value;
      //   setFormRows(updatedRows);
      //   break;
      case "cdw":
        const updatedRows2 = [...formRows_cdw];
        updatedRows2[index][name] = value;
        setFormRows_cdw(updatedRows2);
        break;
      case "scdw":
        const updatedRows3 = [...formRows_scdw];
        updatedRows3[index][name] = value;
        setFormRows_scdw(updatedRows3);
        break;
      case "pai":
        const updatedRows4 = [...formRows_pai];
        updatedRows4[index][name] = value;
        setFormRows_pai(updatedRows4);
        break;
      case "gps":
        const updatedRows5 = [...formRows_gps];
        updatedRows5[index][name] = value;
        setFormRows_gps(updatedRows5);
        break;
      case "baby_seat":
        const updatedRows6 = [...formRows_baby_seat];
        updatedRows6[index][name] = value;
        setFormRows_baby_seat(updatedRows6);
        break;
      case "additional_driver":
        const updatedRows7 = [...formRows_additional_driver];
        updatedRows7[index][name] = value;
        setFormRows_additional_driver(updatedRows7);
        break;
    }
  };
  // Add a new row of inputs
  const handleAddRow = (type) => {
    switch (type) {
      // case "rental_price":
      //   setFormRows([...formRows, { fromDays: "", toDays: "", discount: "" }]);
      //   break;
      case "cdw":
        setFormRows_cdw([
          ...formRows_cdw,
          { fromDays: "", toDays: "", discount: "" },
        ]);
        break;
      case "scdw":
        setFormRows_scdw([
          ...formRows_scdw,
          { fromDays: "", toDays: "", discount: "" },
        ]);
        break;
      case "pai":
        setFormRows_pai([
          ...formRows_pai,
          { fromDays: "", toDays: "", discount: "" },
        ]);
        break;
      case "gps":
        setFormRows_gps([
          ...formRows_gps,
          { fromDays: "", toDays: "", discount: "" },
        ]);
        break;
      case "baby_seat":
        setFormRows_baby_seat([
          ...formRows_baby_seat,
          { fromDays: "", toDays: "", discount: "" },
        ]);
        break;
      case "additional_driver":
        setFormRows_additional_driver([
          ...formRows_additional_driver,
          { fromDays: "", toDays: "", discount: "" },
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
        // case "rental_price":
        //   const updatedRows = formRows.filter((_, i) => i !== index);
        //   setFormRows(updatedRows);
        //   break;
        case "cdw":
          const updatedRows2 = formRows_cdw.filter((_, i) => i !== index);
          setFormRows_cdw(updatedRows2);
          break;
        case "scdw":
          const updatedRows3 = formRows_scdw.filter((_, i) => i !== index);
          setFormRows_scdw(updatedRows3);
          break;
        case "pai":
          const updatedRows4 = formRows_pai.filter((_, i) => i !== index);
          setFormRows_pai(updatedRows4);
          break;
        case "gps":
          const updatedRows5 = formRows_gps.filter((_, i) => i !== index);
          setFormRows_gps(updatedRows5);
          break;
        case "baby_seat":
          const updatedRows6 = formRows_baby_seat.filter((_, i) => i !== index);
          setFormRows_baby_seat(updatedRows6);
          break;
        case "additional_driver":
          const updatedRows7 = formRows_additional_driver.filter(
            (_, i) => i !== index
          );
          setFormRows_additional_driver(updatedRows7);
          break;
      }
    }
  };

  // Validation: Check if all fields are valid numbers and filled out
  // const validateForm = () => {
  //   return formRows.every(
  //     (row) =>
  //       row.fromDays &&
  //       row.toDays &&
  //       row.discount &&
  //       !isNaN(row.fromDays) &&
  //       !isNaN(row.toDays) &&
  //       !isNaN(row.discount)
  //   );
  // };

  // Form submit handler (basic validation and logging for now)
  const handleSubmit = (e, index, type) => {
    console.log("4formSubmitFunction ran");
    e.preventDefault();

    formSubmitFunction(index, type);
  };
  const formSubmitFunction = (index, type) => {
    console.log("formSubmitFunction ran___>", index, type);
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
      // case "rental_price":
      //   body = {
      //     type: "rental_price",

      //     from: formRows[index].fromDays,
      //     to: formRows[index].toDays,
      //     discount: formRows[index].discount,
      //     status: 1,
      //   };

      //   break;
      case "cdw":
        body = {
          type: "cdw",
          from: formRows_cdw[index].fromDays,
          to: formRows_cdw[index].toDays,
          discount: formRows_cdw[index].discount,
          status: 1,
        };
        if (formRows_cdw[index].id) {
          body.id = formRows_cdw[index].id;
        }

        break;
      case "scdw":
        body = {
          type: "scdw",
          from: formRows_scdw[index].fromDays,
          to: formRows_scdw[index].toDays,
          discount: formRows_scdw[index].discount,
          status: 1,
        };
        if (formRows_scdw[index].id) {
          body.id = formRows_scdw[index].id;
        }

        break;
      case "pai":
        body = {
          type: "pai",
          from: formRows_pai[index].fromDays,
          to: formRows_pai[index].toDays,
          discount: formRows_pai[index].discount,
          status: 1,
        };
        if (formRows_pai[index].id) {
          body.id = formRows_pai[index].id;
        }

        break;
      case "gps":
        body = {
          type: "gps",
          from: formRows_gps[index].fromDays,
          to: formRows_gps[index].toDays,
          discount: formRows_gps[index].discount,
          status: 1,
        };
        if (formRows_gps[index].id) {
          body.id = formRows_gps[index].id;
        }

        break;
      case "baby_seat":
        body = {
          type: "baby_seat",
          from: formRows_baby_seat[index].fromDays,
          to: formRows_baby_seat[index].toDays,
          discount: formRows_baby_seat[index].discount,
          status: 1,
        };
        if (formRows_baby_seat[index].id) {
          body.id = formRows_baby_seat[index].id;
        }

        break;
      case "additional_driver":
        body = {
          type: "driver",
          from: formRows_additional_driver[index].fromDays,
          to: formRows_additional_driver[index].toDays,
          discount: formRows_additional_driver[index].discount,
          status: 1,
        };
        if (formRows_additional_driver[index].id) {
          body.id = formRows_additional_driver[index].id;
        }

        break;
    }

    const url = configWeb.PUT_RANGE_PRICING_CREATE;
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
        }
      })
      .catch((error) => {
        // console.log("ERROR-->", error)
        notifyError("Something went wrong. Please try again letter.");
      })
      .finally(() => {
        // Reset all loading states to false after the request is complete
        getPriceList();
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

  const getPriceList = () => {
    // return new Promise((resolve, reject)=>{
    setLoading(true);
    const params = new URLSearchParams();
    // Add parameters only if they exist

    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_RANGE_PRICING_LIST}?${params.toString()}`;

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
        setLoading(false);
        handleCloseDel();
      });
    // });
  };

  useEffect(() => {
    getPriceList();
  }, [currentPage, pageSize]);

  const processData = (data) => {
    const cdwData = [];
    const scdwData = [];
    const paiData = [];
    const gpsData = [];
    const babySeaterData = [];
    const additionalDriverData = [];

    data.forEach((item) => {
      const { from, to, discount, type, id } = item;

      const row = {
        fromDays: from,
        toDays: to,
        discount: discount,
        type: type,
        id,
      };

      switch (type) {
        case "cdw":
          cdwData.push(row);
          break;
        case "scdw":
          scdwData.push(row);
          break;
        case "pai":
          paiData.push(row);
          break;
        case "gps":
          gpsData.push(row);
          break;
        case "baby_seat":
          babySeaterData.push(row);
          break;
        case "driver":
          additionalDriverData.push(row);
          break;
        default:
          break;
      }
    });

    setFormRows_cdw(
      cdwData.length
        ? cdwData
        : [{ fromDays: "", toDays: "", discount: "", type: "cdw" }]
    );
    setFormRows_scdw(
      scdwData.length
        ? scdwData
        : [{ fromDays: "", toDays: "", discount: "", type: "scdw" }]
    );
    setFormRows_pai(
      paiData.length
        ? paiData
        : [{ fromDays: "", toDays: "", discount: "", type: "pai" }]
    );
    setFormRows_gps(
      gpsData.length
        ? gpsData
        : [{ fromDays: "", toDays: "", discount: "", type: "gps" }]
    );
    setFormRows_baby_seat(
      babySeaterData.length
        ? babySeaterData
        : [{ fromDays: "", toDays: "", discount: "", type: "baby_seat" }]
    );
    setFormRows_additional_driver(
      additionalDriverData.length
        ? additionalDriverData
        : [
            {
              fromDays: "",
              toDays: "",
              discount: "",
              type: "additional_driver",
            },
          ]
    );
    console.log("additionalDriverData-->", additionalDriverData);
  };

  useEffect(() => {
    if (Array.isArray(priceListArray)) {
      processData(priceListArray);
    }

    return () => {};
  }, [priceListArray]);
  const [deleteID, setDeleteID] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const deleteLocation = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_RANGE_PRICING(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            notifySuccess("Deleted Successfully");

            getPriceList();
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
    deleteLocation(deleteID);
  };

  return (
    <Container className="container">
      <div className="post_header">
        <Row>
          {/* <Col
            lg="12"
            className="mt-4 d-flex justify-content-end align-items-center"
          >
            <Link to="/dynamic-pricing/range-pricing">
              <Button className="btn-def">Range Pricing List</Button>
            </Link>
          </Col> */}
        </Row>
      </div>
      {editLoading ? (
        <div className="text-center">
          {" "}
          <Spinner />{" "}
        </div>
      ) : (
        <>
          {/* <h4>Rental Price</h4>

          {Array.isArray(formRows) &&  formRows?.map((row, index) => (
            <Form
              onSubmit={(e) => handleSubmit(e, index, "rental_price")}
              key={index}
            >
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group controlId={`fromDays-${index}`}>
                    <Form.Label>From Days</Form.Label>
                    <Form.Control
                      type="number"
                      name="fromDays"
                      value={row.fromDays}
                      onChange={(e) => handleChange(e, index, "rental_price")}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId={`toDays-${index}`}>
                    <Form.Label>To Days</Form.Label>
                    <Form.Control
                      type="number"
                      name="toDays"
                      value={row.toDays}
                      onChange={(e) => handleChange(e, index, "rental_price")}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId={`discount-${index}`}>
                    <Form.Label>Discount</Form.Label>
                    <Form.Control
                      type="number"
                      name="discount"
                      value={row.discount}
                      onChange={(e) => handleChange(e, index, "rental_price")}
                      required
                    />
                  </Form.Group>
                </Col>
                {index === 0 && (
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => handleAddRow("rental_price")}
                      className="me-2"
                    >
                      +
                    </Button>
                  </Col>
                )}

                {index !== 0 && (
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => handleRemoveRow(index, "rental_price", row.id)}
                      disabled={formRows.length === 1}
                    >
                      -
                    </Button>
                  </Col>
                )}
                <Col className="d-flex align-items-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loadingStates.rental_price[index]}
                  >
                    {loadingStates.rental_price[index] ? <Spinner /> : row?.id ? "Update" : "Add"}
                  </Button>
                  {console.log(
                    "loadingStates.rental_price[index]-->",
                    loadingStates.rental_price[index]
                  )}
                </Col>
              </Row>
            </Form>
          ))}
          <div className="border-line"></div> */}
          <h4>CDW</h4>

          {Array.isArray(formRows_cdw) &&
            formRows_cdw?.map((row, index) => (
              <Form onSubmit={(e) => handleSubmit(e, index, "cdw")} key={index}>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) => handleChange(e, index, "cdw")}
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) => handleChange(e, index, "cdw")}
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
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
          <h4>SCDW</h4>

          {Array.isArray(formRows_scdw) &&
            formRows_scdw?.map((row, index) => (
              <Form
                onSubmit={(e) => handleSubmit(e, index, "scdw")}
                key={index}
              >
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) => handleChange(e, index, "scdw")}
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) => handleChange(e, index, "scdw")}
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
                        onChange={(e) => handleChange(e, index, "scdw")}
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
                        onClick={() => handleAddRow("scdw")}
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
                        onClick={() => handleRemoveRow(index, "scdw", row.id)}
                        disabled={formRows_scdw.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.scdw[index]}
                    >
                      {loadingStates.scdw[index] ? (
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
          <h4>PAI</h4>
          {Array.isArray(formRows_pai) &&
            formRows_pai?.map((row, index) => (
              <Form onSubmit={(e) => handleSubmit(e, index, "pai")} key={index}>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) => handleChange(e, index, "pai")}
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) => handleChange(e, index, "pai")}
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
                        onChange={(e) => handleChange(e, index, "pai")}
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
                        onClick={() => handleAddRow("pai")}
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
                        onClick={() => handleRemoveRow(index, "pai", row.id)}
                        disabled={formRows_pai.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.pai[index]}
                    >
                      {loadingStates.pai[index] ? (
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
          <h4>Navigation System</h4>
          {Array.isArray(formRows_gps) &&
            formRows_gps?.map((row, index) => (
              <Form onSubmit={(e) => handleSubmit(e, index, "gps")} key={index}>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) => handleChange(e, index, "gps")}
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) => handleChange(e, index, "gps")}
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
                        onChange={(e) => handleChange(e, index, "gps")}
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
                        onClick={() => handleAddRow("gps")}
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
                        onClick={() => handleRemoveRow(index, "gps", row.id)}
                        disabled={formRows_gps.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.gps[index]}
                    >
                      {loadingStates.gps[index] ? (
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
          <h4>Baby Seater</h4>
          {Array.isArray(formRows_baby_seat) &&
            formRows_baby_seat?.map((row, index) => (
              <Form
                onSubmit={(e) => handleSubmit(e, index, "baby_seat")}
                key={index}
              >
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) => handleChange(e, index, "baby_seat")}
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) => handleChange(e, index, "baby_seat")}
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
                        onChange={(e) => handleChange(e, index, "baby_seat")}
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
                        onClick={() => handleAddRow("baby_seat")}
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
                        onClick={() =>
                          handleRemoveRow(index, "baby_seat", row.id)
                        }
                        disabled={formRows_baby_seat.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.baby_seat[index]}
                    >
                      {loadingStates.baby_seat[index] ? (
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
          <h4>Additional Driver</h4>
          {Array.isArray(formRows_additional_driver) &&
            formRows_additional_driver?.map((row, index) => (
              <Form
                onSubmit={(e) => handleSubmit(e, index, "additional_driver")}
                key={index}
              >
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId={`fromDays-${index}`}>
                      <Form.Label>From Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="fromDays"
                        value={row.fromDays}
                        onChange={(e) =>
                          handleChange(e, index, "additional_driver")
                        }
                        // isInvalid={!row.fromDays || isNaN(row.fromDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`toDays-${index}`}>
                      <Form.Label>To Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="toDays"
                        value={row.toDays}
                        onChange={(e) =>
                          handleChange(e, index, "additional_driver")
                        }
                        // isInvalid={!row.toDays || isNaN(row.toDays)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId={`discount-${index}`}>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        name="discount"
                        value={row.discount}
                        onChange={(e) =>
                          handleChange(e, index, "additional_driver")
                        }
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
                        onClick={() => handleAddRow("additional_driver")}
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
                        onClick={() =>
                          handleRemoveRow(index, "additional_driver", row.id)
                        }
                        disabled={formRows_additional_driver.length === 1}
                      >
                        -
                      </Button>
                    </Col>
                  )}
                  <Col className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingStates.additional_driver[index]}
                    >
                      {loadingStates.additional_driver[index] ? (
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

export default CreateRangePricing;
