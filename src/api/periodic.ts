import { request } from './client';
import { transformPeriodicJobs } from './transforms';
import type { OkResponse, PeriodicJob } from './types';

export type AddPeriodicJobRequest = {
  cron: string;
  kind: string;
  queue?: string;
  args?: Record<string, unknown>;
  max_attempts?: number;
};

export async function getPeriodicJobs(): Promise<PeriodicJob[]> {
  const raw = await request<Parameters<typeof transformPeriodicJobs>[0]>('/periodic');
  return transformPeriodicJobs(raw);
}

export async function addPeriodicJob(body: AddPeriodicJobRequest): Promise<OkResponse> {
  return request<OkResponse>('/periodic', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function pausePeriodicJob(kind: string): Promise<OkResponse> {
  return request<OkResponse>(`/periodic/${encodeURIComponent(kind)}/pause`, {
    method: 'POST',
  });
}

export async function resumePeriodicJob(kind: string): Promise<OkResponse> {
  return request<OkResponse>(`/periodic/${encodeURIComponent(kind)}/resume`, {
    method: 'POST',
  });
}
