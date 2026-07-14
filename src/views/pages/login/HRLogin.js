import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Spinner } from "react-bootstrap";
import CryptoJS from "crypto-js";
import { motion } from "framer-motion";
import {
  FaEye,
  FaEyeSlash,
  FaUserTie,
  FaLock,
  FaEnvelope,
  FaBriefcase,
  FaUsers,
  FaChartLine,
  FaCalendarCheck,
} from "react-icons/fa";
import { simplePostCall } from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import logo from "../../../assets/images/admin_sidebar_logo.png";
import "./hr-login.css";

const ALLOWED_ROLES = ["hr_manager", "hr_recruitment"];

const HRLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;

  useEffect(() => {
    setErrorMessage("");
  }, [email, password]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setValidated(true);
    if (form.checkValidity() === false) {
      event.stopPropagation();
      return;
    }
    loginHR();
  };

  const loginHR = () => {
    setIsLoading(true);
    simplePostCall(
      configWeb.POST_LOGIN,
      JSON.stringify({ email, password })
    )
      .then((res) => {
        if (res?.error) {
          const msg = res.message || "Invalid email or password";
          setErrorMessage(msg);
          notifyError(msg);
          return;
        }

        const userType = res?.type;
        if (!ALLOWED_ROLES.includes(userType)) {
          const msg = "This portal is restricted to HR users only.";
          setErrorMessage(msg);
          notifyError(msg);
          return;
        }

        const now = new Date();
        const tokenItem = {
          access_token: res?.access_token,
          user_id: res?.user_id,
          expiry: now.getTime() + 2 * 60 * 60 * 1000,
        };
        localStorage.setItem("token", JSON.stringify(tokenItem));
        localStorage.setItem(
          "trasealla_user_role",
          CryptoJS.AES.encrypt(userType, secretKey).toString()
        );
        localStorage.setItem(
          "trasealla_must_reset_password",
          res?.must_reset_password ? "1" : "0"
        );
        localStorage.setItem("trasealla_login_portal", "hr");

        notifySuccess("Welcome to the HR Portal");

        if (res?.must_reset_password) {
          navigate("/admin/change-password", { replace: true });
          return;
        }

        const redirectTo =
          userType === "hr_manager"
            ? "/hr/dashboard/manager"
            : "/hr/dashboard/staff";
        navigate(redirectTo, { replace: true });
      })
      .catch(() => {
        const msg = "Something went wrong, please try again";
        setErrorMessage(msg);
        notifyError(msg);
      })
      .finally(() => setIsLoading(false));
  };

  const features = [
    { icon: <FaBriefcase />, title: "Job Postings", desc: "Publish and manage open roles" },
    { icon: <FaUsers />, title: "Candidate Pipeline", desc: "Track applications end-to-end" },
    { icon: <FaCalendarCheck />, title: "Interviews", desc: "Schedule and rate candidates" },
    { icon: <FaChartLine />, title: "Insights", desc: "Funnel and channel analytics" },
  ];

  return (
    <div className="hr-login-page">
      <div className="hr-login-bg-orb orb-a" />
      <div className="hr-login-bg-orb orb-b" />
      <div className="hr-login-bg-grid" />

      <div className="hr-login-container">
        <motion.div
          className="hr-login-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Left brand panel */}
          <div className="hr-login-brand">
            <div className="hr-login-brand-top">
              <img src={logo} alt="Route Facile" className="hr-login-logo" />
              <span className="hr-login-pill">
                <FaUserTie /> HR Portal
              </span>
            </div>

            <div className="hr-login-brand-hero">
              <h1>
                Hire <span>smarter</span>.
                <br />
                Move faster.
              </h1>
              <p>
                One workspace for managers and recruiters to post roles, screen
                candidates, run interviews and make confident hiring calls.
              </p>
            </div>

            <div className="hr-login-feature-grid">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="hr-login-feature"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                >
                  <div className="hr-login-feature-icon">{f.icon}</div>
                  <div>
                    <div className="hr-login-feature-title">{f.title}</div>
                    <div className="hr-login-feature-desc">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="hr-login-brand-foot">
              <span>Restricted access</span>
              <span>HR Manager · HR Recruitment</span>
            </div>
          </div>

          {/* Right form panel */}
          <div className="hr-login-form-side">
            <div className="hr-login-form-wrap">
              <div className="hr-login-mobile-logo">
                <img src={logo} alt="Route Facile" />
              </div>

              <div className="hr-login-form-header">
                <h2>Welcome back</h2>
                <p>Sign in to access the HR Portal.</p>
              </div>

              <Form
                noValidate
                onSubmit={handleSubmit}
                className={`hr-login-form ${validated ? "was-validated" : ""}`}
              >
                <label className="hr-login-label" htmlFor="hr-email">
                  Work email
                </label>
                <div className="hr-login-input">
                  <FaEnvelope className="hr-login-input-icon" />
                  <input
                    id="hr-email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@routefacile.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <label className="hr-login-label mt-3" htmlFor="hr-password">
                  Password
                </label>
                <div className="hr-login-input">
                  <FaLock className="hr-login-input-icon" />
                  <input
                    id="hr-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="hr-login-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>

                <div className="hr-login-row">
                  <label className="hr-login-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {errorMessage && (
                  <motion.div
                    className="hr-login-error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errorMessage}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className="hr-login-submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                  {isLoading ? <Spinner size="sm" animation="border" /> : "Sign in to HR Portal"}
                </motion.button>

                <div className="hr-login-help">
                  Trouble signing in? Contact your HR administrator.
                </div>
              </Form>
            </div>

            <div className="hr-login-footer">
              © {new Date().getFullYear()} Route Facile · HR Portal
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HRLogin;
