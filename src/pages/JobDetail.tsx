import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJobById } from '../api/jobs';
import { getApiErrorMessage } from '../api/client';
import { JobStateBadge } from '../components/JobStateBadge';
import { JsonViewer } from '../components/JsonViewer';
import { formatDateTime, formatRelativeTime } from '../lib/time';
import { ArrowLeft, AlertCircle, Users, Tag } from 'lucide-react';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === 'running' ? 5000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono py-20">
        <div className="flex items-center gap-3 text-textMuted text-xs uppercase tracking-widest border border-darkBorder bg-darkSurface/30 px-4 py-3 rounded-[4px]">
          <span className="w-2 h-2 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading job #{id} details...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6 flex-1 flex flex-col justify-start">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-xs text-textMuted hover:text-textPrimary transition-colors">
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading job: {getApiErrorMessage(error, 'Job not found')}</span>
        </div>
      </div>
    );
  }

  const claimedBy = job.attempted_by.length > 0 ? job.attempted_by[job.attempted_by.length - 1] : null;

  const createdRelative = formatRelativeTime(job.created_at);
  const scheduledRelative = formatRelativeTime(job.scheduled_at);
  const attemptedRelative = formatRelativeTime(job.attempted_at);
  const finalizedRelative = formatRelativeTime(job.finalized_at);

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex flex-col gap-4 border-b border-darkBorder pb-4">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-xs text-textMuted hover:text-textPrimary transition-colors"
        >
          <ArrowLeft size={14} /> Back to jobs
        </Link>

        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide flex items-center gap-2">
            Job <span className="text-textMuted font-normal">#{job.id}</span>
          </h1>
          <p className="text-xs text-textMuted mt-0.5 font-mono">{job.kind}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border border-darkBorder bg-darkSurface/10 p-4 rounded-[4px]">
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Kind</div>
          <div className="text-textPrimary font-semibold break-all">{job.kind}</div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Queue</div>
          <div className="text-textPrimary font-semibold">{job.queue}</div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">State</div>
          <div>
            <JobStateBadge state={job.state} />
          </div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Priority</div>
          <div className="text-textPrimary font-semibold">{job.priority}</div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Attempts</div>
          <div className={`font-semibold ${job.attempt >= job.max_attempts - 1 ? 'text-[#f59e0b]' : 'text-textPrimary'}`}>
            {job.attempt} / {job.max_attempts}
          </div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Unique Key</div>
          <div className="text-textPrimary font-semibold truncate" title={job.unique_key || undefined}>
            {job.unique_key || '—'}
          </div>
        </div>
        {claimedBy && (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="text-[10px] text-textMuted uppercase">Claimed By</div>
            <div className="text-accent font-semibold">{claimedBy}</div>
          </div>
        )}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Created</div>
          <div className="text-textPrimary font-semibold cursor-help" title={formatDateTime(job.created_at)}>
            {createdRelative}
          </div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Scheduled</div>
          <div className="text-textPrimary font-semibold cursor-help" title={formatDateTime(job.scheduled_at)}>
            {scheduledRelative}
          </div>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-textMuted uppercase">Attempted</div>
          <div className="text-textPrimary font-semibold cursor-help" title={formatDateTime(job.attempted_at)}>
            {attemptedRelative}
          </div>
        </div>
        {job.finalized_at && (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="text-[10px] text-textMuted uppercase font-mono">Finalized</div>
            <div className="text-textPrimary font-semibold cursor-help" title={formatDateTime(job.finalized_at)}>
              {finalizedRelative}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-darkBorder bg-darkSurface/20 p-4 rounded-[4px] flex flex-col justify-start">
          <div className="flex items-center gap-1.5 text-[10px] text-textMuted uppercase font-bold mb-3">
            <Users size={12} />
            <span>Attempted By (Workers)</span>
          </div>
          {job.attempted_by.length === 0 ? (
            <div className="text-xs text-textMuted italic font-mono">No workers assigned yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {job.attempted_by.map((worker, index) => (
                <span
                  key={`${worker}-${index}`}
                  className={`px-2 py-1 border text-xs rounded-[4px] font-mono ${
                    index === job.attempted_by.length - 1
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-darkSurface border-darkBorder text-textPrimary'
                  }`}
                >
                  {worker}
                  {index === job.attempted_by.length - 1 && ' (current)'}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border border-darkBorder bg-darkSurface/20 p-4 rounded-[4px] flex flex-col justify-start">
          <div className="flex items-center gap-1.5 text-[10px] text-textMuted uppercase font-bold mb-3">
            <Tag size={12} />
            <span>Job Tags</span>
          </div>
          {job.tags.length === 0 ? (
            <div className="text-xs text-textMuted italic font-mono">No tags defined</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-[#141d17] border border-[#22c55e]/20 text-accent text-xs rounded-[4px] font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider font-mono">Job Arguments</div>
        <JsonViewer data={job.args} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider font-mono">Job Metadata</div>
        <JsonViewer data={job.metadata} />
      </div>

      <div className="space-y-3">
        <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider font-mono">Error Trace History</div>
        {!job.error_trace || job.error_trace.length === 0 ? (
          <div className="border border-darkBorder bg-darkSurface/10 p-4 rounded-[4px] text-xs text-textMuted italic font-mono text-center">
            No errors recorded
          </div>
        ) : (
          <div className="space-y-3">
            {[...job.error_trace]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .map((trace, idx) => (
                <div key={idx} className="border border-[#ef4444]/20 bg-[#12090a] rounded-[4px] overflow-hidden">
                  <div className="border-b border-[#ef4444]/20 bg-[#1a0a0c] px-3 py-2 flex items-center justify-between text-xs font-mono text-[#ef4444]">
                    <span className="font-bold">Attempt {trace.attempt}</span>
                    <span className="text-[11px] opacity-80 cursor-help" title={formatDateTime(trace.at)}>
                      {formatRelativeTime(trace.at)}
                    </span>
                  </div>
                  <pre className="p-3 text-xs font-mono text-[#fca5a5] overflow-auto whitespace-pre-wrap break-all leading-relaxed bg-[#0c0506]">
                    <code>{trace.error}</code>
                  </pre>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
