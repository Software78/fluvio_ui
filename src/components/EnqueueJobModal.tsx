import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getQueues } from '../api/queues';
import { enqueueJob } from '../api/jobActions';
import { getApiErrorMessage } from '../api/client';
import { useToast } from './Toast';
import { X } from 'lucide-react';

interface EnqueueJobModalProps {
  open: boolean;
  onClose: () => void;
}

export const EnqueueJobModal: React.FC<EnqueueJobModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [kind, setKind] = useState('');
  const [queue, setQueue] = useState('');
  const [argsText, setArgsText] = useState('{}');
  const [priority, setPriority] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');
  const [argsError, setArgsError] = useState('');

  const { data: queues } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
  });

  const mutation = useMutation({
    mutationFn: enqueueJob,
    onSuccess: (job) => {
      showToast(`Job #${job.id} enqueued`, 'success');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      resetForm();
      onClose();
      navigate(`/jobs/${job.id}`);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Failed to enqueue job'), 'error');
    },
  });

  const resetForm = () => {
    setKind('');
    setQueue('');
    setArgsText('{}');
    setPriority('');
    setMaxAttempts('');
    setScheduledAt('');
    setTagsText('');
    setUniqueKey('');
    setArgsError('');
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind.trim()) {
      showToast('Kind is required', 'error');
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

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    mutation.mutate({
      kind: kind.trim(),
      queue: queue || undefined,
      args,
      priority: priority ? Number(priority) : undefined,
      max_attempts: maxAttempts ? Number(maxAttempts) : undefined,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
      unique_key: uniqueKey.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg border border-darkBorder bg-[#0c0c0e] rounded-[4px] shadow-xl font-mono max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-darkBorder px-4 py-3 shrink-0">
          <h2 className="text-sm font-bold text-textPrimary uppercase tracking-wide">Enqueue Job</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3 flex-1">
          <div>
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">
              Kind <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="e.g. send_email"
              required
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
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">
              Args (JSON) <span className="text-danger">*</span>
            </label>
            <textarea
              value={argsText}
              onChange={(e) => {
                setArgsText(e.target.value);
                setArgsError('');
              }}
              rows={5}
              className="w-full font-mono text-xs resize-y"
              spellCheck={false}
            />
            {argsError && <p className="text-danger text-[10px] mt-1">{argsError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0"
                className="w-full"
              />
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
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Scheduled At</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Tags</label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="comma-separated"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1 block">Unique Key</label>
            <input
              type="text"
              value={uniqueKey}
              onChange={(e) => setUniqueKey(e.target.value)}
              placeholder="optional dedup key"
              className="w-full"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-darkBorder px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="px-3 py-1.5 text-xs border border-darkBorder rounded-[4px] text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-3 py-1.5 text-xs font-bold border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent uppercase rounded-[4px] tracking-wider transition-colors disabled:opacity-40"
          >
            {mutation.isPending ? 'Enqueueing...' : 'Enqueue'}
          </button>
        </div>
      </div>
    </div>
  );
};
