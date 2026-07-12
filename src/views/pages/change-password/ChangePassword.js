import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { simplePutCallAuth } from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import { Form, Spinner } from "react-bootstrap";
import CryptoJS from "crypto-js";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import logo from "../../../assets/images/logo_new.png";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();

  const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;

  const getUserRole = () => {
    const encrypted = localStorage.getItem("trasealla_user_role");
    if (!encrypted) return "";
    try {
      return CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
    } catch {
      return "";
    }
  };

  const getRedirectPath = () => {
    const role = getUserRole();
    if (role === "hr_manager") return "/hr/dashboard/manager";
    if (role === "hr_recruitment") return "/hr/dashboard/staff";
    if (role === "accounts") return "/accounts-dashboard";
    return "/";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setValidated(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      notifyError("New password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await simplePutCallAuth(
        configWeb.PUT_CHANGE_PASSWORD,
        JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        })
      );

      if (!res?.error) {
        localStorage.setItem("trasealla_must_reset_password", "0");
        notifySuccess("Password changed successfully.");
        navigate(getRedirectPath(), { replace: true });
      } else {
        notifyError(res.message || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Something went wrong, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 36px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={logo} alt="Logo" style={{ height: 48, marginBottom: 16 }} />
          <h4 style={{ fontWeight: 700, color: "#1e293b" }}>Change Password</h4>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            You must change your password before continuing.
          </p>
        </div>

        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Current Password
            </Form.Label>
            <div style={{ position: "relative" }}>
              <Form.Control
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                style={{ paddingRight: 42 }}
              />
              <span
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              New Password
            </Form.Label>
            <div style={{ position: "relative" }}>
              <Form.Control
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter new password"
                style={{ paddingRight: 42 }}
              />
              <span
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Confirm New Password
            </Form.Label>
            <div style={{ position: "relative" }}>
              <Form.Control
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Confirm new password"
                style={{ paddingRight: 42 }}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </Form.Group>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "linear-gradient(135deg, #228be6, #1864ab)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaLock size={14} /> Change Password
              </>
            )}
          </button>
        </Form>
      </div>
    </div>
  );
};

export default ChangePassword;
