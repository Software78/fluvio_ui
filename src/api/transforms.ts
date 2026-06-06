import type { ErrorTrace, Job, JobState, LiveStats, QueueStats } from './types';

type BackendQueueStats = {
  queue: string;
  pending: number;
  running: number;
  scheduled: number;
  dead: number;
  completed?: number;
  failed?: number;
  paused: boolean;
};

type BackendErrorTrace = {
  Attempt?: number;
  attempt?: number;
  Error?: string;
  error?: string;
  At?: string;
  at?: string;
};

type BackendJob = {
  ID?: number;
  id?: number;
  Queue?: string;
  queue?: string;
  Kind?: string;
  kind?: string;
  Args?: Record<string, unknown>;
  args?: Record<string, unknown>;
  State?: string;
  state?: JobState;
  Priority?: number;
  priority?: number;
  Attempt?: number;
  attempt?: number;
  MaxAttempts?: number;
  max_attempts?: number;
  AttemptedBy?: string[];
  attempted_by?: string[];
  ScheduledAt?: string;
  scheduled_at?: string;
  AttemptedAt?: string | null;
  attempted_at?: string | null;
  FinalizedAt?: string | null;
  finalized_at?: string | null;
  CreatedAt?: string;
  created_at?: string;
  ErrorTrace?: BackendErrorTrace[] | null;
  error_trace?: ErrorTrace[] | null;
  Tags?: string[];
  tags?: string[];
  UniqueKey?: string | null;
  unique_key?: string | null;
  Metadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

function transformErrorTrace(raw: BackendErrorTrace): ErrorTrace {
  return {
    attempt: raw.attempt ?? raw.Attempt ?? 0,
    error: raw.error ?? raw.Error ?? '',
    at: raw.at ?? raw.At ?? '',
  };
}

export function transformJob(raw: BackendJob): Job {
  return {
    id: raw.id ?? raw.ID ?? 0,
    queue: raw.queue ?? raw.Queue ?? '',
    kind: raw.kind ?? raw.Kind ?? '',
    args: raw.args ?? raw.Args ?? {},
    state: (raw.state ?? raw.State ?? 'pending') as JobState,
    priority: raw.priority ?? raw.Priority ?? 0,
    attempt: raw.attempt ?? raw.Attempt ?? 0,
    max_attempts: raw.max_attempts ?? raw.MaxAttempts ?? 0,
    attempted_by: raw.attempted_by ?? raw.AttemptedBy ?? [],
    scheduled_at: raw.scheduled_at ?? raw.ScheduledAt ?? '',
    attempted_at: raw.attempted_at ?? raw.AttemptedAt ?? null,
    finalized_at: raw.finalized_at ?? raw.FinalizedAt ?? null,
    created_at: raw.created_at ?? raw.CreatedAt ?? '',
    error_trace: (raw.error_trace ?? raw.ErrorTrace)?.map(transformErrorTrace) ?? null,
    tags: raw.tags ?? raw.Tags ?? [],
    unique_key: raw.unique_key ?? raw.UniqueKey ?? null,
    metadata: raw.metadata ?? raw.Metadata ?? {},
  };
}

type BackendJobsPage = {
  jobs?: BackendJob[];
  Jobs?: BackendJob[];
  total?: number;
  Total?: number;
};

export function transformJobsResponse(
  raw: BackendJob[] | BackendJobsPage,
  options?: { total?: number; limit?: number; offset?: number },
): { jobs: Job[]; total: number } {
  const limit = options?.limit;
  const offset = options?.offset ?? 0;

  if (!Array.isArray(raw)) {
    const page = raw.jobs ?? raw.Jobs ?? [];
    const jobs = page.map(transformJob);
    const total = options?.total ?? raw.total ?? raw.Total ?? jobs.length;
    return { jobs, total };
  }

  const allJobs = raw.map(transformJob);
  const serverTotal = options?.total;

  if (serverTotal !== undefined) {
    return { jobs: allJobs, total: serverTotal };
  }

  if (limit !== undefined) {
    return {
      jobs: allJobs.slice(offset, offset + limit),
      total: allJobs.length,
    };
  }

  return { jobs: allJobs, total: allJobs.length };
}

export function transformQueueStats(raw: BackendQueueStats): QueueStats {
  return {
    name: raw.queue,
    pending: raw.pending,
    running: raw.running,
    scheduled: raw.scheduled,
    dead: raw.dead,
    paused: raw.paused,
  };
}

export function transformQueues(raw: BackendQueueStats[]): QueueStats[] {
  return raw.map(transformQueueStats);
}

/**
 * Parses the SSE `stats` event payload into LiveStats.
 * The backend sends a queue array; throughput and worker fields are derived when absent.
 */
export function parseStatsEvent(data: string): LiveStats {
  const parsed: unknown = JSON.parse(data);

  if (Array.isArray(parsed)) {
    const queues = transformQueues(parsed as BackendQueueStats[]);
    const completed = (parsed as BackendQueueStats[]).reduce(
      (sum, q) => sum + (q.completed ?? 0),
      0,
    );
    const failed = (parsed as BackendQueueStats[]).reduce(
      (sum, q) => sum + (q.failed ?? 0),
      0,
    );

    return {
      queues,
      throughput_per_min: completed,
      error_rate_per_min: failed,
      workers_online: 0,
    };
  }

  const stats = parsed as LiveStats;
  return {
    ...stats,
    queues: stats.queues.map((q) =>
      'queue' in q ? transformQueueStats(q as unknown as BackendQueueStats) : q,
    ),
  };
}
