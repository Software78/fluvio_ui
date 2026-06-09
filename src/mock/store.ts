import type { JobState } from '../api/types';
import {
  INITIAL_CONCURRENCY,
  INITIAL_JOBS,
  INITIAL_PAUSED_QUEUES,
  INITIAL_PERIODIC,
  INITIAL_WORKERS,
  INITIAL_WORKFLOWS,
  QUEUE_NAMES,
} from './data';
import type {
  BackendConcurrencySlot,
  BackendJob,
  BackendPeriodicJob,
  BackendQueueStats,
  BackendWorker,
  BackendWorkflow,
} from './types';

const now = () => new Date().toISOString();

function clone<T>(value: T): T {
  return structuredClone(value);
}

let jobs = clone(INITIAL_JOBS);
let workers = clone(INITIAL_WORKERS);
let periodic = clone(INITIAL_PERIODIC);
let workflows = clone(INITIAL_WORKFLOWS);
let concurrency = clone(INITIAL_CONCURRENCY);
let pausedQueues = new Set(INITIAL_PAUSED_QUEUES);
let nextJobId = Math.max(...INITIAL_JOBS.map((j) => j.id)) + 1;

export function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getNextJobId(): number {
  return nextJobId++;
}

export function computeQueueStats(): BackendQueueStats[] {
  return QUEUE_NAMES.map((queue) => {
    const queueJobs = jobs.filter((j) => j.queue === queue);
    const count = (state: JobState) => queueJobs.filter((j) => j.state === state).length;
    return {
      queue,
      pending: count('pending'),
      running: count('running'),
      scheduled: count('scheduled'),
      dead: count('dead'),
      completed: count('completed'),
      failed: count('failed'),
      cancelled: count('cancelled'),
      paused: pausedQueues.has(queue),
    };
  });
}

export function getWorkerCapacity(queue: string): number {
  return workers.reduce((sum, w) => sum + (w.queues[queue] ?? 0), 0);
}

export function getWorkers(): BackendWorker[] {
  return clone(workers);
}

export function getJobs(): BackendJob[] {
  return jobs;
}

export function getJobById(id: number): BackendJob | undefined {
  return jobs.find((j) => j.id === id);
}

export function filterJobs(params: {
  queue?: string;
  state?: JobState;
  kind?: string;
  deadOnly?: boolean;
}): BackendJob[] {
  let result = jobs;
  if (params.deadOnly) {
    result = result.filter((j) => j.state === 'dead');
  }
  if (params.queue) {
    result = result.filter((j) => j.queue === params.queue);
  }
  if (params.state) {
    result = result.filter((j) => j.state === params.state);
  }
  if (params.kind) {
    result = result.filter((j) => j.kind.includes(params.kind!));
  }
  return result;
}

export function paginateJobs<T>(items: T[], limit: number, offset: number) {
  const page = items.slice(offset, offset + limit);
  return {
    jobs: page,
    limit,
    offset,
    has_more: offset + limit < items.length,
  };
}

export function addJob(job: BackendJob): BackendJob {
  jobs = [...jobs, job];
  return job;
}

export function updateJob(id: number, patch: Partial<BackendJob>): BackendJob | undefined {
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return undefined;
  const updated = { ...jobs[index], ...patch };
  jobs = [...jobs.slice(0, index), updated, ...jobs.slice(index + 1)];
  return updated;
}

export function removeDeadJobs(before: string): number {
  const beforeTime = new Date(before).getTime();
  const toRemove = jobs.filter(
    (j) => j.state === 'dead' && j.died_at && new Date(j.died_at).getTime() < beforeTime,
  );
  const removeIds = new Set(toRemove.map((j) => j.id));
  jobs = jobs.filter((j) => !removeIds.has(j.id));
  return toRemove.length;
}

export function replayDeadJob(id: number): boolean {
  const job = getJobById(id);
  if (!job || job.state !== 'dead') return false;
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
  return true;
}

export function pauseQueue(name: string): boolean {
  if (!QUEUE_NAMES.includes(name as (typeof QUEUE_NAMES)[number])) return false;
  pausedQueues = new Set([...pausedQueues, name]);
  return true;
}

export function resumeQueue(name: string): boolean {
  if (!QUEUE_NAMES.includes(name as (typeof QUEUE_NAMES)[number])) return false;
  const next = new Set(pausedQueues);
  next.delete(name);
  pausedQueues = next;
  return true;
}

export function getPeriodicJobs(): BackendPeriodicJob[] {
  return clone(periodic);
}

export function addPeriodicJob(entry: BackendPeriodicJob): void {
  periodic = [...periodic, entry];
}

export function updatePeriodic(kind: string, patch: Partial<BackendPeriodicJob>): boolean {
  const index = periodic.findIndex((p) => p.kind === kind);
  if (index === -1) return false;
  periodic = [
    ...periodic.slice(0, index),
    { ...periodic[index], ...patch },
    ...periodic.slice(index + 1),
  ];
  return true;
}

export function getWorkflows(): BackendWorkflow[] {
  return clone(workflows);
}

export function getWorkflowById(id: string): BackendWorkflow | undefined {
  return workflows.find((w) => w.id === id);
}

export function paginateWorkflows(limit: number, offset: number) {
  const page = workflows.slice(offset, offset + limit);
  return {
    workflows: clone(page),
    limit,
    offset,
    has_more: offset + limit < workflows.length,
  };
}

export function getConcurrencySlots(): BackendConcurrencySlot[] {
  return clone(concurrency);
}

export function setConcurrencyLimit(kind: string, maxConcurrent: number): boolean {
  const index = concurrency.findIndex((s) => s.kind === kind);
  if (index === -1) return false;
  concurrency = [
    ...concurrency.slice(0, index),
    { ...concurrency[index], max_concurrent: maxConcurrent },
    ...concurrency.slice(index + 1),
  ];
  return true;
}

export function getLiveStatsSnapshot() {
  const queues = computeQueueStats();
  return {
    queues,
    workers_online: workers.length,
    completed: queues.reduce((sum, q) => sum + q.completed, 0),
    failed: queues.reduce((sum, q) => sum + q.failed, 0),
  };
}
