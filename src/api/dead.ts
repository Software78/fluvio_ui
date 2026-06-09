import { request } from './client';
import { transformDeadJobsPage } from './transforms';
import type { BulkReplayResponse, JobsPage, OkResponse, PurgeDeadResponse } from './types';
import { DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE } from './jobs';

export async function getDeadJobs(params: {
  limit?: number;
  offset?: number;
}): Promise<JobsPage> {
  const limit = Math.min(params.limit ?? DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE);
  const offset = params.offset ?? 0;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());

  const raw = await request<Parameters<typeof transformDeadJobsPage>[0]>(
    `/dead?${queryParams.toString()}`,
  );
  return transformDeadJobsPage(raw);
}

export async function replayDeadJob(id: number): Promise<OkResponse> {
  return request<OkResponse>(`/dead/${id}/replay`, { method: 'POST' });
}

export async function replayDeadJobs(ids: number[]): Promise<BulkReplayResponse> {
  return request<BulkReplayResponse>('/dead/replay', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function purgeDeadJobs(before: string): Promise<PurgeDeadResponse> {
  return request<PurgeDeadResponse>('/dead/purge', {
    method: 'POST',
    body: JSON.stringify({ before }),
  });
}
