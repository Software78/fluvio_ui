import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLiveStatsContext } from '../context/LiveStatsContext';
import { getJobs } from '../api/jobs';
import { getQueues } from '../api/queues';
import { getWorkers } from '../api/workers';
import { StatCard } from '../components/StatCard';
import { Sparkline } from '../components/Sparkline';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import type { QueueStats, WorkerInstance } from '../api/types';
import { AlertCircle } from 'lucide-react';

function getQueueCapacity(workers: WorkerInstance[] | undefined, queueName: string): number {
  if (!workers) return 0;
  return workers.reduce((sum, w) => sum + (w.queues[queueName] ?? 0), 0);
}

function formatUtilization(running: number, capacity: number): string {
  if (capacity === 0) return '—';
  return `${Math.round((running / capacity) * 100)}%`;
}

function truncateError(error: string, maxLen = 60): string {
  const firstLine = error.split('\n')[0];
  if (firstLine.length <= maxLen) return firstLine;
  return `${firstLine.slice(0, maxLen)}…`;
}

export const Dashboard: React.FC = () => {
  const { data: liveData, connected } = useLiveStatsContext();
  const [throughputHistory, setThroughputHistory] = useState<number[]>([]);
  const [errorRateHistory, setErrorRateHistory] = useState<number[]>([]);
  const navigate = useNavigate();

  const { data: fallbackQueues, isLoading: fallbackLoading } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    refetchInterval: connected ? false : 5000,
    enabled: !connected,
  });

  const { data: workers } = useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
    refetchInterval: 10000,
    retry: 1,
  });

  const { data: runningJobsData, isLoading: runningLoading } = useQuery({
    queryKey: ['jobs', 'dashboard', 'running'],
    queryFn: () => getJobs({ state: 'running', limit: 8 }),
    refetchInterval: 10000,
  });

  const { data: failedJobsData, isLoading: failedLoading } = useQuery({
    queryKey: ['jobs', 'dashboard', 'failed'],
    queryFn: () => getJobs({ state: 'failed', limit: 8 }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (liveData && connected) {
      setThroughputHistory((prev) => {
        const next = [...prev, liveData.throughput_per_min];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
      setErrorRateHistory((prev) => {
        const next = [...prev, liveData.error_rate_per_min];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
    }
  }, [liveData, connected]);

  const queues: QueueStats[] = useMemo(() => {
    if (connected && liveData) return liveData.queues;
    return fallbackQueues ?? [];
  }, [connected, liveData, fallbackQueues]);

  const metricsCalibrating = connected && throughputHistory.length < 2;
  const hasQueueData = queues.length > 0;

  const totalRunning = queues.reduce((sum, q) => sum + q.running, 0);
  const totalScheduled = queues.reduce((sum, q) => sum + q.scheduled, 0);
  const totalDead = queues.reduce((sum, q) => sum + q.dead, 0);
  const pausedQueueCount = queues.filter((q) => q.paused).length;

  const workersOnline = workers?.length ?? 0;
  const totalCapacity =
    workers?.reduce(
      (sum, worker) => sum + Object.values(worker.queues).reduce((a, b) => a + b, 0),
      0,
    ) ?? 0;

  const utilizationDisplay =
    totalCapacity === 0 ? '—' : `${Math.round((totalRunning / totalCapacity) * 100)}%`;

  const getErrorAlertState = () => {
    if (!connected || metricsCalibrating) return 'normal' as const;
    const rate = liveData?.error_rate_per_min ?? 0;
    if (rate > 10) return 'error' as const;
    if (rate > 0) return 'warning' as const;
    return 'normal' as const;
  };

  const throughputValue = metricsCalibrating ? 'calibrating…' : (liveData?.throughput_per_min ?? '—');
  const errorRateValue = metricsCalibrating ? 'calibrating…' : (liveData?.error_rate_per_min ?? '—');

  const runningJobs = runningJobsData?.jobs ?? [];
  const failedJobs = failedJobsData?.jobs ?? [];

  if (!hasQueueData && (connected ? !liveData : fallbackLoading)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono py-20">
        <div className="flex items-center gap-3 text-textMuted text-xs uppercase tracking-widest border border-darkBorder bg-darkSurface/30 px-4 py-3 rounded-[4px]">
          <span className="w-2 h-2 rounded-full bg-accent pulse-indicator" />
          {connected ? 'Establishing stream connection...' : 'Loading queue data...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Dashboard</h1>
          <p className="text-xs text-textMuted mt-0.5">Real-time telemetry and engine health</p>
        </div>
        {!connected && (
          <div className="flex items-center gap-2 text-xs text-danger font-bold border border-danger/20 bg-danger/5 px-3 py-1.5 rounded-[4px]">
            <AlertCircle size={14} className="pulse-indicator" />
            STREAM INTERRUPTED — USING REST FALLBACK
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Throughput / Min" value={throughputValue} />
        <StatCard
          title="Error Rate / Min"
          value={errorRateValue}
          alertState={getErrorAlertState()}
        />
        <StatCard title="Workers Online" value={workersOnline} loading={!workers} />
        <StatCard title="Worker Capacity" value={totalCapacity} loading={!workers} />
        <StatCard title="Utilization" value={utilizationDisplay} loading={!workers} />
        <button type="button" onClick={() => navigate('/dead')} className="text-left">
          <StatCard
            title="Dead Jobs"
            value={totalDead}
            alertState={totalDead > 0 ? 'warning' : 'normal'}
          />
        </button>
        <StatCard title="Scheduled" value={totalScheduled} />
        <StatCard
          title="Paused Queues"
          value={pausedQueueCount}
          alertState={pausedQueueCount > 0 ? 'warning' : 'normal'}
        />
      </div>

      {metricsCalibrating && (
        <p className="text-[10px] text-textMuted font-mono uppercase tracking-wider">
          Calibrating metrics — throughput and error rate update after the second live tick (~10s)
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Sparkline
          data={throughputHistory}
          label="Throughput (Last 20 ticks)"
          color="#22c55e"
          emptyMessage="Waiting for throughput data..."
        />
        <Sparkline
          data={errorRateHistory}
          label="Error Rate (Last 20 ticks)"
          color="#f59e0b"
          emptyMessage="Waiting for error rate data..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
          <div className="border-b border-darkBorder bg-[#0c0c0e] px-4 py-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider font-mono">
              Running Jobs
            </h2>
            <Link to="/jobs?state=running" className="text-[10px] text-accent hover:underline uppercase">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                  <th className="px-4 py-3 font-semibold w-[70px]">ID</th>
                  <th className="px-4 py-3 font-semibold">Kind</th>
                  <th className="px-4 py-3 font-semibold">Queue</th>
                  <th className="px-4 py-3 font-semibold w-[80px]">Attempt</th>
                  <th className="px-4 py-3 font-semibold text-right">Started</th>
                </tr>
              </thead>
              <tbody>
                {runningLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-textMuted">
                      <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                      Loading...
                    </td>
                  </tr>
                ) : runningJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-textMuted">
                      No running jobs
                    </td>
                  </tr>
                ) : (
                  runningJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-3 font-bold text-textPrimary">#{job.id}</td>
                      <td className="px-4 py-3 text-textPrimary max-w-[120px] truncate" title={job.kind}>
                        {job.kind}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/jobs?queue=${encodeURIComponent(job.queue)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-accent hover:underline"
                        >
                          {job.queue}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-textPrimary">
                        {job.attempt}/{job.max_attempts}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-textMuted cursor-help"
                        title={job.attempted_at ? formatDateTime(job.attempted_at) : undefined}
                      >
                        <RelativeTimeCell dateStr={job.attempted_at} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
          <div className="border-b border-darkBorder bg-[#0c0c0e] px-4 py-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider font-mono">
              Recent Failures
            </h2>
            <Link to="/jobs?state=failed" className="text-[10px] text-accent hover:underline uppercase">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                  <th className="px-4 py-3 font-semibold w-[70px]">ID</th>
                  <th className="px-4 py-3 font-semibold">Kind</th>
                  <th className="px-4 py-3 font-semibold">Queue</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {failedLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-textMuted">
                      <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                      Loading...
                    </td>
                  </tr>
                ) : failedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-textMuted">
                      No recent failures
                    </td>
                  </tr>
                ) : (
                  failedJobs.map((job) => {
                    const errorMsg = job.error_trace?.[0]?.error ?? '';
                    return (
                      <tr
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-4 py-3 font-bold text-textPrimary">#{job.id}</td>
                        <td className="px-4 py-3 text-textPrimary max-w-[100px] truncate" title={job.kind}>
                          {job.kind}
                        </td>
                        <td className="px-4 py-3 text-textMuted">{job.queue}</td>
                        <td
                          className="px-4 py-3 text-[#f59e0b] max-w-[160px] truncate"
                          title={errorMsg || undefined}
                        >
                          {errorMsg ? truncateError(errorMsg) : '—'}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-textMuted cursor-help"
                          title={job.finalized_at ? formatDateTime(job.finalized_at) : undefined}
                        >
                          <RelativeTimeCell dateStr={job.finalized_at} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="border-b border-darkBorder bg-[#0c0c0e] px-4 py-3">
          <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider font-mono">Queue Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Queue Name</th>
                <th className="px-4 py-3 font-semibold text-right">Pending</th>
                <th className="px-4 py-3 font-semibold text-right">Running</th>
                <th className="px-4 py-3 font-semibold text-right">Scheduled</th>
                <th className="px-4 py-3 font-semibold text-right">Completed</th>
                <th className="px-4 py-3 font-semibold text-right">Failed</th>
                <th className="px-4 py-3 font-semibold text-right">Cancelled</th>
                <th className="px-4 py-3 font-semibold text-right">Dead</th>
                <th className="px-4 py-3 font-semibold text-right">Utilization</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => {
                const capacity = getQueueCapacity(workers, queue.name);
                const utilization = formatUtilization(queue.running, capacity);
                const hasIssue = queue.dead > 0 || queue.paused;

                return (
                  <tr
                    key={queue.name}
                    onClick={() => navigate(`/jobs?queue=${encodeURIComponent(queue.name)}`)}
                    className={`border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150 ${
                      queue.paused ? 'opacity-75 border-l-2 border-l-[#f59e0b]' : ''
                    } ${queue.dead > 0 && !queue.paused ? 'border-l-2 border-l-[#f59e0b]/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-bold text-textPrimary">{queue.name}</td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.pending}</td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.running}</td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.scheduled}</td>
                    <td className="px-4 py-3 text-right text-textMuted">{queue.completed}</td>
                    <td className={`px-4 py-3 text-right ${queue.failed > 0 ? 'text-[#f59e0b]' : 'text-textMuted'}`}>
                      {queue.failed}
                    </td>
                    <td className="px-4 py-3 text-right text-textMuted">{queue.cancelled}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${queue.dead > 0 ? 'text-[#f59e0b]' : 'text-textPrimary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs?state=dead&queue=${encodeURIComponent(queue.name)}`);
                      }}
                    >
                      {queue.dead}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-textMuted"
                      title={capacity > 0 ? `${queue.running} / ${capacity} slots` : undefined}
                    >
                      {utilization}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold ${
                          hasIssue ? 'text-[#f59e0b]' : 'text-accent'
                        }`}
                      >
                        {queue.paused ? '⏸ PAUSED' : queue.dead > 0 ? '⚠ DEAD' : '● ACTIVE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RelativeTimeCell: React.FC<{ dateStr: string | null }> = ({ dateStr }) => {
  const formatted = useRelativeTime(dateStr);
  if (!dateStr) return <span>—</span>;
  return <span>{formatted}</span>;
};
