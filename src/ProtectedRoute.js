import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from "./components/context/AppContext"; // Adjust path as needed

const ProtectedRoute = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // One-time migration: copy legacy `autostrad_*` localStorage keys to the new
    // `trasealla_*` keys so users logged in before the rebrand keep their session.
    const legacyKeys = [
      "user_role",
      "must_reset_password",
      "login_portal",
      "user_id",
      "user_name",
      "user_email",
    ];
    legacyKeys.forEach((suffix) => {
      const oldKey = `autostrad_${suffix}`;
      const newKey = `trasealla_${suffix}`;
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldVal);
      }
      if (oldVal !== null) {
        localStorage.removeItem(oldKey);
      }
    });

    // Check authentication whenever the location changes
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const tokenItem = JSON.parse(token);
          const now = new Date();
          // Check if token is expired
          if (now.getTime() > tokenItem?.expiry) {
            localStorage.removeItem("token");
            localStorage.removeItem("trasealla_user_role");
            localStorage.removeItem("trasealla_must_reset_password");
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("trasealla_user_role");
          localStorage.removeItem("trasealla_must_reset_password");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [location]);

  if (isChecking) {
    return null; // or a loading spinner
  }

  // Read mustResetPassword directly from localStorage on every render to avoid
  // stale-state race condition when ChangePassword sets it to "0" then calls navigate()
  const mustResetPassword = localStorage.getItem("trasealla_must_reset_password") === "1";
  const loginPortal = localStorage.getItem("trasealla_login_portal");

  // KYC officers never go through the change-password flow.
  if (isAuthenticated && mustResetPassword && loginPortal !== "kyc") {
    const isResetPath =
      location.pathname === "/change-password" ||
      location.pathname === "/admin/change-password";
    if (!isResetPath) {
      return <Navigate to="/admin/change-password" replace />;
    }
  }

  const loginRedirect =
    location.pathname?.startsWith("/admin/kyc") || loginPortal === "kyc"
      ? "/admin/kyc/login"
      : location.pathname?.startsWith("/hr") || loginPortal === "hr"
      ? "/hr/login"
      : "/login";

  return isAuthenticated ? element : <Navigate to={loginRedirect} replace />;
};

export default ProtectedRoute;
