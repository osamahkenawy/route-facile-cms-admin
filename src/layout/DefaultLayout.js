import React, { useEffect } from "react";
import {
  AppContent,
  AppSidebar,
  AppFooter,
  AppHeader,
} from "../components/index";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";

const DefaultLayout = () => {
  const location = useLocation();
  useEffect(() => {
    const rootDiv = document.getElementById("root");
    if (
      location.pathname === "/bookings/logs" ||
      location.pathname === "/bookings"
    ) {
      rootDiv.classList.add("logs-page");
    } else {
      rootDiv.classList.remove("logs-page");
    }
  }, [location]);
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 w-100">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default DefaultLayout;
