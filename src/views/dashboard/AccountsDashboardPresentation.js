import React, { useRef, useState } from "react";
import { Card, CardBody, Row, Col, Spinner, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "chartjs-plugin-zoom";
import zoomPlugin from "chartjs-plugin-zoom";
import useCountUp from "./useCountUp";
import "./accountsDashboard.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import configWeb from "../../components/config.js/ConfigWeb";
import { simpleGetCallAuth } from "../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../components/notify/notify";

import {
  FaCalendarCheck,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaUndoAlt,
  FaCreditCard,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBan,
  FaCalendarAlt,
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaBriefcase,
} from "react-icons/fa";
import {
  MdTrendingUp,
  MdPayment,
  MdAccountBalance,
} from "react-icons/md";

const AnimatedNumber = ({ value, prefix = "", suffix = "" }) => {
  const isNumeric = !isNaN(value);
  const count = useCountUp(isNumeric ? Number(value) : 0);
  return (
    <span>
      {prefix}
      {isNumeric ? count.toLocaleString() : value}
      {suffix}
    </span>
  );
};

const AccountsDashboardView = ({
  stats,
  chartData,
  loading,
  errorInApis,
  fetchDashboardData,
  overAllLoading,
  userRole,
  fromDate,
  toDate,
  onDateChange,
  onFilterSubmit,
  rawBookings,
  pendingApplications,
}) => {
  Chart.register(zoomPlugin, ArcElement, Tooltip, Legend);

  const navigate = useNavigate();
  const [localFrom, setLocalFrom] = useState(fromDate);
  const [localTo, setLocalTo] = useState(toDate);
  const [exporting, setExporting] = useState(false);

  const fetchSummaryData = async () => {
    const url = configWeb.GET_DASHBOARD_SUMMARY(fromDate, toDate);
    const res = await simpleGetCallAuth(url);
    if (!res || !res.data || res.data.length === 0) {
      notifyError("No data found for the selected date range");
      return null;
    }
    return res;
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await fetchSummaryData();
      if (!res) return;

      const rows = res.data.map((b) => ({
        "ARC Number": b.booking_number || b.arc_number || "",
        "Booking ID": b.booking_log_number || "",
        "Booking Date": b.booking_date || "",
        "Booking Type": b.type || "",
        "Month Time": b.booking_months ?? "",
        "Booking Amount": b.total_amount ?? "",
        "Pay Type": b.payment_type || "",
        "User Name": b.user_name || `${b.user_first_name || ""} ${b.user_last_name || ""}`.trim() || "",
        "User Email": b.user_email || "",
        "User Phone": b.user_phone || "",
        "Car Name": b.car_name || "",
        "Pickup Type": b.pickup_type || "",
        "Pickup Emirate": b.pickup_emirate || "",
        "Pickup Location": b.pickup_location || "",
        "Pickup Address": b.pickup_address || "",
        "Pickup Date & Time": b.pickup_date || b.pickup_date_time || "",
        "Dropoff Type": b.dropoff_type || "",
        "Dropoff Emirate": b.dropoff_emirate || "",
        "Dropoff Location": b.dropoff_location || "",
        "Dropoff Address": b.dropoff_address || "",
        "Dropoff Date & Time": b.dropoff_date || b.dropoff_date_time || "",
        "Status": b.status || b.action || "",
        "Payfort ID": b.payfort_id || b.fort_id || "",
        "LOR": b.booking_days ?? "",
        "Advanced": b.advanced ?? "",
        "Car Rate": b.car_rate ?? "",
        "Inter Emirate Change": b.inter_emirates_charges ?? b.inter_emirate_charges ?? "",
        "Parking Charges": b.parking_charges ?? "",
        "VMD Charges": b.vmd_charges ?? "",
        "Delivery Charges": b.delivery_charges ?? "",
        "Collect Charges": b.collection_charges ?? b.collect_charges ?? "",
        "Coupon Code": b.coupon_code || "",
        "Tax Amount": b.vat_amount ?? b.tax_amount ?? "",
        "Advance Booking Days": b.advance_booking_days ?? "",
        // "Advance Discount %": b.advance_booking_discount_percentage ?? "",
        // "Advance Discount Amount": b.advance_booking_discount_amount ?? "",
        "Source": b.source || "",
      }));

      const summary = res.summary || {};
      const summaryRows = [
        { Field: "Date Range", Value: `${fromDate} to ${toDate}` },
        { Field: "Total Records", Value: res.total_records || rows.length },
        { Field: "Total Bookings", Value: summary.total_bookings || rows.length },
        { Field: "Total Amount", Value: summary.total_amount || "" },
        { Field: "Total Tax", Value: summary.total_tax || "" },
      ];

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const wsData = XLSX.utils.json_to_sheet(rows);
      wsData["!cols"] = rows.length > 0
        ? Object.keys(rows[0]).map((k) => ({ wch: Math.max(k.length + 2, 14) }))
        : [];
      XLSX.utils.book_append_sheet(wb, wsData, "Bookings");

      XLSX.writeFile(wb, `Dashboard_Report_${fromDate}_to_${toDate}.xlsx`);
      notifySuccess("Excel report downloaded successfully");
    } catch (err) {
      console.error("Excel export error:", err);
      notifyError("Failed to export Excel report");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const res = await fetchSummaryData();
      if (!res) return;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(0, 48, 73);
      doc.rect(0, 0, pageW, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Trasealla - Dashboard Report", 40, 38);
      doc.setFontSize(10);
      doc.text(`Date Range: ${fromDate} to ${toDate}`, pageW - 40, 38, { align: "right" });

      // Summary row
      const summary = res.summary || {};
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      const summaryY = 80;
      doc.text(`Total Bookings: ${summary.total_bookings || res.data.length}`, 40, summaryY);
      doc.text(`Total Amount: ${summary.total_amount || ""}`, 240, summaryY);
      doc.text(`Total Tax: ${summary.total_tax || ""}`, 440, summaryY);
      doc.text(`Total Records: ${res.total_records || res.data.length}`, 640, summaryY);

      // Page 1 - Booking & User Info
      const page1Cols = [
        "ARC Number", "Booking ID", "Booking Date", "Type",
        "Month", "Amount", "Pay Type", "User Name", "Email", "Phone",
        "Car Name", "Status", "Source"
      ];
      const page1Rows = res.data.map((b) => [
        b.booking_number || b.arc_number || "",
        b.booking_log_number || "",
        b.booking_date || "",
        b.type || "",
        b.booking_months ?? "",
        b.total_amount ?? "",
        b.payment_type || "",
        b.user_name || `${b.user_first_name || ""} ${b.user_last_name || ""}`.trim() || "",
        b.user_email || "",
        b.user_phone || "",
        b.car_name || "",
        b.status || b.action || "",
        b.source || "",
      ]);

      doc.autoTable({
        head: [page1Cols],
        body: page1Rows,
        startY: summaryY + 20,
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [0, 48, 73], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      // Page 2 - Pickup, Dropoff & Financial Details
      doc.addPage("a4", "landscape");
      doc.setFillColor(0, 48, 73);
      doc.rect(0, 0, pageW, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Pickup / Dropoff & Financial Details", 40, 38);
      doc.setFontSize(10);
      doc.text(`Date Range: ${fromDate} to ${toDate}`, pageW - 40, 38, { align: "right" });

      const page2Cols = [
        "ARC Number", "Pickup Type", "Pickup Emirate", "Pickup Location", "Pickup Address", "Pickup Date & Time",
        "Dropoff Type", "Dropoff Emirate", "Dropoff Location", "Dropoff Address", "Dropoff Date & Time",
        "Payfort ID", "LOR", "Advanced", "Car Rate", "Inter Emirate Change", "Parking", "VMD",
        "Delivery", "Collect", "Coupon", "Tax", "Adv Days"
      ];
      const page2Rows = res.data.map((b) => [
        b.booking_number || b.arc_number || "",
        b.pickup_type || "",
        b.pickup_emirate || "",
        b.pickup_location || "",
        b.pickup_address || "",
        b.pickup_date || b.pickup_date_time || "",
        b.dropoff_type || "",
        b.dropoff_emirate || "",
        b.dropoff_location || "",
        b.dropoff_address || "",
        b.dropoff_date || b.dropoff_date_time || "",
        b.payfort_id || b.fort_id || "",
        b.booking_days ?? "",
        b.advanced ?? "",
        b.car_rate ?? "",
        b.inter_emirates_charges ?? b.inter_emirate_charges ?? "",
        b.parking_charges ?? "",
        b.vmd_charges ?? "",
        b.delivery_charges ?? "",
        b.collection_charges ?? b.collect_charges ?? "",
        b.coupon_code || "",
        b.vat_amount ?? b.tax_amount ?? "",
        b.advance_booking_days ?? "",
      ]);

      doc.autoTable({
        head: [page2Cols],
        body: page2Rows,
        startY: 75,
        styles: { fontSize: 6.5, cellPadding: 3 },
        headStyles: { fillColor: [0, 48, 73], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      doc.save(`Dashboard_Report_${fromDate}_to_${toDate}.pdf`);
      notifySuccess("PDF report downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      notifyError("Failed to export PDF report");
    } finally {
      setExporting(false);
    }
  };

  const commonTooltip = {
    enabled: true,
    backgroundColor: "rgba(30, 30, 60, 0.95)",
    titleColor: "#fff",
    bodyColor: "#fff",
    borderColor: "rgba(111, 66, 193, 0.3)",
    borderWidth: 1,
    padding: 14,
    displayColors: true,
    cornerRadius: 10,
    titleFont: { size: 14, weight: "bold" },
    bodyFont: { size: 13 },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#8486a7", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { color: "#8486a7", font: { size: 11 } },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: commonTooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#8486a7", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { color: "#8486a7", font: { size: 11 } },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12 },
        },
      },
      tooltip: commonTooltip,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12 },
        },
      },
      tooltip: commonTooltip,
    },
  };

  if (loading) {
    return (
      <div className="accounts-dashboard">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
            <p className="mt-3 text-muted">Loading your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorInApis) {
    return (
      <div className="accounts-dashboard">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="text-center">
            <FaExclamationTriangle size={48} className="text-warning mb-3" />
            <h5>Something went wrong</h5>
            <p className="text-muted">Unable to load dashboard data. Please try again.</p>
            <Button variant="primary" onClick={() => fetchDashboardData()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-dashboard">
      {/* Header */}
      <div className="acc-dash-header">
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center mb-1">
              <div className="acc-header-icon-wrap me-3">
                <MdAccountBalance size={32} />
              </div>
              <div>
                <h4 className="acc-dash-title">
                  {userRole === "accounts" ? "Accounts Dashboard" : "Admin Dashboard"}
                </h4>
                <p className="acc-dash-subtitle mb-0">
                  Real-time bookings, payments & revenue at a glance
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-primary"
              size="sm"
              className="acc-refresh-btn"
              onClick={() => fetchDashboardData()}
              disabled={overAllLoading}
            >
              {overAllLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>&#x21bb; Refresh Data</>
              )}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-3" style={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardBody className="py-2 px-3">
          <Row className="align-items-center">
            <Col xs="auto">
              <div className="d-flex align-items-center">
                <FaCalendarAlt className="text-primary me-2" size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#5d7186' }}>
                  Showing data from {fromDate} to {toDate}
                </span>
              </div>
            </Col>
            <Col>
              <div className="d-flex align-items-center justify-content-end flex-wrap gap-2">
                <Form.Control
                  type="date"
                  size="sm"
                  value={localFrom}
                  onChange={(e) => { setLocalFrom(e.target.value); onDateChange(e.target.value, localTo); }}
                  style={{
                    maxWidth: '155px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: '1.5px solid #d1d9e0',
                    padding: '5px 10px',
                    background: '#f8fafc',
                    color: '#1e293b',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#8486a7', fontWeight: 500 }}>→</span>
                <Form.Control
                  type="date"
                  size="sm"
                  value={localTo}
                  onChange={(e) => { setLocalTo(e.target.value); onDateChange(localFrom, e.target.value); }}
                  style={{
                    maxWidth: '155px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: '1.5px solid #d1d9e0',
                    padding: '5px 10px',
                    background: '#f8fafc',
                    color: '#1e293b',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                />
                {/* Filter button */}
                <button
                  onClick={onFilterSubmit}
                  disabled={overAllLoading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 18px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                    cursor: overAllLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                    whiteSpace: 'nowrap', transition: 'opacity 0.2s',
                    opacity: overAllLoading ? 0.7 : 1,
                  }}
                >
                  {overAllLoading
                    ? <Spinner animation="border" size="sm" style={{ color: '#fff' }} />
                    : <><FaFilter size={11} /> Filter</>}
                </button>
                {/* Excel button */}
                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 18px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.30)',
                    whiteSpace: 'nowrap', transition: 'opacity 0.2s',
                    opacity: exporting ? 0.5 : 1,
                  }}
                >
                  {exporting ? <Spinner animation="border" size="sm" style={{ color: '#fff' }} /> : <FaFileExcel size={13} />} Excel
                </button>
                {/* PDF button */}
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 18px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.30)',
                    whiteSpace: 'nowrap', transition: 'opacity 0.2s',
                    opacity: exporting ? 0.5 : 1,
                  }}
                >
                  {exporting ? <Spinner animation="border" size="sm" style={{ color: '#fff' }} /> : <FaFilePdf size={13} />} PDF
                </button>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Top KPI Cards */}
      <Row className="mb-2">
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-kpi-card acc-kpi-bookings">
            <CardBody>
              <div className="acc-kpi-icon">
                <FaCalendarCheck size={24} />
              </div>
              <div className="acc-kpi-content">
                <span className="acc-kpi-label">Total Bookings</span>
                <h2 className="acc-kpi-value">
                  <AnimatedNumber value={stats.totalBookings} />
                </h2>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-kpi-card acc-kpi-revenue">
            <CardBody>
              <div className="acc-kpi-icon">
                <FaMoneyBillWave size={24} />
              </div>
              <div className="acc-kpi-content">
                <span className="acc-kpi-label">Total Revenue</span>
                <h2 className="acc-kpi-value">
                  AED <AnimatedNumber value={Math.round(stats.totalRevenue)} />
                </h2>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-kpi-card acc-kpi-incomplete">
            <CardBody>
              <div className="acc-kpi-icon">
                <FaExclamationTriangle size={24} />
              </div>
              <div className="acc-kpi-content">
                <span className="acc-kpi-label">Incomplete Bookings</span>
                <h2 className="acc-kpi-value">
                  <AnimatedNumber value={stats.incompleteBookings} />
                </h2>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-kpi-card acc-kpi-refunds">
            <CardBody>
              <div className="acc-kpi-icon">
                <FaUndoAlt size={24} />
              </div>
              <div className="acc-kpi-content">
                <span className="acc-kpi-label">Cancellations</span>
                <h2 className="acc-kpi-value">
                  <AnimatedNumber value={stats.cancelled} />
                </h2>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Pending Career Applications */}
      {pendingApplications > 0 && (
        <Row className="mb-2">
          <Col xs={12}>
            <Card
              className="acc-mini-card border-warning"
              style={{ cursor: "pointer", borderLeft: "4px solid #f0ad4e" }}
              onClick={() => navigate("/career/applications?status=0")}
            >
              <CardBody className="d-flex align-items-center">
                <div className="acc-mini-icon bg-warning-soft">
                  <FaBriefcase className="text-warning" size={18} />
                </div>
                <div className="ms-3">
                  <span className="acc-mini-label">Pending Career Applications</span>
                  <h5 className="acc-mini-value mb-0">
                    <AnimatedNumber value={pendingApplications} /> application{pendingApplications !== 1 ? "s" : ""} awaiting review
                  </h5>
                </div>
                <div className="ms-auto">
                  <Button variant="outline-warning" size="sm">Review Now</Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Payment Summary Cards */}
      <Row className="mb-2">
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-mini-card">
            <CardBody className="d-flex align-items-center">
              <div className="acc-mini-icon bg-success-soft">
                <FaCreditCard className="text-success" size={18} />
              </div>
              <div className="ms-3">
                <span className="acc-mini-label">Pay Now</span>
                <h5 className="acc-mini-value mb-0">
                  <AnimatedNumber value={stats.payNow} />
                </h5>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-mini-card">
            <CardBody className="d-flex align-items-center">
              <div className="acc-mini-icon bg-warning-soft">
                <FaHandHoldingUsd className="text-warning" size={18} />
              </div>
              <div className="ms-3">
                <span className="acc-mini-label">Pay Later</span>
                <h5 className="acc-mini-value mb-0">
                  <AnimatedNumber value={stats.payLater} />
                </h5>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-mini-card">
            <CardBody className="d-flex align-items-center">
              <div className="acc-mini-icon bg-primary-soft">
                <FaCheckCircle className="text-primary" size={18} />
              </div>
              <div className="ms-3">
                <span className="acc-mini-label">Completed</span>
                <h5 className="acc-mini-value mb-0">
                  <AnimatedNumber value={stats.completed} />
                </h5>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="acc-mini-card">
            <CardBody className="d-flex align-items-center">
              <div className="acc-mini-icon bg-danger-soft">
                <FaTimesCircle className="text-danger" size={18} />
              </div>
              <div className="ms-3">
                <span className="acc-mini-label">Failed</span>
                <h5 className="acc-mini-value mb-0">
                  <AnimatedNumber value={stats.failed} />
                </h5>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Booking Trend Chart */}
      <Row className="mb-2">
        <Col xs={12}>
          <Card className="acc-chart-card">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <MdTrendingUp className="text-primary me-2" size={22} />
                <h5 className="acc-chart-title mb-0">Daily Booking Trend</h5>
              </div>
              <div style={{ height: "320px" }}>
                {chartData.bookingsByDate ? (
                  <Line data={chartData.bookingsByDate} options={lineOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Monthly Bookings + Payment Breakdown */}
      <Row className="mb-2">
        <Col lg={7} className="mb-3">
          <Card className="acc-chart-card h-100">
            <CardBody>
              <h5 className="acc-chart-title mb-3">Monthly Bookings</h5>
              <div style={{ height: "300px" }}>
                {chartData.bookingsByMonth ? (
                  <Bar data={chartData.bookingsByMonth} options={barOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg={5} className="mb-3">
          <Card className="acc-chart-card h-100">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <MdPayment className="text-primary me-2" size={22} />
                <h5 className="acc-chart-title mb-0">Payment Breakdown</h5>
              </div>
              <div style={{ height: "300px" }}>
                {chartData.paymentType ? (
                  <Doughnut data={chartData.paymentType} options={doughnutOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Booking Status Breakdown */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card className="acc-chart-card">
            <CardBody>
              <h5 className="acc-chart-title mb-3">Booking Status Distribution</h5>
              <div style={{ height: "300px" }}>
                {chartData.bookingAction ? (
                  <Pie data={chartData.bookingAction} options={pieOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountsDashboardView;
