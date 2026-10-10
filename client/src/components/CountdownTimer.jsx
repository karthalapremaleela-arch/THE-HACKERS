import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const difference = new Date(targetDate).getTime() - Date.now();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Required by time passed');
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`inline-flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded-md ${
      isExpired
        ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-amber-50 text-amber-800 border border-amber-200'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}
