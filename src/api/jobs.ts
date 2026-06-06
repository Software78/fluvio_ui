import { request } from './client';
import { transformJob, transformJobsPage } from './transforms';
import type { Job, JobState, JobsPage } from './types';

export const DEFAULT_JOBS_PAGE_SIZE = 50;
export const MAX_JOBS_PAGE_SIZE = 100;

/**
 * Fetch a paginated list of jobs, optionally filtered by queue, state, and kind.
 */
export async function getJobs(params: {
  queue?: string;
  state?: JobState;
  kind?: string;
  limit?: number;
  offset?: number;
}): Promise<JobsPage> {
  const limit = Math.min(params.limit ?? DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE);
  const offset = params.offset ?? 0;

  const queryParams = new URLSearchParams();
  if (params.queue) queryParams.set('queue', params.queue);
  if (params.state) queryParams.set('state', params.state);
  if (params.kind) queryParams.set('kind', params.kind);
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());

  const raw = await request<Parameters<typeof transformJobsPage>[0]>(
    `/jobs?${queryParams.toString()}`,
  );

  return transformJobsPage(raw);
}

/**
 * Fetch a single job's details.
 */
export async function getJobById(id: number): Promise<Job> {
  const raw = await request<Parameters<typeof transformJob>[0]>(`/jobs/${id}`);
  return transformJob(raw);
}
