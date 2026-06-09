import React from 'react';
import { formatDateTime, formatRelativeTime } from '../lib/time';
import type { JobLogEntry } from '../api/types';

const LEVEL_STYLES: Record<string, { badge: string; border: string; bg: string }> = {
  debug: {
    badge: 'text-textMuted bg-darkSurface border-darkBorder',
    border: 'border-darkBorder',
    bg: 'bg-darkSurface/10',
  },
  info: {
    badge: 'text-accent bg-accent/10 border-accent/30',
    border: 'border-accent/20',
    bg: 'bg-[#0a120e]',
  },
  warn: {
    badge: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30',
    border: 'border-[#f59e0b]/20',
    bg: 'bg-[#120f0a]',
  },
  error: {
    badge: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30',
    border: 'border-[#ef4444]/20',
    bg: 'bg-[#12090a]',
  },
};

function levelStyle(level: string) {
  return LEVEL_STYLES[level.toLowerCase()] ?? LEVEL_STYLES.info;
}

interface JobLogsProps {
  logs: JobLogEntry[] | null;
}

export const JobLogs: React.FC<JobLogsProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="border border-darkBorder bg-darkSurface/10 p-4 rounded-[4px] text-xs text-textMuted italic font-mono text-center">
        No execution logs recorded
      </div>
    );
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <div className="space-y-2">
      {sorted.map((entry, idx) => {
        const style = levelStyle(entry.level);
        return (
          <div
            key={idx}
            className={`border ${style.border} ${style.bg} rounded-[4px] overflow-hidden`}
          >
            <div className="px-3 py-2 flex items-center justify-between gap-3 text-xs font-mono border-b border-inherit">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase border rounded-[3px] tracking-wider ${style.badge}`}
                >
                  {entry.level}
                </span>
                <span className="text-textPrimary truncate">{entry.message}</span>
              </div>
              <span
                className="shrink-0 text-[11px] text-textMuted cursor-help"
                title={formatDateTime(entry.at)}
              >
                {formatRelativeTime(entry.at)}
              </span>
            </div>
            {entry.data && Object.keys(entry.data).length > 0 && (
              <pre className="px-3 py-2 text-[11px] font-mono text-textMuted overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                <code>{JSON.stringify(entry.data, null, 2)}</code>
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
};
