import React, { useEffect, useState, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {Link} from 'react-router-dom';
import { MdVisibility } from "react-icons/md";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { simpleGetCallAuth } from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import NamePhoto from "../../../components/NamePhoto/NamePhoto";
import logoImage from "../../../assets/images/logo_new.png";

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

const UsersBookings = () => {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minBookingCount, setMinBookingCount] = useState("");
  const [userBookingArray, setUserBookingArray] = useState([]);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [allUsersData, setAllUsersData] = useState([]); // For summary calculations
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const calculatePaginationMessage = () => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalUsers = totalRecords;
    const usersWithBookings = allUsersData.filter(user => {
      const bookingCount = user.total_bookings !== undefined 
        ? user.total_bookings 
        : (user.booking_count !== undefined 
          ? user.booking_count 
          : (user.total_booking_count !== undefined 
            ? user.total_booking_count 
            : 0));
      return bookingCount > 0;
    }).length;
    const totalBookings = allUsersData.reduce((sum, user) => {
      const bookingCount = user.total_bookings !== undefined 
        ? user.total_bookings 
        : (user.booking_count !== undefined 
          ? user.booking_count 
          : (user.total_booking_count !== undefined 
            ? user.total_booking_count 
            : 0));
      return sum + bookingCount;
    }, 0);
    const uniqueCountries = new Set(allUsersData.map(user => user.country).filter(Boolean)).size;
    
    return {
      totalUsers,
      usersWithBookings,
      totalBookings,
      uniqueCountries
    };
  }, [allUsersData, totalRecords]);

  const getUsersList = (overrideFilters = {}) => {
    setLoading(true);
    const params = new URLSearchParams();
    const filterGender = overrideFilters.gender !== undefined ? overrideFilters.gender : gender;
    const filterEmail = overrideFilters.email !== undefined ? overrideFilters.email : email;
    const filterSortBy = overrideFilters.sortBy !== undefined ? overrideFilters.sortBy : sortBy;
    const filterDateFrom = overrideFilters.dateFrom !== undefined ? overrideFilters.dateFrom : dateFrom;
    const filterDateTo = overrideFilters.dateTo !== undefined ? overrideFilters.dateTo : dateTo;
    const filterMinBookingCount = overrideFilters.minBookingCount !== undefined ? overrideFilters.minBookingCount : minBookingCount;
    const filterPage = overrideFilters.currentPage !== undefined ? overrideFilters.currentPage : currentPage;
    const filterPageSize = overrideFilters.pageSize !== undefined ? overrideFilters.pageSize : pageSize;
    
    if (filterGender) params.append("gender", filterGender);
    if (filterEmail) params.append("user_email", filterEmail);
    if (filterSortBy) params.append("sort_by", filterSortBy);
    if (filterDateFrom) params.append("registered_from", filterDateFrom);
    if (filterDateTo) params.append("registered_to", filterDateTo);
    if (filterMinBookingCount) params.append("min_booking_count", filterMinBookingCount);
    params.append("page", filterPage);
    params.append("page_size", filterPageSize);

    const url = `${configWeb.GET_USER_BOOKING_LIST}?${params.toString()}`;
    console.log("API Call URL:", url); // Debug log
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setUserBookingArray(res?.data || []);
          setTotalRecords(res?.total_records || 0);
          // Store all users data for summary calculations (if available)
          if (res?.all_data) {
            setAllUsersData(res.all_data);
          } else {
            // If no all_data, use current page data for approximation
            setAllUsersData(res?.data || []);
          }
          // Debug: Log first user object to see available fields
          if (res?.data && res.data.length > 0) {
            console.log("Sample user data:", res.data[0]);
          }
        } else {
          setUserBookingArray([]);
          setTotalRecords(0);
          setAllUsersData([]);
        }
      })
      .catch((error) => {
        notifyError("Something went wrong, please try again later");
        setUserBookingArray([]);
        setTotalRecords(0);
        setAllUsersData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getUsersList();
  }, [currentPage, pageSize]);

  // Handle sortBy changes separately to avoid issues with state updates
  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    // Trigger search when sortBy changes
    setCurrentPage(1);
    getUsersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    getUsersList();
  };

  const handleClearFilters = () => {
    // Clear all filter states
    setGender("");
    setEmail("");
    setSortBy("");
    setDateFrom("");
    setDateTo("");
    setMinBookingCount("");
    setCurrentPage(1);
    // Call API immediately with cleared values
    getUsersList({
      gender: "",
      email: "",
      sortBy: "",
      dateFrom: "",
      dateTo: "",
      minBookingCount: "",
      currentPage: 1
    });
  };

  const handleShowBookingDetails = (user) => {
    setSelectedUser(user);
    setShowBookingDetails(true);
    fetchUserBookings(user.user_email);
  };

  const handleCloseBookingDetails = () => {
    setShowBookingDetails(false);
    setSelectedUser(null);
    setUserBookings([]);
  };

  const fetchUserBookings = (userEmail) => {
    if (!userEmail) return;
    
    setLoadingBookings(true);
    const params = new URLSearchParams();
    params.append("user_email", userEmail);
    params.append("page", 1);
    params.append("page_size", 100); // Get more bookings

    const url = `${configWeb.GET_BOOKINGS}?${params.toString()}`;
    simpleGetCallAuth(url)
      .then((res) => {
        if (!res?.error) {
          setUserBookings(res?.data || []);
        } else {
          setUserBookings([]);
        }
      })
      .catch((error) => {
        notifyError("Failed to load booking details");
        setUserBookings([]);
      })
      .finally(() => {
        setLoadingBookings(false);
      });
  };

  const handleDownloadPDF = async () => {
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

    // Fetch all users data for PDF export
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const filterGender = gender;
      const filterEmail = email;
      const filterSortBy = sortBy;
      const filterDateFrom = dateFrom;
      const filterDateTo = dateTo;
      const filterMinBookingCount = minBookingCount;
      
      if (filterGender) params.append("gender", filterGender);
      if (filterEmail) params.append("user_email", filterEmail);
      if (filterSortBy) params.append("sort_by", filterSortBy);
      if (filterDateFrom) params.append("registered_from", filterDateFrom);
      if (filterDateTo) params.append("registered_to", filterDateTo);
      if (filterMinBookingCount) params.append("min_booking_count", filterMinBookingCount);
      
      // Fetch all records (use a large page size)
      params.append("page", 1);
      params.append("page_size", 10000); // Large number to get all records

      const url = `${configWeb.GET_USER_BOOKING_LIST}?${params.toString()}`;
      const res = await simpleGetCallAuth(url);

      if (res?.error) {
        notifyError("Failed to fetch data for PDF export");
        setLoading(false);
        return;
      }

      const allUsers = res?.data || [];
      const totalUsers = res?.total_records || allUsers.length;

      // Create PDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 20;
      const availableWidth = pageWidth - marginLeft - marginRight;

      // Logo dimensions and position - use reasonable aspect ratio to prevent stretching
      // Most logos are wider than tall, using 2.5:1 ratio
      const logoWidth = 75;
      const logoHeight = 30; // 2.5:1 aspect ratio
      const logoX = marginLeft;
      const logoY = marginTop;

      // Add logo at top left
      try {
        doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight, undefined, 'FAST');
      } catch (error) {
        console.log("Logo not found, continuing without logo");
      }

      // Header - Center aligned
      const headerY = logoY + logoHeight / 2;
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      const headerText = "Users Report";
      const headerWidth = doc.getTextWidth(headerText);
      const headerX = (pageWidth - headerWidth) / 2;
      doc.text(headerText, headerX, headerY);
      doc.setFont(undefined, "normal");

      // Add generated timestamp at top right
      const generatedAt = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const timestampText = `Generated: ${generatedAt}`;
      const timestampWidth = doc.getTextWidth(timestampText);
      doc.text(timestampText, pageWidth - marginRight - timestampWidth, headerY);
      doc.setTextColor(0, 0, 0);

      // Summary Statistics Cards
      const startY = logoY + logoHeight + 25;
      const cardSpacing = 15;
      const cardWidth = Math.floor((availableWidth - cardSpacing * 3) / 4);
      const cardHeight = 65;
      let cardX = marginLeft;

      const summaryCards = [
        { label: "TOTAL USERS", value: totalUsers, color: [83, 183, 232], textColor: [83, 183, 232] },
        { label: "USERS WITH BOOKINGS", value: allUsers.filter(u => {
          const count = u.total_bookings || u.booking_count || u.total_booking_count || 0;
          return count > 0;
        }).length, color: [40, 167, 69], textColor: [40, 167, 69] },
        { label: "TOTAL BOOKINGS", value: allUsers.reduce((sum, u) => {
          return sum + (u.total_bookings || u.booking_count || u.total_booking_count || 0);
        }, 0), color: [255, 193, 7], textColor: [255, 193, 7] },
        { label: "UNIQUE COUNTRIES", value: new Set(allUsers.map(u => u.country).filter(Boolean)).size, color: [220, 53, 69], textColor: [220, 53, 69] },
      ];

      summaryCards.forEach(({ label, value, color, textColor }) => {
        // Card background with light color
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(cardX, startY, cardWidth, cardHeight, 3, 3, "FD");
        
        // Left border accent
        doc.setFillColor(...color);
        doc.rect(cardX, startY, 4, cardHeight, "F");
        
        // Label text
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont(undefined, "normal");
        const labelLines = doc.splitTextToSize(label, cardWidth - 20);
        doc.text(labelLines, cardX + 12, startY + 15);
        
        // Value text - large and bold
        doc.setTextColor(...textColor);
        doc.setFontSize(20);
        doc.setFont(undefined, "bold");
        const valueText = String(value);
        const valueTextWidth = doc.getTextWidth(valueText);
        const valueX = cardX + (cardWidth - valueTextWidth) / 2;
        doc.text(valueText, valueX, startY + 45);
        
        // Reset colors
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "normal");
        cardX += cardWidth + cardSpacing;
      });

      // Prepare table data
      const tableData = allUsers.map((user) => [
        user.id || "-",
        user.user_name || "-",
        user.gender || "-",
        user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : "-",
        user.country || "-",
        String(user.total_bookings || user.booking_count || user.total_booking_count || 0),
        user.booking_date ? new Date(user.booking_date).toLocaleDateString('en-GB') : "-",
        user.registered_at ? new Date(user.registered_at).toLocaleDateString('en-GB') : "-",
      ]);

      // Add table
      autoTable(doc, {
        startY: startY + cardHeight + 20,
        head: [["ID", "User", "Gender", "DOB", "Country", "Total Bookings", "Booked At", "Registered At"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 3,
          textColor: [51, 51, 51],
          halign: "left",
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: availableWidth * 0.06, halign: "center", fontSize: 7 }, // ID (6%)
          1: { cellWidth: availableWidth * 0.18, fontSize: 7 }, // User (18%)
          2: { cellWidth: availableWidth * 0.08, halign: "center", fontSize: 7 }, // Gender (8%)
          3: { cellWidth: availableWidth * 0.10, fontSize: 7 }, // DOB (10%)
          4: { cellWidth: availableWidth * 0.12, fontSize: 7 }, // Country (12%)
          5: { cellWidth: availableWidth * 0.10, halign: "center", fontSize: 7 }, // Total Bookings (10%)
          6: { cellWidth: availableWidth * 0.13, fontSize: 7 }, // Booked At (13%)
          7: { cellWidth: availableWidth * 0.13, fontSize: 7 }, // Registered At (13%)
        },
        margin: { left: marginLeft, right: marginRight, top: 10 },
        styles: {
          overflow: "linebreak",
          cellWidth: "wrap",
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
      });

      // Save the PDF
      const fileName = `Users_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      notifySuccess("PDF exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifyError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
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

    // Fetch all users data for Excel export
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const filterGender = gender;
      const filterEmail = email;
      const filterSortBy = sortBy;
      const filterDateFrom = dateFrom;
      const filterDateTo = dateTo;
      const filterMinBookingCount = minBookingCount;
      
      if (filterGender) params.append("gender", filterGender);
      if (filterEmail) params.append("user_email", filterEmail);
      if (filterSortBy) params.append("sort_by", filterSortBy);
      if (filterDateFrom) params.append("registered_from", filterDateFrom);
      if (filterDateTo) params.append("registered_to", filterDateTo);
      if (filterMinBookingCount) params.append("min_booking_count", filterMinBookingCount);
      
      // Fetch all records
      params.append("page", 1);
      params.append("page_size", 10000);

      const url = `${configWeb.GET_USER_BOOKING_LIST}?${params.toString()}`;
      const res = await simpleGetCallAuth(url);

      if (res?.error) {
        notifyError("Failed to fetch data for Excel export");
        setLoading(false);
        return;
      }

      const allUsers = res?.data || [];
      const totalUsers = res?.total_records || allUsers.length;

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add Summary Sheet
      const usersWithBookings = allUsers.filter(u => {
        const count = u.total_bookings || u.booking_count || u.total_booking_count || 0;
        return count > 0;
      }).length;
      
      const totalBookings = allUsers.reduce((sum, u) => {
        return sum + (u.total_bookings || u.booking_count || u.total_booking_count || 0);
      }, 0);
      
      const uniqueCountries = new Set(allUsers.map(u => u.country).filter(Boolean)).size;

      const summaryDataArray = [
        ["Users Report Summary"],
        ["Generated at:", new Date().toLocaleString()],
        [""],
        ["Metric", "Value"],
        ["Total Users", totalUsers],
        ["Users with Bookings", usersWithBookings],
        ["Total Bookings", totalBookings],
        ["Unique Countries", uniqueCountries],
        [""],
        ["Filters Applied"],
        ["Gender", filterGender || "All"],
        ["Email", filterEmail || "All"],
        ["Sort By", filterSortBy || "Default"],
        ["Registration Date From", filterDateFrom || "All"],
        ["Registration Date To", filterDateTo || "All"],
        ["Min Booking Count", filterMinBookingCount || "All"],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryDataArray);
      summaryWS["!cols"] = [
        { wch: 25 }, // Column A width
        { wch: 30 }, // Column B width
      ];
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Prepare data for Excel export
      const excelData = allUsers.map((user, index) => ({
        "Sr. No": index + 1,
        "ID": user.id || "-",
        "User Name": user.user_name || "-",
        "Email": user.user_email || "-",
        "Phone": user.user_phone || "-",
        "Gender": user.gender || "-",
        "DOB": user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : "-",
        "Country": user.country || "-",
        "Total Bookings": user.total_bookings || user.booking_count || user.total_booking_count || 0,
        "Booked At": user.booking_date ? new Date(user.booking_date).toLocaleDateString('en-GB') : "-",
        "Registered At": user.registered_at ? new Date(user.registered_at).toLocaleDateString('en-GB') : "-",
      }));

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 8 },  // Sr. No
        { wch: 8 },  // ID
        { wch: 25 }, // User Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 10 }, // Gender
        { wch: 12 }, // DOB
        { wch: 20 }, // Country
        { wch: 15 }, // Total Bookings
        { wch: 12 }, // Booked At
        { wch: 15 }, // Registered At
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Generate Excel file
      const fileName = `Users_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notifySuccess("Excel exported successfully!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      notifyError("Failed to generate Excel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Page Header with Export Button */}
      <Row className="mt-4 mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Users</h3>
              <p className="text-muted mb-0">View and manage user information</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                disabled={loading || userBookingArray.length === 0}
                className="d-flex align-items-center gap-2"
                style={{ color: '#fff' }}
              >
                <FaFilePdf style={{ color: '#fff' }} /> <span style={{ color: '#fff' }}>Export PDF</span>
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadExcel}
                disabled={loading || userBookingArray.length === 0}
                className="d-flex align-items-center gap-2"
                style={{ color: '#fff' }}
              >
                <FaFileExcel style={{ color: '#fff' }} /> <span style={{ color: '#fff' }}>Export Excel</span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #53b7e8', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Total Users</Card.Title>
              <Card.Text 
                className="h3 mb-0" 
                style={{ 
                  color: '#53b7e8',   
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#000'}
                onMouseLeave={(e) => e.target.style.color = '#53b7e8'}
              >
                {summaryStats.totalUsers.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #28a745', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Users with Bookings</Card.Title>
              <Card.Text 
                className="h3 mb-0" 
                style={{ 
                  color: '#28a745', 
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#000'}
                onMouseLeave={(e) => e.target.style.color = '#28a745'}
              >
                {summaryStats.usersWithBookings.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #ffc107', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Total Bookings per each page</Card.Title>
              <Card.Text 
                className="h3 mb-0" 
                style={{ 
                  color: '#ffc107', 
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#000'}
                onMouseLeave={(e) => e.target.style.color = '#ffc107'}
              >
                {summaryStats.totalBookings.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #dc3545', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Unique Countries</Card.Title>
              <Card.Text 
                className="h3 mb-0" 
                style={{ 
                  color: '#dc3545', 
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#000'}
                onMouseLeave={(e) => e.target.style.color = '#dc3545'}
              >
                {summaryStats.uniqueCountries.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row className="col-lg-12 mb-3">
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label>Gender</Form.Label>
            <Form.Select
                aria-label="Default select"
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value=""> All</option>
                <option key="male" value="male">
                  Male
                </option>
                <option key="female" value="female">
                  Female
                </option>
              </Form.Select>
          </Form.Group>
          </div>
          <div className=" col-lg-3">
          <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
            <Form.Control
                aria-label="Default select"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
              </Form.Control>
          </Form.Group>

        </div>
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label>Sort by Booking Count</Form.Label>
            <Form.Select
                aria-label="Sort by booking count"
                name="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Default</option>
                <option value="total_bookings_desc">High to Low</option>
                <option value="total_bookings_asc">Low to High</option>
              </Form.Select>
          </Form.Group>
        </div>
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label>Booking Count Filter</Form.Label>
            <Form.Select
                aria-label="Filter by minimum booking count"
                name="minBookingCount"
                value={minBookingCount}
                onChange={(e) => setMinBookingCount(e.target.value)}
              >
                <option value="">All Users</option>
                <option value="2">Above 2</option>
                <option value="5">Above 5</option>
                <option value="10">Above 10</option>
                <option value="20">Above 20</option>
                <option value="30">Above 30</option>
                <option value="50">Above 50</option>
              </Form.Select>
          </Form.Group>
        </div>
      </Row>
      <Row className="col-lg-12 mb-3">
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label>Registration Date From</Form.Label>
            <Form.Control
                type="date"
                name="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
          </Form.Group>
        </div>
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label>Registration Date To</Form.Label>
            <Form.Control
                type="date"
                name="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
          </Form.Group>
        </div>
        <div className=" col-lg-3">
          <Form.Group className="mb-3">
            <Form.Label style={{ visibility: 'hidden' }}>Actions</Form.Label>
            <div className="d-flex gap-2">
              <Button className="btn-def btn-icon" onClick={handleSearchClick}>
                Search
              </Button>
              <Button 
                variant="outline-secondary" 
                className="btn-icon" 
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </Form.Group>
        </div>
      </Row>
      <Col>
        <div>
          <p>{calculatePaginationMessage()}</p>
        </div>
        <div className="table-responsive name-photo-table-wrapper" style={{ width: "100%", overflow: "visible", position: "relative" }}>
        <Table
          className="table table-striped"
          style={{ whiteSpace: "nowrap", width: "100%", marginBottom: 0, position: "relative" }}
        >
          <thead className="">
            <tr>
              <th>User</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Country</th>
              <th>Total Bookings</th>
              <th>Booked At</th>
              <th>Registered At</th>
              <th style={{ textAlign: 'center' }}>
              View Details
              </th>
            </tr>
          </thead>

          <tbody className="table table-striped">
            {loading ? (
              <tr>
                <td className="text-center" colSpan={8}>
                  {" "}
                  <Spinner />
                </td>{" "}
              </tr>
            ) : (
              Array.isArray(userBookingArray) &&
              userBookingArray?.length > 0 &&
              userBookingArray?.map((user, index) => (
                <tr key={user.id}>
                  <td>
                    <NamePhoto
                      name={user.user_name || ""}
                      email={user.user_email || ""}
                      phone={user.user_phone || ""}
                      gender={user.gender || ""}
                    />
                  </td>
                  <td>{user.gender}</td>
                  <td>{(user.dob) ? (new Date(user.dob)).toLocaleDateString('en-GB'): ''}</td>
                  <td>{user.country}</td>
                  <td className="text-center" style={{ textAlign: 'center' }}>
                    {(() => {
                      const bookingCount = user.total_bookings !== undefined 
                        ? user.total_bookings 
                        : (user.booking_count !== undefined 
                          ? user.booking_count 
                          : (user.total_booking_count !== undefined 
                            ? user.total_booking_count 
                            : null));
                      return bookingCount !== null ? (
                        <Badge 
                          pill 
                          style={{ backgroundColor: '#53b7e8', color: '#fff', border: 'none' }}
                        >
                          {bookingCount}
                        </Badge>
                      ) : (
                        <Badge 
                          pill 
                          style={{ backgroundColor: '#53b7e8', color: '#fff', border: 'none' }}
                        >
                          -
                        </Badge>
                      );
                    })()}
                  </td>
                  <td>{(user.booking_date) ? (new Date(user.booking_date)).toLocaleDateString('en-GB'): ''}</td>
                  <td>{(new Date(user.registered_at)).toLocaleDateString('en-GB')}</td>
                  <td>
                    <Button
                      className="btn-def btn-sm"
                      onClick={() => handleShowBookingDetails(user)}
                      title="View Details"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 8px",
                      }}
                    >
                      <MdVisibility style={{ fontSize: "18px" }} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
            {userBookingArray?.length === 0 && !loading && (
              <tr className="text-center">
                <td colSpan={8}>No Data Found.</td>
              </tr>
            )}
          </tbody>
        </Table>
        </div>
        <div className="d-flex justify-content-between align-items-center">
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
      </Col>

      {/* Booking Details Modal */}
      <Modal 
        show={showBookingDetails} 
        onHide={handleCloseBookingDetails}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Booking Details - {selectedUser?.user_name || 'User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Name:</strong> {selectedUser.user_name}
                </Col>
                <Col md={6}>
                  <strong>Email:</strong> {selectedUser.user_email}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Phone:</strong> {selectedUser.user_phone}
                </Col>
                <Col md={6}>
                  <strong>Gender:</strong> {selectedUser.gender}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>DOB:</strong> {selectedUser.dob ? (new Date(selectedUser.dob)).toLocaleDateString('en-GB') : 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>Country:</strong> {selectedUser.country || 'N/A'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Registered At:</strong> {(new Date(selectedUser.registered_at)).toLocaleDateString('en-GB')}
                </Col>
                <Col md={6}>
                  <strong>Total Bookings:</strong> 
                  <Badge 
                    pill 
                    style={{ backgroundColor: '#53b7e8', color: '#fff', border: 'none', marginLeft: '8px' }}
                  >
                    {selectedUser.total_bookings !== undefined 
                      ? selectedUser.total_bookings 
                      : (selectedUser.booking_count !== undefined 
                        ? selectedUser.booking_count 
                        : (selectedUser.total_booking_count !== undefined 
                          ? selectedUser.total_booking_count 
                          : 0))}
                  </Badge>
                </Col>
              </Row>
              <hr />
              <h6 className="mb-3">User Bookings</h6>
              {loadingBookings ? (
                <div className="text-center">
                  <Spinner />
                </div>
              ) : userBookings.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Booking #</th>
                        <th>Booking ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Car</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{booking.booking_number}</td>
                          <td>{booking.booking_log_number}</td>
                          <td>{booking.booking_date}</td>
                          <td>
                            <span className={`${booking.status}_box`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>{booking.type}</td>
                          <td>{booking.car_name}</td>
                          <td>{booking.total_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted">No bookings found for this user.</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-def" onClick={handleCloseBookingDetails}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UsersBookings;
