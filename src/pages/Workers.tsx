import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkers } from '../api/workers';
import { getApiErrorMessage } from '../api/client';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import { AlertCircle, Server } from 'lucide-react';

export const Workers: React.FC = () => {
  const { data: workers, isLoading, error } = useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
    refetchInterval: 10000,
    retry: 1,
  });

  const totalCapacity = workers?.reduce(
    (sum, worker) => sum + Object.values(worker.queues).reduce((a, b) => a + b, 0),
    0,
  ) ?? 0;

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Worker Fleet</h1>
          <p className="text-xs text-textMuted mt-0.5 font-mono">
            Live processing clients registered in the fleet registry
          </p>
        </div>
        {!isLoading && workers && (
          <div className="text-xs font-mono text-textMuted">
            <span className="text-textPrimary font-bold">{workers.length}</span> online ·{' '}
            <span className="text-textPrimary font-bold">{totalCapacity}</span> total capacity
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading workers: {getApiErrorMessage(error)}</span>
        </div>
      )}

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Worker ID</th>
                <th className="px-4 py-3 font-semibold">Queues</th>
                <th className="px-4 py-3 font-semibold text-right">Started</th>
                <th className="px-4 py-3 font-semibold text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching worker fleet...
                  </td>
                </tr>
              ) : workers?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-textMuted font-mono">
                    <Server size={16} className="inline mr-2 opacity-50" />
                    No live workers registered.
                  </td>
                </tr>
              ) : (
                workers?.map((worker) => (
                  <tr
                    key={worker.id}
                    className="border-b border-darkBorder hover:bg-[#161618] transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-bold text-textPrimary">{worker.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(worker.queues).map(([queue, capacity]) => (
                          <span
                            key={queue}
                            className="px-2 py-0.5 bg-darkSurface border border-darkBorder text-textPrimary rounded-[4px] text-[10px]"
                          >
                            {queue}: {capacity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-textMuted cursor-help"
                      title={formatDateTime(worker.started_at)}
                    >
                      <RelativeTimeCell dateStr={worker.started_at} />
                    </td>
                    <td
                      className="px-4 py-3 text-right text-accent cursor-help"
                      title={formatDateTime(worker.last_seen)}
                    >
                      <RelativeTimeCell dateStr={worker.last_seen} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RelativeTimeCell: React.FC<{ dateStr: string }> = ({ dateStr }) => {
  const relative = useRelativeTime(dateStr);
  return <>{relative}</>;
};
