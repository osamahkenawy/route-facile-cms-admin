import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";

const DateRangePicker = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  getDahsboardDataFunction,
}) => {
  const handleSearch = () => {
    getDahsboardDataFunction();
  };
  return (
    <Form.Group
      as={Row}
      className="align-items-center justify-content-end mb-3"
    >
      <Col xs="auto d-flex align-items-center">
        <Form.Label className="me-2 text-nowrap">From Date</Form.Label>
        <Form.Control
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          onMouseDown={(e) => e.target.showPicker()}
        />
      </Col>
      <Col xs="auto d-flex align-items-center">
        <Form.Label className="me-2 text-nowrap">To Date</Form.Label>
        <Form.Control
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          onMouseDown={(e) => e.target.showPicker()}
        />
      </Col>
      <Col xs="auto d-flex align-items-center">
        <div className="calender-field-width">
          <Button
            className="btn-def btn-icon"
            onClick={handleSearch}
            // disabled={loading}
          >
            <ion-icon className="search-icon" name="search-outline"></ion-icon>
            Search
          </Button>
        </div>
      </Col>
    </Form.Group>
  );
};

export default DateRangePicker;
