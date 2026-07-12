// components/DateRangeFilter/DateRangeFilter.jsx
import React, { useState } from "react";
import "./dateRangeFilter.css";
import { Dropdown, Spinner } from "react-bootstrap";
import Example from "./DateRangePicker";
import originalMoment from "moment";
import { extendMoment } from "moment-range";
const moment = extendMoment(originalMoment);
const DateRangeFilter = ({
  selectedOption,
  customRange,
  onOptionChange,
  setCustomRangeCalender,
  calenderFlag,
  setCalenderFlag,
  setRetriggerKey,
  setSelectedOption,
  overAllDashApisLoading,
}) => {
  const options = [
    "Today",
    "Yesterday",
    "Last 3 Days",
    "Last 7 Days",
    "This Month",
    "Last 3 Months",
    "Last 6 Months",
    "This Year",
    "Custom Range",
  ];
  const today = moment();

  const [value, setValue] = useState(
    moment.range(today.clone().subtract(1, "days"), today.clone())
  );

  return (
    <div className="date-range-filter">
      {overAllDashApisLoading && (
        <div
          style={{ height: "50px" }}
          className="d-flex justify-content-center align-items-center"
        >
          {" "}
          <Spinner animation="border" variant="primary" />{" "}
        </div>
      )}

      <Dropdown>
        <Dropdown.Toggle
          variant="primary"
          id="dropdown-basic"
          disabled={overAllDashApisLoading}
        >
          {selectedOption === "Custom Range"
            ? `${value.start.format("YYYY-MM-DD")} - ${value.end.format("YYYY-MM-DD")}`
            : selectedOption}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {options.map((opt) => (
            <Dropdown.Item
              key={opt}
              onClick={() => {
                if (selectedOption === opt && opt === "Custom Range") {
                  setRetriggerKey((prev) => prev + 1); // force re-trigger
                  setCalenderFlag(true);
                }
                setSelectedOption(opt);
              }}
            >
              {opt}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      {selectedOption === "Custom Range" && calenderFlag && (
        <div className="custom-range postion-absolute">
          <Example
            setCustomRangeCalender={setCustomRangeCalender}
            setCalenderFlag={setCalenderFlag}
            value={value}
            setValue={setValue}
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
