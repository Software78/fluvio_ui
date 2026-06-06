import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueues, pauseQueue, resumeQueue } from '../api/queues';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import type { QueueStats } from '../api/types';
import { AlertCircle, Pause, Play } from 'lucide-react';

export const Queues: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Fetch queues state with 5s polling
  const { data: queues, isLoading, error } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  // 2. Pause/Resume Mutation with Optimistic UI updates
  const togglePauseMutation = useMutation({
    mutationFn: async ({ name, pause }: { name: string; pause: boolean }) => {
      if (pause) {
        return pauseQueue(name);
      } else {
        return resumeQueue(name);
      }
    },
    onMutate: async ({ name, pause }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['queues'] });

      // Snapshot the previous queues value
      const previousQueues = queryClient.getQueryData<QueueStats[]>(['queues']);

      // Optimistically update local caches
      if (previousQueues) {
        queryClient.setQueryData<QueueStats[]>(
          ['queues'],
          previousQueues.map((q) => (q.name === name ? { ...q, paused: pause } : q))
        );
      }

      // Return context containing previous value
      return { previousQueues };
    },
    onError: (err: any, variables, context) => {
      // Roll back to prior state on failure
      if (context?.previousQueues) {
        queryClient.setQueryData(['queues'], context.previousQueues);
      }
      
      const action = variables.pause ? 'pause' : 'resume';
      showToast(
        getApiErrorMessage(err, `Failed to ${action} queue: ${variables.name}`),
        'error'
      );
    },
    onSettled: () => {
      // Invalidate queries to fetch truth from server
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    }
  });

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Queues Controller</h1>
          <p className="text-xs text-textMuted mt-0.5 font-mono">Control ingestion rates and pause message queues</p>
        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading queues: {getApiErrorMessage(error)}</span>
        </div>
      )}

      {/* Queues Table */}
      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Queue Name</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Pending</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Running</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Scheduled</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Completed</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Failed</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Dead</th>
                <th className="px-4 py-3 font-semibold text-right w-[120px]">Status</th>
                <th className="px-4 py-3 font-semibold text-center w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching queues telemetry...
                  </td>
                </tr>
              ) : queues?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-textMuted font-mono">
                    No active queues registered.
                  </td>
                </tr>
              ) : (
                queues?.map((queue) => (
                  <tr
                    key={queue.name}
                    className={`border-b border-darkBorder hover:bg-[#161618] transition-colors duration-150 ${
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

                    {/* Dead column highlights links if > 0 */}
                    <td className="px-4 py-3 text-right">
                      {queue.dead > 0 ? (
                        <Link
                          to={`/jobs?queue=${queue.name}&state=dead`}
                          className="text-[#f59e0b] hover:underline font-bold"
                          title="View dead jobs for this queue"
                        >
                          {queue.dead}
                        </Link>
                      ) : (
                        <span className="text-textMuted">{queue.dead}</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold ${
                        queue.paused ? 'text-[#f59e0b]' : 'text-accent'
                      }`}>
                        {queue.paused ? '⏸ PAUSED' : '● ACTIVE'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePauseMutation.mutate({ name: queue.name, pause: !queue.paused })}
                        disabled={togglePauseMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border uppercase rounded-[4px] tracking-wider transition-colors duration-150 ${
                          queue.paused
                            ? 'border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent'
                            : 'border-danger/40 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 text-danger'
                        }`}
                      >
                        {queue.paused ? (
                          <>
                            <Play size={10} /> Resume
                          </>
                        ) : (
                          <>
                            <Pause size={10} /> Pause
                          </>
                        )}
                      </button>
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
