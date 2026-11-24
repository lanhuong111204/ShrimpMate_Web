import React, { useState, useEffect } from 'react';

const formatCurrentTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

export const SystemClock = ({ className = 'font-mono-num' }) => {
  const [timeStr, setTimeStr] = useState(formatCurrentTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className={className}>{timeStr}</span>;
};

export default SystemClock;
