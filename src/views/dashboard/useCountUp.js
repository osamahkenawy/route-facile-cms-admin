// hooks/useCountUp.js
import { useEffect, useState } from "react";

const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 10);
    const interval = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(interval);
      }
      setCount(Math.floor(start));
    }, 10);

    return () => clearInterval(interval);
  }, [end, duration]);

  return count;
};

export default useCountUp;
