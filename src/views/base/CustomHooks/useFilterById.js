import { useState, useEffect } from "react";

// Custom hook to filter an array by an array of ids
const useFilterByIds = (array, ids) => {
  const [filteredArray, setFilteredArray] = useState([]);

  useEffect(() => {
    if (array && ids.length > 0) {
      setFilteredArray(() => array.filter((item) => ids.includes(item.emirate_id)));
    } else {
      setFilteredArray([]); // Return an empty array if no data or ids are provided
    }
  }, [array, ids]); // Re-run effect if `array` or `ids` change

  return filteredArray;
};

export default useFilterByIds;
