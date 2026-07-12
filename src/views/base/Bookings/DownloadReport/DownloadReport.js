import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "chartjs-plugin-zoom";
import zoomPlugin from "chartjs-plugin-zoom";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import { notifyError } from "../../../../components/notify/notify";
import {
  FaCalendarCheck,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaUndoAlt,
  FaCreditCard,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaPrint,
  FaChartBar,
  FaFileExcel,
} from "react-icons/fa";
import {
  MdTrendingUp,
  MdPayment,
  MdAccountBalance,
} from "react-icons/md";
import * as XLSX from "xlsx";
import logoPng from "../../../../assets/images/logo_new.png";
import "./DownloadReport.css";

Chart.register(zoomPlugin, ArcElement, Tooltip, Legend);

const DownloadReport = () => {
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  })();
  const [fromDate, setFromDate] = useState(oneMonthAgo);
  const [toDate, setToDate] = useState(today);
  const hasFetched = useRef(false);

  const [stats, setStats] = useState({
    totalBookings: 0,
    incompleteBookings: 0,
    totalRevenue: 0,
    totalRefunds: 0,
    payNow: 0,
    payLater: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    failed: 0,
  });

  const [chartData, setChartData] = useState({
    bookingsByMonth: null,
    bookingsByDate: null,
    paymentType: null,
    bookingAction: null,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  const buildChartsFromBookings = useCallback((bookings) => {
    const paymentTypes = {};
    bookings.forEach((b) => {
      const pt = b.payment_type || "Unknown";
      paymentTypes[pt] = (paymentTypes[pt] || 0) + 1;
    });

    const actions = {};
    bookings.forEach((b) => {
      const action = b.action || b.status || "Unknown";
      actions[action] = (actions[action] || 0) + 1;
    });

    // Daily bookings (last 14 days)
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date.toISOString().split("T")[0];
    });
    const dayLabels = last14Days.map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });
    const bookingsByDate = {};
    last14Days.forEach((d) => (bookingsByDate[d] = 0));
    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const [datePart] = b.booking_date.split(" ");
      const [day, month, year] = datePart.split("/");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      if (bookingsByDate[isoDate] !== undefined) bookingsByDate[isoDate]++;
    });

    // Monthly bookings (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    });
    const bookingsByMonth = {};
    last6Months.forEach(({ label }) => (bookingsByMonth[label] = 0));
    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const [datePart] = b.booking_date.split(" ");
      const [, month, year] = datePart.split("/");
      const mo = last6Months.find(
        (m) => m.year === parseInt(year) && m.month === parseInt(month)
      );
      if (mo && bookingsByMonth[mo.label] !== undefined)
        bookingsByMonth[mo.label]++;
    });

    const payNow =
      paymentTypes["Pay Now"] || paymentTypes["pay_now"] || 0;
    const payLater =
      paymentTypes["Pay Later"] || paymentTypes["pay_later"] || 0;
    const completed =
      actions["Completed"] || actions["Booked"] || actions["completed"] || 0;
    const cancelled =
      actions["Cancelled"] || actions["cancelled"] || 0;
    const pendingCount = actions["Pending"] || actions["pending"] || 0;
    const failedCount = actions["Failed"] || actions["failed"] || 0;

    let totalRevenue = 0;
    bookings.forEach((b) => {
      const amount = parseFloat(b.total_amount || b.amount || 0);
      if (!isNaN(amount)) totalRevenue += amount;
    });

    setStats({
      totalBookings: bookings.length,
      incompleteBookings: cancelled + pendingCount + failedCount,
      totalRevenue: totalRevenue.toFixed(2),
      totalRefunds: cancelled,
      payNow,
      payLater,
      completed,
      cancelled,
      pending: pendingCount,
      failed: failedCount,
    });

    setChartData({
      bookingsByDate: {
        labels: dayLabels,
        datasets: [
          {
            label: "Bookings",
            data: last14Days.map((d) => bookingsByDate[d]),
            borderColor: "#1E3A8A",
            backgroundColor: "rgba(30, 58, 138, 0.08)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#1E3A8A",
          },
        ],
      },
      bookingsByMonth: {
        labels: last6Months.map((m) => m.label),
        datasets: [
          {
            label: "Bookings",
            data: last6Months.map((m) => bookingsByMonth[m.label]),
            backgroundColor: [
              "#0F172A",
              "#1E3A8A",
              "#2563EB",
              "#3B82F6",
              "#60A5FA",
              "#93C5FD",
            ],
            borderRadius: 8,
          },
        ],
      },
      paymentType: {
        labels: Object.keys(paymentTypes),
        datasets: [
          {
            data: Object.values(paymentTypes),
            backgroundColor: ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"],
            borderWidth: 0,
          },
        ],
      },
      bookingAction: {
        labels: Object.keys(actions),
        datasets: [
          {
            data: Object.values(actions),
            backgroundColor: [
              "#10B981",
              "#EF4444",
              "#F59E0B",
              "#2563EB",
              "#8B5CF6",
              "#EC4899",
            ],
            borderWidth: 0,
          },
        ],
      },
    });

    // Recent bookings (last 20)
    const sorted = [...bookings]
      .sort((a, b) => {
        const parseDate = (str) => {
          if (!str) return 0;
          const [datePart] = str.split(" ");
          const [d, m, y] = datePart.split("/");
          return new Date(`${y}-${m}-${d}`).getTime();
        };
        return parseDate(b.booking_date) - parseDate(a.booking_date);
      })
      .slice(0, 20);
    setRecentBookings(sorted);
  }, []);

  const fetchData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const bookingUrl = `${configWeb.GET_BOOKINGS}?page=1&page_size=9999`;
      const res = await simpleGetCallAuth(bookingUrl);
      const bookings = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setAllBookings(bookings);
      // Apply initial date filter
      const initialFiltered = filterBookingsByDate(bookings, fromDate, toDate);
      setFilteredBookings(initialFiltered);
      buildChartsFromBookings(initialFiltered);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, [buildChartsFromBookings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseBookingDate = (str) => {
    if (!str) return null;
    const [datePart] = str.split(" ");
    const [d, m, y] = datePart.split("/");
    if (!d || !m || !y) return null;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  };

  const filterBookingsByDate = (bookings, from, to) => {
    if (!from && !to) return bookings;
    return bookings.filter((b) => {
      const iso = parseBookingDate(b.booking_date);
      if (!iso) return false;
      if (from && iso < from) return false;
      if (to && iso > to) return false;
      return true;
    });
  };

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      notifyError("Please select both From and To dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      notifyError("From date cannot be after To date.");
      return;
    }
    const filtered = filterBookingsByDate(allBookings, fromDate, toDate);
    setFilteredBookings(filtered);
    buildChartsFromBookings(filtered);
  };

  const handleExport = () => {
    if (!fromDate || !toDate) {
      notifyError("Please select both From and To dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      notifyError("From date cannot be after To date.");
      return;
    }
    setExportLoading(true);
    try {
      const filtered = filteredBookings;

      if (filtered.length === 0) {
        notifyError("No bookings found for the selected date range.");
        setExportLoading(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // --- Summary Sheet ---
      const totalRevenue = filtered.reduce((sum, b) => sum + parseFloat(b.total_amount || b.amount || 0), 0);
      const payNowCount = filtered.filter(b => (b.payment_type || "").toLowerCase().includes("now")).length;
      const payLaterCount = filtered.filter(b => (b.payment_type || "").toLowerCase().includes("later")).length;
      const bookedCount = filtered.filter(b => (b.status || "").toLowerCase().includes("booked") || (b.action || "").toLowerCase().includes("completed")).length;
      const cancelledCount = filtered.filter(b => (b.status || b.action || "").toLowerCase().includes("cancel")).length;

      const summaryDataArray = [
        ["Bookings Full Report — Summary"],
        ["Generated at:", new Date().toLocaleString()],
        ["Date Range:", `${fromDate}  to  ${toDate}`],
        [""],
        ["Metric", "Value"],
        ["Total Bookings", filtered.length],
        ["Total Revenue (AED)", totalRevenue.toFixed(2)],
        ["Pay Now Bookings", payNowCount],
        ["Pay Later Bookings", payLaterCount],
        ["Booked / Completed", bookedCount],
        ["Cancelled", cancelledCount],
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryDataArray);
      summaryWS["!cols"] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // --- Full Bookings Sheet (ALL columns) ---
      const rows = filtered.map((b, i) => ({
        "Sr. No": i + 1,
        "ARC No": b.arc_number || b.booking_number || "-",
        "Booking ID": b.booking_log_number || "-",
        "Source": b.source || "-",
        "Booking Date": b.booking_date || "-",
        "Status": b.status || b.action || "-",
        "Type": b.type || "-",
        "Payment Type": b.payment_type || "-",
        "Booking Days": b.booking_days ?? "-",
        "Booking Months": b.booking_months ?? "-",
        "Extra Days (Flexi)": b.booking_flexi_days ?? "-",
        "User Name": b.user_name || b.customer_name || b.full_name || "-",
        "User Email": b.user_email || "-",
        "User Phone": b.user_phone || "-",
        "Car": b.car_name || "-",
        "Pickup Type": b.pickup_type || "-",
        "Pickup Location": b.pickup_location || "-",
        "Pickup Emirate": b.pickup_emirate || "-",
        "Pickup Date": b.pickup_date || "-",
        "Pickup Address": b.pickup_address || "-",
        "Dropoff Type": b.dropoff_type || "-",
        "Dropoff Location": b.dropoff_location || "-",
        "Dropoff Emirate": b.dropoff_emirate || "-",
        "Dropoff Date": b.dropoff_date || "-",
        "Dropoff Address": b.dropoff_address || "-",
        "Payfort ID": b.payfort_id || "-",
        "Car Rate (AED)": b.car_rate ? Number(b.car_rate).toFixed(2) : "0.00",
        "Inter Emirate Charges (AED)": (b.inter_emirates_charges || b.inter_emirate_charges) ? Number(b.inter_emirates_charges || b.inter_emirate_charges).toFixed(2) : "0.00",
        "Parking Charges (AED)": b.parking_charges ? Number(b.parking_charges).toFixed(2) : "0.00",
        "VMD Charges (AED)": b.vmd_charges ? Number(b.vmd_charges).toFixed(2) : "0.00",
        "Delivery Charges (AED)": b.delivery_charges ? Number(b.delivery_charges).toFixed(2) : "0.00",
        "Collection Charges (AED)": b.collection_charges ? Number(b.collection_charges).toFixed(2) : "0.00",
        "Coupon Code": b.coupon_code || "-",
        "VAT Amount (AED)": b.vat_amount ? Number(b.vat_amount).toFixed(2) : "0.00",
        "Total Amount (AED)": b.total_amount ? Number(b.total_amount).toFixed(2) : "0.00",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 8 },  // Sr. No
        { wch: 12 }, // ARC No
        { wch: 18 }, // Booking ID
        { wch: 10 }, // Source
        { wch: 18 }, // Booking Date
        { wch: 12 }, // Status
        { wch: 10 }, // Type
        { wch: 12 }, // Payment Type
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
        { wch: 14 }, // Car Rate
        { wch: 22 }, // Inter Emirate Charges
        { wch: 18 }, // Parking Charges
        { wch: 14 }, // VMD Charges
        { wch: 18 }, // Delivery Charges
        { wch: 18 }, // Collection Charges
        { wch: 15 }, // Coupon Code
        { wch: 16 }, // VAT Amount
        { wch: 18 }, // Total Amount
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, `Bookings_Full_Report_${fromDate}_to_${toDate}.xlsx`);
    } catch {
      notifyError("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const setToday = () => {
    setFromDate(today);
    setToDate(today);
    const filtered = filterBookingsByDate(allBookings, today, today);
    setFilteredBookings(filtered);
    buildChartsFromBookings(filtered);
  };

  const handlePrint = () => {
    window.print();
  };

  const commonTooltip = {
    enabled: true,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    titleColor: "#fff",
    bodyColor: "#fff",
    borderColor: "rgba(37, 99, 235, 0.3)",
    borderWidth: 1,
    padding: 14,
    displayColors: true,
    cornerRadius: 10,
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: "top" }, tooltip: commonTooltip },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748B", font: { size: 11 } } },
    },
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: commonTooltip },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748B", font: { size: 11 } } },
    },
  };

  const pieOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyle: "circle", font: { size: 12 } } },
      tooltip: commonTooltip,
    },
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyle: "circle", font: { size: 12 } } },
      tooltip: commonTooltip,
    },
  };

  if (loading) {
    return (
      <div className="report-page">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
            <p className="mt-3 text-muted">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      {/* Logo — print only */}
      <div className="report-print-logo text-center mb-3">
        <img
          src={logoPng}
          alt="Trasealla"
          style={{ height: 60, objectFit: "contain" }}
        />
      </div>

      {/* Report Header */}
      <div className="report-header">
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <div className="report-header-icon me-3">
                <FaChartBar size={28} />
              </div>
              <div>
                <h4 className="report-title mb-0">Booking & Financial Report</h4>
                <p className="report-subtitle mb-0">
                  Generated on{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto" className="d-flex gap-2 no-print">
            <Button
              variant="outline-light"
              size="sm"
              onClick={handlePrint}
            >
              <FaPrint className="me-1" /> Print
            </Button>
          </Col>
        </Row>
        {/* Export Controls */}
        <div className="report-header-export mt-3 no-print">
          <div className="d-flex align-items-end gap-3 flex-wrap">
            <div style={{ minWidth: 170 }}>
              <label className="form-label small mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>From Date</label>
              <input
                type="date"
                className="form-control form-control-sm report-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 170 }}>
              <label className="form-label small mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>To Date</label>
              <input
                type="date"
                className="form-control form-control-sm report-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline-light"
              size="sm"
              onClick={setToday}
              className="d-flex align-items-center gap-1"
            >
              <FaCalendarCheck /> Today
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleFilter}
              className="d-flex align-items-center gap-1 fw-semibold"
            >
              <FaChartBar /> Filter
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={handleExport}
              disabled={exportLoading}
              className="d-flex align-items-center gap-2 fw-semibold"
              style={{ color: "#1E3A8A" }}
            >
              {exportLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaDownload /> Export Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI cards */}
      <Row className="mb-3">
        {[
          { label: "Total Bookings", value: stats.totalBookings, icon: <FaCalendarCheck size={20} />, color: "#1E3A8A" },
          { label: "Total Revenue", value: `AED ${Number(stats.totalRevenue).toLocaleString()}`, icon: <FaMoneyBillWave size={20} />, color: "#059669" },
          { label: "Pay Now", value: stats.payNow, icon: <FaCreditCard size={20} />, color: "#2563EB" },
          { label: "Pay Later", value: stats.payLater, icon: <FaHandHoldingUsd size={20} />, color: "#D97706" },
          { label: "Completed", value: stats.completed, icon: <FaCheckCircle size={20} />, color: "#10B981" },
          { label: "Cancelled", value: stats.cancelled, icon: <FaUndoAlt size={20} />, color: "#EF4444" },
          { label: "Incomplete", value: stats.incompleteBookings, icon: <FaExclamationTriangle size={20} />, color: "#F59E0B" },
          { label: "Failed", value: stats.failed, icon: <FaTimesCircle size={20} />, color: "#DC2626" },
        ].map((item, i) => (
          <Col xl={3} md={4} sm={6} key={i} className="mb-3">
            <Card className="report-stat-card h-100">
              <CardBody className="d-flex align-items-center">
                <div
                  className="report-stat-icon"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="ms-3">
                  <div className="report-stat-label">{item.label}</div>
                  <div className="report-stat-value" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row className="mb-3">
        <Col xs={12} className="mb-3">
          <Card className="report-chart-card">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <MdTrendingUp className="me-2" size={22} style={{ color: "#1E3A8A" }} />
                <h5 className="report-chart-title mb-0">Daily Booking Trend (Last 14 Days)</h5>
              </div>
              <div style={{ height: "300px" }}>
                {chartData.bookingsByDate ? (
                  <Line data={chartData.bookingsByDate} options={lineOpts} />
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

      <Row className="mb-3">
        <Col lg={7} className="mb-3">
          <Card className="report-chart-card h-100">
            <CardBody>
              <h5 className="report-chart-title mb-3">Monthly Bookings (Last 6 Months)</h5>
              <div style={{ height: "280px" }}>
                {chartData.bookingsByMonth ? (
                  <Bar data={chartData.bookingsByMonth} options={barOpts} />
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
          <Card className="report-chart-card h-100">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <MdPayment className="me-2" size={22} style={{ color: "#2563EB" }} />
                <h5 className="report-chart-title mb-0">Payment Breakdown</h5>
              </div>
              <div style={{ height: "280px" }}>
                {chartData.paymentType ? (
                  <Doughnut data={chartData.paymentType} options={doughnutOpts} />
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

      <Row className="mb-3">
        <Col lg={5} className="mb-3">
          <Card className="report-chart-card h-100">
            <CardBody>
              <h5 className="report-chart-title mb-3">Booking Status Distribution</h5>
              <div style={{ height: "280px" }}>
                {chartData.bookingAction ? (
                  <Pie data={chartData.bookingAction} options={pieOpts} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg={7} className="mb-3">
          <Card className="report-chart-card h-100">
            <CardBody>
              <h5 className="report-chart-title mb-3">Summary Table</h5>
              <Table bordered hover responsive className="report-summary-table mb-0">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="text-end">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Bookings</td>
                    <td className="text-end fw-semibold">{stats.totalBookings.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Total Revenue</td>
                    <td className="text-end fw-semibold text-success">
                      AED {Number(stats.totalRevenue).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>Pay Now Bookings</td>
                    <td className="text-end fw-semibold">{stats.payNow}</td>
                  </tr>
                  <tr>
                    <td>Pay Later Bookings</td>
                    <td className="text-end fw-semibold">{stats.payLater}</td>
                  </tr>
                  <tr>
                    <td>Completed</td>
                    <td className="text-end fw-semibold text-success">{stats.completed}</td>
                  </tr>
                  <tr>
                    <td>Cancelled</td>
                    <td className="text-end fw-semibold text-danger">{stats.cancelled}</td>
                  </tr>
                  <tr>
                    <td>Failed</td>
                    <td className="text-end fw-semibold text-danger">{stats.failed}</td>
                  </tr>
                  <tr>
                    <td>Pending</td>
                    <td className="text-end fw-semibold text-warning">{stats.pending}</td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Full Bookings Table */}
      <Row className="mb-3">
        <Col xs={12}>
          <Card className="report-chart-card">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="report-chart-title mb-0">All Bookings ({filteredBookings.length})</h5>
                <small className="text-muted">
                  {fromDate && toDate ? `${fromDate} to ${toDate}` : "All Time"} — export to Excel for the complete dataset
                </small>
              </div>
              <div className="table-responsive">
                <Table hover className="report-bookings-table mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ARC No</th>
                      <th>Booking ID</th>
                      <th>Source</th>
                      <th>Booking Date</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Days</th>
                      <th>Months</th>
                      <th>Extra Days</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Car</th>
                      <th>Pickup Type</th>
                      <th>Pickup Location</th>
                      <th>Pickup Emirate</th>
                      <th>Pickup Date</th>
                      <th>Pickup Address</th>
                      <th>Dropoff Type</th>
                      <th>Dropoff Location</th>
                      <th>Dropoff Emirate</th>
                      <th>Dropoff Date</th>
                      <th>Dropoff Address</th>
                      <th>Payfort ID</th>
                      <th className="text-end">Car Rate</th>
                      <th className="text-end">Inter Emirate</th>
                      <th className="text-end">Parking</th>
                      <th className="text-end">VMD</th>
                      <th className="text-end">Delivery</th>
                      <th className="text-end">Collection</th>
                      <th>Coupon</th>
                      <th className="text-end">VAT</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={35} className="text-center text-muted py-4">
                          No bookings found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b, i) => (
                        <tr key={b.id || i}>
                          <td>{i + 1}</td>
                          <td className="fw-semibold">{b.arc_number || b.booking_number || "-"}</td>
                          <td style={{fontSize: '0.75rem'}}>{b.booking_log_number || "-"}</td>
                          <td>{b.source || "-"}</td>
                          <td style={{whiteSpace: 'nowrap'}}>{b.booking_date || "-"}</td>
                          <td>
                            <span
                              className={`report-badge ${
                                (b.status || b.action || "")
                                  .toLowerCase()
                                  .includes("booked") || (b.status || b.action || "").toLowerCase().includes("complete")
                                  ? "badge-success"
                                  : (b.status || b.action || "")
                                      .toLowerCase()
                                      .includes("cancel")
                                  ? "badge-danger"
                                  : (b.status || b.action || "")
                                      .toLowerCase()
                                      .includes("edit") || (b.status || b.action || "").toLowerCase().includes("extend")
                                  ? "badge-warning"
                                  : "badge-warning"
                              }`}
                            >
                              {b.status || b.action || "-"}
                            </span>
                          </td>
                          <td>{b.type || "-"}</td>
                          <td>
                            <span
                              className={`report-badge ${
                                (b.payment_type || "").toLowerCase().includes("now")
                                  ? "badge-pay-now"
                                  : "badge-pay-later"
                              }`}
                            >
                              {b.payment_type || "-"}
                            </span>
                          </td>
                          <td>{b.booking_days ?? "-"}</td>
                          <td>{b.booking_months ?? "-"}</td>
                          <td>{b.booking_flexi_days ?? "-"}</td>
                          <td>{b.user_name || b.customer_name || b.full_name || "-"}</td>
                          <td style={{fontSize: '0.75rem'}}>{b.user_email || "-"}</td>
                          <td>{b.user_phone || "-"}</td>
                          <td>{b.car_name || "-"}</td>
                          <td>{b.pickup_type || "-"}</td>
                          <td>{b.pickup_location || "-"}</td>
                          <td>{b.pickup_emirate || "-"}</td>
                          <td style={{whiteSpace: 'nowrap'}}>{b.pickup_date || "-"}</td>
                          <td>{b.pickup_address || "-"}</td>
                          <td>{b.dropoff_type || "-"}</td>
                          <td>{b.dropoff_location || "-"}</td>
                          <td>{b.dropoff_emirate || "-"}</td>
                          <td style={{whiteSpace: 'nowrap'}}>{b.dropoff_date || "-"}</td>
                          <td>{b.dropoff_address || "-"}</td>
                          <td style={{fontSize: '0.75rem'}}>{b.payfort_id || "-"}</td>
                          <td className="text-end">{b.car_rate ? Number(b.car_rate).toFixed(2) : "0.00"}</td>
                          <td className="text-end">{(b.inter_emirates_charges || b.inter_emirate_charges) ? Number(b.inter_emirates_charges || b.inter_emirate_charges).toFixed(2) : "0.00"}</td>
                          <td className="text-end">{b.parking_charges ? Number(b.parking_charges).toFixed(2) : "0.00"}</td>
                          <td className="text-end">{b.vmd_charges ? Number(b.vmd_charges).toFixed(2) : "0.00"}</td>
                          <td className="text-end">{b.delivery_charges ? Number(b.delivery_charges).toFixed(2) : "0.00"}</td>
                          <td className="text-end">{b.collection_charges ? Number(b.collection_charges).toFixed(2) : "0.00"}</td>
                          <td>{b.coupon_code || "-"}</td>
                          <td className="text-end">{b.vat_amount ? Number(b.vat_amount).toFixed(2) : "0.00"}</td>
                          <td className="text-end fw-semibold">
                            {b.total_amount ? Number(b.total_amount).toFixed(2) : "0.00"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default DownloadReport;
