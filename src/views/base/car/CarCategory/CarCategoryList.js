import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomPagination from "../../../../components/CustomPagination/CustomPagination";
import { ImBin } from "react-icons/im";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
  simplePutCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import configWeb from "../../../../components/config.js/ConfigWeb";
import { LuClipboardPen } from "react-icons/lu";
import { formatDateTimeUAE } from "../../CustomHooks/reusableFunctions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const CarCategoryList = () => {
  const imageFileServer = process.env.REACT_APP_FILE_SERVER;
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [carGroupListArray, setCarGroupListArray] = useState([]);
  const [showdel, setShowdel] = useState(false);
  const navigate = useNavigate();
  const [deleteID, setDeleteID] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  const handleCloseDel = () => setShowdel(false);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const calculatePaginationMessage = () => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  const getCarCategoryList = () => {
    setLoading(true);
    const body = JSON.stringify({});
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_CAR_CATEGORIES}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setCarGroupListArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setCarGroupListArray([]);
          setTotalRecords(0);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setCarGroupListArray([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
        handleCloseDel();
      });
  };

  useEffect(() => {
    getCarCategoryList();
  }, [currentPage, pageSize]);

  const deleteCarCategory = (id) => {
    return new Promise((resolve, reject) => {
      setDeleteLoading(true);
      const url = configWeb.DELETE_CAR_CATEGORY(id);
      simpleDeleteCallAuth(url)
        .then((res) => {
          if (res?.status === "success") {
            notifySuccess("Deleted Successfully");

            getCarCategoryList();
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
          setDeleteLoading(false);
          handleCloseDel();
        });
    });
  };

  const handleDelete = () => {
    deleteCarCategory(deleteID);
  };

  const handleEdit = (id) => {
    navigate(`/car/edit-category/${id}`);
  };

  const handleShowDel = (id) => {
    setDeleteID(id);
    setShowdel(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const reordered = Array.from(carGroupListArray);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    setCarGroupListArray(reordered);
    setOrderChanged(true);
  };

  const handleSaveOrder = () => {
    const orderedIds = carGroupListArray.map((item) => item.id);
    setReorderLoading(true);
    simplePutCallAuth(
      configWeb.REORDER_CAR_CATEGORIES,
      JSON.stringify({ ordered_ids: orderedIds })
    )
      .then((res) => {
        if (res?.error) {
          notifyError(res?.message?.[0] || "Failed to save order");
        } else {
          notifySuccess("Category order saved successfully");
          setOrderChanged(false);
        }
      })
      .catch(() => {
        notifyError("Something went wrong while saving order");
      })
      .finally(() => {
        setReorderLoading(false);
      });
  };

  return (
    <div className="w-100" style={{ maxWidth: "100%" }}>
      <Row>
        <Col
          lg="12"
          className="mt-4 d-flex justify-content-end align-items-center gap-2"
        >
          {orderChanged && (
            <Button
              className="btn-def"
              onClick={handleSaveOrder}
              disabled={reorderLoading}
            >
              {reorderLoading ? <Spinner size="sm" /> : "Save Order"}
            </Button>
          )}
          <Link to="/car/create-category">
            <Button className="btn-def">Add Category</Button>
          </Link>
        </Col>
      </Row>

      <Col>
        <div>
          <p>{calculatePaginationMessage()}</p>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table
            className="table table-responsive table-striped w-100"
          >
            <thead className="">
              <tr>
                <th scope="col" style={{ width: "40px" }}></th>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Image</th>
                <th scope="col">Status</th>
                <th scope="col">Created At</th>
                <th scope="col" style={{ paddingRight: "30px" }}>
                  Action
                </th>
              </tr>
            </thead>

            <Droppable droppableId="category-list">
              {(provided) => (
                <tbody
                  className=""
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {loading ? (
                    <tr>
                      <td className="text-center" colSpan={100}>
                        {" "}
                        <Spinner />
                      </td>{" "}
                    </tr>
                  ) : (
                    Array.isArray(carGroupListArray) &&
                    carGroupListArray?.length > 0 &&
                    carGroupListArray?.map((item, index) => (
                      <Draggable
                        key={String(item.id)}
                        draggableId={String(item.id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: snapshot.isDragging
                                ? "#e8f4fd"
                                : "inherit",
                            }}
                          >
                            <td
                              {...provided.dragHandleProps}
                              style={{
                                cursor: "grab",
                                fontSize: "1.3em",
                                textAlign: "center",
                                userSelect: "none",
                              }}
                            >
                              ⠿
                            </td>
                            <td scope="row">{item.id}</td>
                            <td>{item?.name_en}</td>
                            <td className="text-center">
                              <div className="car-listing-img-div-px">
                                <img
                                  className="car-listing-img grey-background"
                                  src={`${imageFileServer}admin/car/category/${item?.image}`}
                                  /* src={listingCarExample} */ alt="img-error"
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div
                                className={`px-4 py-2 font-size-14px ${item.status ? "active_box" : "inactive_box"}`}
                              >
                                {item.status ? "Active" : "Inactive"}
                              </div>
                            </td>
                            <td>{formatDateTimeUAE(item?.created_at)}</td>

                            <td>
                              <LuClipboardPen
                                onClick={() => handleEdit(item.id)}
                                className="me-4"
                                style={{
                                  cursor: "pointer",
                                  height: "1.5em",
                                  width: "1.5em",
                                  stroke: "orange",
                                }}
                              />
                              <ImBin
                                onClick={() => handleShowDel(item.id)}
                                style={{
                                  cursor: "pointer",
                                  height: "1.5em",
                                  width: "1.5em",
                                  fill: "#ff6b6b",
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))
                  )}
                  {carGroupListArray?.length === 0 && !loading && (
                    <tr className="text-center">
                      <td colSpan={100}>No Data Found.</td>
                    </tr>
                  )}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
        <div className="d-flex justify-content-between align-items-center">
          <CustomPagination
            recordsPerPage={pageSize}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
            currentPage={currentPage}
          />
          <Col lg="2">
            <Form.Group className="mb-3">
              <Form.Select
                aria-label="Default select example"
                name="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </div>
      </Col>
      <Modal show={showdel} onHide={handleCloseDel}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Category !</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this category ?</Modal.Body>
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
    </div>
  );
};

export default CarCategoryList;
