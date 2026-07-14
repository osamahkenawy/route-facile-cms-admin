import React, { useEffect } from 'react'
import { useState, useContext } from 'react'
import { Form, Spinner } from 'react-bootstrap';
// import { ConfigContext } from '../Context/ConfigContext'
// import { ConfigProvider } from '../Context/ConfigContext'
// import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
// import { Trans, useTranslation } from 'react-i18next';



const RegisterNew = () => {
    // const { t } = useTranslation();

    // const { apiURL, handleUpdateToken } = useContext(ConfigContext);
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validated, setValidated] = useState(false);
    const navigate = useNavigate();

    const [registerState, setRegisterState] = useState({
      first_name: "",
      last_name: "",
      phone_code: "",
      phone_number: "",
      email: "",
      password:""
    });

const handleChange = (e) => {
  const { name, value } = e.target;
  setRegisterState((prev) => ({
    ...prev,
    [name]: value,
  }));
};
    useEffect(() => {
        setErrorMessage('');
    }, [username, password])


    const togglePassword = () => {
        setShowPassword((prevState) => !prevState);
    }

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
        // Proceed with form submission logic
        //   setIsLoading(true);
        // Simulating async process
        // Login();
      }
      setValidated(true);
    };

    return (
        <>
            <div

                className="auth-page-wrapper pt-5 ">
                {/* auth page bg */}
                <div

                    className="auth-one-bg-position auth-one-bg"

                    id="auth-particles">


                    <div

                        className="bg-overlay " ></div>


                    <div className="shape">


                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 1440 120" >

                            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z" fill="#FBF7F4">

                            </path>
                        </svg>
                    </div>
                </div>
            </div>
            {/* <!-- auth page content --> */}
            <div className="auth-page-content">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="text-center mt-sm-5 mb-4 text-white-50--">
                                <div className="d-inline-block auth-logo">
                                    <a href="index.html">
                                        {/* <img src="assets/images/logo-light.png" alt="" height="20" /> */}
                                        <img src="assets/images/logo_new.png" alt="" height="110" style={{position:"absolute"}} />
                                    </a>
                                </div>
                                <p className="mt-3 fs-15 fw-medium text-danger">Route Facile Admin Control Panel</p>

                            </div>
                        </div>
                    </div>
                    {/* <!-- end row --> */}

                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6 col-xl-5">
                            <div className="card mt-4 z-1">
                                <div className="card-body p-4">
                                    <div className="text-center mt-2">
                                        <h5 className="text-primary">Welcome !</h5>
                                        <p className="text-muted">Register to Continue to Route Facile Admin.</p>


                                    </div>

                                    <div className="p-2 mt-4">
                                    <Form noValidate onSubmit={handleSubmit} className={validated ? 'was-validated' : ''}>
      
                                    <div className="mb-3">
        <label htmlFor="first_name" className="form-label">First Name</label>
        <input
          type="text"
          className="form-control position-relative z-1"
          id="first_name"
          name="first_name"
          placeholder="Enter first name"
          value={registerState?.first_name}
          onChange={handleChange}
          autoComplete="off"
          required
        />
        <div className="invalid-feedback">
          Please enter first name.
        </div>
      </div>
                                    <div className="mb-3">
        <label htmlFor="last_name" className="form-label">Last Name</label>
        <input
          type="text"
          className="form-control position-relative z-1"
          id="last_name"
          name="last_name"
          placeholder="Enter first name"
          value={registerState?.last_name}
          onChange={handleChange}
          autoComplete="off"
          required
        />
        <div className="invalid-feedback">
          Please enter last name.
        </div>
      </div>
      
      
      
      <div className="mb-3">
        <label htmlFor="username" className="form-label">Email</label>
        <input
          type="email"
          className="form-control position-relative z-1"
          id="username"
          name="username"
          placeholder="Enter user name"
          value={username}
          onChange={handleUsernameChange}
          autoComplete="off"
          required
        />
        <div className="invalid-feedback">
          Please enter your username.
        </div>
      </div>

      <div className="mb-3">
        <div className="float-end">
          <a href="auth-pass-reset-basic.html" className="text-muted">Forgot password?</a>
        </div>
        <label className="form-label" htmlFor="password-input">Password</label>
        <div className="position-relative auth-pass-inputgroup mb-3">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control pe-5 password-input"
            placeholder="Enter password"
            id="password-input"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="off"
            required
          />
          <button
            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
            type="button"
            id="password-addon"
            onClick={togglePassword}
          >
            <i className={`${showPassword ? 'ri-eye-fill align-middle' : 'ri-eye-off-fill align-middle'}`}></i>
          </button>
          <div className="invalid-feedback">
            Please enter your password.
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="hstack flex-wrap gap-2 mb-3 mb-lg-0">
          <button
            className="btn btn-primary w-100"
            type="submit"
            disabled={/* !username || !password || */ isLoading}
          >
            <span className="d-flex align-items-center">
              {/* {isLoading && (
                <span className="spinner-border flex-shrink-0" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
              )} */}
              <span className="flex-grow-1 ms-2 text-center">
                {isLoading ? <Spinner/> : 'Register'}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* {errorMessage && <p className="alert alert-danger">{errorMessage}</p>} */}
    </Form>
                                    </div>



                                </div>

                                {/* <!-- end card body --> */}

                            </div>
                            {/* <!-- end card --> */}

                            <div className="mt-4 text-center">
                                <p className="mb-0">Already have an account ? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Login </Link> </p>
                            </div>

                        </div>
                    </div>
                    {/* <!-- end row --> */}

                </div>
                {/* <!-- end container --> */}


            </div>
            {/*  <!-- end auth page content --> */}
            {/*  <!-- footer --> */}
            <footer className="footer">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="text-center">
                                {/* <p className="mb-0 text-muted">&copy;
                                    {year} Velzon. Crafted with <i className="mdi mdi-heart text-danger"></i> by Themesbrand
                                </p> */}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            {/*  <!-- end Footer --> */}

        </>
    )
}

export default RegisterNew