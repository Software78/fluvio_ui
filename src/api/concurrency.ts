import { request } from './client';
import { transformConcurrencySlots } from './transforms';
import type { ConcurrencySlot, OkResponse } from './types';

export async function getConcurrencySlots(): Promise<ConcurrencySlot[]> {
  const raw = await request<Parameters<typeof transformConcurrencySlots>[0]>('/concurrency');
  return transformConcurrencySlots(raw);
}

export async function setConcurrencyLimit(
  kind: string,
  maxConcurrent: number,
): Promise<OkResponse> {
  return request<OkResponse>(`/concurrency/${encodeURIComponent(kind)}`, {
    method: 'PUT',
    body: JSON.stringify({ max_concurrent: maxConcurrent }),
  });
}
