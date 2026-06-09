import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPeriodicJobs,
  addPeriodicJob,
  pausePeriodicJob,
  resumePeriodicJob,
} from '../api/periodic';
import { getQueues } from '../api/queues';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import type { PeriodicJob } from '../api/types';
import { AlertCircle, Pause, Play, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export const Periodic: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [cron, setCron] = useState('');
  const [kind, setKind] = useState('');
  const [queue, setQueue] = useState('');
  const [argsText, setArgsText] = useState('{}');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [argsError, setArgsError] = useState('');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['periodic'],
    queryFn: getPeriodicJobs,
    refetchInterval: 10000,
  });

  const { data: queues } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
  });

  const togglePauseMutation = useMutation({
    mutationFn: async ({ kind: jobKind, pause }: { kind: string; pause: boolean }) => {
      if (pause) return pausePeriodicJob(jobKind);
      return resumePeriodicJob(jobKind);
    },
    onMutate: async ({ kind: jobKind, pause }) => {
      await queryClient.cancelQueries({ queryKey: ['periodic'] });
      const previous = queryClient.getQueryData<PeriodicJob[]>(['periodic']);
      if (previous) {
        queryClient.setQueryData<PeriodicJob[]>(
          ['periodic'],
          previous.map((j) => (j.kind === jobKind ? { ...j, paused: pause } : j)),
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['periodic'], context.previous);
      }
      const action = variables.pause ? 'pause' : 'resume';
      showToast(getApiErrorMessage(err, `Failed to ${action} periodic job`), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['periodic'] });
    },
  });

  const addMutation = useMutation({
    mutationFn: addPeriodicJob,
    onSuccess: () => {
      showToast('Periodic schedule added', 'success');
      queryClient.invalidateQueries({ queryKey: ['periodic'] });
      setCron('');
      setKind('');
      setQueue('');
      setArgsText('{}');
      setMaxAttempts('');
      setFormOpen(false);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Failed to add schedule'), 'error');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cron.trim() || !kind.trim()) {
      showToast('Cron and kind are required', 'error');
      return;
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsText) as Record<string, unknown>;
      if (typeof args !== 'object' || args === null || Array.isArray(args)) {
        throw new Error('Args must be a JSON object');
      }
      setArgsError('');
    } catch {
      setArgsError('Invalid JSON — args must be a JSON object');
      return;
    }

    addMutation.mutate({
      cron: cron.trim(),
      kind: kind.trim(),
      queue: queue || undefined,
      args,
      max_attempts: maxAttempts ? Number(maxAttempts) : undefined,
    });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Periodic Jobs</h1>
          <p className="text-xs text-textMuted mt-0.5">Durable cron schedules that survive restarts</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(!formOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent uppercase rounded-[4px] tracking-wider transition-colors"
        >
          <Plus size={10} /> Add Schedule
          {formOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="border border-darkBorder bg-darkSurface/10 p-4 rounded-[4px] space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">
                Cron <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 9 * * *"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">
                Kind <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="daily_report"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Queue</label>
              <select value={queue} onChange={(e) => setQueue(e.target.value)} className="w-full">
                <option value="">Default</option>
                {queues?.map((q) => (
                  <option key={q.name} value={q.name}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Max Attempts</label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="default"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Args (JSON)</label>
            <textarea
              value={argsText}
              onChange={(e) => {
                setArgsText(e.target.value);
                setArgsError('');
              }}
              rows={3}
              className="w-full font-mono text-xs resize-y"
              spellCheck={false}
            />
            {argsError && <p className="text-danger text-[10px] mt-1">{argsError}</p>}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-3 py-1.5 text-xs font-bold border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent uppercase rounded-[4px] tracking-wider transition-colors disabled:opacity-40"
            >
              {addMutation.isPending ? 'Adding...' : 'Add Schedule'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading periodic jobs: {getApiErrorMessage(error)}</span>
        </div>
      )}

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold">Cron</th>
                <th className="px-4 py-3 font-semibold">Queue</th>
                <th className="px-4 py-3 font-semibold w-[80px]">Max Att.</th>
                <th className="px-4 py-3 font-semibold text-right">Next Run</th>
                <th className="px-4 py-3 font-semibold text-right">Last Run</th>
                <th className="px-4 py-3 font-semibold text-right w-[100px]">Status</th>
                <th className="px-4 py-3 font-semibold text-center w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching periodic schedules...
                  </td>
                </tr>
              ) : jobs?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-textMuted font-mono">
                    No periodic schedules registered.
                  </td>
                </tr>
              ) : (
                jobs?.map((job) => (
                  <tr
                    key={job.kind}
                    className={`border-b border-darkBorder hover:bg-[#161618] transition-colors duration-150 ${
                      job.paused ? 'opacity-50 border-l-2 border-l-[#f59e0b]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-textPrimary">{job.kind}</td>
                    <td className="px-4 py-3 text-textPrimary">{job.cron}</td>
                    <td className="px-4 py-3 text-textMuted">{job.queue || 'default'}</td>
                    <td className="px-4 py-3 text-textPrimary">{job.max_attempts}</td>
                    <td
                      className="px-4 py-3 text-right text-textMuted cursor-help"
                      title={formatDateTime(job.next_run_at)}
                    >
                      <RelativeTimeCell dateStr={job.next_run_at} />
                    </td>
                    <td
                      className="px-4 py-3 text-right text-textMuted cursor-help"
                      title={job.last_run_at ? formatDateTime(job.last_run_at) : undefined}
                    >
                      <RelativeTimeCell dateStr={job.last_run_at} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold ${
                          job.paused ? 'text-[#f59e0b]' : 'text-accent'
                        }`}
                      >
                        {job.paused ? '⏸ PAUSED' : '● ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          togglePauseMutation.mutate({ kind: job.kind, pause: !job.paused })
                        }
                        disabled={togglePauseMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border uppercase rounded-[4px] tracking-wider transition-colors duration-150 ${
                          job.paused
                            ? 'border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent'
                            : 'border-danger/40 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 text-danger'
                        }`}
                      >
                        {job.paused ? (
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

const RelativeTimeCell: React.FC<{ dateStr: string | null }> = ({ dateStr }) => {
  const relative = useRelativeTime(dateStr);
  return <>{dateStr ? relative : '—'}</>;
};
