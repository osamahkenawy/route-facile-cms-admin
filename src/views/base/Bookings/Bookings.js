import React, { useEffect, useMemo, useState } from "react";

import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  ActionIcon,
  Badge,
  Button as MButton,
  Divider,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  TextInput as MTextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  TbFilter,
  TbRefresh,
  TbSearch,
} from "react-icons/tb";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";

import configWeb from "../../../components/config.js/ConfigWeb";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import {
  fetchData,
  filterArrayByProperty,
} from "../CustomHooks/reusableFunctions";
import { useSearchParams } from "react-router-dom";
import logoImage from "../../../assets/images/logo_new.png";
import "./Bookings.css";

// Conditional imports for PDF/Excel libraries
let jsPDF, autoTable, XLSX;

// Load PDF libraries
import("jspdf").then((module) => {
  jsPDF = module.default || module;
}).catch((error) => {
  console.warn("jsPDF library not available:", error);
});

import("jspdf-autotable").then((module) => {
  autoTable = module.default || module;
}).catch((error) => {
  console.warn("jspdf-autotable library not available:", error);
});

import("xlsx").then((module) => {
  XLSX = module.default || module;
}).catch((error) => {
  console.warn("XLSX library not available:", error);
});

const Bookings = () => {
  const [show, setShow] = useState(false);
  const [showdel, setShowdel] = useState(false);
  const [showdcat, setShowdcat] = useState(false);

  const handleClose = () => setShow(false);

  const handleCloseDel = () => setShowdel(false);

  const handleCloseCat = () => setShowdcat(false);

  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpened, { open: openFilters, close: closeFilters }] =
    useDisclosure(false);

  const [priceListArray, setPriceListArray] = useState([]);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [emiratesArray, setEmiratesArray] = useState([]);
  const [locationArray, setLocationArray] = useState([]);
  const [filteredlocationArray, setFilteredLocationArray] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [paramsData, setParamsData] = useState({
    booking_start_date: "",
    booking_end_date: "",
    pickup_start_date: "",
    pickup_end_date: "",
    user_email: searchParams.get("user_email") ? searchParams.get("user_email"): "",
    booking_number: "",
    payment_type: "",
    type: "",
    status: "",
    emirate_id: "",
    location_id: "",
    booking_source:"",
    coupon_code: ""
  });

  const getBookings = () => {
    setLoading(true);

    const params = new URLSearchParams();
    // Add parameters only if they exist
    if (paramsData.booking_start_date)
      params.append("from", paramsData.booking_start_date);
    if (paramsData.booking_end_date)
      params.append("to", paramsData.booking_end_date);
    if (paramsData.pickup_start_date)
      params.append("pickup_from", paramsData.pickup_start_date);
    if (paramsData.pickup_end_date)
      params.append("pickup_to", paramsData.pickup_end_date);
    if (paramsData.user_email)
      params.append("user_email", paramsData.user_email);
    if (paramsData.booking_number)
      params.append("booking_number", paramsData.booking_number);
    if (paramsData.type) params.append("type", paramsData.type);
    if (paramsData.payment_type)
      params.append("payment_type", paramsData.payment_type);
    if (paramsData.status) params.append("status", paramsData.status);
    if (paramsData.pickup_type)
      params.append("pickup_type", paramsData.pickup_type);
    if (paramsData.dropoff_type)
      params.append("dropoff_type", paramsData.dropoff_type);
    if (paramsData.emirate_id)
      params.append("emirate_id", paramsData.emirate_id);
    if (paramsData.location_id)
      params.append("location_id", paramsData.location_id);
    if (paramsData.booking_source)
      params.append("booking_source", paramsData.booking_source);
    if (paramsData.coupon_code)
      params.append("coupon_code", paramsData.coupon_code);
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_BOOKINGS}?${params.toString()}`;

    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          const bookings = Array.isArray(res?.data) ? res.data : [];
          setPriceListArray(bookings);

          // Extract total_records from pagination object
          const apiTotal = Number(res?.pagination?.total_records || res?.total_records);
          const computedTotal =
            !Number.isNaN(apiTotal) && apiTotal > 0
              ? apiTotal
              : bookings.length;

          setTotalRecords(computedTotal);
          setSummaryData(res?.summary || null);
        } else {
          setPriceListArray([]);
          setTotalRecords(0);
          setSummaryData(null);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setPriceListArray([]);
        setTotalRecords(0);
        setSummaryData(null);
      })
      .finally(() => {
        setLoading(false);
      });
    // });
  };

  useEffect(() => {
    // const url =`${configWeb.GET_MONTHLY_PRICE}?page=${currentPage}&page_size=${pageSize}`
    getBookings();
  }, [currentPage, pageSize]);

  const handleSearchList = () => {
    setCurrentPage(1);

    getBookings();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const calculatePaginationMessage = () => {
    if (!totalRecords) {
      return "Showing 0 to 0 of 0 entries";
    }
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handleParamChange = (e) => {
    console.log(e.target);
    const { name, value } = e.target;
    setParamsData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (name === "emirate_id") {
      setParamsData((prevData) => ({
        ...prevData,
        location_id: "",
      }));
    }
  };
  const clearDate = (name) => {
    setParamsData((prevData) => ({
      ...prevData,
      [name]: "",
    }));
    if (name === "emirate_id") {
      setParamsData((prevData) => ({
        ...prevData,
        location_id: "",
      }));
    }
  };

  const handleSearchClick = () => {
    getBookings();
  };

  const handleResetFilters = () => {
    setParamsData({
      booking_start_date: "",
      booking_end_date: "",
      pickup_start_date: "",
      pickup_end_date: "",
      user_email: "",
      booking_number: "",
      payment_type: "",
      type: "",
      status: "",
      emirate_id: "",
      location_id: "",
      booking_source: "",
      coupon_code: "",
      pickup_type: "",
      dropoff_type: "",
    });
  };

  const activeFilterCount = useMemo(
    () =>
      Object.values(paramsData).filter(
        (v) => v !== "" && v !== null && v !== undefined
      ).length,
    [paramsData]
  );

  const downloadReportDisabled = useMemo(
    () => loading || priceListArray.length === 0,
    [loading, priceListArray]
  );

  const handleDownloadReport = async () => {
    if (downloadReportDisabled) {
      notifyError("No data available to download.");
      return;
    }
    
    // Ensure libraries are loaded
    if (!jsPDF || !autoTable) {
      try {
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable")
        ]);
        jsPDF = jsPDFModule.default || jsPDFModule;
        autoTable = autoTableModule.default || autoTableModule;
      } catch (error) {
        notifyError("PDF generation is not available. Please contact support.");
        return;
      }
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const availableWidth = pageWidth - marginLeft - marginRight;
    const logoWidth = 50;
    const logoHeight = 25;
    const logoX = marginLeft;
    const logoY = 15;

    // Add logo at the top left
    try {
      doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.log("Logo not found, continuing without logo");
    }

    // Center the header "Bookings Report"
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    const headerText = "Bookings Report";
    const headerWidth = doc.getTextWidth(headerText);
    const headerX = (pageWidth - headerWidth) / 2;
    doc.text(headerText, headerX, logoY + logoHeight / 2 + 5);
    doc.setFont(undefined, "normal");

    // Add generated timestamp at top right
    const generatedAt = new Date().toLocaleString();
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const timestampWidth = doc.getTextWidth(`Generated: ${generatedAt}`);
    doc.text(`Generated: ${generatedAt}`, pageWidth - marginRight - timestampWidth, logoY + logoHeight / 2 + 5);
    doc.setTextColor(0, 0, 0);

    const startY = logoY + logoHeight + 30;

    // Build date range string from filters or API summary
    const getDateRangeStr = () => {
      if (paramsData.booking_start_date || paramsData.booking_end_date) {
        const from = paramsData.booking_start_date || "Start";
        const to = paramsData.booking_end_date || "Now";
        return `${from}  to  ${to}`;
      }
      if (summaryData?.date_range) {
        const dr = summaryData.date_range;
        if (typeof dr === 'object' && dr) {
          if (dr.from && dr.to) return `${dr.from} - ${dr.to}`;
          if (dr.start_date && dr.end_date) return `${dr.start_date} - ${dr.end_date}`;
        }
        if (typeof dr === 'string' && dr) return dr;
      }
      return "All Time";
    };

    // Build applied filters summary for display
    const getAppliedFilters = () => {
      const filters = [];
      if (paramsData.pickup_start_date || paramsData.pickup_end_date)
        filters.push(`Pickup: ${paramsData.pickup_start_date || "Start"} to ${paramsData.pickup_end_date || "Now"}`);
      if (paramsData.user_email) filters.push(`Email: ${paramsData.user_email}`);
      if (paramsData.booking_number) filters.push(`Booking#: ${paramsData.booking_number}`);
      if (paramsData.payment_type) filters.push(`Payment: ${paramsData.payment_type}`);
      if (paramsData.type) filters.push(`Type: ${paramsData.type}`);
      if (paramsData.status) filters.push(`Status: ${paramsData.status}`);
      if (paramsData.booking_source) filters.push(`Source: ${paramsData.booking_source}`);
      if (paramsData.coupon_code) filters.push(`Coupon: ${paramsData.coupon_code}`);
      return filters.join(" | ");
    };

    const total_bookings = summaryData?.total_bookings ?? totalRecords ?? priceListArray.length;
    const total_revenue = summaryData?.total_revenue ?? "";

    const summaryRows = [
      { label: "Total Bookings", value: total_bookings },
      {
        label: "Total Revenue",
        value: total_revenue
          ? `AED ${Number(total_revenue).toLocaleString()}`
          : "AED 0",
      },
      { label: "Booking Date Range", value: getDateRangeStr() },
      { label: "Page Records", value: priceListArray.length },
    ];

    // Calculate card width to fit cards in available width
    const cardSpacing = 15;
    const totalSpacing = cardSpacing * (summaryRows.length - 1);
    const cardWidth = Math.floor((availableWidth - totalSpacing) / summaryRows.length);
    const cardHeight = 55;
    let cardX = marginLeft;
    const cardY = startY;

    summaryRows.forEach(({ label, value }) => {
      doc.setDrawColor(33, 150, 243);
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, "FD");
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.text(label, cardX + 10, cardY + 20);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      const valueStr = String(value);
      const maxValueWidth = cardWidth - 20;
      const valueWidth = doc.getTextWidth(valueStr);
      if (valueWidth > maxValueWidth) {
        doc.setFontSize(11);
      }
      doc.text(valueStr, cardX + 10, cardY + 40);
      doc.setFont(undefined, "normal");
      cardX += cardWidth + cardSpacing;
    });

    // Show applied filters below the summary cards
    const filtersStr = getAppliedFilters();
    if (filtersStr) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Filters: ${filtersStr}`, marginLeft, cardY + cardHeight + 14);
      doc.setTextColor(0, 0, 0);
    }

    // --- PAGE 1: Booking Info + User Details ---
    const tablePage1Columns = [
      { header: "ARC No", dataKey: "arc_number" },
      { header: "Booking ID", dataKey: "booking_log_number" },
      { header: "Source", dataKey: "source" },
      { header: "Date", dataKey: "booking_date" },
      { header: "Status", dataKey: "status" },
      { header: "Type", dataKey: "type" },
      { header: "Payment", dataKey: "payment_type" },
      { header: "Days", dataKey: "booking_days" },
      { header: "Months", dataKey: "booking_months" },
      { header: "Extra Days", dataKey: "booking_flexi_days" },
      { header: "User", dataKey: "user_name" },
      { header: "Email", dataKey: "user_email" },
      { header: "Phone", dataKey: "user_phone" },
      { header: "Car", dataKey: "car_name" },
    ];

    // --- PAGE 2: Pickup / Dropoff / Financial ---
    const tablePage2Columns = [
      { header: "ARC No", dataKey: "arc_number" },
      { header: "Pickup Type", dataKey: "pickup_type" },
      { header: "Pickup Location", dataKey: "pickup_location" },
      { header: "Pickup Emirate", dataKey: "pickup_emirate" },
      { header: "Pickup Date", dataKey: "pickup_date" },
      { header: "Pickup Address", dataKey: "pickup_address" },
      { header: "Dropoff Type", dataKey: "dropoff_type" },
      { header: "Dropoff Location", dataKey: "dropoff_location" },
      { header: "Dropoff Emirate", dataKey: "dropoff_emirate" },
      { header: "Dropoff Date", dataKey: "dropoff_date" },
      { header: "Dropoff Address", dataKey: "dropoff_address" },
      { header: "Payfort ID", dataKey: "payfort_id" },
      { header: "Car Rate", dataKey: "car_rate" },
      { header: "Inter Emirate", dataKey: "inter_emirate_charges" },
      { header: "Parking", dataKey: "parking_charges" },
      { header: "VMD", dataKey: "vmd_charges" },
      { header: "Delivery", dataKey: "delivery_charges" },
      { header: "Collection", dataKey: "collection_charges" },
      { header: "Coupon", dataKey: "coupon_code" },
      { header: "VAT", dataKey: "vat_amount" },
      { header: "Total", dataKey: "total_amount" },
    ];

    const truncate = (str, max) => str && str.length > max ? str.substring(0, max) + "..." : (str || "-");

    const tableData = priceListArray.map((item) => ({
      ...item,
      arc_number: item.arc_number || item.booking_number || "-",
      booking_date: item.booking_date ? item.booking_date.split(" ")[0] : "-",
      booking_days: item.booking_days ?? "-",
      booking_months: item.booking_months ?? "-",
      booking_flexi_days: item.booking_flexi_days ?? "-",
      booking_log_number: truncate(String(item.booking_log_number || ""), 14),
      user_name: truncate(item.user_name, 18),
      user_email: truncate(item.user_email, 22),
      user_phone: truncate(item.user_phone, 14),
      car_name: truncate(item.car_name, 14),
      pickup_type: item.pickup_type || "-",
      pickup_location: truncate(item.pickup_location, 22),
      pickup_emirate: item.pickup_emirate || "-",
      pickup_date: item.pickup_date ? item.pickup_date.split(" ")[0] : "-",
      pickup_address: truncate(item.pickup_address, 22),
      dropoff_type: item.dropoff_type || "-",
      dropoff_location: truncate(item.dropoff_location, 22),
      dropoff_emirate: item.dropoff_emirate || "-",
      dropoff_date: item.dropoff_date ? item.dropoff_date.split(" ")[0] : "-",
      dropoff_address: truncate(item.dropoff_address, 22),
      payfort_id: truncate(item.payfort_id, 16),
      car_rate: item.car_rate ? `${Number(item.car_rate).toFixed(2)}` : "0.00",
      inter_emirate_charges: (item.inter_emirates_charges || item.inter_emirate_charges)
        ? `${Number(item.inter_emirates_charges || item.inter_emirate_charges).toFixed(2)}`
        : "0.00",
      parking_charges: item.parking_charges ? `${Number(item.parking_charges).toFixed(2)}` : "0.00",
      vmd_charges: item.vmd_charges ? `${Number(item.vmd_charges).toFixed(2)}` : "0.00",
      delivery_charges: item.delivery_charges ? `${Number(item.delivery_charges).toFixed(2)}` : "0.00",
      collection_charges: item.collection_charges ? `${Number(item.collection_charges).toFixed(2)}` : "0.00",
      coupon_code: item.coupon_code || "-",
      vat_amount: item.vat_amount ? `${Number(item.vat_amount).toFixed(2)}` : "0.00",
      total_amount: item.total_amount
        ? `AED ${Number(item.total_amount).toFixed(2)}`
        : "AED 0.00",
    }));

    const commonHeadStyles = {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: 2,
    };

    const commonBodyStyles = {
      fontSize: 6,
      cellPadding: 1.5,
      textColor: [51, 51, 51],
      halign: "left",
      valign: "middle",
    };

    const statusCellParser = function (data) {
      data.cell.styles.lineColor = [200, 200, 200];
      data.cell.styles.lineWidth = 0.1;
      if (data.column.dataKey === "status") {
        const status = data.cell.text[0];
        if (status === "Booked") {
          data.cell.styles.fillColor = [40, 167, 69];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === "Cancelled") {
          data.cell.styles.fillColor = [220, 53, 69];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === "Extended") {
          data.cell.styles.fillColor = [255, 193, 7];
          data.cell.styles.textColor = [0, 0, 0];
        } else if (status === "Edited") {
          data.cell.styles.fillColor = [23, 162, 184];
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
      // Highlight total amount
      if (data.column.dataKey === "total_amount" && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [0, 128, 0];
      }
    };

    // --- Render Page 1 table ---
    const tableStartY = cardY + cardHeight + (filtersStr ? 26 : 14);
    autoTable(doc, {
      startY: tableStartY,
      theme: "striped",
      headStyles: commonHeadStyles,
      bodyStyles: commonBodyStyles,
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: marginLeft, right: marginRight },
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      didParseCell: statusCellParser,
      columns: tablePage1Columns,
      body: tableData,
    });

    // --- Page 2 header ---
    doc.addPage("a4", "landscape");
    const page2Y = 15;
    try {
      doc.addImage(logoImage, "PNG", marginLeft, page2Y, logoWidth, logoHeight);
    } catch (error) { /* logo optional */ }
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    const page2Title = "Bookings Report — Pickup, Dropoff & Financials";
    const page2TitleWidth = doc.getTextWidth(page2Title);
    doc.text(page2Title, (pageWidth - page2TitleWidth) / 2, page2Y + logoHeight / 2 + 5);
    doc.setFont(undefined, "normal");

    // --- Render Page 2 table ---
    autoTable(doc, {
      startY: page2Y + logoHeight + 20,
      theme: "striped",
      headStyles: commonHeadStyles,
      bodyStyles: commonBodyStyles,
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: marginLeft, right: marginRight },
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      didParseCell: statusCellParser,
      columns: tablePage2Columns,
      body: tableData,
    });

    doc.save(`booking-report-${new Date().getTime()}.pdf`);
    notifySuccess("Booking report downloaded successfully.");
  };

  const handleDownloadExcel = async () => {
    if (downloadReportDisabled) {
      notifyError("No data available to download.");
      return;
    }
    
    // Ensure library is loaded
    if (!XLSX) {
      try {
        const XLSXModule = await import("xlsx");
        XLSX = XLSXModule.default || XLSXModule;
      } catch (error) {
        notifyError("Excel generation is not available. Please contact support.");
        return;
      }
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Build date range string from filters or API summary
    const getExcelDateRange = () => {
      if (paramsData.booking_start_date || paramsData.booking_end_date) {
        const from = paramsData.booking_start_date || "Start";
        const to = paramsData.booking_end_date || "Now";
        return `${from}  to  ${to}`;
      }
      if (summaryData?.date_range) {
        const dr = summaryData.date_range;
        if (typeof dr === 'object' && dr) {
          if (dr.from && dr.to) return `${dr.from} - ${dr.to}`;
          if (dr.start_date && dr.end_date) return `${dr.start_date} - ${dr.end_date}`;
        }
        if (typeof dr === 'string' && dr) return dr;
      }
      return "All Time";
    };

    // Always add Summary Sheet
    const excelTotalBookings = summaryData?.total_bookings ?? totalRecords ?? priceListArray.length;
    const excelTotalRevenue = summaryData?.total_revenue ? `AED ${Number(summaryData.total_revenue).toLocaleString()}` : "AED 0";

    const summaryDataArray = [
      ["Bookings Report Summary"],
      ["Generated at:", new Date().toLocaleString()],
      [""],
      ["Metric", "Value"],
      ["Total Bookings", excelTotalBookings],
      ["Total Revenue", excelTotalRevenue],
      ["Booking Date Range", getExcelDateRange()],
      ["Page Records", priceListArray.length],
    ];

    // Add applied filters
    if (paramsData.pickup_start_date || paramsData.pickup_end_date)
      summaryDataArray.push(["Pickup Date Range", `${paramsData.pickup_start_date || "Start"}  to  ${paramsData.pickup_end_date || "Now"}`]);
    if (paramsData.user_email) summaryDataArray.push(["User Email", paramsData.user_email]);
    if (paramsData.booking_number) summaryDataArray.push(["Booking Number", paramsData.booking_number]);
    if (paramsData.payment_type) summaryDataArray.push(["Payment Type", paramsData.payment_type]);
    if (paramsData.type) summaryDataArray.push(["Booking Type", paramsData.type]);
    if (paramsData.status) summaryDataArray.push(["Status", paramsData.status]);
    if (paramsData.booking_source) summaryDataArray.push(["Booking Source", paramsData.booking_source]);
    if (paramsData.coupon_code) summaryDataArray.push(["Coupon Code", paramsData.coupon_code]);

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryDataArray);
    summaryWS["!cols"] = [
      { wch: 22 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Prepare data for Excel export with all columns
    const excelData = priceListArray.map((item, index) => ({
      "Sr. No": index + 1,
      "ARC No": item.arc_number || item.booking_number || "-",
      "Booking ID": item.booking_log_number || "-",
      "Source": item.source || "-",
      "Booking Date": item.booking_date || "-",
      "Status": item.status || "-",
      "Type": item.type || "-",
      "Payment": item.payment_type || "-",
      "Days": item.booking_days ?? "-",
      "Months": item.booking_months ?? "-",
      "Extra Days": item.booking_flexi_days ?? "-",
      "User Name": item.user_name || "-",
      "User Email": item.user_email || "-",
      "User Phone": item.user_phone || "-",
      "Car": item.car_name || "-",
      "Pickup Type": item.pickup_type || "-",
      "Pickup Location": item.pickup_location || "-",
      "Pickup Emirate": item.pickup_emirate || "-",
      "Pickup Date": item.pickup_date || "-",
      "Pickup Address": item.pickup_address || "-",
      "Dropoff Type": item.dropoff_type || "-",
      "Dropoff Location": item.dropoff_location || "-",
      "Dropoff Emirate": item.dropoff_emirate || "-",
      "Dropoff Date": item.dropoff_date || "-",
      "Dropoff Address": item.dropoff_address || "-",
      "Payfort ID": item.payfort_id || "-",
      "Car Rate": item.car_rate ? `AED ${Number(item.car_rate).toFixed(2)}` : "AED 0.00",
      "Inter Emirate Charges": (item.inter_emirates_charges || item.inter_emirate_charges) ? `AED ${Number(item.inter_emirates_charges || item.inter_emirate_charges).toFixed(2)}` : "AED 0.00",
      "Parking Charges": item.parking_charges ? `AED ${Number(item.parking_charges).toFixed(2)}` : "AED 0.00",
      "VMD Charges": item.vmd_charges ? `AED ${Number(item.vmd_charges).toFixed(2)}` : "AED 0.00",
      "Delivery Charges": item.delivery_charges ? `AED ${Number(item.delivery_charges).toFixed(2)}` : "AED 0.00",
      "Collection Charges": item.collection_charges ? `AED ${Number(item.collection_charges).toFixed(2)}` : "AED 0.00",
      "Coupon Code": item.coupon_code || "-",
      "VAT Amount": item.vat_amount ? `AED ${Number(item.vat_amount).toFixed(2)}` : "AED 0.00",
      "Total Amount": item.total_amount ? `AED ${Number(item.total_amount).toFixed(2)}` : "AED 0.00",
    }));

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws["!cols"] = [
      { wch: 8 },  // Sr. No
      { wch: 12 }, // Booking #
      { wch: 18 }, // Booking ID
      { wch: 10 }, // Source
      { wch: 18 }, // Booking Date
      { wch: 12 }, // Status
      { wch: 10 }, // Type
      { wch: 12 }, // Payment
      { wch: 8 },  // Days
      { wch: 10 }, // Months
      { wch: 12 }, // Extra Days
      { wch: 25 }, // User Name
      { wch: 30 }, // User Email
      { wch: 15 }, // User Phone
      { wch: 20 }, // Car
      { wch: 12 }, // Pickup Type
      { wch: 35 }, // Pickup Location
      { wch: 15 }, // Pickup Emirate
      { wch: 20 }, // Pickup Date
      { wch: 30 }, // Pickup Address
      { wch: 12 }, // Dropoff Type
      { wch: 35 }, // Dropoff Location
      { wch: 15 }, // Dropoff Emirate
      { wch: 20 }, // Dropoff Date
      { wch: 30 }, // Dropoff Address
      { wch: 20 }, // Payfort ID
      { wch: 12 }, // Car Rate
      { wch: 20 }, // Inter Emirate Charges
      { wch: 15 }, // Parking Charges
      { wch: 12 }, // VMD Charges
      { wch: 15 }, // Delivery Charges
      { wch: 15 }, // Collection Charges
      { wch: 15 }, // Coupon Code
      { wch: 12 }, // VAT Amount
      { wch: 15 }, // Total Amount
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");

    // Generate Excel file and download
    const fileName = `booking-report-${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    notifySuccess("Excel report downloaded successfully.");
  };

  useEffect(() => {
    fetchData({
      url: `${configWeb.GET_EMIRATES}?page_size=9999`,
      setter: setEmiratesArray,
    });
    fetchData({
      url: configWeb.GET_LOCATIONS,
      setter: setLocationArray,
    });
  }, []);
  useEffect(() => {
    if (locationArray && paramsData.emirate_id) {
      const filteredLocations = filterArrayByProperty(
        locationArray,
        paramsData.emirate_id,
        "emirate_id"
      );
      setFilteredLocationArray(filteredLocations);
    } else {
      setFilteredLocationArray([]);
    }
  }, [paramsData.emirate_id, locationArray]);

  return (
    <Container fluid className="bookings-container">
      {/* Modern Mantine action bar */}
      <Paper withBorder shadow="xs" p="md" radius="md" mt="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <Title order={3} c="dark">
              Bookings
            </Title>
            {activeFilterCount > 0 && (
              <Badge color="indigo" variant="light" size="lg" radius="sm">
                {activeFilterCount} active filter
                {activeFilterCount === 1 ? "" : "s"}
              </Badge>
            )}
          </Group>
          <Group gap="sm" wrap="wrap">
            <MTextInput
              placeholder="Quick search by Booking #"
              value={paramsData.booking_number || ""}
              onChange={(e) =>
                setParamsData((prev) => ({
                  ...prev,
                  booking_number: e.currentTarget.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchList();
              }}
              leftSection={<TbSearch size={16} />}
              w={260}
            />
            <MButton
              variant="default"
              leftSection={<TbFilter size={16} />}
              rightSection={
                activeFilterCount > 0 ? (
                  <Badge color="indigo" circle size="sm">
                    {activeFilterCount}
                  </Badge>
                ) : null
              }
              onClick={openFilters}
            >
              Filters
            </MButton>
            {activeFilterCount > 0 && (
              <Tooltip label="Clear all filters" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={handleResetFilters}
                  aria-label="Reset filters"
                >
                  <TbRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            <MButton
              color="indigo"
              leftSection={<TbSearch size={16} />}
              loading={loading}
              onClick={handleSearchList}
            >
              Search
            </MButton>
          </Group>
        </Group>
      </Paper>
      
      {/* Download Buttons - Circular Icons */}
      <div className="position-fixed" style={{ 
        right: '20px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 1000 
      }}>
        <div className="d-flex flex-column gap-3">
          <Button
            className="rounded-circle d-flex align-items-center justify-content-center"
            variant="primary"
            onClick={handleDownloadReport}
            disabled={downloadReportDisabled}
            style={{ 
              width: '60px', 
              height: '60px',
              backgroundColor: '#6366F1',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            title="Download PDF Report"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,17L8,15H11V11H13V15H16L14,17" />
            </svg>
          </Button>
          <Button
            className="rounded-circle d-flex align-items-center justify-content-center"
            variant="success"
            onClick={handleDownloadExcel}
            disabled={downloadReportDisabled}
            style={{ 
              width: '60px', 
              height: '60px',
              backgroundColor: '#10B981',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            title="Download Excel Report"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,11H10V13H8V11M8,14H10V16H8V14M8,17H10V19H8V17M11,11H16V13H11V11M11,14H16V16H11V14M11,17H16V19H11V17" />
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Search Filters Drawer (Mantine) */}
      <Drawer
        opened={filtersOpened}
        onClose={closeFilters}
        position="right"
        size="lg"
        padding="lg"
        title={<Title order={4}>Search Filters</Title>}
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        scrollAreaComponent={ScrollArea.Autosize}
        styles={{ body: { paddingTop: 8 } }}
      >
        {/* Booking Created Date Range Section */}
        <Row className="mb-4">
          <Col xs={12}>
            <h6 className="text-muted mb-3">Booking Created Date (When booking was made)</h6>
          </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group controlId="booking_start_date">
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                name="booking_start_date"
                id="booking_start_date"
                value={paramsData.booking_start_date}
                onChange={handleParamChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group controlId="booking_end_date" className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                name="booking_end_date"
                id="booking_end_date"
                value={paramsData.booking_end_date}
                onChange={handleParamChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
            </Form.Group>
        </Col>
        
        {/* Pickup Date Range Section */}
        <Col xs={12} className="mt-3">
            <h6 className="text-muted mb-3">Pickup Date (When car is picked up)</h6>
          </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group controlId="pickup_start_date">
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                name="pickup_start_date"
                id="pickup_start_date"
                value={paramsData.pickup_start_date}
                onChange={handleParamChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group controlId="pickup_end_date" className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                name="pickup_end_date"
                id="pickup_end_date"
                value={paramsData.pickup_end_date}
                onChange={handleParamChange}
                onMouseDown={(e) => e.target.showPicker()}
              />
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group controlId="booking_number" className="mb-3">
              <Form.Label>Booking Number</Form.Label>
              <Form.Control
                type="text"
                name="booking_number"
                id="booking_number"
                value={paramsData.booking_number}
                onChange={handleParamChange}
              />
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group controlId="user_email" className="mb-3">
              <Form.Label>User Email</Form.Label>
              <Form.Control
                type="text"
                name="user_email"
                id="user_email"
                value={paramsData.user_email}
                onChange={handleParamChange}
              />
              {paramsData.user_email && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("user_email")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Payment type</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="payment_type"
                value={paramsData.payment_type}
                onChange={handleParamChange}
              >
                <option value=""> Select</option>
                <option key="now" value="now">
                  Pay Now
                </option>
                <option key="later" value="later">
                  Pay Later
                </option>
              </Form.Select>
              {paramsData.payment_type && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("payment_type")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Booking type</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="type"
                value={paramsData.type}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                <option key="daily" value="daily">
                  Daily
                </option>
                <option key="monthly" value="monthly">
                  Monthly
                </option>
              </Form.Select>
              {paramsData.type && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("type")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Booking Status</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="status"
                value={paramsData.status}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                <option key="book" value="book">
                  Booked
                </option>
                <option key="edit" value="edit">
                  Edited
                </option>
                <option key="extend" value="extend">
                  Extended
                </option>
                <option key="cancel" value="cancel">
                  Cancelled
                </option>
              </Form.Select>
              {paramsData.status && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("status")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Pickup Type</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="pickup_type"
                value={paramsData.pickup_type}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                <option key="self" value="self">
                  Self
                </option>
                <option key="delivery" value="delivery">
                  Delivery
                </option>
              </Form.Select>
              {paramsData.pickup_type && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("pickup_type")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Dropoff Type</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="dropoff_type"
                value={paramsData.dropoff_type}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                <option key="self" value="self">
                  Self
                </option>
                <option key="collection" value="collection">
                  Collection
                </option>
              </Form.Select>
              {paramsData.dropoff_type && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("dropoff_type")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Emirate</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="emirate_id"
                value={paramsData.emirate_id}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                {emiratesArray?.length > 0 &&
                  emiratesArray?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}{" "}
                    </option>
                  ))}
              </Form.Select>
              {paramsData.emirate_id && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("emirate_id")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="location_id"
                value={paramsData.location_id}
                onChange={handleParamChange}
              >
                <option value="" disabled={!paramsData.emirate_id}>
                  {paramsData.emirate_id
                    ? "Select location"
                    : "Select Emirate First"}
                </option>
                {filteredlocationArray?.length > 0 &&
                  filteredlocationArray?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_en}{" "}
                    </option>
                  ))}
              </Form.Select>
              {paramsData.location_id && (
                <div className="clear-btn">
                  <Button
                    variant="outline-secondary mt-1 "
                    onClick={() => clearDate("location_id")}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Form.Group>
        </Col>
        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Booking source</Form.Label>
              <Form.Select
                aria-label="Default select example"
                name="booking_source"
                value={paramsData.booking_source}
                onChange={handleParamChange}
              >
                <option value="">Select</option>
                <option value="web">Website</option>
                <option value="mobile">Mobile</option>
              </Form.Select>
            </Form.Group>
        </Col>

        <Col xs={12} md={6} lg={4} xl={3} className="mb-3">
          <Form.Group>
            <Form.Label>Promo Code</Form.Label>
            <Form.Control
              type="text"
              name="coupon_code"
              value={paramsData.coupon_code}
              onChange={handleParamChange}
            />
          </Form.Group>
        </Col>

      </Row>
        <Divider my="md" />
        <Group justify="space-between">
          <MButton
            variant="subtle"
            color="gray"
            leftSection={<TbRefresh size={16} />}
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
          >
            Reset all
          </MButton>
          <Group gap="xs">
            <MButton variant="default" onClick={closeFilters}>
              Close
            </MButton>
            <MButton
              color="indigo"
              leftSection={<TbSearch size={16} />}
              loading={loading}
              onClick={() => {
                closeFilters();
                handleSearchList();
              }}
            >
              Apply &amp; Search
            </MButton>
          </Group>
        </Group>
      </Drawer>
      
      {/* Results Section */}
      <div className="results-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">{calculatePaginationMessage()}</p>
        </div>
        <div className="table-responsive">
            <Table className="table table-striped table-hover">
            <thead>
              <tr>
                <th scope="col">Sr. No</th>
                <th scope="col">ARC number</th>
                <th scope="col">Booking ID</th>
                <th scope="col">Source</th>
                <th scope="col">Booking Date</th>
                <th scope="col">Status</th>
                <th scope="col">Type</th>
                <th scope="col">Payment</th>
                <th scope="col">Days</th>
                <th scope="col">Months</th>
                <th scope="col">Extra Days</th>
                <th scope="col">User Name</th>
                <th scope="col">User Email</th>
                <th scope="col">User Phone</th>
                <th scope="col">Car</th>
                <th scope="col">Pickup</th>
                <th scope="col">Pickup Location</th>
                <th scope="col">Pickup Emirate</th>
                <th scope="col">Pickup Date Time</th>
                <th scope="col">Pickup Address</th>
                <th scope="col">Dropoff</th>
                <th scope="col">Dropoff Location</th>
                <th scope="col">Dropoff Emirate</th>
                <th scope="col">Dropoff Date Time</th>
                <th scope="col">Dropoff Address</th>
                <th scope="col">Payfort ID</th>
                <th scope="col">Car Rate</th>
                <th scope="col">Inter Emirate Charges</th>
                <th scope="col">Parking Charges</th>
                <th scope="col">VMD Charges</th>
                <th scope="col">Delivery Charges</th>
                <th scope="col">Collect Charges</th>
                <th scope="col">Coupon Code</th>
                <th scope="col">Tax Amount</th>
                <th scope="col">Booking Amount</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center" colSpan={100}>
                    {" "}
                    <Spinner />
                  </td>{" "}
                </tr>
              ) : (
                Array.isArray(priceListArray) &&
                priceListArray?.length > 0 &&
                priceListArray?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.arc_number || item.booking_number || "-"}</td>
                    <td>{item.booking_log_number}</td>
                    <td>{item.source}</td>
                    <td>{item.booking_date}</td>
                    <td>
                      <div className={`${item.status}_box`}>{item.status}</div>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.payment_type}</td>
                    <td>{item.booking_days}</td>
                    <td>{item.booking_months}</td>
                    <td>{item.booking_flexi_days}</td>
                    <td>{item.user_name}</td>
                    <td>{item.user_email}</td>
                    <td>{item.user_phone}</td>
                    <td>{item.car_name}</td>

                    <td>{item.pickup_type}</td>
                    <td>{item.pickup_location}</td>
                    <td>{item.pickup_emirate}</td>
                    <td>{item.pickup_date}</td>
                    <td>{item.pickup_address}</td>

                    <td>{item.dropoff_type}</td>
                    <td>{item.dropoff_location}</td>
                    <td>{item.dropoff_emirate}</td>
                    <td>{item.dropoff_date}</td>
                    <td>{item.dropoff_address}</td>

                    <td>{item.payfort_id}</td>
                    <td>{item.car_rate}</td>
                    <td>{item.inter_emirate_charges}</td>
                    <td>{item.parking_charges}</td>
                    <td>{item.vmd_charges}</td>
                    <td>{item.delivery_charges}</td>
                    <td>{item.collection_charges}</td>
                    <td>{item.coupon_code}</td>
                    <td>{item.vat_amount}</td>
                    <td>{item.total_amount}</td>
                  </tr>
                ))
              )}
              {priceListArray?.length === 0 && !loading && (
                <tr className="text-center">
                  <td colSpan={100}>No Data Found.</td>
                </tr>
              )}
            </tbody>
            </Table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
            <CustomPagination
              recordsPerPage={pageSize}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
            <Col lg="2">
              <Form.Group className="mb-3">
                <Form.Select
                  aria-label="Default select example"
                  name="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </div>
        </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (English)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (Arabic)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select>
              <option>Active</option>
              <option>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showdel} onHide={handleCloseDel}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this entry ?</Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleClose}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showdcat} onHide={handleCloseCat}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (English)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoty Name (Arabic)</Form.Label>
            <Form.Control type="text" placeholder="enter email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select>
              <option>Active</option>
              <option>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleCloseCat}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Bookings;
