import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConcurrencySlots, setConcurrencyLimit } from '../api/concurrency';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import type { ConcurrencySlot } from '../api/types';
import { AlertCircle, Save } from 'lucide-react';

type KindGroup = {
  kind: string;
  slots: ConcurrencySlot[];
  maxConcurrent: number;
  totalRunning: number;
};

export const Concurrency: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: slots, isLoading, error } = useQuery({
    queryKey: ['concurrency'],
    queryFn: getConcurrencySlots,
    refetchInterval: 10000,
  });

  const groups = useMemo<KindGroup[]>(() => {
    if (!slots) return [];
    const byKind = new Map<string, ConcurrencySlot[]>();
    for (const slot of slots) {
      const list = byKind.get(slot.kind) ?? [];
      list.push(slot);
      byKind.set(slot.kind, list);
    }
    return [...byKind.entries()].map(([kind, kindSlots]) => ({
      kind,
      slots: kindSlots,
      maxConcurrent: kindSlots[0]?.max_concurrent ?? 0,
      totalRunning: kindSlots.reduce((sum, s) => sum + s.running, 0),
    }));
  }, [slots]);

  const setLimitMutation = useMutation({
    mutationFn: ({ kind, maxConcurrent }: { kind: string; maxConcurrent: number }) =>
      setConcurrencyLimit(kind, maxConcurrent),
    onSuccess: (_, variables) => {
      showToast(`Concurrency limit updated for ${variables.kind}`, 'success');
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variables.kind];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['concurrency'] });
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Failed to update concurrency limit'), 'error');
    },
  });

  const handleSave = (kind: string) => {
    const raw = edits[kind];
    const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < 1) {
      showToast('Max concurrent must be an integer >= 1', 'error');
      return;
    }
    setLimitMutation.mutate({ kind, maxConcurrent: value });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="border-b border-darkBorder pb-4">
        <h1 className="text-lg font-bold text-textPrimary uppercase tracking-wide">Concurrency Limits</h1>
        <p className="text-xs text-textMuted mt-0.5">
          Per-kind global concurrency caps enforced across the fleet
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-danger/20 bg-danger/5 text-danger font-mono text-xs rounded-[4px]">
          <AlertCircle size={16} />
          <span>Error loading concurrency slots: {getApiErrorMessage(error)}</span>
        </div>
      )}

      <div className="border border-darkBorder bg-darkSurface/20 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted uppercase text-[10px] tracking-wider bg-[#0f0f11]">
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold text-right w-[100px]">Running</th>
                <th className="px-4 py-3 font-semibold text-right w-[120px]">Max Concurrent</th>
                <th className="px-4 py-3 font-semibold">Partitions</th>
                <th className="px-4 py-3 font-semibold text-center w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-textMuted font-mono">
                    <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Fetching concurrency slots...
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-textMuted font-mono">
                    No concurrency limits configured.
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const editValue = edits[group.kind] ?? String(group.maxConcurrent);
                  const hasEdit = edits[group.kind] !== undefined && edits[group.kind] !== String(group.maxConcurrent);

                  return (
                    <tr
                      key={group.kind}
                      className="border-b border-darkBorder hover:bg-[#161618] transition-colors duration-150"
                    >
                      <td className="px-4 py-3 font-bold text-textPrimary">{group.kind}</td>
                      <td className="px-4 py-3 text-right text-textPrimary">{group.totalRunning}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={editValue}
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [group.kind]: e.target.value }))
                          }
                          className="w-20 text-right ml-auto"
                        />
                      </td>
                      <td className="px-4 py-3 text-textMuted">
                        {group.slots.length <= 1 && !group.slots[0]?.partition_key
                          ? '—'
                          : group.slots
                              .map((s) =>
                                s.partition_key
                                  ? `${s.partition_key} (${s.running})`
                                  : `global (${s.running})`,
                              )
                              .join(', ')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSave(group.kind)}
                          disabled={!hasEdit || setLimitMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent uppercase rounded-[4px] tracking-wider transition-colors disabled:opacity-40"
                        >
                          <Save size={10} /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
