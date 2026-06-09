import { request } from './client';
import { transformWorkflow, transformWorkflowsPage } from './transforms';
import type { Workflow, WorkflowsPage } from './types';
import { DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE } from './jobs';

export async function getWorkflows(params: {
  limit?: number;
  offset?: number;
}): Promise<WorkflowsPage> {
  const limit = Math.min(params.limit ?? DEFAULT_JOBS_PAGE_SIZE, MAX_JOBS_PAGE_SIZE);
  const offset = params.offset ?? 0;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());

  const raw = await request<Parameters<typeof transformWorkflowsPage>[0]>(
    `/workflows?${queryParams.toString()}`,
  );
  return transformWorkflowsPage(raw);
}

export async function getWorkflowById(id: string): Promise<Workflow> {
  const raw = await request<Parameters<typeof transformWorkflow>[0]>(`/workflows/${id}`);
  return transformWorkflow(raw);
}
