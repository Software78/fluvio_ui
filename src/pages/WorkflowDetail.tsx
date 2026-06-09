import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowById } from '../api/workflows';
import { getApiErrorMessage } from '../api/client';
import { WorkflowStateBadge } from '../components/WorkflowStateBadge';
import { formatDateTime, formatRelativeTime } from '../lib/time';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => getWorkflowById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono py-20">
        <div className="flex items-center gap-3 text-textMuted text-xs uppercase tracking-widest border border-darkBorder bg-darkSurface/30 px-4 py-3 rounded-[4px]">
          <span className="w-2 h-2 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading workflow...
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="space-y-6 flex-1 flex flex-col justify-start">
        <Link
          to="/workflows"
          className="inline-flex items-center gap-2 text-xs text-textMuted hover:text-textPrimary transition-colors"
        >
          <ArrowLeft size={14} /> Back to workflows
        </Link>
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading workflow: {getApiErrorMessage(error, 'Workflow not found')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="flex flex-col gap-4 border-b border-darkBorder pb-4">
        <Link
          to="/workflows"
          className="inline-flex items-center gap-2 text-xs text-textMuted hover:text-textPrimary transition-colors"
        >
          <ArrowLeft size={14} /> Back to workflows
        </Link>

        <div>
          <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Workflow</h1>
          <p className="text-xs text-textMuted mt-0.5 font-mono break-all">{workflow.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-textMuted uppercase">State</span>
            <WorkflowStateBadge state={workflow.state} />
          </div>
          <div>
            <span className="text-[10px] text-textMuted uppercase mr-2">Created</span>
            <span className="text-textPrimary cursor-help" title={formatDateTime(workflow.created_at)}>
              {formatRelativeTime(workflow.created_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-textMuted uppercase mr-2">Tasks</span>
            <span className="text-textPrimary font-bold">{workflow.tasks.length}</span>
          </div>
        </div>
      </div>

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Task ID</th>
                <th className="px-4 py-3 font-semibold w-[120px]">State</th>
                <th className="px-4 py-3 font-semibold">Depends On</th>
                <th className="px-4 py-3 font-semibold w-[100px]">Job ID</th>
              </tr>
            </thead>
            <tbody>
              {workflow.tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-textMuted font-mono">
                    No tasks in this workflow.
                  </td>
                </tr>
              ) : (
                workflow.tasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b border-darkBorder hover:bg-[#161618] transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-bold text-textPrimary">{task.task_id}</td>
                    <td className="px-4 py-3">
                      <WorkflowStateBadge state={task.state} />
                    </td>
                    <td className="px-4 py-3 text-textMuted">
                      {task.depends_on.length > 0 ? task.depends_on.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {task.job_id != null ? (
                        <Link
                          to={`/jobs/${task.job_id}`}
                          className="text-accent hover:underline font-bold"
                        >
                          #{task.job_id}
                        </Link>
                      ) : (
                        <span className="text-textMuted">—</span>
                      )}
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
