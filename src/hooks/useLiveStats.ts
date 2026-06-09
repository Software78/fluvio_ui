import { useEffect, useRef, useState } from 'react';
import { getApiPrefix } from '../config';
import { parseStatsEvent, type StatsSnapshot } from '../api/transforms';
import type { LiveStats } from '../api/types';
const SSE_INTERVAL_SECONDS = 5;

/**
 * Custom hook to connect to the Server-Sent Events stream at /fluvio/api/events.
 * Reconnects automatically with a 3-second delay on failure.
 * Exposes connected status and latest LiveStats.
 */
export function useLiveStats() {
  const [data, setData] = useState<LiveStats | null>(null);
  const [connected, setConnected] = useState(false);
  const dataRef = useRef<LiveStats | null>(null);
  const snapshotRef = useRef<StatsSnapshot | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`${getApiPrefix()}/events`);

        eventSource.onopen = () => {
          if (active) {
            setConnected(true);
          }
        };

        const handleStats = (event: MessageEvent) => {
          if (!active) return;
          try {
            const stats = parseStatsEvent(
              event.data,
              snapshotRef.current,
              SSE_INTERVAL_SECONDS,
            );
            snapshotRef.current = {
              completed: stats.queues.reduce((sum, q) => sum + q.completed, 0),
              failed: stats.queues.reduce((sum, q) => sum + q.failed, 0),
            };
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
