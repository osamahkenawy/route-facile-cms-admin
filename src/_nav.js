import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilChartPie,
  cilCursor,
  cilNotes,
  cilPuzzle,
  cilSpeedometer,
  cilDescription,
} from "@coreui/icons";
import { CNavGroup, CNavItem } from "@coreui/react";
import { TfiHome } from "react-icons/tfi";
import { TfiViewListAlt } from "react-icons/tfi";
import { TfiViewGrid } from "react-icons/tfi";
import { TfiCar } from "react-icons/tfi";
import { TfiUser } from "react-icons/tfi";
import { TfiMoney } from "react-icons/tfi";
import { TfiReload } from "react-icons/tfi";
import { TfiBriefcase } from "react-icons/tfi";

const _nav = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/dashboard",
    icon: <TfiHome className="nav-icon" />,
    roles: ["admin", "accounts"],
  },
  {
    component: CNavGroup,
    name: "Car",
    to: "/car",
    icon: <TfiCar className="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Brand",
        to: "/car/brand",
      },
      {
        component: CNavItem,
        name: "Category",
        to: "/car/category",
      },
      {
        component: CNavItem,
        name: "Cars",
        to: "/car/cardatabase",
      },
      {
        component: CNavItem,
        name: "Car Groups",
        to: "/car/group",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "CMS",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Homepage Banners",
        to: "/cms/homepagebanners",
      },
      {
        component: CNavItem,
        name: "Cities",
        to: "/cms/cities",
      },
      {
        component: CNavItem,
        name: "Locations",
        to: "/cms/locations",
      },
      {
        component: CNavItem,
        name: "Special Offers",
        to: "/cms/special-offers",
      },
      {
        component: CNavItem,
        name: "Pages",
        to: "/cms/admin-pages",
      },
      {
        component: CNavItem,
        name: "Awards and Recognitions",
        to: "/cms/awards-and-recognition",
      },
      {
        component: CNavItem,
        name: "Teachers Rental",
        to: "/cms/teachers-rental",
      },
      {
        component: CNavItem,
        name: "Promo Ticker",
        to: "/cms/promo-ticker",
      },
    ],
  },
  // {
  //   component: CNavGroup,
  //   name: "EDC Promotions",
  //   icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: "EDC Promo Code",
  //       to: "/cms/edc-promo",
  //     },
  //     {
  //       component: CNavItem,
  //       name: "EDC Terms & Conditions",
  //       to: "/cms/edc-terms",
  //     },
  //   ],
  // },
  {
    component: CNavGroup,
    name: "User Request",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Enquiry Requests",
        to: "/user-request/enquiry-request",
      },
      {
        component: CNavItem,
        name: "Lost And Found Requests",
        to: "/user-request/lost-and-found-request",
      },
      {
        component: CNavItem,
        name: "Subscription Requests",
        to: "/user-request/subscription-request",
      },
      {
        component: CNavItem,
        name: "Offer Requests",
        to: "/user-request/offer-request",
      },
    ],
  },

  {
    component: CNavGroup,
    name: "Pricing",
    icon: <TfiMoney className="nav-icon" />,

    items: [
      {
        component: CNavGroup, // Nested group for PAGES
        name: "Daily Pricing",
        items: [
          {
            component: CNavItem,
            name: "Upload Daily Pricing",
            to: "/pricing/upload-daily-pricing",
          },
          {
            component: CNavItem,
            name: "Daily Pricing List",
            to: "/pricing/daily-pricing-list",
          },
        ],
      },
      {
        component: CNavGroup, // Nested group for PAGES
        name: "Monthly Pricing",
        items: [
          {
            component: CNavItem,
            name: "Upload Monthly Pricing",
            to: "/pricing/upload-monthly-pricing",
          },
          {
            component: CNavItem,
            name: "Monthly Pricing List",
            to: "/pricing/monthly-price-list",
          },
        ],
      },
      {
        component: CNavGroup, // Nested group for PAGES
        name: "Range Pricing",
        items: [
          {
            component: CNavItem,
            name: "Upload Range Pricing",
            to: "/pricing/upload-range-pricing",
          },
          {
            component: CNavItem,
            name: "Range Pricing List",
            to: "/pricing/range-pricing-list",
          },
        ],
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Dynamic Pricing",
    icon: <TfiMoney className="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Range Discount",
        to: "/dynamic-pricing/range-pricing",
      },
      {
        component: CNavItem,
        name: "Daily/Weekly Coupon Code",
        to: "/dynamicpricing/coupon-code",
      },
      {
        component: CNavItem,
        name: "Monthly Coupon Code",
        to: "/dynamicpricing/monthly-coupon-code",
      },
      {
        component: CNavGroup,
        name: "One-Time Coupons",
        items: [
          {
            component: CNavItem,
            name: "List",
            to: "/admin/one-time-coupons",
          },
          {
            component: CNavItem,
            name: "Add coupon",
            to: "/admin/one-time-coupons/new",
          },
          {
            component: CNavItem,
            name: "Bulk create",
            to: "/admin/one-time-coupons/bulk",
          },
        ],
      },
      {
        component: CNavItem,
        name: "Surge Pricing",
        to: "/dynamic-pricing/surge-pricing",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Users",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Documents",
        to: "/users/documents",
        roles: ["counter"],
      },
      {
        component: CNavItem,
        name: "Users",
        to: "/users"
      }
    ],
  },
  {
    component: CNavGroup,
    name: "Bookings",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,

    items: [
      {
        component: CNavItem,
        name: "Bookings",
        to: "/bookings",
        roles: ["counter", "accounts"],
      },
      {
        component: CNavItem,
        name: "Booking logs",
        to: "/bookings/logs",
        roles: ["accounts"],
      },

      {
        component: CNavItem,
        name: "Incomplete Bookings",
        to: "/bookings/incomplete",
        roles: ["accounts"],
      },
      {
        component: CNavItem,
        name: "Refunds",
        to: "/refunds",
        roles: ["accounts"],
      },
      {
        component: CNavItem,
        name: "Download Report",
        to: "/download-report",
        roles: ["accounts"],
      },
    ],
  },
  // {
  //   component: CNavItem,
  //   name: "Stop Sale",
  //   to: "/stop-sale/stop-sale-list",
  //   icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  // },
  {
    component: CNavGroup,
    name: "Misc. Settings",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Other Charges",
        to: "/misc-setting/other-charges",
      },
      {
        component: CNavItem,
        name: "Inter City Charges",
        to: "/misc-setting/inter-city-charges",
      },
    ],
  },
  // {
  //   component: CNavItem,
  //   name: "UI Vote",
  //   to: "/ui-vote",
  //   icon: <TfiViewListAlt className="nav-icon" />,
  // },
  {
    component: CNavItem,
    name: "KYC Submissions",
    to: "/admin/kyc/submissions",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    roles: ["admin", "kyc_officer"],
  },
  {
    component: CNavGroup,
    name: "HR & Recruiting",
    icon: <TfiBriefcase className="nav-icon" />,
    visible: true,
    items: [
      {
        component: CNavItem,
        name: "Manager Dashboard",
        to: "/hr/dashboard/manager",
        roles: ["hr_manager"],
      },
      {
        component: CNavItem,
        name: "HR Staff",
        to: "/hr/staff",
        roles: ["hr_manager"],
      },
      {
        component: CNavItem,
        name: "Staff Dashboard",
        to: "/hr/dashboard/staff",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "Job Postings",
        to: "/hr/jobs",
        roles: ["hr_manager", "hr_recruitment"],
      },
      {
        component: CNavItem,
        name: "Applications",
        to: "/hr/applications",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "Questionnaires",
        to: "/hr/questionnaires",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "AI Keywords",
        to: "/hr/keywords",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "Channel Postings",
        to: "/hr/channel-postings",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "Status History",
        to: "/hr/status-history",
        roles: ["hr_recruitment", "hr_manager"],
      },
      {
        component: CNavItem,
        name: "Ratings",
        to: "/hr/ratings",
        roles: ["hr_recruitment", "hr_manager"],
      },
    ],
  },
];

export default _nav;
