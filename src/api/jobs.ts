import { request, requestWithTotal } from './client';
import { transformJob, transformJobsResponse } from './transforms';
import type { Job, JobState } from './types';
import * as mock from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const DEFAULT_JOBS_PAGE_SIZE = 25;

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
  
  const limit = params.limit ?? DEFAULT_JOBS_PAGE_SIZE;
  const offset = params.offset ?? 0;

  const queryParams = new URLSearchParams();
  if (params.queue) queryParams.set('queue', params.queue);
  if (params.state) queryParams.set('state', params.state);
  if (params.kind) queryParams.set('kind', params.kind);
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());

  const { data, total } = await requestWithTotal<Parameters<typeof transformJobsResponse>[0]>(
    `/jobs?${queryParams.toString()}`,
  );

  return transformJobsResponse(data, { total, limit, offset });
}

/**
 * Fetch a single job's details.
 */
export async function getJobById(id: number): Promise<Job> {
  if (USE_MOCK) {
    return mock.mockGetJobById(id);
  }
  const raw = await request<Parameters<typeof transformJob>[0]>(`/jobs/${id}`);
  return transformJob(raw);
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
