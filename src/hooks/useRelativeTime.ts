import { useEffect, useState } from 'react';
import { formatRelativeTime } from '../lib/time';

/**
 * A hook that returns a periodically updated relative time string.
 * This ensures that timestamps like "just now" or "2m ago" update in real-time
 * without manual page refreshes.
 */
export function useRelativeTime(
  dateStr: string | null | undefined,
  intervalMs: number = 10000
): string {
  const [formatted, setFormatted] = useState(() => formatRelativeTime(dateStr));

  useEffect(() => {
    setFormatted(formatRelativeTime(dateStr));
    
    if (!dateStr) return;
    
    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(dateStr));
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [dateStr, intervalMs]);

  return formatted;
}
