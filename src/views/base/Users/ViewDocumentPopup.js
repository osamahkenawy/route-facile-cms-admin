import React from "react";
import { Modal } from "react-bootstrap";
import { FaDownload } from "react-icons/fa";

const ViewDocumentPopup = ({
  show,
  handleClose,
  link,
  isPDF,
  documentName,
}) => {
  return (
    <Modal size="lg" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{documentName} {" "} <a href={link} target="_blank" download title="Download"><FaDownload /></a></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="view-document-container">
          {true ? (
            <object
              data={link}
              type="application/pdf"
              width="100%"
              height="600px"
            >
              <p>
                Failed to load PDF.{" "}
                <a href={link} target="_blank" rel="noreferrer">
                  View it in another tab.
                </a>
                .
              </p>
            </object>
          ) : (
            <img className="view-doc-img" src={link} alt="img not found" />
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ViewDocumentPopup;
