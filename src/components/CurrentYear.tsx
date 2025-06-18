
"use client";

import { useState, useEffect, type ReactNode } from 'react';

const CurrentYear = (): ReactNode => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // Return null or a placeholder until the year is determined on the client.
  // This ensures the initial client render matches the server render if the server
  // also doesn't render the year or renders a placeholder.
  // If the server *does* render the year, this client component will update it post-hydration.
  if (year === null) {
    return null; // Or return a static placeholder like '...' or new Date().getFullYear().toString() if you want server to render it too.
                 // For this specific case, returning null initially on client is fine, and then it populates.
  }

  return <>{year}</>;
};

export default CurrentYear;
