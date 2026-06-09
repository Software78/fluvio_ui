import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE } from '../api/jobs';
import { getDeadJobs, replayDeadJob, replayDeadJobs, purgeDeadJobs } from '../api/dead';
import { getApiErrorMessage } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import { AlertCircle, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const DeadLetter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_JOBS_PAGE_SIZE), 10);
  const limit = PAGE_SIZE_OPTIONS.includes(limitParam) ? limitParam : DEFAULT_JOBS_PAGE_SIZE;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeBefore, setPurgeBefore] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dead', limit, offset],
    queryFn: () => getDeadJobs({ limit, offset }),
    refetchInterval: 10000,
  });

  const jobs = data?.jobs ?? [];
  const hasMore = data?.has_more ?? false;
  const currentPage = Math.floor(offset / limit) + 1;

  const invalidateDead = () => {
    queryClient.invalidateQueries({ queryKey: ['dead'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['queues'] });
  };

  const replayOneMutation = useMutation({
    mutationFn: replayDeadJob,
    onSuccess: () => {
      showToast('Job replayed', 'success');
      invalidateDead();
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Failed to replay job'), 'error'),
  });

  const bulkReplayMutation = useMutation({
    mutationFn: replayDeadJobs,
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        showToast(`Replayed ${result.replayed}, ${result.errors.length} failed`, 'error');
      } else {
        showToast(`Replayed ${result.replayed} job(s)`, 'success');
      }
      setSelected(new Set());
      setBulkConfirmOpen(false);
      invalidateDead();
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Bulk replay failed'), 'error');
      setBulkConfirmOpen(false);
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (before: string) => purgeDeadJobs(before),
    onSuccess: (result) => {
      showToast(`Purged ${result.purged} dead job(s)`, 'success');
      setPurgeOpen(false);
      setPurgeBefore('');
      invalidateDead();
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Purge failed'), 'error');
    },
  });

  const handlePageChange = (direction: 'next' | 'prev') => {
    const nextParams = new URLSearchParams(searchParams);
    const newOffset = direction === 'next' ? offset + limit : Math.max(0, offset - limit);
    nextParams.set('offset', newOffset.toString());
    nextParams.set('limit', limit.toString());
    setSearchParams(nextParams);
  };

  const handlePageSizeChange = (nextLimit: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('limit', Math.min(nextLimit, MAX_JOBS_PAGE_SIZE).toString());
    nextParams.set('offset', '0');
    setSearchParams(nextParams);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((j) => j.id)));
    }
  };

  const handlePurge = () => {
    if (!purgeBefore) {
      showToast('Select a date before which to purge', 'error');
      return;
    }
    purgeMutation.mutate(new Date(purgeBefore).toISOString());
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Dead Letter Queue</h1>
          <p className="text-xs text-textMuted mt-0.5">Inspect, replay, or purge exhausted jobs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/jobs"
            className="px-2.5 py-1 text-[10px] font-bold border border-darkBorder text-textMuted hover:text-textPrimary uppercase rounded-[4px] tracking-wider transition-colors"
          >
            All Jobs
          </Link>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setBulkConfirmOpen(true)}
              disabled={bulkReplayMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-[#f59e0b]/40 bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 text-[#f59e0b] uppercase rounded-[4px] tracking-wider transition-colors disabled:opacity-40"
            >
              <RotateCcw size={10} /> Replay Selected ({selected.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => setPurgeOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-danger/40 bg-danger/5 hover:bg-danger/10 text-danger uppercase rounded-[4px] tracking-wider transition-colors"
          >
            <Trash2 size={10} /> Purge
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading dead jobs: {getApiErrorMessage(error)}</span>
        </div>
      )}

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold w-[40px]">
                  <input
                    type="checkbox"
                    checked={jobs.length > 0 && selected.size === jobs.length}
                    onChange={toggleSelectAll}
                    className="accent-accent"
                  />
                </th>
                <th className="px-4 py-3 font-semibold w-[90px]">ID</th>
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold">Queue</th>
                <th className="px-4 py-3 font-semibold text-right">Died At</th>
                <th className="px-4 py-3 font-semibold w-[100px]">Attempt</th>
                <th className="px-4 py-3 font-semibold text-center w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching dead letter queue...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-textMuted font-mono">
                    No dead jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="accent-accent"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-textPrimary">#{job.id}</td>
                    <td className="px-4 py-3 text-textPrimary max-w-[200px] truncate" title={job.kind}>
                      {job.kind}
                    </td>
                    <td className="px-4 py-3 text-textMuted">{job.queue}</td>
                    <td
                      className="px-4 py-3 text-right text-[#f59e0b] cursor-help"
                      title={job.died_at ? formatDateTime(job.died_at) : undefined}
                    >
                      <RelativeTimeCell dateStr={job.died_at} />
                    </td>
                    <td className="px-4 py-3 text-textPrimary">
                      {job.attempt}/{job.max_attempts}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => replayOneMutation.mutate(job.id)}
                        disabled={replayOneMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold border border-[#f59e0b]/40 bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 text-[#f59e0b] uppercase rounded-[4px] transition-colors disabled:opacity-40"
                      >
                        <RotateCcw size={10} /> Replay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-darkBorder bg-[#0c0c0e] px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange('prev')}
              disabled={offset === 0 || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 border border-darkBorder rounded-[4px] hover:border-textMuted disabled:opacity-40 text-textPrimary transition-all"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => handlePageChange('next')}
              disabled={!hasMore || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 border border-darkBorder rounded-[4px] hover:border-textMuted disabled:opacity-40 text-textPrimary transition-all"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
          <div className="text-textMuted text-center">
            Page <span className="text-textPrimary font-bold">{currentPage}</span>
            {jobs.length > 0 && (
              <span className="hidden md:inline">
                {' '}
                · showing {offset + 1}–{offset + jobs.length}
              </span>
            )}
            {hasMore && <span className="text-accent"> · more available</span>}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="dead-page-size" className="text-textMuted uppercase text-[10px] font-bold">
              Per page
            </label>
            <select
              id="dead-page-size"
              value={limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={isLoading}
              className="min-w-[72px]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={bulkConfirmOpen}
        title="Bulk Replay"
        message={`Replay ${selected.size} selected dead job(s)? Each will be re-enqueued as pending.`}
        confirmLabel="Replay All"
        loading={bulkReplayMutation.isPending}
        onConfirm={() => bulkReplayMutation.mutate([...selected])}
        onCancel={() => setBulkConfirmOpen(false)}
      />

      <ConfirmModal
        open={purgeOpen}
        title="Purge Dead Jobs"
        message="Permanently delete all dead jobs that died before the selected date. This cannot be undone."
        confirmLabel="Purge"
        variant="danger"
        loading={purgeMutation.isPending}
        onConfirm={handlePurge}
        onCancel={() => {
          setPurgeOpen(false);
          setPurgeBefore('');
        }}
      >
        <div>
          <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">
            Purge jobs died before
          </label>
          <input
            type="datetime-local"
            value={purgeBefore}
            onChange={(e) => setPurgeBefore(e.target.value)}
            className="w-full"
          />
        </div>
      </ConfirmModal>
    </div>
  );
};

const RelativeTimeCell: React.FC<{ dateStr: string | null }> = ({ dateStr }) => {
  const relative = useRelativeTime(dateStr);
  return <>{dateStr ? relative : '—'}</>;
};
