import React from "react";
import "./tooltip.css"

const TooltipCell = ({ data }) => {
  // Parse data if it's a string
  let parsedData;
  try {
    parsedData = typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Failed to parse data:", error);
    parsedData = []; // Default to an empty array if parsing fails
  }

  if (!parsedData || !parsedData.length) {
    return <td>[ ]</td>; // Render a default text if the array is empty
  }

  return (
    <td>
      <div className="tooltip-container">
        <span className="tooltip-trigger">Hover to see</span>
        <div className="tooltip-content">
          <div className="tooltip-grid">
            {parsedData.map((item, index) => (
              <div className="tooltip-item" key={index}>
                <strong>Item {index + 1}</strong>
                <ul className="tooltip-list">
                  {Object.entries(item).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </td>
  );
};

export default TooltipCell;
