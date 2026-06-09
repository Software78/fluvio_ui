import type { ApiError } from '../api/client';
import type { EnqueueRequest, JobState } from '../api/types';
import {
  addJob,
  addPeriodicJob,
  computeQueueStats,
  delay,
  filterJobs,
  getConcurrencySlots,
  getJobById,
  getNextJobId,
  getPeriodicJobs,
  getWorkerCapacity,
  getWorkers,
  getWorkflowById,
  paginateJobs,
  paginateWorkflows,
  pauseQueue,
  removeDeadJobs,
  replayDeadJob,
  resumeQueue,
  setConcurrencyLimit,
  updateJob,
  updatePeriodic,
} from './store';
import type { BackendJob } from './types';

function apiError(message: string, status: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.info = { error: message };
  error.message = message;
  return error;
}

function parseQuery(path: string): URLSearchParams {
  const qIndex = path.indexOf('?');
  if (qIndex === -1) return new URLSearchParams();
  return new URLSearchParams(path.slice(qIndex + 1));
}

function pathWithoutQuery(path: string): string {
  const qIndex = path.indexOf('?');
  return qIndex === -1 ? path : path.slice(0, qIndex);
}

const now = () => new Date().toISOString();

export async function mockRequest<T>(path: string, options?: RequestInit): Promise<T> {
  await delay();

  const method = (options?.method ?? 'GET').toUpperCase();
  const cleanPath = pathWithoutQuery(path);
  const query = parseQuery(path);

  // GET /queues
  if (method === 'GET' && cleanPath === '/queues') {
    return computeQueueStats() as T;
  }

  // GET /queues/:name
  const queueDetailMatch = cleanPath.match(/^\/queues\/([^/]+)$/);
  if (method === 'GET' && queueDetailMatch) {
    const name = decodeURIComponent(queueDetailMatch[1]);
    const stats = computeQueueStats().find((q) => q.queue === name);
    if (!stats) throw apiError(`queue not found: ${name}`, 404);
    return {
      ...stats,
      worker_instances: getWorkers().filter((w) => (w.queues[name] ?? 0) > 0).length,
      worker_capacity: getWorkerCapacity(name),
    } as T;
  }

  // POST /queues/:name/pause|resume
  const queueActionMatch = cleanPath.match(/^\/queues\/([^/]+)\/(pause|resume)$/);
  if (method === 'POST' && queueActionMatch) {
    const name = decodeURIComponent(queueActionMatch[1]);
    const action = queueActionMatch[2];
    const ok = action === 'pause' ? pauseQueue(name) : resumeQueue(name);
    if (!ok) throw apiError(`queue not found: ${name}`, 404);
    return { ok: true } as T;
  }

  // GET /jobs
  if (method === 'GET' && cleanPath === '/jobs') {
    const limit = Math.min(parseInt(query.get('limit') || '50', 10), 100);
    const offset = parseInt(query.get('offset') || '0', 10);
    const filtered = filterJobs({
      queue: query.get('queue') || undefined,
      state: (query.get('state') as JobState) || undefined,
      kind: query.get('kind') || undefined,
    });
    return paginateJobs(filtered, limit, offset) as T;
  }

  // GET /jobs/:id
  const jobMatch = cleanPath.match(/^\/jobs\/(\d+)$/);
  if (method === 'GET' && jobMatch) {
    const id = parseInt(jobMatch[1], 10);
    const job = getJobById(id);
    if (!job) throw apiError(`job not found: ${id}`, 404);
    return job as T;
  }

  // POST /jobs (enqueue)
  if (method === 'POST' && cleanPath === '/jobs') {
    const body = JSON.parse(options?.body as string) as EnqueueRequest;
    const job: BackendJob = {
      id: getNextJobId(),
      queue: body.queue || 'default',
      kind: body.kind,
      args: body.args,
      state: body.scheduled_at ? 'scheduled' : 'pending',
      priority: body.priority ?? 0,
      attempt: 0,
      max_attempts: body.max_attempts ?? 3,
      attempted_by: [],
      scheduled_at: body.scheduled_at ?? now(),
      attempted_at: null,
      finalized_at: null,
      died_at: null,
      created_at: now(),
      error_trace: null,
      logs: [{ at: now(), level: 'info', message: `Job enqueued: ${body.kind}` }],
      tags: body.tags ?? [],
      unique_key: body.unique_key ?? null,
      metadata: {},
    };
    return addJob(job) as T;
  }

  // POST /jobs/:id/cancel
  const cancelMatch = cleanPath.match(/^\/jobs\/(\d+)\/cancel$/);
  if (method === 'POST' && cancelMatch) {
    const id = parseInt(cancelMatch[1], 10);
    const job = getJobById(id);
    if (!job) throw apiError(`job not found: ${id}`, 404);
    if (!['pending', 'scheduled', 'running'].includes(job.state)) {
      throw apiError(`cannot cancel job in state: ${job.state}`, 400);
    }
    updateJob(id, { state: 'cancelled', finalized_at: now() });
    return { ok: true } as T;
  }

  // POST /jobs/:id/retry
  const retryMatch = cleanPath.match(/^\/jobs\/(\d+)\/retry$/);
  if (method === 'POST' && retryMatch) {
    const id = parseInt(retryMatch[1], 10);
    const job = getJobById(id);
    if (!job) throw apiError(`job not found: ${id}`, 404);
    if (!['failed', 'cancelled'].includes(job.state)) {
      throw apiError(`cannot retry job in state: ${job.state}`, 400);
    }
    updateJob(id, {
      state: 'pending',
      attempt: 0,
      attempted_by: [],
      attempted_at: null,
      finalized_at: null,
      died_at: null,
      scheduled_at: now(),
      error_trace: null,
    });
    return { ok: true } as T;
  }

  // GET /workers
  if (method === 'GET' && cleanPath === '/workers') {
    return getWorkers() as T;
  }

  // GET /dead
  if (method === 'GET' && cleanPath === '/dead') {
    const limit = Math.min(parseInt(query.get('limit') || '50', 10), 100);
    const offset = parseInt(query.get('offset') || '0', 10);
    const dead = filterJobs({ deadOnly: true });
    return paginateJobs(dead, limit, offset) as T;
  }

  // POST /dead/:id/replay
  const deadReplayMatch = cleanPath.match(/^\/dead\/(\d+)\/replay$/);
  if (method === 'POST' && deadReplayMatch) {
    const id = parseInt(deadReplayMatch[1], 10);
    if (!replayDeadJob(id)) throw apiError(`dead job not found: ${id}`, 404);
    return { ok: true } as T;
  }

  // POST /dead/replay (bulk)
  if (method === 'POST' && cleanPath === '/dead/replay') {
    const body = JSON.parse(options?.body as string) as { ids: number[] };
    let replayed = 0;
    const errors: { id: number; error: string }[] = [];
    for (const id of body.ids) {
      if (replayDeadJob(id)) {
        replayed++;
      } else {
        errors.push({ id, error: 'not found or not dead' });
      }
    }
    return { replayed, errors: errors.length > 0 ? errors : undefined } as T;
  }

  // POST /dead/purge
  if (method === 'POST' && cleanPath === '/dead/purge') {
    const body = JSON.parse(options?.body as string) as { before: string };
    const purged = removeDeadJobs(body.before);
    return { purged } as T;
  }

  // GET /periodic
  if (method === 'GET' && cleanPath === '/periodic') {
    return getPeriodicJobs() as T;
  }

  // POST /periodic
  if (method === 'POST' && cleanPath === '/periodic') {
    const body = JSON.parse(options?.body as string) as {
      cron: string;
      kind: string;
      queue?: string;
      args?: Record<string, unknown>;
      max_attempts?: number;
    };
    addPeriodicJob({
      kind: body.kind,
      cron: body.cron,
      queue: body.queue || 'default',
      max_attempts: body.max_attempts ?? 3,
      args: body.args ?? {},
      next_run_at: new Date(Date.now() + 3600_000).toISOString(),
      last_run_at: null,
      paused: false,
    });
    return { ok: true } as T;
  }

  // POST /periodic/:kind/pause|resume
  const periodicActionMatch = cleanPath.match(/^\/periodic\/([^/]+)\/(pause|resume)$/);
  if (method === 'POST' && periodicActionMatch) {
    const kind = decodeURIComponent(periodicActionMatch[1]);
    const action = periodicActionMatch[2];
    if (!updatePeriodic(kind, { paused: action === 'pause' })) {
      throw apiError(`periodic job not found: ${kind}`, 404);
    }
    return { ok: true } as T;
  }

  // GET /workflows
  if (method === 'GET' && cleanPath === '/workflows') {
    const limit = Math.min(parseInt(query.get('limit') || '50', 10), 100);
    const offset = parseInt(query.get('offset') || '0', 10);
    return paginateWorkflows(limit, offset) as T;
  }

  // GET /workflows/:id
  const workflowMatch = cleanPath.match(/^\/workflows\/([^/]+)$/);
  if (method === 'GET' && workflowMatch) {
    const id = decodeURIComponent(workflowMatch[1]);
    const workflow = getWorkflowById(id);
    if (!workflow) throw apiError(`workflow not found: ${id}`, 404);
    return workflow as T;
  }

  // GET /concurrency
  if (method === 'GET' && cleanPath === '/concurrency') {
    return getConcurrencySlots() as T;
  }

  // PUT /concurrency/:kind
  const concurrencyMatch = cleanPath.match(/^\/concurrency\/([^/]+)$/);
  if (method === 'PUT' && concurrencyMatch) {
    const kind = decodeURIComponent(concurrencyMatch[1]);
    const body = JSON.parse(options?.body as string) as { max_concurrent: number };
    if (!setConcurrencyLimit(kind, body.max_concurrent)) {
      throw apiError(`concurrency slot not found: ${kind}`, 404);
    }
    return { ok: true } as T;
  }

  throw apiError(`mock endpoint not implemented: ${method} ${cleanPath}`, 404);
}
