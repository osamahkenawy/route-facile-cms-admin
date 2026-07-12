import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import CryptoJS from "crypto-js";

const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const [drop, setDrop] = useState(null);
  const handleDrop = () => {
    setDrop(!drop);
  };

  const getLogoutPath = () => {
    // Prefer the current URL: route segments win over stored portal flag.
    if (typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      if (path.startsWith("/admin/kyc")) return "/admin/kyc/login";
      if (path.startsWith("/hr")) return "/hr/login";
    }
    const portal = localStorage.getItem("trasealla_login_portal");
    if (portal === "kyc") return "/admin/kyc/login";
    if (portal === "hr") return "/hr/login";
    return "/login";
  };

  const clearAuthAndRedirect = () => {
    const target = getLogoutPath();
    localStorage.removeItem("token");
    localStorage.removeItem("trasealla_user_role");
    localStorage.removeItem("trasealla_must_reset_password");
    localStorage.removeItem("trasealla_login_portal");
    navigate(target);
  };
  //   function getToken() {
  //     const token_item = localStorage.getItem("token");
  //     if (!token_item) {
  //       navigate("/login");
  //       return null;
  //     }
  //     const item = JSON.parse(token_item);
  //     const now = new Date();
  //     if (now.getTime() > item?.expiry) {
  //       localStorage.removeItem("token");
  //       return null;
  //     }
  //     return item?.access_token;
  //   }

  //   setInterval(() => {
  //     const token = getToken();
  //     if (!token) {
  //       {
  // navigate("/login");
  //       }
  //     }
  //   }, 2 * 60 * 1000);

  const getToken = () => {
    const token_item = localStorage.getItem("token");
    if (!token_item) {
      navigate(getLogoutPath());
      return null;
    }
    const item = JSON.parse(token_item);
    const now = new Date();
    if (now.getTime() > item?.expiry) {
      clearAuthAndRedirect();
      return null;
    }
    return item?.access_token;
  };

  const setTokenExpiryHandler = () => {
    const token_item = localStorage.getItem("token");
    if (!token_item) {
      navigate(getLogoutPath());
      return;
    }
    const item = JSON.parse(token_item);
    const now = new Date();
    const timeRemaining = item.expiry - now.getTime();

    if (timeRemaining <= 0) {
      clearAuthAndRedirect();
    } else {
      // Set a timeout to log out the user when the token expires
      setTimeout(() => {
        clearAuthAndRedirect();
      }, timeRemaining);
    }
  };

  useEffect(() => {
    setTokenExpiryHandler();
  }, []);
  const handleLogout = () => {
    clearAuthAndRedirect();
  };

  const getRoleLabel = () => {
    try {
      const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;
      const encrypted = localStorage.getItem("trasealla_user_role");
      if (encrypted) {
        const role = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
        if (role === "accounts") return "Accountant";
        if (role === "counter") return "Counter";
        if (role === "hr_manager") return "HR Manager";
        if (role === "hr_recruitment") return "HR Recruiter";
      }
    } catch (e) {}
    // Fallback: if user is on the HR portal, surface HR rather than Admin
    if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/hr")) {
      return "HR";
    }
    return "Admin";
  };

  return (
    <div className="position-relative">
      <Dropdown className="me-2">
        <Dropdown.Toggle
          variant="none"
          className="d-flex align-items-center"
          onClick={handleDrop}
          style={{ background: 'transparent', border: 'none' }}
        >
          <h6 className="my-auto mb-0">{getRoleLabel()}</h6>
        </Dropdown.Toggle>
      </Dropdown>
      {drop && (
        <>
          <div
            className="admin-dropdown-overlay"
            onClick={handleDrop}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1029,
            }}
          />
          <div
            className="px-4 py-1 rounded-2 bg-white admin-dropdown-menu"
            style={{
              position: "absolute",
              right: "0",
              top: "100%",
              marginTop: "5px",
              border: "1px solid black",
              cursor: "pointer",
              zIndex: 1030,
              minWidth: "100px",
            }}
          >
            <span onClick={handleLogout}>Logout</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AppHeaderDropdown;
