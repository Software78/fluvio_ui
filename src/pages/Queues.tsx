import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueues, pauseQueue, resumeQueue, getQueueDetail } from '../api/queues';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Drawer } from '../components/Drawer';
import type { QueueStats } from '../api/types';
import { AlertCircle, Pause, Play } from 'lucide-react';

export const Queues: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const { data: queues, isLoading, error } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    refetchInterval: 5000,
  });

  const { data: queueDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['queue', selectedQueue],
    queryFn: () => getQueueDetail(selectedQueue!),
    enabled: !!selectedQueue,
  });

  const togglePauseMutation = useMutation({
    mutationFn: async ({ name, pause }: { name: string; pause: boolean }) => {
      if (pause) {
        return pauseQueue(name);
      }
      return resumeQueue(name);
    },
    onMutate: async ({ name, pause }) => {
      await queryClient.cancelQueries({ queryKey: ['queues'] });

      const previousQueues = queryClient.getQueryData<QueueStats[]>(['queues']);

      if (previousQueues) {
        queryClient.setQueryData<QueueStats[]>(
          ['queues'],
          previousQueues.map((q) => (q.name === name ? { ...q, paused: pause } : q)),
        );
      }

      return { previousQueues };
    },
    onError: (err: unknown, variables, context) => {
      if (context?.previousQueues) {
        queryClient.setQueryData(['queues'], context.previousQueues);
      }

      const action = variables.pause ? 'pause' : 'resume';
      showToast(
        getApiErrorMessage(err, `Failed to ${action} queue: ${variables.name}`),
        'error',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      if (selectedQueue) {
        queryClient.invalidateQueries({ queryKey: ['queue', selectedQueue] });
      }
    },
  });

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Queues Controller</h1>
          <p className="text-xs text-textMuted mt-0.5 font-mono">Control ingestion rates and pause message queues</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading queues: {getApiErrorMessage(error)}</span>
        </div>
      )}

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
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Cancelled</th>
                <th className="px-4 py-3 font-semibold text-right w-[110px]">Dead</th>
                <th className="px-4 py-3 font-semibold text-right w-[120px]">Status</th>
                <th className="px-4 py-3 font-semibold text-center w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching queues telemetry...
                  </td>
                </tr>
              ) : queues?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-textMuted font-mono">
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedQueue(queue.name)}
                        className="font-bold text-textPrimary hover:text-accent transition-colors text-left"
                      >
                        {queue.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.pending}</td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.running}</td>
                    <td className="px-4 py-3 text-right text-textPrimary">{queue.scheduled}</td>
                    <td className="px-4 py-3 text-right text-textMuted">{queue.completed}</td>
                    <td className={`px-4 py-3 text-right ${queue.failed > 0 ? 'text-[#f59e0b]' : 'text-textMuted'}`}>
                      {queue.failed}
                    </td>
                    <td className="px-4 py-3 text-right text-textMuted">{queue.cancelled}</td>
                    <td className="px-4 py-3 text-right">
                      {queue.dead > 0 ? (
                        <Link
                          to="/dead"
                          className="text-[#f59e0b] hover:underline font-bold"
                          title="View dead letter queue"
                        >
                          {queue.dead}
                        </Link>
                      ) : (
                        <span className="text-textMuted">{queue.dead}</span>
                      )}
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

      <Drawer
        open={!!selectedQueue}
        title={selectedQueue ? `Queue: ${selectedQueue}` : ''}
        onClose={() => setSelectedQueue(null)}
      >
        {detailLoading ? (
          <div className="flex items-center gap-2 text-textMuted text-xs">
            <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Loading queue detail...
          </div>
        ) : queueDetail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold ${
                  queueDetail.paused ? 'text-[#f59e0b]' : 'text-accent'
                }`}
              >
                {queueDetail.paused ? '⏸ PAUSED' : '● ACTIVE'}
              </span>
              <button
                type="button"
                onClick={() =>
                  togglePauseMutation.mutate({
                    name: queueDetail.name,
                    pause: !queueDetail.paused,
                  })
                }
                disabled={togglePauseMutation.isPending}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border uppercase rounded-[4px] tracking-wider transition-colors ${
                  queueDetail.paused
                    ? 'border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent'
                    : 'border-danger/40 bg-danger/5 hover:bg-danger/10 text-danger'
                }`}
              >
                {queueDetail.paused ? (
                  <>
                    <Play size={10} /> Resume
                  </>
                ) : (
                  <>
                    <Pause size={10} /> Pause
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['Pending', queueDetail.pending],
                  ['Running', queueDetail.running],
                  ['Scheduled', queueDetail.scheduled],
                  ['Completed', queueDetail.completed],
                  ['Failed', queueDetail.failed],
                  ['Cancelled', queueDetail.cancelled],
                  ['Dead', queueDetail.dead],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="border border-darkBorder bg-darkSurface/10 p-3 rounded-[4px]">
                  <div className="text-[10px] text-textMuted uppercase mb-1">{label}</div>
                  <div
                    className={`text-sm font-bold ${
                      label === 'Dead' && value > 0
                        ? 'text-[#f59e0b]'
                        : label === 'Failed' && value > 0
                          ? 'text-[#f59e0b]'
                          : 'text-textPrimary'
                    }`}
                  >
                    {label === 'Dead' && value > 0 ? (
                      <Link to="/dead" className="hover:underline">
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-darkBorder bg-darkSurface/10 p-3 rounded-[4px] space-y-2">
              <div className="text-[10px] text-textMuted uppercase font-bold">Worker Capacity</div>
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">Instances</span>
                <span className="text-textPrimary font-bold">{queueDetail.worker_instances}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">Max Concurrent</span>
                <span className="text-accent font-bold">{queueDetail.worker_capacity}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-textMuted text-xs">Unable to load queue detail.</p>
        )}
      </Drawer>
    </div>
  );
};
