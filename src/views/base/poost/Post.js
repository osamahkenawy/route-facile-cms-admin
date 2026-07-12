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
import { ImBin } from "react-icons/im";
import { LuClipboardPen } from "react-icons/lu";
import avatar from "../../../assets/images/react.jpg";
import { Link } from "react-router-dom";

const Post = () => {
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
            className="mt-2 d-flex justify-content-end align-items-center"
          >
            <Link to="/blog/add-blog">
              <Button className="btn-def" onClick={handleShowCat}>
                Add Post
              </Button>
            </Link>
          </Col>
        </Row>
        <Row>
          <Col lg="4">
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select aria-label="Default select example">
                <option>Open this select menu</option>
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col className="mt-auto mb-3">
            <Button className="btn-def ">Search</Button>
          </Col>
        </Row>
        <Col>
          <Table className="table table-responsive">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Title (en)</th>
                <th scope="col">Image</th>
                <th scope="col">Add Date</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td scope="row">1</td>
                <td>Mark, hi there how are you? </td>
                <td>
                  <img src={avatar} style={{ width: "80px" }} />
                </td>
                <td>12/12/2024</td>
                <td>
                  <Button className="btn-def" size="sm">
                    Active
                  </Button>
                </td>
                <td>
                  <LuClipboardPen onClick={handleShow} className="me-2" />
                  <ImBin onClick={handleShowDel} />
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
    // <>post</>
  );
};

export default Post;
