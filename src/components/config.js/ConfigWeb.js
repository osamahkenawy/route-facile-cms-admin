const BASE_URL = process.env.REACT_APP_NODE_HOST || "http://localhost:3001/api/v1/";
// Alternative: const BASE_URL = "http://localhost:3000/api/v1/";

const CAREERS_PUBLIC_URL =
  process.env.REACT_APP_CAREERS_PUBLIC_URL || "https://www.trasealla.com/en/careerspage";

const configWeb = {
  BASE_URL: BASE_URL,
  // Admin Memo Portal API base. Overridable via REACT_APP_MEMO_BASE; defaults
  // to `${BASE_URL}admin/memo/` so production never ends up calling
  // `undefineddocuments` (which silently falls back to index.html).
  MEMO_BASE: process.env.REACT_APP_MEMO_BASE || `${BASE_URL}admin/memo/`,
  CAREERS_PUBLIC_URL,
  GET_CAREER_PUBLIC_JOB_URL: (id) => `${CAREERS_PUBLIC_URL}/${id}`,

  ///////////////////Auth apis/////////////////
  POST_LOGIN: BASE_URL + "admin/login",
  PUT_CHANGE_PASSWORD: BASE_URL + "admin/change-password",

  ///////////////////CMS////////////////////
  GET_EMIRATES: BASE_URL + "admin/emirate",
  GET_LOCATIONS: BASE_URL + "admin/location",
  GET_CAR_GROUPS: BASE_URL + "admin/car-group",
  GET_CAR: BASE_URL + "admin/car",

  //////////////////Pricing Apis////////////////////
  POST_DAILY_PRICE: BASE_URL + "admin/rate/daily",
  GET_DAILY_PRICE: BASE_URL + "admin/rate/daily",
  POST_MONTHLY_PRICE: BASE_URL + "admin/rate/monthly/v2",
  GET_MONTHLY_PRICE: BASE_URL + "admin/rate/monthly/v2",
  POST_RANGE_PRICE: BASE_URL + "admin/rate/range",
  GET_RANGE_PRICE: BASE_URL + "admin/rate/range",

  //////////////////Dynamic Pricing Apis////////////////////
  GET_DISCOUNT_COUPON: BASE_URL + "admin/discount/coupon",
  POST_DISCOUNT_COUPON: BASE_URL + "admin/discount/coupon",
  DELETE_DISCOUNT_COUPON: (id) => `${BASE_URL}admin/discount/coupon/${id}`,
  GET_DISCOUNT_COUPON_DETAILS: (id) => `${BASE_URL}admin/discount/coupon/${id}`,
  PUT_DISCOUNT_COUPON: (id) => `${BASE_URL}admin/discount/coupon/${id}`,
  // One-time-use (single-use / limited-use) discount coupons
  GET_ONE_TIME_COUPON: BASE_URL + "admin/discount/coupon/single-use",
  POST_ONE_TIME_COUPON: BASE_URL + "admin/discount/coupon/single-use",
  POST_ONE_TIME_COUPON_BULK: BASE_URL + "admin/discount/coupon/single-use/bulk",
  GET_ONE_TIME_COUPON_DETAILS: (id) =>
    `${BASE_URL}admin/discount/coupon/single-use/${id}`,
  PUT_ONE_TIME_COUPON: (id) =>
    `${BASE_URL}admin/discount/coupon/single-use/${id}`,
  DELETE_ONE_TIME_COUPON: (id) =>
    `${BASE_URL}admin/discount/coupon/single-use/${id}`,
  POST_SURGE: BASE_URL + "admin/surge",
  GET_SURGE: BASE_URL + "admin/surge",
  DELETE_SURGE: (id) => `${BASE_URL}admin/surge/${id}`,
  GET_SURGE_DETAILS: (id) => `${BASE_URL}admin/surge/${id}`,
  PUT_SURGE: (id) => `${BASE_URL}admin/surge/${id}`,

  PUT_RANGE_PRICING_CREATE: BASE_URL + "admin/discount/range",
  PUT_RANGE_PRICING_UPDATE: (id) => `${BASE_URL}admin/discount/range/${id}`,
  GET_RANGE_PRICING_LIST: BASE_URL + "admin/discount/range",
  DELETE_RANGE_PRICING: (id) => `${BASE_URL}admin/discount/range/${id}`,
  GET_RANGE_PRICING_DETAILS: (id) => `${BASE_URL}admin/discount/range/${id}`,
  //Monthly coupon code //
  GET_MONTHLY_DISCOUNT_COUPON_LIST: BASE_URL + "admin/discount/coupon",

  //////////////////////////Booking Apis////////////////////////////
  GET_BOOKING_LOGS: BASE_URL + "admin/booking/log",
  GET_INCOMPLETE_BOOKING: BASE_URL + "admin/booking/incomplete",
  GET_BOOKINGS: BASE_URL + "admin/booking",
  GET_REFUNDS: BASE_URL + "admin/refund",
  GET_REPORT: BASE_URL + "admin/booking/report",

  /////////////////////// CSM APIs ///////////////////////////////////////
  ///Location////////
  GET_LOCATION_LIST: BASE_URL + "admin/location",
  POST_CREATE_LOCATION: BASE_URL + "admin/location",
  GET_LOCATION_DETAILS: (id) => `${BASE_URL}admin/location/${id}`,
  PUT_LOCATION: (id) => `${BASE_URL}admin/location/${id}`,
  GET_LOCATION_EXCEPTION_HOURS: (id) => `${BASE_URL}admin/location/opening/hour/exception/${id}`,
  POST_LOCATION_EXCEPTION_HOURS: (id) => `${BASE_URL}admin/location/opening/hour/exception/${id}`,
  PUT_LOCATION_EXCEPTION_HOURS: (id) => `${BASE_URL}admin/location/opening/hour/exception/${id}`,
  DELETE_LOCATION_EXCEPTION_HOURS: (id) => `${BASE_URL}admin/location/opening/hour/exception/${id}`,

  //////Emirate///////
  GET_EMIRATE_LIST: BASE_URL + "admin/emirate",
  GET_EMIRATE_DETAILS: (id) => `${BASE_URL}admin/emirate/${id}`,
  PUT_EMIRATE_UPDATE: (id) => `${BASE_URL}admin/emirate/${id}`,

  ///Home page banner//////
  GET_HOMEPAGE_BANNER_LIST: BASE_URL + "admin/home/banner",
  POST_HOMEPAGE_BANNER_CREATE: BASE_URL + "admin/home/banner",
  PUT_HOMEPAGE_BANNER_UPDATE: (id) => `${BASE_URL}admin/home/banner/${id}`,
  GET_HOMEPAGE_BANNER_DETAILS: (id) => `${BASE_URL}admin/home/banner/${id}`,
  DELETE_HOMEPAGE_BANNER: (id) => `${BASE_URL}admin/home/banner/${id}`,

  /////Special Offers////
  GET_SPECIAL_OFFER_LIST: BASE_URL + "admin/offer",
  POST_SPECIAL_OFFER_CREATE: BASE_URL + "admin/offer",
  PUT_SPECIAL_OFFER_UPDATE: (id) => `${BASE_URL}admin/offer/${id}`,
  GET_SPECIAL_OFFER_DETAILS: (id) => `${BASE_URL}admin/offer/${id}`,
  DELETE_SPECIAL_OFFER: (id) => `${BASE_URL}admin/offer/${id}`,

  /////Awards And Recognition////
  GET_AWARDS_AND_CERTIFICATE_LIST: BASE_URL + "admin/award/certificate",
  POST_AWARDS_AND_CERTIFICATE_CREATE: BASE_URL + "admin/award/certificate",
  PUT_AWARDS_AND_CERTIFICATE_UPDATE: (id) =>
    `${BASE_URL}admin/award/certificate/${id}`,
  GET_AWARDS_AND_CERTIFICATE_DETAILS: (id) =>
    `${BASE_URL}admin/award/certificate/${id}`,
  DELETE_AWARDS_AND_CERTIFICATE: (id) =>
    `${BASE_URL}admin/award/certificate/${id}`,

  //// ADMIN PAGES /////
  GET_ADMIN_PAGES_LISTING: BASE_URL + "admin/page",
  POST_ADMIN_PAGES_CREATE: BASE_URL + "admin/page",
  GET_ADMIN_PAGES_DETAILS: (id) => `${BASE_URL}admin/page/${id}`,
  PUT_ADMIN_PAGES_UPDATE: (id) => `${BASE_URL}admin/page/${id}`,

  /////////////////////// CAR APIs ///////////////////////////////////////
  GET_BRANDS: BASE_URL + "admin/car-brand",
  POST_CAR_BRANDS: BASE_URL + "admin/car-brand",
  DELETE_CAR_BRAND: (id) => BASE_URL + `admin/car-brand/${id}`,
  PUT_CAR_BRAND_UPDATE: (id) => BASE_URL + `admin/car-brand/${id}`,
  GET_CAR_BRAND_DETAILS: (id) => BASE_URL + `admin/car-brand/${id}`,
  GET_CAR_CATEGORIES: BASE_URL + "admin/car-category",
  POST_CAR_CATEGORIES: BASE_URL + "admin/car-category",
  DELETE_CAR_CATEGORY: (id) => BASE_URL + `admin/car-category/${id}`,
  GET_CAR_CATEGORY_DETAILS: (id) => BASE_URL + `admin/car-category/${id}`,
  PUT_CAR_CATEGORY_UPDATE: (id) => BASE_URL + `admin/car-category/${id}`,
  REORDER_CAR_CATEGORIES: BASE_URL + "admin/car-category/reorder",
  GET_CAR_FUEL_TYPE: BASE_URL + "admin/car-fuel_type",
  GET_CAR_TRANSMISSION: BASE_URL + "admin/car-transmission",
  POST_CAR_CREATE: BASE_URL + "admin/car",
  GET_CAR_LIST: BASE_URL + "admin/car",
  GET_CAR_GROUP_DETAIL: (id) => BASE_URL + `admin/car-group/${id}`,
  GET_CAR_GROUP_LIST: BASE_URL + "admin/car-group",
  PUT_CAR_GROUP: (id) => BASE_URL + `admin/car-group/${id}`,
  POST_CAR_GROUP: BASE_URL + `admin/car-group`,
  DELETE_CAR_GROUP: (id) => BASE_URL + `admin/car-group/${id}`,
  DELETE_CAR: (id) => `${BASE_URL}admin/car/${id}`,
  GET_CAR_DETAILS: (id) => `${BASE_URL}admin/car/${id}`,
  PUT_CAR_UPDATE: (id) => `${BASE_URL}admin/car/${id}`,

  /////////////////////// USER REQUESTS APIs ///////////////////////////////////////
  GET_ENQUIRY_LIST: BASE_URL + "admin/user-enquiry",
  GET_LOST_AND_FOUND_LIST: BASE_URL + "admin/user-lost-found-request",
  GET_SUBSCRIPTION_LIST: BASE_URL + "admin/user/newsletter/subscription",
  GET_OFFER_LIST: BASE_URL + "admin/user-offer-enquiry",

  /////////////////////// USER DOCUMENT API ///////////////////////////////////////
  GET_USER_DOCUMENT_LIST: BASE_URL + "admin/user/document",
  GET_USER_BOOKING_LIST: BASE_URL + "admin/user/booking",

  /////////////////////// STOP SALE API ///////////////////////////////////////
  GET_STOP_SALE_LIST: BASE_URL + "admin/stop/sale",
  POST_CREATE_STOP_SALE: BASE_URL + "admin/stop/sale",
  GET_DETAIL_STOP_SALE: (id) => `${BASE_URL}admin/stop/sale/${id}`,
  PUT_UPDATE_STOP_SALE: (id) => `${BASE_URL}admin/stop/sale/${id}`,
  DELETE_STOP_SALE: (id) => `${BASE_URL}admin/stop/sale/${id}`,

  /////////////////////// MISC. SETTINGS API ///////////////////////////////////////
  GET_OTHER_CHARGES_LIST: BASE_URL + "admin/charges/other",
  PUT_OTHER_CHARGES: BASE_URL + "admin/charges/other",

  GET_INTER_EMIRATE_CHARGES_LIST: BASE_URL + "admin/charges/inter_emirates",
  PUT_INTER_EMIRATE_CHARGES: BASE_URL + "admin/charges/inter_emirates",
  DELETE_INTER_EMIRATE_CHARGES: (id) =>
    `${BASE_URL}admin/charges/inter_emirates/${id}`,

  /////////////////////// DASHBOARD API ///////////////////////////////////////
  GET_DASHBOARD_STATS: (paramType, from, to) =>
    `${BASE_URL}admin/dashboard/${paramType}?from=${from}&to=${to}`,
  GET_DASHBOARD_STATS_COUNTS: BASE_URL + "admin/dashboard",
  GET_DASHBOARD_SUMMARY: (from, to) =>
    `${BASE_URL}admin/dashboard/summary?from=${from}&to=${to}`,

    ///Teacher Rates//////
  TEACHERS_RATE: BASE_URL + "admin/rate/teacher",

  /////////////////////// UI VOTE API ///////////////////////////////////////
  GET_UI_VOTE: BASE_URL + "ui-vote",
  GET_UI_VOTE_ALL: BASE_URL + "ui-vote/all",

  /////////////////////// EDC PROMO API ///////////////////////////////////////
  GET_EDC_PROMO: BASE_URL + "admin/edc/promo",
  PUT_EDC_PROMO: BASE_URL + "admin/edc/promo",
  GET_EDC_TERMS: BASE_URL + "admin/edc/terms",
  POST_EDC_TERM: BASE_URL + "admin/edc/terms",
  GET_EDC_TERM_DETAILS: (id) => `${BASE_URL}admin/edc/terms/${id}`,
  PUT_EDC_TERM: (id) => `${BASE_URL}admin/edc/terms/${id}`,
  DELETE_EDC_TERM: (id) => `${BASE_URL}admin/edc/terms/${id}`,
  PUT_EDC_TERMS_REORDER: BASE_URL + "admin/edc/terms/reorder",

  /////////////////////// PROMO TICKER API ///////////////////////////////////////
  GET_PROMO_TICKER_LIST: BASE_URL + "admin/promo-ticker",
  POST_PROMO_TICKER_CREATE: BASE_URL + "admin/promo-ticker",
  GET_PROMO_TICKER_DETAILS: (id) => `${BASE_URL}admin/promo-ticker/${id}`,
  PUT_PROMO_TICKER_UPDATE: (id) => `${BASE_URL}admin/promo-ticker/${id}`,
  DELETE_PROMO_TICKER: (id) => `${BASE_URL}admin/promo-ticker/${id}`,

  /////////////////////// CAREER JOBS API ///////////////////////////////////////
  GET_CAREER_JOB_LIST: BASE_URL + "admin/career/job",
  POST_CAREER_JOB_CREATE: BASE_URL + "admin/career/job",
  GET_CAREER_JOB_DETAILS: (id) => `${BASE_URL}admin/career/job/${id}`,
  PUT_CAREER_JOB_UPDATE: (id) => `${BASE_URL}admin/career/job/${id}`,
  PATCH_CAREER_JOB_STATUS: (id) => `${BASE_URL}admin/career/job/${id}/status`,
  DELETE_CAREER_JOB: (id) => `${BASE_URL}admin/career/job/${id}`,

  /////////////////////// CAREER APPLICATIONS API ///////////////////////////////////////
  GET_CAREER_APPLICATION_LIST: BASE_URL + "admin/career/application",
  GET_CAREER_APPLICATION_DETAILS: (id) => `${BASE_URL}admin/career/application/${id}`,
  PUT_CAREER_APPLICATION_UPDATE: (id) => `${BASE_URL}admin/career/application/${id}`,

  /////////////////////// KYC SUBMISSIONS API ///////////////////////////////////////
  GET_KYC_SUBMISSIONS: BASE_URL + "admin/kyc/submissions",
  GET_KYC_SUBMISSIONS_EXPORT: BASE_URL + "admin/kyc/submissions/export",
  GET_KYC_SUBMISSION_DETAILS: (id) => `${BASE_URL}admin/kyc/submissions/${id}`,
  PATCH_KYC_SUBMISSION_STATUS: (id) => `${BASE_URL}admin/kyc/submissions/${id}/status`,
  GET_KYC_SUBMISSION_PDF: (id) => `${BASE_URL}admin/kyc/submissions/${id}/download`,
  GET_KYC_SUBMISSION_SIGNATURE: (id) => `${BASE_URL}admin/kyc/submissions/${id}/signature`,
  GET_KYC_ATTACHMENT_DOWNLOAD: (id, attachmentId) =>
    `${BASE_URL}admin/kyc/submissions/${id}/attachments/${attachmentId}/download`,
  DELETE_CAREER_APPLICATION: (id) => `${BASE_URL}admin/career/application/${id}`,
  GET_CAREER_APPLICATION_CV: (id) => `${BASE_URL}admin/career/application/${id}/cv`,
  GET_CAREER_APPLICATION_ATTACHMENT: (id, attachmentId) => `${BASE_URL}admin/career/application/${id}/attachment/${attachmentId}`,
  GET_CAREER_PENDING_COUNT: BASE_URL + "admin/career/application/pending-count",

  /////////////////////// RECRUITING DEPARTMENTS API ///////////////////////////////////////
  GET_RECRUITING_DEPARTMENT_LIST: BASE_URL + "admin/recruiting/department",
  GET_RECRUITING_DEPARTMENT_ACTIVE: BASE_URL + "admin/recruiting/department/active",
  GET_RECRUITING_DEPARTMENT_DETAILS: (id) => `${BASE_URL}admin/recruiting/department/${id}`,
  POST_RECRUITING_DEPARTMENT_CREATE: BASE_URL + "admin/recruiting/department",
  PUT_RECRUITING_DEPARTMENT_UPDATE: (id) => `${BASE_URL}admin/recruiting/department/${id}`,
  DELETE_RECRUITING_DEPARTMENT: (id) => `${BASE_URL}admin/recruiting/department/${id}`,

  /////////////////////// RECRUITING INTERVIEWS API ///////////////////////////////////////
  GET_RECRUITING_INTERVIEW_LIST: BASE_URL + "admin/recruiting/interview",
  GET_RECRUITING_INTERVIEW_UPCOMING: BASE_URL + "admin/recruiting/interview/upcoming",
  GET_RECRUITING_INTERVIEW_DETAILS: (id) => `${BASE_URL}admin/recruiting/interview/${id}`,
  POST_RECRUITING_INTERVIEW_CREATE: BASE_URL + "admin/recruiting/interview",
  PUT_RECRUITING_INTERVIEW_UPDATE: (id) => `${BASE_URL}admin/recruiting/interview/${id}`,
  DELETE_RECRUITING_INTERVIEW: (id) => `${BASE_URL}admin/recruiting/interview/${id}`,

  /////////////////////// RECRUITING STATUS HISTORY API ///////////////////////////////////////
  GET_RECRUITING_STATUS_HISTORY: BASE_URL + "admin/recruiting/status-history",
  GET_RECRUITING_STATUS_HISTORY_DETAILS: (id) => `${BASE_URL}admin/recruiting/status-history/${id}`,
  POST_RECRUITING_STATUS_HISTORY: BASE_URL + "admin/recruiting/status-history",

  /////////////////////// RECRUITING RATINGS API ///////////////////////////////////////
  GET_RECRUITING_RATING_LIST: BASE_URL + "admin/recruiting/rating",
  GET_RECRUITING_RATING_AVERAGE: (applicationId) => `${BASE_URL}admin/recruiting/rating/average/${applicationId}`,
  GET_RECRUITING_RATING_DETAILS: (id) => `${BASE_URL}admin/recruiting/rating/${id}`,
  POST_RECRUITING_RATING_CREATE: BASE_URL + "admin/recruiting/rating",
  PUT_RECRUITING_RATING_UPDATE: (id) => `${BASE_URL}admin/recruiting/rating/${id}`,
  DELETE_RECRUITING_RATING: (id) => `${BASE_URL}admin/recruiting/rating/${id}`,

  /////////////////////// RECRUITING QUESTIONNAIRE API ///////////////////////////////////////
  GET_RECRUITING_QUESTIONNAIRE_LIST: BASE_URL + "admin/recruiting/questionnaire",
  GET_RECRUITING_QUESTIONNAIRE_BY_JOB: (jobId) => `${BASE_URL}admin/recruiting/questionnaire/by-job/${jobId}`,
  GET_RECRUITING_QUESTIONNAIRE_META: BASE_URL + "admin/recruiting/questionnaire/meta/types",
  GET_RECRUITING_QUESTIONNAIRE_DETAILS: (id) => `${BASE_URL}admin/recruiting/questionnaire/${id}`,
  POST_RECRUITING_QUESTIONNAIRE_CREATE: BASE_URL + "admin/recruiting/questionnaire",
  POST_RECRUITING_QUESTIONNAIRE_BULK: BASE_URL + "admin/recruiting/questionnaire/bulk",
  POST_RECRUITING_QUESTIONNAIRE_DUPLICATE: BASE_URL + "admin/recruiting/questionnaire/duplicate",
  PUT_RECRUITING_QUESTIONNAIRE_REORDER: BASE_URL + "admin/recruiting/questionnaire/reorder",
  PUT_RECRUITING_QUESTIONNAIRE_UPDATE: (id) => `${BASE_URL}admin/recruiting/questionnaire/${id}`,
  DELETE_RECRUITING_QUESTIONNAIRE: (id) => `${BASE_URL}admin/recruiting/questionnaire/${id}`,

  /////////////////////// HR STAFF MANAGEMENT API ///////////////////////////////////////
  GET_HR_STAFF_LIST: BASE_URL + "admin/hr",
  GET_HR_STAFF_DETAILS: (id) => `${BASE_URL}admin/hr/${id}`,
  POST_HR_STAFF_CREATE: BASE_URL + "admin/hr",
  PUT_HR_STAFF_UPDATE: (id) => `${BASE_URL}admin/hr/${id}`,
  PATCH_HR_STAFF_STATUS: (id) => `${BASE_URL}admin/hr/${id}/status`,
  POST_HR_STAFF_RESET_PASSWORD: (id) => `${BASE_URL}admin/hr/${id}/reset-password`,
  DELETE_HR_STAFF: (id) => `${BASE_URL}admin/hr/${id}`,

  /////////////////////// RECRUITING KEYWORD API ///////////////////////////////////////
  GET_RECRUITING_KEYWORD_LIST: BASE_URL + "admin/recruiting/keyword",
  GET_RECRUITING_KEYWORD_DETAILS: (id) => `${BASE_URL}admin/recruiting/keyword/${id}`,
  POST_RECRUITING_KEYWORD_CREATE: BASE_URL + "admin/recruiting/keyword",
  PUT_RECRUITING_KEYWORD_UPDATE: (id) => `${BASE_URL}admin/recruiting/keyword/${id}`,
  DELETE_RECRUITING_KEYWORD: (id) => `${BASE_URL}admin/recruiting/keyword/${id}`,

  /////////////////////// RECRUITING CHANNEL POSTING API ///////////////////////////////////////
  GET_RECRUITING_CHANNEL_POSTING_LIST: BASE_URL + "admin/recruiting/channel-posting",
  GET_RECRUITING_CHANNEL_POSTING_DETAILS: (id) => `${BASE_URL}admin/recruiting/channel-posting/${id}`,
  POST_RECRUITING_CHANNEL_POSTING_CREATE: BASE_URL + "admin/recruiting/channel-posting",
  PUT_RECRUITING_CHANNEL_POSTING_UPDATE: (id) => `${BASE_URL}admin/recruiting/channel-posting/${id}`,
  DELETE_RECRUITING_CHANNEL_POSTING: (id) => `${BASE_URL}admin/recruiting/channel-posting/${id}`,

  /////////////////////// RECRUITING DASHBOARD API ///////////////////////////////////////
  GET_RECRUITING_DASHBOARD_STATS: BASE_URL + "admin/recruiting/dashboard/stats",
  GET_RECRUITING_DASHBOARD_RECENT_APPS: BASE_URL + "admin/recruiting/dashboard/recent-applications",
  GET_RECRUITING_DASHBOARD_UPCOMING_INTERVIEWS: BASE_URL + "admin/recruiting/dashboard/upcoming-interviews",

  /////////////////////// HR MANAGER DASHBOARD API ///////////////////////////////////////
  GET_MANAGER_DASHBOARD_STATS: BASE_URL + "admin/recruiting/dashboard/manager/stats",
  GET_MANAGER_DASHBOARD_RECENT_APPS: BASE_URL + "admin/recruiting/dashboard/manager/recent-applications",
  GET_MANAGER_DASHBOARD_UPCOMING_INTERVIEWS: BASE_URL + "admin/recruiting/dashboard/manager/upcoming-interviews",
  GET_MANAGER_DASHBOARD_HIRING_PIPELINE: BASE_URL + "admin/recruiting/dashboard/manager/hiring-pipeline",
  GET_MANAGER_DASHBOARD_APPLICATION_TRENDS: BASE_URL + "admin/recruiting/dashboard/manager/application-trends",
  GET_MANAGER_DASHBOARD_INTERVIEW_STATS: BASE_URL + "admin/recruiting/dashboard/manager/interview-stats",
  GET_MANAGER_DASHBOARD_TOP_RATED: BASE_URL + "admin/recruiting/dashboard/manager/top-rated-applications",

  /////////////////////// HR STAFF DASHBOARD API ///////////////////////////////////////
  GET_STAFF_DASHBOARD_STATS: BASE_URL + "admin/recruiting/dashboard/staff/stats",
  GET_STAFF_DASHBOARD_MY_INTERVIEWS: BASE_URL + "admin/recruiting/dashboard/staff/my-interviews",
  GET_STAFF_DASHBOARD_MY_RECENT_INTERVIEWS: BASE_URL + "admin/recruiting/dashboard/staff/my-recent-interviews",
  GET_STAFF_DASHBOARD_OPEN_POSITIONS: BASE_URL + "admin/recruiting/dashboard/staff/open-positions",
  GET_STAFF_DASHBOARD_MY_RATINGS: BASE_URL + "admin/recruiting/dashboard/staff/my-ratings",
};

export default configWeb;
