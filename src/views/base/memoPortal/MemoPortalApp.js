// Top-level router for the Memo Portal. Mounted in App.js under
// /memo-portal/* OUTSIDE the admin's ProtectedRoute so staff users can
// reach it without an admin login.

import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import portalApi, { setStorageKey } from "./portalApi";
import PortalLogin from "./PortalLogin";
import PortalList from "./PortalList";
import PortalDetail from "./PortalDetail";

const PortalGuard = ({ children, embedded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = portalApi.getToken();
    if (!token) {
      navigate("/memo-portal/login", { replace: true, state: { from: location } });
      return;
    }
    portalApi
      .me()
      .then(() => setChecked(true))
      .catch(() => {
        portalApi.clearSession();
        navigate("/memo-portal/login", { replace: true });
      });
  }, [navigate, location]);

  if (!checked) return null;
  return typeof children === "function" ? children({ embedded }) : children;
};

const MemoPortalApp = ({ storageKey = "memo_portal_token", embedded = false }) => {
  useEffect(() => { setStorageKey(storageKey); }, [storageKey]);

  return (
    <Routes>
      <Route path="login" element={<PortalLogin embedded={embedded} />} />
      <Route
        path="logout"
        element={<LogoutAndRedirect />}
      />
      <Route
        index
        element={
          <PortalGuard embedded={embedded}>
            <PortalList embedded={embedded} />
          </PortalGuard>
        }
      />
      <Route
        path="memos/:id"
        element={
          <PortalGuard embedded={embedded}>
            <PortalDetail embedded={embedded} />
          </PortalGuard>
        }
      />
      <Route path="*" element={<Navigate to="/memo-portal" replace />} />
    </Routes>
  );
};

const LogoutAndRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try { await portalApi.logout(); } catch (_) { /* ignore */ }
      portalApi.clearSession();
      navigate("/memo-portal/login", { replace: true });
    })();
  }, [navigate]);
  return null;
};

export default MemoPortalApp;
