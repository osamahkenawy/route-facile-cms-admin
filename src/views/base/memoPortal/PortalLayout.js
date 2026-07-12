// Public layout shell for the Memo Portal. Renders Trasealla header (logo +
// user/email + Logout) and a footer. Embedded mode skips the header/footer
// since the admin shell already provides chrome.

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import portalApi from "./portalApi";
import traseallaLogo from "./logo_trasealla_navy.svg";
import "./memoPortal.css";

const PortalLayout = ({ children, embedded = false, email }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await portalApi.logout(); } catch (_) { /* ignore */ }
    portalApi.clearSession();
    navigate("/memo-portal/login", { replace: true });
  };

  if (embedded) {
    return <div className="mp-shell">{children}</div>;
  }

  const initials = (email || "?")
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mp-shell">
      <header className="mp-header">
        <Link to="/memo-portal" className="mp-header__brand">
          <img src={traseallaLogo} alt="Trasealla" className="mp-header__logo" />
          <span className="mp-header__divider" />
          <span className="mp-header__brandText">
            <span className="mp-header__brandTitle">Memo Portal</span>
            <span className="mp-header__brandSub">Internal communications</span>
          </span>
        </Link>
        {email && (
          <div className="mp-header__user">
            <div className="mp-header__avatar" title={email}>{initials || "U"}</div>
            <div className="mp-header__userInfo">
              <span className="mp-header__userLabel">Signed in as</span>
              <span className="mp-header__email" title={email}>{email}</span>
            </div>
            <button className="mp-btn mp-btn--ghost" onClick={handleLogout}>
              <FaSignOutAlt size={12} /> Logout
            </button>
          </div>
        )}
      </header>
      <main className="mp-main">{children}</main>
      <footer className="mp-footer">
        © {new Date().getFullYear()} Trasealla. Confidential — for internal use only.
      </footer>
    </div>
  );
};

export default PortalLayout;

