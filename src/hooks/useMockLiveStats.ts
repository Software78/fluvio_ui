import { useEffect, useRef, useState } from 'react';
import { transformQueues } from '../api/transforms';
import type { LiveStats } from '../api/types';
import { getLiveStatsSnapshot } from '../mock/store';

const TICK_INTERVAL_MS = 5000;

/**
 * Simulates the SSE live stats stream using in-memory mock store data.
 */
export function useMockLiveStats() {
  const [data, setData] = useState<LiveStats | null>(null);
  const dataRef = useRef<LiveStats | null>(null);
  const snapshotRef = useRef<{ completed: number; failed: number } | undefined>(undefined);

  useEffect(() => {
    const tick = () => {
      const snapshot = getLiveStatsSnapshot();
      const queues = transformQueues(snapshot.queues);

      let throughput_per_min = 0;
      let error_rate_per_min = 0;

      if (snapshotRef.current) {
        const completedDelta = Math.max(0, snapshot.completed - snapshotRef.current.completed);
        const failedDelta = Math.max(0, snapshot.failed - snapshotRef.current.failed);
        const scale = 60 / (TICK_INTERVAL_MS / 1000);
        throughput_per_min = Math.round(completedDelta * scale);
        error_rate_per_min = Math.round(failedDelta * scale);
      }

      // Small random drift so sparklines move even when counts are stable
      throughput_per_min += Math.floor(Math.random() * 8);
      error_rate_per_min += Math.floor(Math.random() * 3);

      snapshotRef.current = {
        completed: snapshot.completed,
        failed: snapshot.failed,
      };

      const stats: LiveStats = {
        queues,
        throughput_per_min,
        error_rate_per_min,
        workers_online: snapshot.workers_online,
      };

      dataRef.current = stats;
      setData(stats);
    };

    tick();
    const interval = window.setInterval(tick, TICK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return { data, connected: true, dataRef };
}
