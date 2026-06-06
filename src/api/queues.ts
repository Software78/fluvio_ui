import { request } from './client';
import { transformQueues } from './transforms';
import type { QueueStats } from './types';

/**
 * Fetch stats for all queues.
 */
export async function getQueues(): Promise<QueueStats[]> {
  const raw = await request<Array<{ queue: string } & Omit<QueueStats, 'name'>>>(
    '/queues',
  );
  return transformQueues(raw);
}

/**
 * Pause processing for a given queue.
 */
export async function pauseQueue(name: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/queues/${name}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume processing for a paused queue.
 */
export async function resumeQueue(name: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/queues/${name}/resume`, {
    method: 'POST',
  });
}
