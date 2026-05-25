"use client";

import { useEffect, useState } from "react";

export function useLiveMetrics<T>(
  fetchFn: () => Promise<T>,
  interval = 5000
) {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const result = await fetchFn();
        if (!mounted) return;
        setData(result);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err);
      }
    }

    void run();

    const id = setInterval(() => {
      void run();
    }, interval);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetchFn, interval]);

  return { data, lastUpdated, error };
}
