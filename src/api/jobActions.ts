import { request } from './client';
import { transformJob } from './transforms';
import type { EnqueueRequest, Job, OkResponse } from './types';

export async function cancelJob(id: number): Promise<OkResponse> {
  return request<OkResponse>(`/jobs/${id}/cancel`, { method: 'POST' });
}

export async function retryJob(id: number): Promise<OkResponse> {
  return request<OkResponse>(`/jobs/${id}/retry`, { method: 'POST' });
}

export async function enqueueJob(body: EnqueueRequest): Promise<Job> {
  const raw = await request<Parameters<typeof transformJob>[0]>('/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return transformJob(raw);
}
