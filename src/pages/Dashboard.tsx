import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStatsContext } from '../context/LiveStatsContext';
import { StatCard } from '../components/StatCard';
import { Sparkline } from '../components/Sparkline';
import { AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data, connected } = useLiveStatsContext();
  const [throughputHistory, setThroughputHistory] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      setThroughputHistory((prev) => {
        const next = [...prev, data.throughput_per_min];
        if (next.length > 20) {
          return next.slice(next.length - 20);
        }
        return next;
      });
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono py-20">
        <div className="flex items-center gap-3 text-textMuted text-xs uppercase tracking-widest border border-darkBorder bg-darkSurface/30 px-4 py-3 rounded-[4px]">
          <span className="w-2 h-2 rounded-full bg-accent pulse-indicator" />
          Establishing stream connection...
        </div>
      </div>
    );
  }

  const totalPending = data.queues.reduce((sum, q) => sum + q.pending, 0);
  const totalRunning = data.queues.reduce((sum, q) => sum + q.running, 0);
  const totalCompleted = data.queues.reduce((sum, q) => sum + q.completed, 0);
  const totalFailed = data.queues.reduce((sum, q) => sum + q.failed, 0);

  const getErrorAlertState = () => {
    if (data.error_rate_per_min > 10) return 'error';
    if (data.error_rate_per_min > 0) return 'warning';
    return 'normal';
  };

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
            STREAM INTERRUPTED — RECONNECTING
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Throughput / Min" value={data.throughput_per_min} />
        <StatCard title="Error Rate / Min" value={data.error_rate_per_min} alertState={getErrorAlertState()} />
        <StatCard title="Total Pending" value={totalPending} />
        <StatCard title="Running Jobs" value={totalRunning} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Completed (total)" value={totalCompleted} />
        <StatCard title="Failed (total)" value={totalFailed} alertState={totalFailed > 0 ? 'warning' : 'normal'} />
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
                <th className="px-4 py-3 font-semibold text-right">Dead</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.queues.map((queue) => (
                <tr
                  key={queue.name}
                  onClick={() => navigate('/queues')}
                  className={`border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150 ${
                    queue.paused ? 'opacity-50 border-l-2 border-l-[#f59e0b]' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-textPrimary">{queue.name}</td>
                  <td className="px-4 py-3 text-right text-textPrimary">{queue.pending}</td>
                  <td className="px-4 py-3 text-right text-textPrimary">{queue.running}</td>
                  <td className="px-4 py-3 text-right text-textPrimary">{queue.scheduled}</td>
                  <td className="px-4 py-3 text-right text-textMuted">{queue.completed}</td>
                  <td className={`px-4 py-3 text-right ${queue.failed > 0 ? 'text-[#f59e0b]' : 'text-textMuted'}`}>
                    {queue.failed}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${queue.dead > 0 ? 'text-[#f59e0b]' : 'text-textPrimary'}`}>
                    {queue.dead}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold ${
                        queue.paused ? 'text-[#f59e0b]' : 'text-accent'
                      }`}
                    >
                      {queue.paused ? '⏸ PAUSED' : '● ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sparkline data={throughputHistory} />
    </div>
  );
};
