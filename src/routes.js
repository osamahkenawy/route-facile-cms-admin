import React from "react";
import QoutationRequest from "./views/base/quotationReq/QuotationRequest";
import Brand from "./views/base/car/CarBrand/CarBrand.js";
import CCategory from "./views/base/car/CarCategory/CarCategoryList.js";
import Group from "./views/base/car/Group.js";
import Transmission from "./views/base/car/Transmission.js";
import Fueltype from "./views/base/car/Fueltype.js";
import Cardatabase from "./views/base/car/carDataBase/Cardatabase.js";
import CreateCar from "./views/base/car/carDataBase/CreateCar";
import Cartype from "./views/base/car/Cartype.js";
import Allusers from "./views/base/user/Allusers.js";
import Inactiveuser from "./views/base/user/InactiveUsers.js";
import Userfeedback from "./views/base/user/Userfeedback.js";
import HomepageBanner from "./views/base/cms/HomePageBanner/HomepageBanner.js";
import FAQcategory from "./views/base/cms/FAQcategory.js";
import FAQs from "./views/base/cms/FAQs.js";
import Cities from "./views/base/cms/Cities/Cities.js";
import Locations from "./views/base/cms/Locations/Locations.js";
import SpecialOffers from "./views/base/cms/SpecialOffers/SpecialOffers.js";
import Aboutus from "./views/base/cms/Aboutus.js";
import CoprporateLeasing from "./views/base/cms/CoprporateLeasing.js";
import BusCommercial from "./views/base/cms/BusCommercial.js";
import Career from "./views/base/cms/Career.js";
import CareerJobs from "./views/base/cms/CareerJobs/CareerJobs.js";
import CreateCareerJob from "./views/base/cms/CareerJobs/CreateCareerJob.js";
import CareerApplications from "./views/base/cms/CareerJobs/CareerApplications.js";
import ApplicationDetail from "./views/base/cms/CareerJobs/ApplicationDetail.js";
import HRDashboard from "./views/base/HR/HRDashboard";
import HRManagerDashboard from "./views/base/HR/HRManagerDashboard";
import HRStaffDashboard from "./views/base/HR/HRStaffDashboard";
import HRJobsList from "./views/base/HR/HRJobsList";
import HRJobForm from "./views/base/HR/HRJobForm";
import HRJobDetail from "./views/base/HR/HRJobDetail";
import HRApplicationsList from "./views/base/HR/HRApplicationsList";
import HRApplicationDetail from "./views/base/HR/HRApplicationDetail";
import HRDepartments from "./views/base/HR/HRDepartments";
import HRInterviewsList from "./views/base/HR/HRInterviewsList";
import HRInterviewDetail from "./views/base/HR/HRInterviewDetail";
import HRQuestionnaires from "./views/base/HR/HRQuestionnaires";
import HRKeywords from "./views/base/HR/HRKeywords";
import HRChannelPostings from "./views/base/HR/HRChannelPostings";
import HRStatusHistory from "./views/base/HR/HRStatusHistory";
import HRRatings from "./views/base/HR/HRRatings";
import HRStaff from "./views/base/HR/HRStaff";
import PrivacyPolicy from "./views/base/cms/PrivacyPolicy.js";
import TermsConditions from "./views/base/cms/TermsConditions.js";
import Citywise from "./views/base/cms/Citywise.js";
import Landmarkwise from "./views/base/cms/Landmarkwise.js";
import Neighbourhood from "./views/base/cms/Neighbourhood.js";
import AwardRecognition from "./views/base/cms/AwardsAndRecognition.js/AwardRecognition.js";
import Uploaddailypricing from "./views/base/pricing/Uploaddailypricing.js";
import Dailypricelist from "./views/base/pricing/Dailypricelist.js";
import Uploadmonthlypricing from "./views/base/pricing/Uploadmonthlypricing.js";
import Monthlypricelist from "./views/base/pricing/Monthlypricelist.js";
import IndiCarPricing from "./views/base/pricing/IndiCarPricing.js";
import GroupcarPricing from "./views/base/pricing/GroupcarPricing.js";
import InterCityPricing from "./views/base/pricing/InterCityPricing.js";
import UploadRangePricing from "./views/base/pricing/UploadRangePricing.js";
import Rangepricinglist from "./views/base/pricing/Rangepricinglist.js";
import RangePricing from "./views/base/dynamicPricing/RangePricing.js";
import AdvanceBooking from "./views/base/dynamicPricing/AdvanceBooking.js";
import CouponCode from "./views/base/dynamicPricing/CouponCode.js";
import CouponCodeMonthly from "./views/base/dynamicPricing/CouponCodeMonthly.js";
import CreateCouponCode from "./views/base/dynamicPricing/CreateCouponCode";
import CreateLocation from "./views/base/cms/Locations/CreateLocation";
import DaySurge from "./views/base/dynamicPricing/SurgeList.js";
import BookNowDis from "./views/base/dynamicPricing/BookNowDis.js";
import Allbookings from "./views/base/Bookings/Allbookings.js";
import Currentbookings from "./views/base/Bookings/Currentbookings.js";
import Upcomingbookings from "./views/base/Bookings/Upcomingbookings.js";
import Pastbookings from "./views/base/Bookings/Pastbookings.js";
import Cancelledbookings from "./views/base/Bookings/Cancelledbookings.js";
import Failedbookings from "./views/base/Bookings/Failedbookings.js";
import RefundList from "./views/base/Bookings/RefundList";
import Pendingrefundlist from "./views/base/Refund/Pendingrefundlist.js";
import Login from "./views/pages/login/Login.js";
import AddPost from "./views/base/poost/AddPost";
import CreateSurge from "./views/base/dynamicPricing/CreateSurge";
import BookingLogs from "./views/base/Bookings/BookingLogs";
import Bookings from "./views/base/Bookings/Bookings.js";
import EditCity from "./views/base/cms/Cities/EditCity";
import CreateHomePageBanner from "./views/base/cms/HomePageBanner/CreateHomePageBanner";
import CreateSpecialOffers from "./views/base/cms/SpecialOffers/CreateSpecialOffers";
import CreateAwardsAndRecognition from "./views/base/cms/AwardsAndRecognition.js/CreateAwardAndRecognition";
import EnquiryRequest from "./views/base/UserRequests/EnquiryRequest";
import LostAndFoundRequest from "./views/base/UserRequests/LostAndFoundRequest";
import SubscriptionRequest from "./views/base/UserRequests/SubscriptionRequest";
import OfferRequest from "./views/base/UserRequests/OfferRequest";
import Listing from "./views/base/car/CarGroup/Listing.js";
import Create from "./views/base/car/CarGroup/Create.js";
import CreateRangePricing from "./views/base/dynamicPricing/RangePricing/CreateRangePricing";
import AdminPages from "./views/base/cms/AdminPages/AdminPages";
import CreateAdminPages from "./views/base/cms/AdminPages/CreateAdminPages";
import MonthlyCouponCodeList from "./views/base/dynamicPricing/MonthlyCouponCode/MonthlyCouponCodeList";
import CreateMonthlyCouponCode from "./views/base/dynamicPricing/MonthlyCouponCode/CreateMonthlyCouponCode";
import OneTimeCouponList from "./views/base/dynamicPricing/OneTimeCoupons/OneTimeCouponList";
import OneTimeCouponForm from "./views/base/dynamicPricing/OneTimeCoupons/OneTimeCouponForm";
import OneTimeCouponBulk from "./views/base/dynamicPricing/OneTimeCoupons/OneTimeCouponBulk";
import OneTimeCouponDetail from "./views/base/dynamicPricing/OneTimeCoupons/OneTimeCouponDetail";
import IncompleteBookings from "./views/base/Bookings/IncompleteBookings.js";
import CreateCarCategory from "./views/base/car/CarCategory/CreateCarCategory";
import CreateCarBrand from "./views/base/car/CarBrand/CreateCarBrand";
import DownloadReport from "./views/base/Bookings/DownloadReport/DownloadReport";
import DocumentList from "./views/base/Users/documents";
import StopSaleList from "./views/base/StopSale/StopSaleList";
import CreateStopSale from "./views/base/StopSale/CreateStopSale";
import OtherCharges from "./views/base/MiscSetting/OtherCharges";
import InterCityCharges from "./views/base/MiscSetting/InterCityCharges";
import UsersBookings from "./views/base/Users/UserBookings.js";
import TeachersRental from "./views/base/cms/TeachersRental/TeachersRental.js";
import TeachersRentalRates from "./views/base/cms/TeachersRental/TeachersRentalRates.js";
import EdcPromo from "./views/base/cms/EdcPromo/EdcPromo.js";
import EdcTerms from "./views/base/cms/EdcPromo/EdcTerms.js";
import UIVote from "./views/base/UIVote/UIVote.js";
import NewDesignVote from "./views/base/NewDesignVote/NewDesignVote.js";
import PromoTickerList from "./views/base/cms/PromoTicker/PromoTickerList.js";
import CreatePromoTicker from "./views/base/cms/PromoTicker/CreatePromoTicker.js";
import KycSubmissionsList from "./views/base/kyc/KycSubmissionsList.js";
import KycSubmissionDetail from "./views/base/kyc/KycSubmissionDetail.js";
// import DynamicRangePricingList from "./views/base/dynamicPricing/RangePricing/DynamicRangePricingList";
// import Dashboard from './views/dashboard/Dashboard'

const Dashboard = React.lazy(() => import("./views/dashboard/Dashboard"));
const AccountsDashboard = React.lazy(() => import("./views/dashboard/AccountsDashboard"));
const NewsLetter = React.lazy(
  () => import("./views/base/NewsLetter/NewsLetter")
);
const Colors = React.lazy(() => import("./views/theme/colors/Colors"));
const Typography = React.lazy(
  () => import("./views/theme/typography/Typography")
);

const Category = React.lazy(() => import("./views/base/category/Category"));
const Tag = React.lazy(() => import("./views/base/tag/Tag"));
const Post = React.lazy(() => import("./views/base/poost/Post"));
const Lostandfound = React.lazy(
  () => import("./views/lostandfound/Lostandfound")
);

// Memo Portal (admin-only). Lazy-loaded so the bundle stays small while the
// feature is being built out one page at a time.
const MemoDashboard = React.lazy(() => import("./views/base/memo/MemoDashboard"));
const MemoDocumentsList = React.lazy(() => import("./views/base/memo/MemoDocumentsList"));
const MemoDocumentDetail = React.lazy(() => import("./views/base/memo/MemoDocumentDetail"));
const MemoCategoriesList = React.lazy(() => import("./views/base/memo/MemoCategoriesList"));
const MemoAuditLog = React.lazy(() => import("./views/base/memo/MemoAuditLog"));
const MemoSettings = React.lazy(() => import("./views/base/memo/MemoSettings"));

const routes = [
  { path: "/", exact: true, name: "Home" },
  { path: "/login", exact: true, name: "Login", element: Login },

  { path: "/dashboard", name: "Dashboard", element: AccountsDashboard },
  { path: "/accounts-dashboard", name: "Accounts Dashboard", element: AccountsDashboard, roles: ["accounts"] },
  { path: "/newsletterSubscription", name: "NewsLetter", element: NewsLetter },
  { path: "/lostandfound", name: "LostAndFound", element: Lostandfound },
  {
    path: "/quotationrequest",
    name: "QuotationRequest",
    element: QoutationRequest,
  },

  { path: "/theme", name: "Theme", element: Colors, exact: true },
  { path: "/theme/colors", name: "Colors", element: Colors },
  { path: "/theme/typography", name: "Typography", element: Typography },

  { path: "/blog/category", name: "Category", element: Category },
  { path: "/blog/tag", name: "Tag", element: Tag },
  { path: "/blog/post", name: "Post", element: Post },
  { path: "/blog/add-blog", name: "Add Blog", element: AddPost },

  { path: "/car/brand", name: "Brand", element: Brand },
  { path: "/car/create-brand", name: "Create Brand", element: CreateCarBrand },
  { path: "/car/edit-brand/:id", name: "Edit Brand", element: CreateCarBrand },
  { path: "/car/category", name: "Car Category", element: CCategory },
  {
    path: "/car/create-category",
    name: "Create Category",
    element: CreateCarCategory,
  },
  {
    path: "/car/edit-category/:id",
    name: "Edit Category",
    element: CreateCarCategory,
  },
  { path: "/car/group", name: "Car Group", element: Listing },
  { path: "/car/create-group", name: "Car Group", element: Create },
  { path: "/car/transmission", name: "Transmission", element: Transmission },
  { path: "/car/fueltype", name: "Fuel Type", element: Fueltype },
  { path: "/car/cardatabase", name: "Cars", element: Cardatabase },
  { path: "/car/create-car", name: "Create Car", element: CreateCar },
  {
    path: "/cms/create-home-banner",
    name: "Create Banner",
    element: CreateHomePageBanner,
  },
  {
    path: "/cms/edit-home-banner/:id",
    name: "Edit Banner",
    element: CreateHomePageBanner,
  },
  {
    path: "/car/edit-car/:id",
    name: "Edit Car",
    element: CreateCar,
  },
  {
    path: "/car/edit-group/:id",
    name: "Edit Car Group",
    element: Create,
  },
  { path: "/car/cartype", name: "Car Type", element: Cartype },

  { path: "/user/all-users", name: "All Users", element: Allusers },
  {
    path: "/user/inactive-users",
    name: "Inactive Users",
    element: Inactiveuser,
  },
  { path: "/user/user-feedback", name: "User Feedback", element: Userfeedback },

  {
    path: "/cms/homepagebanners",
    name: "Homepage Banners",
    element: HomepageBanner,
  },

  {
    path: "/cms/teachers-rental",
    name: "Teachers Rental",
    element: TeachersRental,
  },
  {
    path: "/cms/teachers-rental-upload",
    name: "Teachers Rental",
    element: TeachersRentalRates
  },
  {
    path: "/cms/edc-promo",
    name: "EDC Promo Code",
    element: EdcPromo,
  },
  {
    path: "/cms/edc-terms",
    name: "EDC Terms & Conditions",
    element: EdcTerms,
  },

  { path: "/cms/FAQcategory", name: "FAQ Category", element: FAQcategory },
  { path: "/cms/faqs", name: "FAQs", element: FAQs },
  { path: "/cms/cities", name: "Cities", element: Cities },
  { path: "/cms/locations", name: "Locations", element: Locations },
  {
    path: "/cms/special-offers",
    name: "Special Offers",
    element: SpecialOffers,
  },
  {
    path: "/cms/create-special-offer",
    name: "Create Special Offers",
    element: CreateSpecialOffers,
  },
  {
    path: "/cms/edit-special-offer/:id",
    name: "Edit Special Offers",
    element: CreateSpecialOffers,
  },
  { path: "/cms/aboutus", name: "About us", element: Aboutus },
  {
    path: "/cms/corporate-leasing",
    name: "Coprporate Leasing",
    element: CoprporateLeasing,
  },
  {
    path: "/cms/busesAndCommercial",
    name: "Buses And Commercial",
    element: BusCommercial,
  },
  { path: "/cms/career", name: "Career", element: Career },
  { path: "/career/jobs", name: "Career Jobs", element: CareerJobs },
  { path: "/career/create-job", name: "Create Job", element: CreateCareerJob },
  {
    path: "/career/edit-job/:id",
    name: "Edit Job",
    element: CreateCareerJob,
  },
  {
    path: "/career/applications",
    name: "Career Applications",
    element: CareerApplications,
  },
  {
    path: "/career/application/:id",
    name: "Application Detail",
    element: ApplicationDetail,
  },
  // HR & Recruiting Module
  { path: "/hr/dashboard", name: "HR Dashboard", element: HRDashboard, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/dashboard/manager", name: "Manager Dashboard", element: HRManagerDashboard, roles: ["hr_manager"] },
  { path: "/hr/dashboard/staff", name: "Staff Dashboard", element: HRStaffDashboard, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/jobs", name: "Job Postings", element: HRJobsList, roles: ["hr_manager", "hr_recruitment"] },
  { path: "/hr/jobs/create", name: "Create Job", element: HRJobForm, roles: ["hr_manager", "hr_recruitment"] },
  { path: "/hr/jobs/:id/edit", name: "Edit Job", element: HRJobForm, roles: ["hr_manager", "hr_recruitment"] },
  { path: "/hr/jobs/:id", name: "Job Detail", element: HRJobDetail, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/applications", name: "Applications", element: HRApplicationsList, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/applications/:id", name: "Application Detail", element: HRApplicationDetail, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/departments", name: "Departments", element: HRDepartments, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/interviews", name: "Interviews", element: HRInterviewsList, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/interview/:id", name: "Interview Detail", element: HRInterviewDetail, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/questionnaires", name: "Questionnaires", element: HRQuestionnaires, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/keywords", name: "Keywords", element: HRKeywords, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/channel-postings", name: "Channel Postings", element: HRChannelPostings, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/status-history", name: "Status History", element: HRStatusHistory, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/ratings", name: "Ratings", element: HRRatings, roles: ["hr_recruitment", "hr_manager"] },
  { path: "/hr/staff", name: "HR Staff", element: HRStaff, roles: ["hr_manager"] },
  // Memo Portal (admin-only). The roles array is what AppContent uses to
  // hide these routes from non-admin users (admins see every route).
  { path: "/memo/dashboard", name: "Memo Dashboard", element: MemoDashboard, roles: ["admin"] },
  { path: "/memo/documents", name: "Memo Documents", element: MemoDocumentsList, roles: ["admin"] },
  { path: "/memo/documents/:id", name: "Memo Document", element: MemoDocumentDetail, roles: ["admin"] },
  { path: "/memo/categories", name: "Memo Categories", element: MemoCategoriesList, roles: ["admin"] },
  { path: "/memo/audit-log", name: "Memo Audit Log", element: MemoAuditLog, roles: ["admin"] },
  { path: "/memo/settings", name: "Memo Settings", element: MemoSettings, roles: ["admin"] },
  // KYC Submissions (admin + kyc_officer)
  {
    path: "/admin/kyc/submissions",
    name: "KYC Submissions",
    element: KycSubmissionsList,
    roles: ["admin", "kyc_officer"],
  },
  {
    path: "/admin/kyc/submissions/:id",
    name: "KYC Submission Detail",
    element: KycSubmissionDetail,
    roles: ["admin", "kyc_officer"],
  },
  {
    path: "/user-request/enquiry-request",
    name: "Enuiry Requests",
    element: EnquiryRequest,
  },
  {
    path: "/user-request/lost-and-found-request",
    name: "Lost And Found Requests",
    element: LostAndFoundRequest,
  },
  {
    path: "/user-request/subscription-request",
    name: "Subscription Requests",
    element: SubscriptionRequest,
  },
  {
    path: "/user-request/offer-request",
    name: "Offer Requests",
    element: OfferRequest,
  },
  {
    path: "/dynamic-pricing/range-pricing",
    name: "Range Discount",
    element: CreateRangePricing,
  },
  // { path: "/dynamic-pricing/edit-range-pricing/:id", name: "Edit Range Pricing", element: CreateRangePricing },
  // { path: "/dynamic-pricing/range-pricing", name: "Range Pricing", element: DynamicRangePricingList },
  {
    path: "/cms/privacy-policy",
    name: "Privacy Policy",
    element: PrivacyPolicy,
  },
  {
    path: "/cms/admin-pages",
    name: "Admin Pages",
    element: AdminPages,
  },
  {
    path: "/cms/create-admin-pages",
    name: "Create Admin Pages",
    element: CreateAdminPages,
  },
  {
    path: "/cms/edit-admin-pages/:id",
    name: "Edit Admin Pages",
    element: CreateAdminPages,
  },
  { path: "/cms/citywise", name: "City wise", element: Citywise },
  { path: "/cms/landmarkwise", name: "Landmark wise", element: Landmarkwise },
  {
    path: "/cms/neighbourhoodwise",
    name: "Neighbourhood wise",
    element: Neighbourhood,
  },
  {
    path: "/cms/awards-and-recognition",
    name: "Awards & recognitions",
    element: AwardRecognition,
  },
  {
    path: "/cms/create-awards-and-recognition",
    name: "Create Awards & recognitions",
    element: CreateAwardsAndRecognition,
  },
  {
    path: "/cms/edit-awards-and-recognition/:id",
    name: "Edit Awards & recognitions",
    element: CreateAwardsAndRecognition,
  },

  {
    path: "/pricing/upload-daily-pricing",
    name: "Upload Daily Pricing",
    element: Uploaddailypricing,
  },
  {
    path: "/pricing/daily-pricing-list",
    name: "Daily Pricing List",
    element: Dailypricelist,
  },
  {
    path: "/pricing/upload-monthly-pricing",
    name: "Upload Monthly Pricing",
    element: Uploadmonthlypricing,
  },
  {
    path: "/pricing/monthly-price-list",
    name: "Monthly Pricing List",
    element: Monthlypricelist,
  },
  {
    path: "/pricing/individualcarpricing",
    name: "Individual Car Pricing",
    element: IndiCarPricing,
  },
  {
    path: "/pricing/groupcarpricing",
    name: "Group Car Pricing",
    element: GroupcarPricing,
  },
  {
    path: "/pricing/intercitypricing",
    name: "Inter City Pricing",
    element: InterCityPricing,
  },
  {
    path: "/pricing/upload-range-pricing",
    name: " Upload Range Pricing",
    element: UploadRangePricing,
  },
  {
    path: "/pricing/range-pricing-list",
    name: "Range Pricing List",
    element: Rangepricinglist,
  },

  {
    path: "/dynamicpricing/range-pricing",
    name: "Range Pricing",
    element: RangePricing,
  },
  {
    path: "/dynamicpricing/advance-booking",
    name: "Advance Booking",
    element: AdvanceBooking,
  },
  {
    path: "/dynamicpricing/coupon-code",
    name: "Daily Weekly Coupon Code List",
    element: CouponCode,
  },
  {
    path: "/dynamicpricing/monthly-coupon-code",
    name: "Monthly Coupon Code List",
    element: MonthlyCouponCodeList,
  },
  {
    path: "/dynamicpricing/create-monthly-coupon-code",
    name: "Create Monthly Coupon Code",
    element: CreateMonthlyCouponCode,
  },
  {
    path: "/dynamicpricing/edit-monthly-coupon-code/:id",
    name: "Edit Monthly Coupon Code",
    element: CreateMonthlyCouponCode,
  },
  {
    path: "/dynamic-pricing/create-discount-coupon",
    name: "Create Daily/Weekly Coupon Code",
    element: CreateCouponCode,
  },
  {
    path: "/dynamic-pricing/edit-discount-coupon/:id",
    name: "Edit Daily/Weekly Coupon Code",
    element: CreateCouponCode,
  },
  // ===== One-Time (single-use / limited-use) Discount Coupons =====
  {
    path: "/admin/one-time-coupons",
    name: "One-Time Coupons",
    element: OneTimeCouponList,
    roles: ["admin"],
  },
  {
    path: "/admin/one-time-coupons/new",
    name: "Add One-Time Coupon",
    element: OneTimeCouponForm,
    roles: ["admin"],
  },
  {
    path: "/admin/one-time-coupons/bulk",
    name: "Bulk Create One-Time Coupons",
    element: OneTimeCouponBulk,
    roles: ["admin"],
  },
  {
    path: "/admin/one-time-coupons/:id",
    name: "One-Time Coupon Detail",
    element: OneTimeCouponDetail,
    roles: ["admin"],
  },
  {
    path: "/admin/one-time-coupons/:id/edit",
    name: "Edit One-Time Coupon",
    element: OneTimeCouponForm,
    roles: ["admin"],
  },
  {
    path: "/cms/create-location",
    name: "Create Location",
    element: CreateLocation,
  },
  {
    path: "/cms/edit-location/:id",
    name: "Edit Location",
    element: CreateLocation,
  },
  {
    path: "/cms/edit-city/:id",
    name: "Edit City",
    element: EditCity,
  },
  {
    path: "/dynamic-pricing/create-surge",
    name: "Create Surge",
    element: CreateSurge,
  },
  {
    path: "/dynamic-pricing/edit-surge/:id",
    name: "Edit Surge",
    element: CreateSurge,
  },
  {
    path: "/dynamic-pricing/surge-pricing",
    name: "Surge Pricing",
    element: DaySurge,
  },
  {
    path: "/dynamicpricing/book-now-discount",
    name: "Book Now Discount",
    element: BookNowDis,
  },

  {
    path: "/bookings/all-bookings",
    name: "All Bookings",
    element: Allbookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings/logs",
    name: "Booking logs",
    element: BookingLogs,
    roles: ["accounts"],
  },
  {
    path: "/bookings/incomplete",
    name: "Incomplete Bookings",
    element: IncompleteBookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings",
    name: "Booking",
    element: Bookings,
    roles: ["counter", "accounts"],
  },
  {
    path: "/bookings/current-bookings",
    name: "Current Bookings",
    element: Currentbookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings/upcoming-bookings",
    name: "Upcoming Bookings",
    element: Upcomingbookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings/past-bookings",
    name: "Past Bookings",
    element: Pastbookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings/cancelled-bookings",
    name: "Cancelled Bookings",
    element: Cancelledbookings,
    roles: ["accounts"],
  },
  {
    path: "/bookings/failed-bookings",
    name: "Failed Bookings",
    element: Failedbookings,
    roles: ["accounts"],
  },

  {
    path: "/refunds",
    name: "Refunds",
    element: RefundList,
    roles: ["accounts"],
  },
  {
    path: "/refund/pending-refund-list",
    name: "Pending Refund List",
    element: Pendingrefundlist,
    roles: ["accounts"],
  },
  {
    path: "/download-report",
    name: "Download Report",
    element: DownloadReport,
    roles: ["accounts"],
  },
  {
    path: "/users/documents",
    name: "Documents",
    element: DocumentList,
    roles: ["counter"],
  },
  {
    path: "/users",
    name: "Users",
    element: UsersBookings
  },
  {
    path: "/ui-vote",
    name: "UI Vote",
    element: UIVote
  },
  {
    path: "/new-design-vote",
    name: "New Design Vote",
    element: NewDesignVote
  },
  {
    path: "stop-sale/stop-sale-list",
    name: "Stop Sale List",
    element: StopSaleList,
  },
  {
    path: "/stop-sale/create-stop-sale",
    name: "Create Stop Sale",
    element: CreateStopSale,
  },
  {
    path: "/stop-sale/edit-stop-sale/:id",
    name: "Edit Stop Sale",
    element: CreateStopSale,
  },
  {
    path: "/misc-setting/other-charges",
    name: "Other Charges",
    element: OtherCharges,
  },
  {
    path: "/misc-setting/inter-city-charges",
    name: "Inter City Charges",
    element: InterCityCharges,
  },
  {
    path: "/cms/promo-ticker",
    name: "Promo Ticker",
    element: PromoTickerList,
  },
  {
    path: "/cms/create-promo-ticker",
    name: "Create Promo Ticker",
    element: CreatePromoTicker,
  },
  {
    path: "/cms/edit-promo-ticker/:id",
    name: "Edit Promo Ticker",
    element: CreatePromoTicker,
  },
];

export default routes;
