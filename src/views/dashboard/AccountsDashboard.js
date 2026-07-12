import React, { useEffect, useState, useCallback } from "react";
import AccountsDashboardView from "./AccountsDashboardPresentation";
import dayjs from "dayjs";
import configWeb from "../../components/config.js/ConfigWeb";
import { simpleGetCallAuth } from "../../components/config.js/Setup";
import { notifyError } from "../../components/notify/notify";
import { chartConfigMap } from "./chartConfig";
import CryptoJS from "crypto-js";

const AccountsDashboard = () => {
  const secretKey = process.env.REACT_APP_LOCAL_ENCRYPTION_KEY;
  const userRoleEncrypted = localStorage.getItem("trasealla_user_role");
  let userRole = "";
  if (userRoleEncrypted) {
    try {
      userRole = CryptoJS.AES.decrypt(userRoleEncrypted, secretKey).toString(
        CryptoJS.enc.Utf8
      );
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  }

  const [loading, setLoading] = useState(true);
  const [errorInApis, setErrorInApis] = useState(false);
  const [overAllLoading, setOverAllLoading] = useState(true);

  const now = dayjs();
  const [fromDate, setFromDate] = useState(now.subtract(1, "month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(now.format("YYYY-MM-DD"));

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

  const [rawBookings, setRawBookings] = useState([]);
  const [pendingApplications, setPendingApplications] = useState(0);

  function formatDateToYMD(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function transformData(inputData, paramType) {
    if (
      !inputData ||
      !Array.isArray(inputData.labels) ||
      !Array.isArray(inputData.data)
    ) {
      return null;
    }
    return {
      labels: inputData.labels,
      datasets: [
        {
          data: inputData.data,
          ...(chartConfigMap[paramType] || {}),
        },
      ],
    };
  }

  function buildChartsFromBookings(bookings, from, to) {
    // Payment type
    const paymentTypes = {};
    bookings.forEach((b) => {
      const pt = b.payment_type || "Unknown";
      paymentTypes[pt] = (paymentTypes[pt] || 0) + 1;
    });
    const paymentChart = transformData(
      { labels: Object.keys(paymentTypes), data: Object.values(paymentTypes) },
      "payment_type"
    );

    // Booking action / status
    const actions = {};
    bookings.forEach((b) => {
      const action = b.action || b.status || "Unknown";
      actions[action] = (actions[action] || 0) + 1;
    });
    const actionChart = transformData(
      { labels: Object.keys(actions), data: Object.values(actions) },
      "action"
    );

    // Daily bookings — build day buckets from the actual from→to range
    const startDate = new Date(from);
    const endDate = new Date(to);
    const dayDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const dateRange = Array.from({ length: dayDiff }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
    const dayLabels = dateRange.map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    const bookingsByDate = {};
    dateRange.forEach((d) => (bookingsByDate[d] = 0));
    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const [datePart] = b.booking_date.split(" ");
      const [day, month, year] = datePart.split("/");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      if (bookingsByDate[isoDate] !== undefined) bookingsByDate[isoDate]++;
    });
    const dateChart = {
      labels: dayLabels,
      datasets: [
        {
          label: "Bookings",
          data: dateRange.map((d) => bookingsByDate[d]),
          borderColor: "#1e3a5f",
          backgroundColor: "rgba(30, 58, 95, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: dayDiff > 60 ? 0 : 4,
          pointBackgroundColor: "#1e3a5f",
        },
      ],
    };

    // Monthly bookings — build month buckets from the actual from→to range
    const monthSet = new Map();
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cur <= endMonth) {
      const label = cur.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthSet.set(`${cur.getFullYear()}-${cur.getMonth() + 1}`, { label, count: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const [datePart] = b.booking_date.split(" ");
      const [, month, year] = datePart.split("/");
      const key = `${parseInt(year)}-${parseInt(month)}`;
      if (monthSet.has(key)) monthSet.get(key).count++;
    });
    const monthEntries = [...monthSet.values()];
    const monthChart = {
      labels: monthEntries.map((m) => m.label),
      datasets: [
        {
          label: "Bookings",
          data: monthEntries.map((m) => m.count),
          backgroundColor: [
            "#0a1628", "#1e3a5f", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
            "#0a1628", "#1e3a5f", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
          ],
          borderRadius: 8,
        },
      ],
    };

    // Stats
    const payNow = paymentTypes["Pay Now"] || paymentTypes["pay_now"] || 0;
    const payLater = paymentTypes["Pay Later"] || paymentTypes["pay_later"] || 0;
    const completed = actions["Completed"] || actions["Booked"] || actions["completed"] || 0;
    const cancelled = actions["Cancelled"] || actions["cancelled"] || 0;
    const pending = actions["Pending"] || actions["pending"] || 0;
    const failed = actions["Failed"] || actions["failed"] || 0;

    // Revenue calculation
    let totalRevenue = 0;
    bookings.forEach((b) => {
      const amount = parseFloat(b.total_amount || b.amount || 0);
      if (!isNaN(amount)) totalRevenue += amount;
    });

    return {
      stats: {
        totalBookings: bookings.length,
        incompleteBookings: cancelled + pending + failed,
        totalRevenue: totalRevenue.toFixed(2),
        totalRefunds: cancelled,
        payNow,
        payLater,
        completed,
        cancelled,
        pending,
        failed,
      },
      charts: {
        bookingsByMonth: monthChart,
        bookingsByDate: dateChart,
        paymentType: paymentChart,
        bookingAction: actionChart,
      },
    };
  }

  const fetchDashboardData = useCallback(async (from, to) => {
    setLoading(true);
    setOverAllLoading(true);
    setErrorInApis(false);
    try {
      let bookingsArray = null;

      // Use the summary API which properly filters by date range
      try {
        const summaryUrl = configWeb.GET_DASHBOARD_SUMMARY(from, to);
        const summaryRes = await simpleGetCallAuth(summaryUrl);
        if (summaryRes && Array.isArray(summaryRes.data)) {
          bookingsArray = summaryRes.data;
        }
      } catch (e) {
        console.warn("Dashboard summary API failed, falling back to bookings API:", e);
      }

      // Fallback to bookings API if summary fails
      if (!bookingsArray) {
        try {
          const params = new URLSearchParams();
          if (from) params.append("from", from);
          if (to) params.append("to", to);
          const bookingUrl = `${configWeb.GET_BOOKINGS}?${params.toString()}`;
          const bookingsRes = await simpleGetCallAuth(bookingUrl);
          bookingsArray = Array.isArray(bookingsRes)
            ? bookingsRes
            : bookingsRes && Array.isArray(bookingsRes.data)
              ? bookingsRes.data
              : null;
        } catch (e) {
          console.warn("Bookings API failed:", e);
        }
      }

      if (bookingsArray) {
        // Client-side date filter to ensure only bookings within range are used
        const fromMs = new Date(from).getTime();
        const toMs = new Date(to).getTime() + 86400000; // include the end date
        const filtered = bookingsArray.filter((b) => {
          if (!b.booking_date) return false;
          const [datePart] = b.booking_date.split(" ");
          const [day, month, year] = datePart.split("/");
          const bookingMs = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`).getTime();
          return bookingMs >= fromMs && bookingMs < toMs;
        });

        setRawBookings(filtered);
        const result = buildChartsFromBookings(filtered, from, to);
        setStats(result.stats);
        setChartData(result.charts);
      }

      try {
        const countUrl = configWeb.GET_DASHBOARD_STATS_COUNTS;
        const countRes = await simpleGetCallAuth(countUrl);
        if (countRes && !countRes.error) {
          setStats((prev) => ({
            ...prev,
            totalBookings: countRes.total_bookings || prev.totalBookings,
            incompleteBookings: countRes.incomplete_bookings || prev.incompleteBookings,
          }));
        }
      } catch (e) {
        console.warn("Dashboard counts API failed:", e);
      }

      try {
        const pendingUrl = configWeb.GET_CAREER_PENDING_COUNT;
        const pendingRes = await simpleGetCallAuth(pendingUrl);
        if (pendingRes && !pendingRes.error) {
          setPendingApplications(pendingRes?.count || 0);
        }
      } catch (e) {
        console.warn("Career pending count API failed:", e);
      }
    } catch (error) {
      console.error("Error fetching accounts dashboard:", error);
      setErrorInApis(true);
      notifyError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setOverAllLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchDashboardData(fromDate, toDate);
  }, [fetchDashboardData, fromDate, toDate]);

  const handleDateFilter = useCallback((from, to) => {
    setFromDate(from);
    setToDate(to);
  }, []);

  const handleFilterSubmit = useCallback(() => {
    fetchDashboardData(fromDate, toDate);
  }, [fetchDashboardData, fromDate, toDate]);

  useEffect(() => {
    fetchDashboardData(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AccountsDashboardView
      stats={stats}
      chartData={chartData}
      loading={loading}
      errorInApis={errorInApis}
      fetchDashboardData={handleRefresh}
      overAllLoading={overAllLoading}
      userRole={userRole}
      fromDate={fromDate}
      toDate={toDate}
      onDateChange={handleDateFilter}
      onFilterSubmit={handleFilterSubmit}
      rawBookings={rawBookings}
      pendingApplications={pendingApplications}
    />
  );
};

export default AccountsDashboard;
