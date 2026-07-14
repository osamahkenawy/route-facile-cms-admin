import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { simplePostCall } from "../../../components/config.js/Setup";
import configWeb from "../../../components/config.js/ConfigWeb";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import { Form, Spinner } from "react-bootstrap";
import CryptoJS from "crypto-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../../assets/images/logo_new.png";
import loginBgImage from "../../../assets/images/admin_login_page.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setErrorMessage("");
  }, [username, password]);

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      LoginUser();
    }
    setValidated(true);
  };

  const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;

  const LoginUser = () => {
    let body = {
      email: username,
      password: password,
    };

    setIsLoading(true);
    simplePostCall(configWeb.POST_LOGIN, JSON.stringify(body))
      .then((res) => {
        if (!res?.error) {
          const now = new Date();
          const token_item = {
            access_token: res?.access_token,
            user_id: res?.user_id,
            expiry: now.getTime() + 2 * 60 * 60 * 1000,
          };
          localStorage.setItem("token", JSON.stringify(token_item));
          const encryptedUserRole = CryptoJS.AES.encrypt(
            res?.type,
            secretKey
          ).toString();
          localStorage.setItem("trasealla_user_role", encryptedUserRole);
          localStorage.setItem(
            "trasealla_must_reset_password",
            res?.must_reset_password ? "1" : "0"
          );
          localStorage.setItem("trasealla_login_portal", "admin");
          notifySuccess("Login Successful.");

          const userType = res?.type;
          // KYC officers skip change-password flow entirely.
          if (res?.must_reset_password && userType !== 'kyc_officer') {
            navigate('/admin/change-password', { replace: true });
          } else {
            let redirectTo = '/';
            if (userType === 'hr_manager') {
              redirectTo = '/hr/dashboard/manager';
            } else if (userType === 'hr_recruitment') {
              redirectTo = '/hr/dashboard/staff';
            } else if (userType === 'kyc_officer') {
              redirectTo = '/admin/kyc/submissions';
            }
            navigate(redirectTo, { replace: true });
          }
        } else {
          const errorMsg = res.message || "Invalid email or password";
          setErrorMessage(errorMsg);
          notifyError(errorMsg);
        }
      })
      .catch((errr) => {
        console.log(errr);
        const errorMsg = "Something went wrong, please try again";
        setErrorMessage(errorMsg);
        notifyError(errorMsg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="row g-0 login-row">
          {/* Left Side - Image Panel */}
          <div className="col-lg-6 d-none d-lg-block">
            <div 
              className="login-left-panel"
              style={{
                backgroundImage: `url(${loginBgImage})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#FFF'
              }}
            >
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="col-lg-6">
            <div className="login-right-panel">
              <div className="login-form-container">
                {/* Logo */}
                <div className="login-logo">
                  <img src={logo} alt="Route Facile" height="60" />
                </div>

                {/* Welcome Text */}
                <div className="login-header">
                  <h4>
                    Welcome to <span className="fw-bold">Route Facile</span>
                  </h4>
                  <p className="text-muted">
                    Sign in to continue to Route Facile Admin.
                  </p>
                </div>

                {/* Login Form */}
                <Form
                  noValidate
                  onSubmit={handleSubmit}
                  className={`login-form ${validated ? "was-validated" : ""}`}
                >
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className={`form-control ${username ? "has-value" : ""}`}
                      id="email-input"
                      placeholder="Enter Email"
                      value={username}
                      onChange={handleUsernameChange}
                      autoComplete="off"
                      required
                    />
                    <label htmlFor="email-input">Email</label>
                    <div className="invalid-feedback">
                      Please enter your email.
                    </div>
                  </div>

                  <div className="form-floating password-field mb-3">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${password ? "has-value" : ""}`}
                      id="password-input"
                      placeholder="Enter Password"
                      value={password}
                      onChange={handlePasswordChange}
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePassword}
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <label htmlFor="password-input">Password</label>
                    <div className="invalid-feedback">
                      Please enter your password.
                    </div>
                  </div>

                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                    />
                    <label
                      className="form-check-label text-muted"
                      htmlFor="rememberMe"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    className="btn btn-login w-100"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner size="sm" /> : "Log In"}
                  </button>

                  {errorMessage && (
                    <p className="alert alert-danger mt-3">{errorMessage}</p>
                  )}
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
