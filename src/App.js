import React, { Suspense, useContext, useEffect } from "react";
import {
  HashRouter,
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";

import { CSpinner, useColorModes } from "@coreui/react";
import "./scss/style.scss";
import "./css/main.css";
import "react-toastify/dist/ReactToastify.css";
import RegisterNew from "./views/pages/register/RegisterNew";
import ProtectedRoute from "./ProtectedRoute";

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));

const Login = React.lazy(() => import("./views/pages/login/Login"));
const HRLogin = React.lazy(() => import("./views/pages/login/HRLogin"));
const KycLogin = React.lazy(() => import("./views/pages/login/KycLogin"));
const ChangePassword = React.lazy(() => import("./views/pages/change-password/ChangePassword"));
// const Register = React.lazy(() => import('./views/pages/register/Register'))
// const RegisterNew = React.lazy(() => import('./views/pages/register/RegisterNew'))
const Page404 = React.lazy(() => import("./views/pages/page404/Page404"));
const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));
const MemoPortalApp = React.lazy(() => import("./views/base/memoPortal/MemoPortalApp"));

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes(
    "coreui-free-react-admin-template-theme"
  );
  const storedTheme = useSelector((state) => state.theme);
  // const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split("?")[1]);
    const theme =
      urlParams.get("theme") &&
      urlParams.get("theme").match(/^[A-Za-z0-9\s]+/)[0];
    if (true) {
      setColorMode("light");
    }

    if (isColorModeSet()) {
      return;
    }

    setColorMode(/* storedTheme */ "light");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications position="top-right" />
        {/* <HashRouter> */}
        <ToastContainer />
        <BrowserRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              {/* <CSpinner color="primary" variant="grow" /> */}
              <div></div>
            </div>
          }
        >
          <Routes>
            <Route exact path="/login" name="Login Page" element={<Login />} />
            <Route exact path="/hr/login" name="HR Login" element={<HRLogin />} />
            <Route exact path="/admin/kyc/login" name="KYC Login" element={<KycLogin />} />
            <Route exact path="/change-password" name="Change Password" element={<ProtectedRoute element={<ChangePassword />} />} />
            <Route exact path="/admin/change-password" name="Admin Change Password" element={<ProtectedRoute element={<ChangePassword />} />} />
            {/* <Route exact path="/register" name="Register Page" element={<RegisterNew />} /> */}
            <Route exact path="/404" name="Page 404" element={<Page404 />} />
            <Route exact path="/500" name="Page 500" element={<Page500 />} />

            {/* Public Memo Portal (email + PIN, no admin login required) */}
            <Route
              path="/memo-portal/*"
              element={<MemoPortalApp storageKey="memo_portal_token" />}
            />

            {/* Protected Route */}
            <Route
              path="*"
              element={<ProtectedRoute element={<DefaultLayout />} />}
            />

            {/* <Route path="*" name="Home" element={<DefaultLayout />} /> */}
          </Routes>
        </Suspense>
      </BrowserRouter>
      {/* </HashRouter> */}
      </ModalsProvider>
    </MantineProvider>
  );
};

export default App;
