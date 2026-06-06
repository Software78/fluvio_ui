import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_JOBS_PAGE_SIZE, getJobs } from '../api/jobs';
import { getQueues } from '../api/queues';
import { JobStateBadge } from '../components/JobStateBadge';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { formatDateTime } from '../lib/time';
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { JobState } from '../api/types';

// Hardcoded state enum values
const JOB_STATES: JobState[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'dead',
  'scheduled',
  'cancelled'
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const Jobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Local state for client-side search input to prevent API calls on typing
  const [kindInput, setKindInput] = useState('');

  // Extract pagination and filters from URL Search Params
  const queueFilter = searchParams.get('queue') || '';
  const stateFilter = searchParams.get('state') || '';
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_JOBS_PAGE_SIZE), 10);
  const limit = PAGE_SIZE_OPTIONS.includes(limitParam) ? limitParam : DEFAULT_JOBS_PAGE_SIZE;

  // 1. Fetch available queues for filter dropdown
  const { data: queues } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    refetchInterval: 10000 // refresh queue names list occasionally
  });

  // 2. Fetch jobs based on URL filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', queueFilter, stateFilter, limit, offset],
    queryFn: () => getJobs({
      queue: queueFilter || undefined,
      state: (stateFilter as JobState) || undefined,
      limit,
      offset,
    }),
    refetchInterval: 10000 // automatically refetch every 10s
  });

  // Client-side filtering of the returned jobs page by 'kind'
  const jobs = data?.jobs || [];
  const filteredJobs = kindInput.trim() 
    ? jobs.filter(job => job.kind.toLowerCase().includes(kindInput.toLowerCase()))
    : jobs;

  const totalJobs = data?.total || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalJobs / limit) || 1;

  // Update filters in URL search params (resets offset to 0)
  const handleFilterChange = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('offset', '0');
    nextParams.set('limit', limit.toString());
    setSearchParams(nextParams);
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    const nextParams = new URLSearchParams(searchParams);
    const newOffset = direction === 'next' ? offset + limit : Math.max(0, offset - limit);
    nextParams.set('offset', newOffset.toString());
    nextParams.set('limit', limit.toString());
    setSearchParams(nextParams);
  };

  const handlePageSizeChange = (nextLimit: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('limit', nextLimit.toString());
    nextParams.set('offset', '0');
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Jobs Registry</h1>
          <p className="text-xs text-textMuted mt-0.5">Filter, inspect, and analyze queue executions</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Queue Dropdown */}
        <div className="flex flex-col">
          <label className="text-[10px] text-textMuted uppercase font-bold mb-1">Queue</label>
          <select 
            value={queueFilter} 
            onChange={(e) => handleFilterChange('queue', e.target.value)}
          >
            <option value="">All Queues</option>
            {queues?.map(q => (
              <option key={q.name} value={q.name}>{q.name}</option>
            ))}
          </select>
        </div>

        {/* State Dropdown */}
        <div className="flex flex-col">
          <label className="text-[10px] text-textMuted uppercase font-bold mb-1">State</label>
          <select 
            value={stateFilter} 
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="capitalize"
          >
            <option value="">All States</option>
            {JOB_STATES.map(state => (
              <option key={state} value={state} className="capitalize">{state}</option>
            ))}
          </select>
        </div>

        {/* Kind Client Search */}
        <div className="flex flex-col">
          <label className="text-[10px] text-textMuted uppercase font-bold mb-1">Filter by Kind (Local)</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. send_email" 
              value={kindInput}
              onChange={(e) => setKindInput(e.target.value)}
              className="w-full pl-8"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted" />
          </div>
        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading jobs list: {(error as any).info?.message || error.message}</span>
        </div>
      )}

      {/* Jobs Table Container */}
      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold w-[90px]">ID</th>
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold">Queue</th>
                <th className="px-4 py-3 font-semibold w-[120px]">State</th>
                <th className="px-4 py-3 font-semibold w-[100px]">Attempt</th>
                <th className="px-4 py-3 font-semibold text-right">Scheduled At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching jobs registry...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-textMuted font-mono">
                    No jobs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const attemptNearLimit = job.attempt >= job.max_attempts - 1;
                  return (
                    <tr 
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="border-b border-darkBorder hover:bg-[#161618] cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-3 font-bold text-textPrimary">#{job.id}</td>
                      <td className="px-4 py-3 text-textPrimary max-w-[200px] truncate" title={job.kind}>
                        {job.kind}
                      </td>
                      <td className="px-4 py-3 text-textMuted">{job.queue}</td>
                      <td className="px-4 py-3">
                        <JobStateBadge state={job.state} />
                      </td>
                      <td className={`px-4 py-3 ${attemptNearLimit ? 'text-[#f59e0b] font-semibold' : 'text-textPrimary'}`}>
                        {job.attempt}/{job.max_attempts}
                      </td>
                      <td 
                        className="px-4 py-3 text-right text-textMuted cursor-help"
                        title={formatDateTime(job.scheduled_at)}
                      >
                        <RelativeTimeCell dateStr={job.scheduled_at} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="border-t border-darkBorder bg-[#0c0c0e] px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange('prev')}
              disabled={offset === 0 || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 border border-darkBorder rounded-[4px] hover:border-textMuted disabled:opacity-40 disabled:hover:border-darkBorder text-textPrimary transition-all duration-150"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              onClick={() => handlePageChange('next')}
              disabled={offset + limit >= totalJobs || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 border border-darkBorder rounded-[4px] hover:border-textMuted disabled:opacity-40 disabled:hover:border-darkBorder text-textPrimary transition-all duration-150"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <div className="text-textMuted text-center">
            Page <span className="text-textPrimary font-bold">{currentPage}</span> of{' '}
            <span className="text-textPrimary font-bold">{totalPages}</span>
            <span className="hidden sm:inline"> ({totalJobs} total jobs)</span>
            {totalJobs > 0 && (
              <span className="hidden md:inline">
                {' '}
                · showing {offset + 1}–{Math.min(offset + limit, totalJobs)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="jobs-page-size" className="text-textMuted uppercase text-[10px] font-bold">
              Per page
            </label>
            <select
              id="jobs-page-size"
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

// Sub-component to encapsulate hook usage per row
const RelativeTimeCell: React.FC<{ dateStr: string }> = ({ dateStr }) => {
  const relative = useRelativeTime(dateStr);
  return <>{relative}</>;
};
