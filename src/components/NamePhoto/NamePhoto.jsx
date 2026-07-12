import React, { useState } from "react";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import { Modal } from "react-bootstrap";
import "./NamePhoto.css";

const NamePhoto = ({
  name,
  photo = "",
  description = "",
  iconOnly = false,
  phone = "",
  gender = "",
  email = "",
  address = "",
  extra = "",
  onClick,
}) => {
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);

  // Helper function to get initials (equivalent to name_chip computed)
  const getNameChip = (nameStr) => {
    if (!nameStr) return "";
    return nameStr
      .split(" ")
      .filter((n) => n.trim() !== "")
      .map((n) => n.substring(0, 1))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Truncated name (for now, just return name as-is)
  const truncatedName = name || "";

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'email') {
        setShowEmailPopup(false);
      } else {
        setShowPhonePopup(false);
      }
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const handleEmailClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmailPopup(true);
  };

  const handlePhoneClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPhonePopup(true);
  };

  return (
    <div
      className="name-photo-container d-inline-flex align-items-center"
      onClick={handleClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      onMouseDown={(e) => {
        // Prevent any default link behavior
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          e.preventDefault();
        }
      }}
    >
      <div className="image mr-2">
        {photo ? (
          <img className="auth-img" src={photo} alt={name} />
        ) : (
          <span className="initialletter">
            {getNameChip(name)}
          </span>
        )}
      </div>
      {!iconOnly && (
        <div className="name-photo-name-desc d-flex text-start flex-column ml-1">
          <div className="fleet-profile-name">{truncatedName}</div>
          {extra && <div className="name-extra">{extra}</div>}
          {(email || phone || description) && (
            <div className="name-photo-name d-flex align-items-center">
              {description && (
                <div className="name-photo-desc">{description}</div>
              )}
              {email && (
                <>
                  <button
                    type="button"
                    className="btnInit m-1"
                    onClick={handleEmailClick}
                    style={{
                      width: "25px",
                      height: "25px",
                      border: "1px solid #d0ddf4",
                      backgroundColor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      cursor: "pointer",
                      borderRadius: "50%",
                    }}
                  >
                    <MdEmail
                      style={{
                        width: "10.05px",
                        height: "7.537px",
                        color: "#04092152",
                      }}
                    />
                  </button>
                  <Modal
                    show={showEmailPopup}
                    onHide={() => setShowEmailPopup(false)}
                    centered
                    size="sm"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Email</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div 
                        style={{ 
                          marginBottom: "15px",
                          userSelect: 'all',
                          pointerEvents: 'none'
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        <strong>{email}</strong>
                      </div>
                      <button
                        className="tooltip-copy-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopy(email, 'email');
                        }}
                        style={{ width: "100%" }}
                        type="button"
                      >
                        Copy Email
                      </button>
                    </Modal.Body>
                  </Modal>
                </>
              )}
              {phone && (
                <>
                  <button
                    type="button"
                    className="btnInit m-1"
                    onClick={handlePhoneClick}
                    style={{
                      width: "25px",
                      height: "25px",
                      border: "1px solid #d0ddf4",
                      backgroundColor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      cursor: "pointer",
                      borderRadius: "50%",
                    }}
                  >
                    <MdPhone
                      style={{
                        width: "10.05px",
                        height: "7.537px",
                        color: "#04092152",
                      }}
                    />
                  </button>
                  <Modal
                    show={showPhonePopup}
                    onHide={() => setShowPhonePopup(false)}
                    centered
                    size="sm"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Phone</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div style={{ marginBottom: "15px" }}>
                        <strong>{phone}</strong>
                      </div>
                      <button
                        className="tooltip-copy-btn"
                        onClick={() => handleCopy(phone, 'phone')}
                        style={{ width: "100%" }}
                      >
                        Copy Phone
                      </button>
                    </Modal.Body>
                  </Modal>
                </>
              )}
              {address && (
                <button
                  type="button"
                  className="btnInit m-1"
                  title={address}
                  style={{
                    width: "25px",
                    height: "25px",
                    border: "1px solid #d0ddf4",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <MdLocationOn
                    style={{
                      width: "10.05px",
                      height: "7.537px",
                      color: "#04092152",
                    }}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NamePhoto;

