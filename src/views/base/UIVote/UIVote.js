import React, { useEffect, useState, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Row,
  Col,
  Table,
  Spinner,
} from "react-bootstrap";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import CustomPagination from "../../../components/CustomPagination/CustomPagination";
import { simpleGetCall } from "../../../components/config.js/Setup";
import { notifyError, notifySuccess } from "../../../components/notify/notify";
import configWeb from "../../../components/config.js/ConfigWeb";
import logoImage from "../../../assets/images/logo_new.png";
import * as XLSX from "xlsx";

// Conditional imports for PDF libraries
let jsPDF, autoTable;

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

const UIVote = () => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voteData, setVoteData] = useState([]);
  const [allVoteData, setAllVoteData] = useState([]);
  const [loadingAllData, setLoadingAllData] = useState(false);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const calculatePaginationMessage = () => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);
    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
  };

  const getVoteList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("page_size", pageSize);

    const url = `${configWeb.GET_UI_VOTE}?${params.toString()}`;
    simpleGetCall(url)
      .then((res) => {
        if (!res?.error) {
          setVoteData(res?.data || []);
          setTotalRecords(res?.total_records || 0);
        } else {
          setVoteData([]);
          setTotalRecords(0);
          notifyError(res?.message || "Failed to load vote data");
        }
      })
      .catch((error) => {
        console.error("Error fetching vote data:", error);
        notifyError("Something went wrong, please try again later");
        setVoteData([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getAllVoteData = () => {
    setLoadingAllData(true);
    simpleGetCall(configWeb.GET_UI_VOTE_ALL)
      .then((res) => {
        // Handle response - it could be the data directly or wrapped in a response object
        if (res?.data && Array.isArray(res.data)) {
          setAllVoteData(res.data);
        } else if (Array.isArray(res)) {
          setAllVoteData(res);
        } else if (!res?.error) {
          setAllVoteData(res?.data || []);
        } else {
          setAllVoteData([]);
          console.error("Failed to load all vote data:", res?.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching all vote data:", error);
        setAllVoteData([]);
      })
      .finally(() => {
        setLoadingAllData(false);
      });
  };

  useEffect(() => {
    getVoteList();
    getAllVoteData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate summary statistics from all data (not paginated)
  const summaryStats = useMemo(() => {
    const newUICount = allVoteData.filter((vote) => vote.choice === "first").length;
    const oldUICount = allVoteData.filter((vote) => vote.choice === "second").length;
    
    return {
      total: allVoteData.length,
      newUI: newUICount,
      oldUI: oldUICount,
    };
  }, [allVoteData]);

  const getChoiceBadge = (choice) => {
    if (choice === "first") {
      return (
        <Badge bg="success" style={{ backgroundColor: "#28a745", color: "#fff" }}>
          New UI
        </Badge>
      );
    } else if (choice === "second") {
      return (
        <Badge bg="info" style={{ backgroundColor: "#17a2b8", color: "#fff" }}>
          Old UI
        </Badge>
      );
    }
    return <Badge bg="secondary">{choice || "-"}</Badge>;
  };

  const getChoiceText = (choice) => {
    if (choice === "first") return "New UI";
    if (choice === "second") return "Old UI";
    return choice || "-";
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

    // Use the already fetched allVoteData, or fetch if not available
    let allVoteDataForPDF = allVoteData;
    
    // If allVoteData is empty, fetch it now
    if (allVoteDataForPDF.length === 0) {
      setLoading(true);
      try {
        const response = await simpleGetCall(configWeb.GET_UI_VOTE_ALL);
        // Handle response - it could be the data directly or wrapped in a response object
        if (response?.data && Array.isArray(response.data)) {
          allVoteDataForPDF = response.data;
        } else if (Array.isArray(response)) {
          allVoteDataForPDF = response;
        } else if (!response?.error) {
          allVoteDataForPDF = response?.data || [];
        } else {
          notifyError(response?.message || "Failed to fetch all vote data for PDF export");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error fetching all vote data:", error);
        notifyError("Failed to fetch all vote data. Please try again later.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Calculate summary statistics from all data
    const allNewUICount = allVoteDataForPDF.filter((vote) => vote.choice === "first").length;
    const allOldUICount = allVoteDataForPDF.filter((vote) => vote.choice === "second").length;
    const allTotalCount = allVoteDataForPDF.length;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20;
    const availableWidth = pageWidth - marginLeft - marginRight;

    // Logo dimensions and position
    const logoWidth = 60;
    const logoHeight = 30;
    const logoX = marginLeft;
    const logoY = marginTop;

    // Add logo at top left
    try {
      doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.log("Logo not found, continuing without logo");
    }

    // Header - Center aligned
    const headerY = logoY + logoHeight / 2;
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const headerText = "UI Vote Report";
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

    // Summary Statistics Cards - Better styling (using all data)
    const startY = logoY + logoHeight + 25;
    const cardSpacing = 15;
    const cardWidth = Math.floor((availableWidth - cardSpacing * 2) / 3);
    const cardHeight = 65;
    let cardX = marginLeft;

    const summaryCards = [
      { label: "TOTAL VOTES", value: allTotalCount, color: [83, 183, 232], textColor: [83, 183, 232] },
      { label: "NEW UI", value: allNewUICount, color: [40, 167, 69], textColor: [40, 167, 69] },
      { label: "OLD UI", value: allOldUICount, color: [23, 162, 184], textColor: [23, 162, 184] },
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
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(label, cardX + 12, startY + 18);
      
      // Value text - large and bold
      doc.setTextColor(...textColor);
      doc.setFontSize(24);
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

    // Prepare table data with proper formatting (using all data)
    const tableData = allVoteDataForPDF.map((vote) => ({
      id: String(vote.id || "-"),
      username: vote.username || "-",
      phone_number: vote.phone_number || "-",
      email: vote.email || "-",
      choice: getChoiceText(vote.choice),
      created_at: formatDate(vote.created_at),
    }));

    autoTable(doc, {
      startY: startY + cardHeight + 20,
      head: [["ID", "Username", "Phone Number", "Email", "Choice", "Created At"]],
      body: tableData.map(row => [
        row.id,
        row.username,
        row.phone_number,
        row.email,
        row.choice,
        row.created_at
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [51, 51, 51],
        halign: "left",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "center", fontSize: 8 }, // ID
        1: { cellWidth: 90, fontSize: 8 }, // Username
        2: { cellWidth: 100, fontSize: 8 }, // Phone Number
        3: { cellWidth: 130, fontSize: 8 }, // Email
        4: { cellWidth: 80, halign: "center", fontSize: 8 }, // Choice
        5: { cellWidth: 120, fontSize: 7 }, // Created At
      },
      margin: { left: marginLeft, right: marginRight, top: 10 },
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      didParseCell: function (data) {
        // Add borders to all cells
        data.cell.styles.lineColor = [200, 200, 200];
        data.cell.styles.lineWidth = 0.3;
        
        // Color code choice column (column index 4)
        if (data.column.index === 4) {
          const choice = data.cell.text[0];
          if (choice === "New UI") {
            data.cell.styles.fillColor = [40, 167, 69]; // Green
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          } else if (choice === "Old UI") {
            data.cell.styles.fillColor = [23, 162, 184]; // Blue
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Save the PDF
    const fileName = `UI_Vote_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    notifySuccess("PDF exported successfully!");
  };

  const handleDownloadExcel = async () => {
    // Use the already fetched allVoteData, or fetch if not available
    let allVoteDataForExcel = allVoteData;
    
    // If allVoteData is empty, fetch it now
    if (allVoteDataForExcel.length === 0) {
      setLoading(true);
      try {
        const response = await simpleGetCall(configWeb.GET_UI_VOTE_ALL);
        // Handle response - it could be the data directly or wrapped in a response object
        if (response?.data && Array.isArray(response.data)) {
          allVoteDataForExcel = response.data;
        } else if (Array.isArray(response)) {
          allVoteDataForExcel = response;
        } else if (!response?.error) {
          allVoteDataForExcel = response?.data || [];
        } else {
          notifyError(response?.message || "Failed to fetch all vote data for Excel export");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error fetching all vote data:", error);
        notifyError("Failed to fetch all vote data. Please try again later.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (allVoteDataForExcel.length === 0) {
      notifyError("No data available to export");
      return;
    }

    // Prepare data for Excel export
    const excelData = allVoteDataForExcel.map((vote) => ({
      ID: vote.id || "-",
      Username: vote.username || "-",
      "Phone Number": vote.phone_number || "-",
      Email: vote.email || "-",
      Choice: getChoiceText(vote.choice),
      "Created At": formatDate(vote.created_at),
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create a worksheet from the data
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 10 }, // ID
      { wch: 25 }, // Username
      { wch: 18 }, // Phone Number
      { wch: 35 }, // Email
      { wch: 12 }, // Choice
      { wch: 25 }, // Created At
    ];
    ws["!cols"] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "UI Vote Report");

    // Generate Excel file and download
    const fileName = `UI_Vote_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    notifySuccess("Excel file exported successfully!");
  };

  return (
    <>
      <style>
        {`
          .header-navbar~* .body, .header-navbar~.body {
            padding-top: 50px;
          }
        `}
      </style>
      <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>UI Vote</h3>
              <p className="text-muted mb-0">View user votes for UI preference</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={handleDownloadExcel}
                disabled={loading || loadingAllData || allVoteData.length === 0}
                className="d-flex align-items-center gap-2 text-white"
              >
                <FaFileExcel /> Export Excel
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                disabled={loading || loadingAllData || allVoteData.length === 0}
                className="d-flex align-items-center gap-2"
              >
                <FaFilePdf /> Export PDF
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4} sm={12} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #53b7e8', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Total Votes</Card.Title>
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
                {loadingAllData ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  summaryStats.total.toLocaleString()
                )}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={12} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #28a745', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">New UI</Card.Title>
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
                {loadingAllData ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  summaryStats.newUI.toLocaleString()
                )}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={12} className="mb-3">
          <Card className="h-100 shadow-sm" style={{ borderLeft: '4px solid #17a2b8', cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title className="text-muted small mb-2">Old UI</Card.Title>
              <Card.Text 
                className="h3 mb-0" 
                style={{ 
                  color: '#17a2b8', 
                  fontWeight: 'bold',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#000'}
                onMouseLeave={(e) => e.target.style.color = '#17a2b8'}
              >
                {loadingAllData ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  summaryStats.oldUI.toLocaleString()
                )}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Choice</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    </td>
                  </tr>
                ) : voteData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No vote data available
                    </td>
                  </tr>
                ) : (
                  voteData.map((vote) => (
                    <tr key={vote.id}>
                      <td>{vote.id}</td>
                      <td>{vote.username || "-"}</td>
                      <td>{vote.phone_number || "-"}</td>
                      <td>{vote.email || "-"}</td>
                      <td>{getChoiceBadge(vote.choice)}</td>
                      <td>{formatDate(vote.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {!loading && totalRecords > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <p className="mb-0">{calculatePaginationMessage()}</p>
              </div>
              <CustomPagination
                currentPage={currentPage}
                recordsPerPage={pageSize}
                onPageChange={handlePageChange}
                totalRecords={totalRecords}
              />
            </div>
          )}
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default UIVote;
