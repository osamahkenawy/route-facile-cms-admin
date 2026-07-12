import React, { useState } from "react";
import DateRangePicker from "react-daterange-picker";
import "react-daterange-picker/dist/css/react-calendar.css";
import originalMoment from "moment";
import { extendMoment } from "moment-range";
import "./dateRangeFilter.css";
import { Prev } from "react-bootstrap/esm/PageItem";

const moment = extendMoment(originalMoment);

const DateRangeFilter = ({
  setCustomRangeCalender,
  setCalenderFlag,
  value,
  setValue,
}) => {
  const today = moment();

  const handleSelect = (range) => {
    setValue(range);
    setCustomRangeCalender({
      from: range?.start?.format("YYYY-MM-DD"),
      to: range?.end?.format("YYYY-MM-DD"),
    });
    setCalenderFlag(false);
  };

  return (
    <div className="range-date-picker-wrapper-div">
      <div className="d-flex justify-content-center">
        {value.start.format("YYYY-MM-DD")} - {value.end.format("YYYY-MM-DD")}
      </div>

      <DateRangePicker
        value={value}
        onSelect={handleSelect}
        singleDateRange={true}
      />
    </div>
  );
};

export default DateRangeFilter;
