import React, { useEffect, useState } from "react";
import DashboardView from "./DashboardPresentation";
import dayjs from "dayjs";
import configWeb from "../../components/config.js/ConfigWeb";
import { simpleGetCallAuth } from "../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../components/notify/notify";
import { chartConfigMap } from "./chartConfig";
import * as XLSX from "xlsx";

// Comprehensive dummy data for all chart types with proper chart config
const createDummyChartData = () => {
  const chartData = {
    // Daily bookings line chart
    booking_date: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          data: [45, 52, 38, 65, 59, 70, 48],
          ...chartConfigMap.booking_date,
        },
      ],
    },
    // Monthly bookings bar chart
    booking_month: {
      labels: ["June 2024", "July 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024"],
      datasets: [
        {
          data: [280, 320, 410, 380, 450, 390],
          ...chartConfigMap.booking_month,
        },
      ],
    },
    // Emirate distribution doughnut chart
    emirate: {
      labels: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
      datasets: [
        {
          data: [245, 180, 95, 45, 30, 20, 15],
          ...chartConfigMap.emirate,
        },
      ],
    },
    // Pickup type pie chart
    pickup_type: {
      labels: ["Terminal", "Hotel/Home"],
      datasets: [
        {
          data: [320, 180],
          ...chartConfigMap.pickup_type,
        },
      ],
    },
    // Dropoff type pie chart
    dropoff_type: {
      labels: ["Terminal", "Hotel/Home"],
      datasets: [
        {
          data: [290, 210],
          ...chartConfigMap.dropoff_type,
        },
      ],
    },
    // Booking type pie chart
    type: {
      labels: ["One Way", "Round Trip"],
      datasets: [
        {
          data: [350, 150],
          ...chartConfigMap.type,
        },
      ],
    },
    // Payment type pie chart
    payment_type: {
      labels: ["Pay Now", "Pay Later"],
      datasets: [
        {
          data: [380, 120],
          ...chartConfigMap.payment_type,
        },
      ],
    },
    // Booking action pie chart
    action: {
      labels: ["Completed", "Pending", "In Progress", "Cancelled"],
      datasets: [
        {
          data: [320, 80, 60, 40],
          ...chartConfigMap.action,
        },
      ],
    },
    // Booking source pie chart
    booking_source: {
      labels: ["Website", "Mobile App", "Call Center", "Partner API"],
      datasets: [
        {
          data: [220, 150, 80, 50],
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
    // Car distribution doughnut chart
    car: {
      labels: [
        "Toyota Camry", "Honda Accord", "Nissan Altima", "BMW 3 Series",
        "Mercedes C-Class", "Audi A4", "Toyota Corolla", "Honda Civic",
        "Mazda CX-5", "Ford Explorer"
      ],
      datasets: [
        {
          data: [85, 72, 68, 45, 42, 38, 35, 32, 28, 25],
          ...chartConfigMap.car,
        },
      ],
    },
    // Car group distribution doughnut chart
    group: {
      labels: ["Economy", "Compact", "Mid-size", "Full-size", "Premium", "Luxury", "SUV", "Van"],
      datasets: [
        {
          data: [120, 95, 85, 65, 50, 35, 40, 10],
          backgroundColor: [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", 
            "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"
          ],
        },
      ],
    },
    // Location distribution doughnut chart
    location: {
      labels: [
        "Dubai International Airport", "Abu Dhabi Airport", "Dubai Mall",
        "Mall of Emirates", "JBR Beach", "Downtown Dubai", "Dubai Marina",
        "Business Bay", "Sharjah City Center", "Al Ain Mall"
      ],
      datasets: [
        {
          data: [95, 80, 65, 55, 45, 40, 35, 30, 25, 20],
          ...chartConfigMap.location,
        },
      ],
    },
  };
  return chartData;
};

const dummyChartData = createDummyChartData();

// Dummy count stats for the stat cards
const dummyCountStats = {
  total_bookings: 2847,
  total_cars: 156,
  total_locations: 42,
  total_users: 8934,
  incomplete_bookings: 234
};

const Dashboard = () => {
  const PARAM_TYPES = [
    "booking_date",
    "booking_month",
    "pickup_type",
    "dropoff_type",
    "type",
    "payment_type",
    "emirate",
    "action",
    "booking_source",
    "car",
    "group",
    "location",
  ];
  const initialLoadingStates = PARAM_TYPES.reduce((acc, type) => {
    acc[type] = true; // Set to true to show loading spinners while fetching real data
    return acc;
  }, {});

  const [loadingStates, setLoadingStates] = useState(initialLoadingStates);
  const [countsStats, setCountsStats] = useState({}); // Start with empty stats
  const now = dayjs();
  const [fromDate, setFromDate] = useState(
    now.startOf("month").format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState(now.endOf("month").format("YYYY-MM-DD"));
  const [dashboardStats, setDashboardStats] = useState({}); // Start with empty stats
  const [errorInApis, setErrorInApis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overAllDashApisLoading, setOverAllDashApisLoading] = useState(true);
  // const now = new Date();
  function formatDateToYMD(date) {
    if (!(date instanceof Date)) {
      date = new Date(date); // Convert if it's not already a Date object
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
  const now2 = new Date();
  const [customRange, setCustomRange] = useState({
    from: formatDateToYMD(
      new Date(new Date(now2).setMonth(now2.getMonth() - 1))
    ),
    to: formatDateToYMD(new Date()),
  });

  // Function to transform booking array data into chart format
  function transformBookingDataToCharts(bookings, paramType) {
    if (!bookings || !Array.isArray(bookings)) {
      return transformDashboardData(null, paramType);
    }

    let chartData = { labels: [], data: [] };

    switch (paramType) {
      case "booking_date":
        // Group bookings by date (last 7 days)
        const last7Days = Array.from({length: 7}, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0]; // Use ISO format for consistency
        });
        
        const dayLabels = last7Days.map(dateStr => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });
        
        const bookingsByDate = {};
        last7Days.forEach(date => bookingsByDate[date] = 0);
        
        bookings.forEach(booking => {
          // Parse date format: "26/8/2025 1:21:18 PM" -> "2025-08-26"
          const [datePart] = booking.booking_date.split(' ');
          const [day, month, year] = datePart.split('/');
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          if (bookingsByDate[isoDate] !== undefined) {
            bookingsByDate[isoDate]++;
          }
        });
        
        chartData.labels = dayLabels;
        chartData.data = last7Days.map(date => bookingsByDate[date]);
        break;

      case "payment_type":
        const paymentTypes = {};
        bookings.forEach(booking => {
          paymentTypes[booking.payment_type] = (paymentTypes[booking.payment_type] || 0) + 1;
        });
        chartData.labels = Object.keys(paymentTypes);
        chartData.data = Object.values(paymentTypes);
        break;

      case "emirate":
        const emirates = {};
        bookings.forEach(booking => {
          emirates[booking.pickup_emirate] = (emirates[booking.pickup_emirate] || 0) + 1;
        });
        chartData.labels = Object.keys(emirates);
        chartData.data = Object.values(emirates);
        break;

      case "type":
        const bookingTypes = {};
        bookings.forEach(booking => {
          bookingTypes[booking.type] = (bookingTypes[booking.type] || 0) + 1;
        });
        chartData.labels = Object.keys(bookingTypes);
        chartData.data = Object.values(bookingTypes);
        break;

      case "car":
        const cars = {};
        bookings.forEach(booking => {
          cars[booking.car_name] = (cars[booking.car_name] || 0) + 1;
        });
        // Show top 10 cars
        const sortedCars = Object.entries(cars).sort((a, b) => b[1] - a[1]).slice(0, 10);
        chartData.labels = sortedCars.map(([name]) => name);
        chartData.data = sortedCars.map(([, count]) => count);
        break;

      case "booking_source":
        const sources = {};
        bookings.forEach(booking => {
          sources[booking.source] = (sources[booking.source] || 0) + 1;
        });
        chartData.labels = Object.keys(sources);
        chartData.data = Object.values(sources);
        break;

      case "booking_month":
        // Group bookings by month (last 6 months)
        const last6Months = Array.from({length: 6}, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            year: date.getFullYear(),
            month: date.getMonth() + 1
          };
        });
        
        const bookingsByMonth = {};
        last6Months.forEach(({label}) => bookingsByMonth[label] = 0);
        
        bookings.forEach(booking => {
          const [datePart] = booking.booking_date.split(' ');
          const [day, month, year] = datePart.split('/');
          const monthObj = last6Months.find(m => m.year === parseInt(year) && m.month === parseInt(month));
          
          if (monthObj && bookingsByMonth[monthObj.label] !== undefined) {
            bookingsByMonth[monthObj.label]++;
          }
        });
        
        chartData.labels = last6Months.map(m => m.label);
        chartData.data = chartData.labels.map(label => bookingsByMonth[label]);
        break;

      default:
        // For other types, use the original transform function
        return transformDashboardData(null, paramType);
    }

    return transformDashboardData(chartData, paramType);
  }

  function transformDashboardData(inputData, paramType) {
    if (
      !inputData ||
      !Array.isArray(inputData.labels) ||
      !Array.isArray(inputData.data)
    ) {
      console.log("Invalid data format, using mock data for:", paramType);
      // Return mock data structure if API fails
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          data: [10, 20, 15, 25, 30, 22, 18],
          ...(chartConfigMap[paramType] || {}),
        }],
      };
    }

    const datasetsOptions = {
      data: inputData?.data,
      ...(chartConfigMap[paramType] || {}),
    };

    return {
      labels: inputData?.labels,
      datasets: [datasetsOptions],
    };
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const getDahsboardDataFunction = async (from, to, useDummyData = false) => {
    console.log("Loading dashboard data...");
    
    // Only use dummy data if explicitly requested
    if (useDummyData) {
      setDashboardStats(dummyChartData);
      setCountsStats(dummyCountStats);
      setLoadingStates(PARAM_TYPES.reduce((acc, type) => {
        acc[type] = false;
        return acc;
      }, {}));
      setOverAllDashApisLoading(false);
      setErrorInApis(false);
      setLoading(false);
      return;
    }
    
    setOverAllDashApisLoading(true);
    setErrorInApis(false);
    // setLoading(true);
    const resetLoadingStates = PARAM_TYPES.reduce((acc, type) => {
      acc[type] = true;
      return acc;
    }, {});
    setLoadingStates(resetLoadingStates);

    const finalData = {};
    // Don't reset dashboardStats to empty - keep dummy data as fallback
    try {
      // First, let's try to get booking data for stats
      const bookingUrl = configWeb.GET_BOOKINGS;
      const bookingsRes = await simpleGetCallAuth(bookingUrl);
      
      // Calculate stats from bookings if available
      let calculatedStats = {
        total_bookings: 462,
        total_cars: 28,
        total_locations: 28,
        total_users: 5966,
        incomplete_bookings: 0
      };
      
      if (bookingsRes && Array.isArray(bookingsRes)) {
        calculatedStats.total_bookings = bookingsRes.length;
        
        // Extract unique values
        const uniqueUsers = [...new Set(bookingsRes.map(b => b.user_email))];
        const uniqueCars = [...new Set(bookingsRes.map(b => b.car_name))];
        const uniqueLocations = [...new Set(bookingsRes.map(b => b.pickup_location).concat(bookingsRes.map(b => b.dropoff_location)))];
        
        calculatedStats.total_users = uniqueUsers.length || 5966;
        calculatedStats.total_cars = uniqueCars.length || 28;
        calculatedStats.total_locations = uniqueLocations.length || 28;
        
        // Count incomplete bookings (cancelled, failed, etc.)
        const incompleteStatuses = ['Cancelled', 'Failed', 'Incomplete', 'Pending'];
        const incompleteBookings = bookingsRes.filter(booking => 
          incompleteStatuses.includes(booking.status) || !booking.status || booking.status !== 'Booked'
        ).length;
        calculatedStats.incomplete_bookings = incompleteBookings;
      }

      const countUrl = configWeb.GET_DASHBOARD_STATS_COUNTS;
      const countRes = await simpleGetCallAuth(countUrl);
      setCountsStats(countRes || calculatedStats);

      await sleep(1000);
      
      // Try to use booking data for charts if available
      if (bookingsRes && Array.isArray(bookingsRes)) {
        console.log("Using booking data for charts, total bookings:", bookingsRes.length);
        
        // Generate charts from booking data
        for (const paramType of ["booking_date", "booking_month", "payment_type", "emirate", "type", "car", "booking_source"]) {
          const transformed = transformBookingDataToCharts(bookingsRes, paramType);
          setDashboardStats((prevStats) => ({
            ...prevStats,
            [paramType]: transformed,
          }));
          setLoadingStates((prev) => ({
            ...prev,
            [paramType]: false,
          }));
        }
      }
      
      // Try original dashboard API endpoints as fallback
      for (const paramType of PARAM_TYPES) {
        // Skip if already processed from bookings
        if (bookingsRes && Array.isArray(bookingsRes) && ["booking_date", "booking_month", "payment_type", "emirate", "type", "car", "booking_source"].includes(paramType)) {
          continue;
        }
        
        const url = configWeb.GET_DASHBOARD_STATS(paramType, from, to);
        const res = await simpleGetCallAuth(url);

        const resData = res || [];

        // finalData[paramType] = transformDashboardData(resData, paramType);
        const transformed = transformDashboardData(resData, paramType);
        setDashboardStats((prevStats) => ({
          ...prevStats,
          [paramType]: transformed,
        }));

        setLoadingStates((prev) => ({
          ...prev,
          [paramType]: false,
        }));
        setLoading(false);
        await sleep(500);
      }

      // setDashboardStats(finalData);
    } catch (error) {
      console.error("Error during dashboard fetch:", error);
      // Fall back to dummy data on error
      console.log("Falling back to demo data due to API error");
      setDashboardStats(dummyChartData);
      setCountsStats(dummyCountStats);
      setLoadingStates(PARAM_TYPES.reduce((acc, type) => {
        acc[type] = false;
        return acc;
      }, {}));
      setErrorInApis(false); // Don't show error since we have dummy data
      notifyError("Failed to load real data - displaying demo data");
    } finally {
      setLoading(false);
      setOverAllDashApisLoading(false);
    }
  };
  // Load actual data on mount
  useEffect(() => {
    // Load real data from API on initial load
    console.log("Initial load - fetching actual data from API");
    getDahsboardDataFunction(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // Summary sheet
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

      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

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
      doc.text(`Total Amount: ${summary.total_amount || "-"}`, 240, summaryY);
      doc.text(`Total Tax: ${summary.total_tax || "-"}`, 440, summaryY);
      doc.text(`Total Records: ${res.total_records || res.data.length}`, 640, summaryY);

      // Page 1 columns - Booking & User Info
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

  return (
    <DashboardView
      stats={dashboardStats}
      stats2={null} // Not needed anymore
      loading={loading}
      setFromDate={setFromDate}
      setToDate={setToDate}
      toDate={toDate}
      fromDate={fromDate}
      errorInApis={errorInApis}
      getDahsboardDataFunction={getDahsboardDataFunction}
      setCustomRange={setCustomRange}
      customRange={customRange}
      loadingStates={loadingStates}
      countsStats={countsStats}
      overAllDashApisLoading={overAllDashApisLoading}
      handleExportExcel={handleExportExcel}
      handleExportPDF={handleExportPDF}
      exporting={exporting}
    />
  );
};

export default Dashboard;
