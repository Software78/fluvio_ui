import { request } from './client';
import { transformWorkers } from './transforms';
import type { WorkerInstance } from './types';

/**
 * Fetch live processing workers registered in the fleet registry.
 */
export async function getWorkers(): Promise<WorkerInstance[]> {
  const raw = await request<Array<Parameters<typeof transformWorkers>[0][number]>>('/workers');
  return transformWorkers(raw);
}
