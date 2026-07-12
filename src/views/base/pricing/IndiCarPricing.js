import React, { useState } from "react";

import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
const IndiCarPricing = () => {
  const [show, setShow] = useState(false);
  const [showdel, setShowdel] = useState(false);
  const [showdcat, setShowdcat] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleCloseDel = () => setShowdel(false);
  const handleShowDel = () => setShowdel(true);

  const handleCloseCat = () => setShowdcat(false);
  const handleShowCat = () => setShowdcat(true);

  return (
   <Container>
    <Row className="justify-content-between">
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center"
        >
        
        </Col>
      </Row>
      <Row className="mt-2 mb-4">
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Year</Form.Label>
            <Form.Select aria-label="Default select example" required>
              <option>Select Year</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Month</Form.Label>
            <Form.Select aria-label="Default select example">
              <option>Select Month</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Emirate</Form.Label>
            <Form.Select aria-label="Default select example">
              <option>Select Emirate</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col lg="2">
          <Form.Group className="mb-3">
            <Form.Label>Car</Form.Label>
            <Form.Select aria-label="Default select example">
              <option>Select Car</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </Form.Select>
          </Form.Group>
        </Col>
       
        <Col className="mt-auto mb-3">
          <Button className="btn-def ">Submit</Button>
        </Col>
      </Row>
      <Col>
        <Table className="table table-responsive" >
       
          <tbody>
         
  <tr  >

							<td className="pt-4"> <span ><b>31 Dec 2024 - Tuesday</b></span></td>

							<td>

								<small>RATE</small><br/>

								<input type="text" className="table_input"  value="160.00" data-name="rate" data-id="5635236"/>

							</td>

							<td>

								<small>CDW</small><br/>

								<input className="table_input" type="text"  value="25.00" data-name="cdw" data-id="5635236"/>



							</td>

							<td>

								<small>SCDW</small><br/>

								<input className="table_input" type="text"  value="30.00" data-name="scdw" data-id="5635236"/>



							</td>

							<td>

								<small>PAI</small><br/>

								<input className="table_input" type="text"  value="15.00" data-name="pai" data-id="5635236"/>

							</td>

							<td>

								<small>GPS</small><br/>

								<input className="table_input" type="text"  value="15.00" data-name="gps" data-id="5635236"/>

							</td>

							<td>

								<small>Baby Seat</small><br/>

								<input className="table_input" type="text"  value="20.00" data-name="baby_seat" data-id="5635236"/>

							</td>

							<td>

								<small>Driver Fee</small><br/>

								<input className="table_input" type="text"  value="25.00" data-name="driver" data-id="5635236"/>

							</td>

						</tr>
          </tbody>
        </Table>
      </Col>
    </Row>
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Category</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Categoty Name (English)</Form.Label>
          <Form.Control type="text" placeholder="enter email" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Categoty Name (Arabic)</Form.Label>
          <Form.Control type="text" placeholder="enter email" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select>
            <option>Active</option>
            <option>Inactive</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn-def" onClick={handleClose}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showdel} onHide={handleCloseDel}>
      <Modal.Header closeButton>
        <Modal.Title>Category</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this entry ?</Modal.Body>
      <Modal.Footer>
        <Button className="btn-def" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showdcat} onHide={handleCloseCat}>
      <Modal.Header closeButton>
        <Modal.Title>Category</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Categoty Name (English)</Form.Label>
          <Form.Control type="text" placeholder="enter email" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Categoty Name (Arabic)</Form.Label>
          <Form.Control type="text" placeholder="enter email" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select>
            <option>Active</option>
            <option>Inactive</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn-def" onClick={handleCloseCat}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  </Container>
  )
}

export default IndiCarPricing
