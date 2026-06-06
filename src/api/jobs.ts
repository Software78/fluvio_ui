import { request } from './client';
import type { Job, JobState } from './types';
import * as mock from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Fetch a list of jobs, optionally filtered by queue, state, and kind.
 */
export async function getJobs(params: {
  queue?: string;
  state?: JobState;
  kind?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: Job[]; total: number }> {
  if (USE_MOCK) {
    return mock.mockGetJobs(
      params.queue || undefined,
      params.state || undefined,
      params.kind || undefined,
      params.limit,
      params.offset
    );
  }
  
  const queryParams = new URLSearchParams();
  if (params.queue) queryParams.set('queue', params.queue);
  if (params.state) queryParams.set('state', params.state);
  if (params.kind) queryParams.set('kind', params.kind);
  if (params.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
  
  return request<{ jobs: Job[]; total: number }>(`/jobs?${queryParams.toString()}`);
}

/**
 * Fetch a single job's details.
 */
export async function getJobById(id: number): Promise<Job> {
  if (USE_MOCK) {
    return mock.mockGetJobById(id);
  }
  return request<Job>(`/jobs/${id}`);
}

/**
 * Cancel a pending or scheduled job.
 */
export async function cancelJob(id: number): Promise<{ ok: boolean }> {
  if (USE_MOCK) {
    return mock.mockCancelJob(id);
  }
  return request<{ ok: boolean }>(`/jobs/${id}/cancel`, {
    method: 'POST',
  });
}
