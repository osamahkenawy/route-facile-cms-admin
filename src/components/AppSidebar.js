import React from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from "@coreui/react";

import { AppSidebarNav } from "./AppSidebarNav";
import navigation from "../_nav";
import { Link } from "react-router-dom";
import CryptoJS from "crypto-js";

// Import the small logo for collapsed sidebar
import logoSmall from "../assets/images/trasealla_t_mark.png";
import logoNewTrasealla from "../assets/images/arc_white_logo.png";

// Import accounts sidebar styles
import "../views/dashboard/accountsDashboard.css";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const token = localStorage?.getItem("token");
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

  const roleBasedFilterNavigation = navigation
    .map((nav) => {
      // Top-level items without children (e.g., Dashboard)
      if (!nav.items) {
        return nav?.roles?.includes(userRole) ? nav : null;
      }

      const filteredItems = nav.items.filter((item) =>
        item?.roles?.includes(userRole)
      );

      if (filteredItems.length === 0) return null;

      return {
        ...nav,
        items: filteredItems,
      };
    })
    .filter(Boolean);

  // Admin sees everything except HR & Recruiting (HR portal has its own navigation)
  const adminNavigation = navigation.filter(
    (nav) => nav?.name !== "HR & Recruiting"
  );

  const navigationBasedOnRole =
    userRole === "admin" ? adminNavigation : roleBasedFilterNavigation;

  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);

  return (
    <CSidebar
      className="border-end accounts-sidebar"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: "set", sidebarShow: visible });
      }}
    >
      <CSidebarHeader className="">
        <CSidebarBrand to="/">
          {/* Full logo - shown when sidebar is expanded */}
          <Link to="/" className="sidebar-brand-full" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <img
              src={logoNewTrasealla}
              alt="logo"
              style={{ width: '200px', objectFit: 'contain' }}
            />
          </Link>
          {/* Small logo - shown when sidebar is collapsed */}
          <img
            src={logoSmall}
            alt="logo"
            height={28}
            className="p-1 rounded-2 sidebar-brand-narrow"
          />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: "set", sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigationBasedOnRole} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() =>
            dispatch({ type: "set", sidebarUnfoldable: !unfoldable })
          }
        />
      </CSidebarFooter>
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
