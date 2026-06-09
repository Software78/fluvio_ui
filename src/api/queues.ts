import { request } from './client';
import { transformQueueDetail, transformQueues } from './transforms';
import type { QueueDetail, QueueStats } from './types';

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

export async function getQueueDetail(name: string): Promise<QueueDetail> {
  const raw = await request<Parameters<typeof transformQueueDetail>[0]>(
    `/queues/${encodeURIComponent(name)}`,
  );
  return transformQueueDetail(raw);
}
