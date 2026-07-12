import { simpleGetCallAuth } from "../../../components/config.js/Setup";

export function formatDateTimeUAE(dateTimeString) {
  // Parse the input date string and convert to UAE time zone
  const date = new Date(dateTimeString);

  // Format date and time for UAE time zone
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", // UAE Time Zone (UTC+4)
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format
  });

  // Format the date string
  const formattedDate = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return `${formattedDate.year}-${formattedDate.month}-${formattedDate.day} ${formattedDate.hour}:${formattedDate.minute}`;
}

export const stringToArray = (string) => {
  if (typeof string !== "string") return null;
  try {
    const parsedArray = JSON.parse(string);
    if (
      Array.isArray(parsedArray) &&
      parsedArray.length === 2 &&
      parsedArray.every((num) => typeof num === "number")
    ) {
      return parsedArray;
    }
  } catch (error) {
    return null;
  }
  return null;
};

export const fetchData = async ({ url, setter, onError, onFinally }) => {
  try {
    const response = await simpleGetCallAuth(url);
    setter(response.data || []);
  } catch (error) {
    if (onError) onError(error);
    else console.error("Fetch error:", error);
  } finally {
    if (onFinally) onFinally();
  }
};

export function filterArrayByProperty(arrayOfObjects, filterKey, propertyName) {
  // Validate that arrayOfObjects is indeed an array.
  if (!Array.isArray(arrayOfObjects)) {
    return [];
  }

  // Validate that propertyName is a string
  if (typeof propertyName !== "string") {
    return [];
  }

  // Return a new filtered array
  return arrayOfObjects.filter(
    (item) => item[propertyName]?.toString() === filterKey?.toString()
  );
}
