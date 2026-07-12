// containers/DateRangeFilterContainer.jsx
import React, { useState, useEffect } from "react";
import DateRangeFilter from "./DateRangeFilterPresentation";

const DateRangeFilterContainer = ({
  onRangeChange,
  setCustomRange,
  customRange,
  getDahsboardDataFunction,
  overAllDashApisLoading,
}) => {
  const [selectedOption, setSelectedOption] = useState("This Month");
  const [calenderFlag, setCalenderFlag] = useState(true);
  const [date, setDate] = useState(null);
  const [retriggerKey, setRetriggerKey] = useState(0);
  const [customRangeCalender, setCustomRangeCalender] = useState({
    from: "",
    to: "",
  });

  function formatDateToYMD(date) {
    if (!(date instanceof Date)) {
      date = new Date(date); // Convert if it's not already a Date object
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getDateRange(selectedOption, customRange) {
    const now = new Date();
    let fromDate;
    let toDate = new Date();

    switch (selectedOption) {
      case "Today":
        fromDate = new Date();
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Yesterday":
        fromDate = new Date(now.getTime() - (2 - 1) * 24 * 60 * 60 * 1000);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Last 3 Days":
        fromDate = new Date(now.getTime() - (3 - 1) * 24 * 60 * 60 * 1000);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Last 7 Days":
        fromDate = new Date(now.getTime() - (7 - 1) * 24 * 60 * 60 * 1000);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "This Month":
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Last 3 Months":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Last 6 Months":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "This Year":
        fromDate = new Date(now.getFullYear(), 0, 1);
        getDahsboardDataFunction(
          formatDateToYMD(fromDate),
          formatDateToYMD(toDate)
        );
        setCalenderFlag(true);
        break;
      case "Custom Range":
        fromDate = customRange.from;
        toDate = customRange.to;

        break;
      default:
        fromDate = now;
    }

    return {
      from: formatDateToYMD(fromDate),
      to: formatDateToYMD(toDate),
    };
  }

  useEffect(() => {
    if (
      selectedOption === "Custom Range" &&
      customRangeCalender.from &&
      customRangeCalender.to
    ) {
      getDahsboardDataFunction(
        customRangeCalender.from,
        customRangeCalender.to
      );

      setCustomRangeCalender({
        from: "",
        to: "",
      });
    }
  }, [selectedOption, customRangeCalender]);
  useEffect(() => {
    setCustomRangeCalender({
      from: "",
      to: "",
    });
    if (selectedOption) {
      const { from, to } = getDateRange(selectedOption, customRange);
      setDate(from);

      setCustomRange({
        from: from,
        to: to,
      });
    }
  }, [selectedOption, retriggerKey]);

  return (
    <DateRangeFilter
      selectedOption={selectedOption}
      onOptionChange={(e) => setSelectedOption(e.target.value)}
      customRange={customRange}
      setCustomRangeCalender={setCustomRangeCalender}
      calenderFlag={calenderFlag}
      setCalenderFlag={setCalenderFlag}
      setSelectedOption={setSelectedOption}
      setRetriggerKey={setRetriggerKey}
      overAllDashApisLoading={overAllDashApisLoading}
    />
  );
};

export default DateRangeFilterContainer;
