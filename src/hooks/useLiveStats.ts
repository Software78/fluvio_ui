import { useEffect, useRef, useState } from 'react';
import { parseStatsEvent } from '../api/transforms';
import type { LiveStats } from '../api/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const SSE_URL = `${BASE_URL}/fluvio/api/events`;

/**
 * Custom hook to connect to the Server-Sent Events stream at /fluvio/api/events.
 * Reconnects automatically with a 3-second delay on failure.
 * Exposes connected status and latest LiveStats.
 */
export function useLiveStats() {
  const [data, setData] = useState<LiveStats | null>(null);
  const [connected, setConnected] = useState(false);
  const dataRef = useRef<LiveStats | null>(null);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(SSE_URL);

        eventSource.onopen = () => {
          if (active) {
            setConnected(true);
          }
        };

        const handleStats = (event: MessageEvent) => {
          if (!active) return;
          try {
            const stats = parseStatsEvent(event.data);
            dataRef.current = stats;
            setData(stats);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        };

        eventSource.addEventListener('stats', handleStats);
        eventSource.onmessage = handleStats;

        eventSource.onerror = () => {
          if (!active) return;
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimer = window.setTimeout(() => {
            if (active) connect();
          }, 3000);
        };
      } catch (err) {
        console.error('Failed to instantiate EventSource:', err);
        setConnected(false);
        reconnectTimer = window.setTimeout(() => {
          if (active) connect();
        }, 3000);
      }
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return { data, connected, dataRef };
}
