import { useState, useEffect, useRef } from 'react';

export const usePollTimer = (initialTime: number) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(initialTime <= 0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Update when server sends new time
    setTimeRemaining(initialTime);
    setIsExpired(initialTime <= 0);
  }, [initialTime]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    // Countdown locally
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRemaining]);

  return { timeRemaining, isExpired };
};