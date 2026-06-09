import React from 'react';

interface WorkflowStateBadgeProps {
  state: string;
}

export const WorkflowStateBadge: React.FC<WorkflowStateBadgeProps> = ({ state }) => {
  const getBadgeStyle = () => {
    switch (state) {
      case 'pending':
        return 'text-[#3b82f6] border-[#3b82f6]/20 bg-[#3b82f6]/5';
      case 'waiting':
        return 'text-[#a855f7] border-[#a855f7]/20 bg-[#a855f7]/5';
      case 'running':
        return 'text-accent border-accent/20 bg-accent/5';
      case 'completed':
        return 'text-textMuted border-darkBorder bg-darkSurface/5';
      case 'failed':
        return 'text-danger border-danger/20 bg-danger/5';
      case 'cancelled':
        return 'text-textMuted line-through border-darkBorder bg-darkSurface/5';
      default:
        return 'text-textMuted border-darkBorder';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono border rounded-[4px] leading-none ${getBadgeStyle()}`}
    >
      {state === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-indicator" />
      )}
      {state}
    </span>
  );
};
