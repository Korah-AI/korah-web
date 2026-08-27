'use client';

import { useState, useEffect } from 'react';

const SAT_DATES = [
  new Date('2026-08-22'),
  new Date('2026-09-12'),
  new Date('2026-10-03'),
  new Date('2026-11-07'),
  new Date('2026-12-05'),
  new Date('2027-03-06'),
  new Date('2027-05-01'),
  new Date('2027-06-05'),
];

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateCountdown(targetDate: Date): Countdown {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

function CountdownCard({ date, index }: { date: Date; index: number }) {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    calculateCountdown(date)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(date));
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg p-6 transition-all ${
        countdown.isPast
          ? 'border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
          : 'border-2 border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950'
      }`}
    >
      <div className="text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
        Test {index + 1}
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {formattedDate}
      </div>

      {countdown.isPast ? (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Test Date Passed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {countdown.days}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Days
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {countdown.hours}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Hours
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {countdown.minutes}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Minutes
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {countdown.seconds}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CountdownGrid() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Upcoming SAT Dates
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Prepare for your test with these upcoming SAT dates
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SAT_DATES.map((date, index) => (
          <CountdownCard key={date.toISOString()} date={date} index={index} />
        ))}
      </div>
    </div>
  );
}
