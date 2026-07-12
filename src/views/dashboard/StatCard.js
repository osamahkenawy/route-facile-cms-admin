// components/StatCard.js
import React from "react";
import { Card, CardBody, Row, Col } from "react-bootstrap";
import "./dashboard.css";
import useCountUp from "./useCountUp";

const StatCard = ({ title, value, icon, variant = "primary" }) => {
  const isNumeric = !isNaN(value);
  const count = useCountUp(isNumeric ? Number(value) : 0);

  // Map variants to their specific colors
  const variantColors = {
    primary: { bg: 'rgba(28, 132, 238, 0.1)', text: '#1c84ee' },
    success: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
    danger: { bg: 'rgba(239, 95, 95, 0.1)', text: '#ef5f5f' },
    warning: { bg: 'rgba(249, 185, 49, 0.1)', text: '#f9b931' },
    info: { bg: 'rgba(78, 202, 194, 0.1)', text: '#4ecac2' },
  };

  const colors = variantColors[variant] || variantColors.primary;

  return (
    <Card className="analytics-stat-card">
      <CardBody>
        <Row>
          <Col xs={6}>
            <div 
              className="avatar-md rounded d-flex align-items-center justify-content-center"
              style={{ backgroundColor: colors.bg }}
            >
              <span style={{ color: colors.text }}>{icon}</span>
            </div>
          </Col>
          <Col xs={6} className="text-end">
            <p className="text-muted mb-0 text-truncate">{title}</p>
            <h3 className="text-dark mt-1 mb-0">
              {isNumeric ? count.toLocaleString() : value}
            </h3>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default StatCard;
