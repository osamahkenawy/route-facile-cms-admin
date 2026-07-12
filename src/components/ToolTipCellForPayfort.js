import React from "react";
import "./tooltip.css";

const ToolTipCellForPayfort = ({ data }) => {
  let parsedData;

  try {
    // Parse data if it's a string
    parsedData = typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Failed to parse data:", error);
    return <td>Error parsing data</td>;
  }

  // Handle cases where parsedData is not an array
  if (!parsedData || (typeof parsedData !== "object" && !Array.isArray(parsedData))) {
    return <td>[ ]</td>;
  }

  // If parsedData is an object, convert it to an array of key-value pairs
  const dataToRender = Array.isArray(parsedData)
    ? parsedData
    : Object.entries(parsedData);

  return (
    <td>
      <div className="tooltip-container">
        <span className="tooltip-trigger">Hover to see</span>
        <div className="tooltip-content">
          <div className="tooltip-grid">
            {dataToRender.map((item, index) => {
              if (Array.isArray(item)) {
                // Render key-value pairs from objects
                const [key, value] = item;
                return (
                  <div className="tooltip-item" key={index}>
                    <strong>{key}</strong>: {String(value)}
                  </div>
                );
              }
              // Render items in an array format
              return (
                <div className="tooltip-item" key={index}>
                  <strong>Item {index + 1}</strong>: {JSON.stringify(item)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </td>
  );
};

export default ToolTipCellForPayfort;
