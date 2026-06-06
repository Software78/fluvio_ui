import { request } from './client';
import * as mock from './mock';
import { transformQueues } from './transforms';
import type { QueueStats } from './types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Fetch stats for all queues.
 */
export async function getQueues(): Promise<QueueStats[]> {
  if (USE_MOCK) {
    return mock.mockGetQueues();
  }
  const raw = await request<Array<{ queue: string } & Omit<QueueStats, 'name'>>>(
    '/queues',
  );
  return transformQueues(raw);
}

/**
 * Pause processing for a given queue.
 */
export async function pauseQueue(name: string): Promise<{ ok: boolean }> {
  if (USE_MOCK) {
    return mock.mockPauseQueue(name);
  }
  return request<{ ok: boolean }>(`/queues/${name}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume processing for a paused queue.
 */
export async function resumeQueue(name: string): Promise<{ ok: boolean }> {
  if (USE_MOCK) {
    return mock.mockResumeQueue(name);
  }
  return request<{ ok: boolean }>(`/queues/${name}/resume`, {
    method: 'POST',
  });
}
