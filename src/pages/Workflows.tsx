import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE } from '../api/jobs';
import { getWorkflows } from '../api/workflows';
import { getApiErrorMessage } from '../api/client';
import { WorkflowStateBadge } from '../components/WorkflowStateBadge';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const Workflows: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_JOBS_PAGE_SIZE), 10);
  const limit = PAGE_SIZE_OPTIONS.includes(limitParam) ? limitParam : DEFAULT_JOBS_PAGE_SIZE;

  const { data, isLoading, error } = useQuery({
    queryKey: ['workflows', limit, offset],
    queryFn: () => getWorkflows({ limit, offset }),
    refetchInterval: 10000,
  });

  const workflows = data?.workflows ?? [];
  const hasMore = data?.has_more ?? false;
  const currentPage = Math.floor(offset / limit) + 1;

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

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="border-b border-darkBorder pb-4">
        <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Workflows</h1>
        <p className="text-xs text-textMuted mt-0.5">DAG job chains with dependency tracking</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading workflows: {getApiErrorMessage(error)}</span>
        </div>
      )}

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold w-[120px]">State</th>
                <th className="px-4 py-3 font-semibold w-[80px] text-right">Tasks</th>
                <th className="px-4 py-3 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching workflows...
                  </td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-textMuted font-mono">
                    No workflows found.
                  </td>
                </tr>
              ) : (
                workflows.map((wf) => (
                  <tr
                    key={wf.id}
                    onClick={() => navigate(`/workflows/${wf.id}`)}
                    className="border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-bold text-textPrimary truncate max-w-[280px]" title={wf.id}>
                      {wf.id}
                    </td>
                    <td className="px-4 py-3">
                      <WorkflowStateBadge state={wf.state} />
                    </td>
                    <td className="px-4 py-3 text-right text-textPrimary">{wf.tasks.length}</td>
                    <td
                      className="px-4 py-3 text-right text-textMuted cursor-help"
                      title={formatDateTime(wf.created_at)}
                    >
                      <RelativeTimeCell dateStr={wf.created_at} />
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
            {workflows.length > 0 && (
              <span className="hidden md:inline">
                {' '}
                · showing {offset + 1}–{offset + workflows.length}
              </span>
            )}
            {hasMore && <span className="text-accent"> · more available</span>}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="workflows-page-size" className="text-textMuted uppercase text-[10px] font-bold">
              Per page
            </label>
            <select
              id="workflows-page-size"
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
    </div>
  );
};

const RelativeTimeCell: React.FC<{ dateStr: string }> = ({ dateStr }) => {
  const relative = useRelativeTime(dateStr);
  return <>{relative}</>;
};
