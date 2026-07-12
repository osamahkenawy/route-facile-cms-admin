import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CContainer, CSpinner } from "@coreui/react";
import CryptoJS from "crypto-js";
import routes from "../routes";

const AccountsDashboard = lazy(() => import("../views/dashboard/AccountsDashboard"));

const AppContent = () => {
  const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;
  const userRoleEncrypted = localStorage.getItem("trasealla_user_role");
  let userRole = "";
  if (userRoleEncrypted) {
    try {
      userRole = CryptoJS.AES.decrypt(userRoleEncrypted, secretKey).toString(
        CryptoJS.enc.Utf8
      );
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  }

  const filteredRoutes = routes.filter((route) =>
    route?.roles?.includes(userRole)
  );
  const redirectRoutes = userRole === "admin" ? routes : filteredRoutes;

  const wrongUrlRedirect =
    userRole === "admin"
      ? "/"
      : userRole === "accounts"
        ? "/accounts-dashboard"
        : userRole === "hr_manager"
          ? "/hr/dashboard/manager"
          : userRole === "hr_recruitment"
            ? "/hr/dashboard/staff"
            : userRole === "kyc_officer"
              ? "/admin/kyc/submissions"
              : "/bookings";

  return (
    <CContainer className="px-4" lg>
      {/* <Suspense fallback={<CSpinner color="primary" />}> */}
      <Suspense fallback={<div> </div>}>
        <Routes>
          {redirectRoutes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            );
          })}
          {(userRole === "admin" || userRole === "accounts") ? (
            <Route path="/" element={<AccountsDashboard />} />
          ) : (
            <Route path="/" element={<Navigate to={wrongUrlRedirect} replace />} />
          )}
          <Route path="*" element={<Navigate to={wrongUrlRedirect} />} />
        </Routes>
      </Suspense>
    </CContainer>
  );
};

export default React.memo(AppContent);
