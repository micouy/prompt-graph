import { useEffect, useState, useRef } from "react";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const overrideDebouncedValue = (value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setDebouncedValue(value);
  };

  return { debouncedValue, overrideDebouncedValue };
};

export default useDebounce;
