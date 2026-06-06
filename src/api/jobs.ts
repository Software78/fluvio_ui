import { request, requestWithTotal } from './client';
import { transformJob, transformJobsResponse } from './transforms';
import type { Job, JobState } from './types';

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
  const raw = await request<Parameters<typeof transformJob>[0]>(`/jobs/${id}`);
  return transformJob(raw);
}

/**
 * Cancel a pending or scheduled job.
 */
export async function cancelJob(id: number): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/jobs/${id}/cancel`, {
    method: 'POST',
  });
}
