import React, { useRef, useState } from "react";
import { Card, CardBody, CardHeader, Row, Col, Spinner, Button, Dropdown } from "react-bootstrap";

import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "chartjs-plugin-zoom";
import zoomPlugin from "chartjs-plugin-zoom";
import StatCard from "./StatCard";

import {
  FaCar,
  FaCalendarCheck,
  FaUsers,
  FaMapMarkerAlt,
  FaClock,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";

import DateRangeFilterContainer from "./DateRangeFilter/DateRangeFilterContainer";

const DashboardView = ({
  stats,
  stats2,
  getDahsboardDataFunction,
  loading,
  errorInApis,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  loadingStates,
  customRange,
  setCustomRange,
  countsStats,
  overAllDashApisLoading,
  handleExportExcel,
  handleExportPDF,
  exporting,
}) => {
  Chart.register(zoomPlugin, ArcElement, Tooltip, Legend);
  const [labelLength, setLabelLength] = useState(false);
  const [chartRendered, setChartRendered] = useState(false);

  const generateLegendWithValues = (chart) => {
    const { data } = chart;
    const dataset = data.datasets[0];
    if (data.labels.length > 15) setLabelLength(true);

    return data.labels.map((label, index) => {
      const value = dataset.data[index];
      const backgroundColor = dataset.backgroundColor[index];
      return {
        text: `(${value}) ${label}`,
        fillStyle: backgroundColor,
        strokeStyle: backgroundColor,
        index,
      };
    });
  };

  const commonTooltipConfig = {
    enabled: true,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    titleColor: '#fff',
    bodyColor: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    padding: 12,
    displayColors: true,
    cornerRadius: 8,
    titleFont: { size: 14, weight: 'bold' },
    bodyFont: { size: 13 },
    callbacks: {
      title: function(tooltipItems) {
        if (tooltipItems && tooltipItems.length > 0) {
          return tooltipItems[0].label || '';
        }
        return '';
      },
      label: function(context) {
        const datasetLabel = context.dataset.label || 'Value';
        let value;
        if (context.parsed !== undefined && context.parsed.y !== undefined) {
          value = context.parsed.y;
        } else if (context.raw !== undefined) {
          value = context.raw;
        } else if (context.parsed !== undefined && typeof context.parsed === 'number') {
          value = context.parsed;
        } else {
          value = 0;
        }
        const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
        return `${datasetLabel}: ${formattedValue}`;
      },
      labelTextColor: function() { return '#fff'; }
    }
  };

  const options = {
    plugins: {
      legend: {
        position: "left",
        labels: { generateLabels: generateLegendWithValues },
      },
      tooltip: commonTooltipConfig,
    },
    maintainAspectRatio: false,
  };

  const zoomOptions = {
    pan: { enabled: true, mode: "x" },
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      mode: "x",
    },
  };

  const options2 = {
    plugins: {
      legend: {},
      tooltip: commonTooltipConfig,
      zoom: zoomOptions,
    },
    animation: { onComplete: () => setChartRendered(true) },
    maintainAspectRatio: false,
  };

  const options3 = {
    plugins: {
      legend: {
        labels: { generateLabels: generateLegendWithValues },
      },
      tooltip: commonTooltipConfig,
      zoom: zoomOptions,
    },
    maintainAspectRatio: false,
  };

  const chartRef = useRef(null);

  // Card Title Component
  const CardTitle = ({ children, as = 'h5', className = '' }) => {
    const Tag = as;
    return <Tag className={`card-title-analytics ${className}`}>{children}</Tag>;
  };

  // Loading Spinner Component
  const LoadingSpinner = ({ height = "300px" }) => (
    <div style={{ height }} className="d-flex justify-content-center align-items-center">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  // Simple Chart Card Header - No dropdown, no dashed border
  const ChartCardHeader = ({ title }) => (
    <CardHeader className="chart-card-header bg-transparent">
      <CardTitle>{title}</CardTitle>
    </CardHeader>
  );

  const renderContent = () => {
    if (loading)
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ width: "100%", height: "80vh" }}>
          <Spinner animation="border" variant="primary" />
        </div>
      );
    else if (!stats) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ width: "100%", height: "80vh" }}>
          <p>No Data Found !</p>
        </div>
      );
    } else if (errorInApis) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ width: "100%", height: "80vh" }}>
          {console.log("errorInApis", errorInApis)}
          <p>Something went wrong in API call. Please try again after sometime.</p>
        </div>
      );
    }

    return (
      <>
        {/* Top Section: Stats + Conversions Card */}
        <Row>
          {/* Stats Column */}
          <Col xxl={3}>
            <Row>
              <Col md={6} xxl={12}>
                <StatCard
                  title="Total Bookings"
                  value={countsStats?.total_bookings || 0}
                  icon={<FaCalendarCheck size={28} />}
                  variant="primary"
                />
              </Col>
              <Col md={6} xxl={12}>
                <StatCard
                  title="Incomplete Bookings"
                  value={countsStats?.incomplete_bookings || 0}
                  icon={<FaClock size={28} />}
                  variant="warning"
                />
              </Col>
              <Col md={6} xxl={12}>
                <StatCard
                  title="Active Cars"
                  value={countsStats?.total_cars || 0}
                  icon={<FaCar size={28} />}
                  variant="success"
                />
              </Col>
              <Col md={6} xxl={12}>
                <StatCard
                  title="Total Users"
                  value={countsStats?.total_users || 0}
                  icon={<FaUsers size={28} />}
                  variant="danger"
                />
              </Col>
            </Row>
          </Col>

          {/* Main Conversions Card */}
          <Col xxl={9}>
            <Card>
              <CardBody className="p-0">
                <Row className="g-0">
                  {/* Left Side - Locations Summary */}
                  <Col lg={4}>
                    <div className="p-3 d-flex flex-column justify-content-between h-100">
                      <CardTitle>Locations Overview</CardTitle>
                      
                      {/* Location Icon & Count */}
                      <div className="text-center my-4">
                        <div 
                          className="avatar-lg rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{ backgroundColor: 'rgba(127, 86, 218, 0.1)' }}
                        >
                          <FaMapMarkerAlt style={{ color: '#7f56da' }} size={32} />
                        </div>
                        <h2 className="text-dark mb-1">{countsStats?.total_locations || 0}</h2>
                        <p className="text-muted mb-0">Total Locations</p>
                      </div>

                      {/* Stats Row */}
                      <Row className="text-center">
                        <Col xs={6}>
                          <p className="text-muted mb-2">Active</p>
                          <h3 className="text-dark mb-3">{countsStats?.active_locations || countsStats?.total_locations || 0}</h3>
                        </Col>
                        <Col xs={6}>
                          <p className="text-muted mb-2">Cars</p>
                          <h3 className="text-dark mb-3">{countsStats?.total_cars || 0}</h3>
                        </Col>
                      </Row>

                      {/* View Details Button */}
                      <div className="text-center">
                        <Button variant="light" className="w-100">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Col>

                  {/* Right Side - Performance Chart */}
                  <Col lg={8} className="border-start">
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <CardTitle>
                          <MdTrendingUp className="me-2 text-primary" />
                          Daily Bookings Trend
                        </CardTitle>
                      </div>
                      
                      <div className="alert alert-info mt-3 text text-truncate mb-0" role="alert">
                        Live booking data from your dashboard analytics.
                      </div>

                      {loadingStates["booking_date"] || !stats?.booking_date ? (
                        <LoadingSpinner height="313px" />
                      ) : (
                        <div style={{ height: "313px" }} className="mt-2">
                          {stats?.booking_date && (
                            <Line data={stats?.booking_date} options={options2} />
                          )}
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Bookings by Month - Full Width */}
        <Row>
          <Col xs={12}>
            <Card>
              <ChartCardHeader title="Bookings by Month" />
              <CardBody>
                {loadingStates["booking_month"] ? (
                  <LoadingSpinner height="350px" />
                ) : (
                  <div style={{ height: "350px" }}>
                    {stats?.booking_month && (
                      <Bar data={stats?.booking_month} options={options2} />
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Pie Charts Row - 4 Columns */}
        <Row>
          <Col lg={3} md={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Pickup" />
              <CardBody className="d-flex align-items-center justify-content-center">
                {loadingStates["pickup_type"] ? (
                  <LoadingSpinner height="200px" />
                ) : (
                  <div style={{ height: "200px", width: "100%" }}>
                    {stats?.pickup_type && <Pie data={stats?.pickup_type} options={options3} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Dropoff" />
              <CardBody className="d-flex align-items-center justify-content-center">
                {loadingStates["dropoff_type"] ? (
                  <LoadingSpinner height="200px" />
                ) : (
                  <div style={{ height: "200px", width: "100%" }}>
                    {stats?.dropoff_type && <Pie data={stats?.dropoff_type} options={options3} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Type" />
              <CardBody className="d-flex align-items-center justify-content-center">
                {loadingStates["type"] ? (
                  <LoadingSpinner height="200px" />
                ) : (
                  <div style={{ height: "200px", width: "100%" }}>
                    {stats?.type && <Pie data={stats?.type} options={options3} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Payment" />
              <CardBody className="d-flex align-items-center justify-content-center">
                {loadingStates["payment_type"] ? (
                  <LoadingSpinner height="200px" />
                ) : (
                  <div style={{ height: "200px", width: "100%" }}>
                    {stats?.payment_type && <Pie data={stats?.payment_type} options={options3} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Doughnut Charts Row - 3 Columns */}
        <Row>
          <Col lg={4}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Emirate" />
              <CardBody>
                {loadingStates["emirate"] ? (
                  <LoadingSpinner height="280px" />
                ) : (
                  <div style={{ height: "280px" }}>
                    {stats?.emirate && <Doughnut data={stats?.emirate} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Action" />
              <CardBody>
                {loadingStates["action"] ? (
                  <LoadingSpinner height="280px" />
                ) : (
                  <div style={{ height: "280px" }}>
                    {stats?.action && <Pie data={stats?.action} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Source" />
              <CardBody>
                {loadingStates["booking_source"] ? (
                  <LoadingSpinner height="280px" />
                ) : (
                  <div style={{ height: "280px" }}>
                    {stats?.booking_source && <Pie data={stats?.booking_source} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Bookings By Car */}
        <Row>
          <Col xs={12}>
            <Card>
              <ChartCardHeader title="Bookings By Car" />
              <CardBody>
                {loadingStates["car"] ? (
                  <LoadingSpinner height="300px" />
                ) : (
                  <div style={{ height: "300px" }}>
                    {stats?.car && <Doughnut data={stats?.car} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Bookings By Car Group & Locations */}
        <Row>
          <Col lg={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Car Group" />
              <CardBody>
                {loadingStates["group"] ? (
                  <LoadingSpinner height="300px" />
                ) : (
                  <div style={{ height: "300px" }}>
                    {stats?.group && <Doughnut data={stats?.group} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="card-height-100">
              <ChartCardHeader title="Bookings By Locations" />
              <CardBody>
                {loadingStates["location"] ? (
                  <LoadingSpinner height="300px" />
                ) : (
                  <div style={{ height: "300px" }}>
                    {stats?.location && <Doughnut data={stats?.location} options={options} />}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <div className="analytics-dashboard">
      {/* Page Title Row - Page name left, breadcrumb right */}
      <div className="page-title-box">
        <Row className="align-items-center">
          <Col>
            <h4 className="page-title mb-0">Analytics</h4>
          </Col>
          <Col xs="auto">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><a href="#">Dashboards</a></li>
              <li className="breadcrumb-item active">Analytics</li>
            </ol>
          </Col>
        </Row>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-3 filter-card">
        <CardBody className="py-2">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <DateRangeFilterContainer
              setCustomRange={setCustomRange}
              customRange={customRange}
              getDahsboardDataFunction={getDahsboardDataFunction}
              overAllDashApisLoading={overAllDashApisLoading}
            />
            <div className="d-flex gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? <Spinner animation="border" size="sm" className="me-1" /> : <FaFileExcel className="me-1" />}
                Excel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {exporting ? <Spinner animation="border" size="sm" className="me-1" /> : <FaFilePdf className="me-1" />}
                PDF
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {renderContent()}
    </div>
  );
};

export default DashboardView;
