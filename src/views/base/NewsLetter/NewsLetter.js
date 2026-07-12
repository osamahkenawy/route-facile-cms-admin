import React from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import Table from 'react-bootstrap/Table'

const NewsLetter = () => {
  return (
    <Row className="py-3">
      <Row className="mb-3">
        <Col xs="12" sm="12" md="6" lg="4">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="enter email" />
          </Form.Group>
        </Col>
        <Col xs="12" sm="12" md="6" lg="4">
          <Form.Label>Status</Form.Label>
          <Form.Select aria-label="Default select example">
            <option>Open this select menu</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
          </Form.Select>
        </Col>
        <Col xs="2" sm="2" md="2" lg="2" className="mt-auto mb-3 ">
          <div className="d-flex mt-3 mt-lg-0">
            <Button className='btn-def'>Search</Button>
            <Button className="btn-def mx-3">Export</Button>
          </div>
        </Col>
      </Row>

      <Table className="table table-responsive">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Email</th>
            <th scope="col">Add Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td scope="row">1</td>
            <td>Mark</td>
            <td>Otto</td>
          </tr>
        </tbody>
      </Table>
    </Row>
  )
}

export default NewsLetter
