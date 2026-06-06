import type { ErrorTrace, Job, JobState, LiveStats, QueueStats, WorkerInstance } from './types';

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
  Args?: Record<string, unknown> | string;
  args?: Record<string, unknown> | string;
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
  ErrorTrace?: BackendErrorTrace[] | string | null;
  error_trace?: ErrorTrace[] | string | null;
  Tags?: string[];
  tags?: string[];
  UniqueKey?: string | null;
  unique_key?: string | null;
  Metadata?: Record<string, unknown> | string;
  metadata?: Record<string, unknown> | string;
};

type BackendWorker = {
  ID?: string;
  id?: string;
  Queues?: Record<string, number>;
  queues?: Record<string, number>;
  StartedAt?: string;
  started_at?: string;
  LastSeen?: string;
  last_seen?: string;
};

type BackendJobsPage = {
  jobs?: BackendJob[];
  Jobs?: BackendJob[];
  limit?: number;
  Limit?: number;
  offset?: number;
  Offset?: number;
  has_more?: boolean;
  HasMore?: boolean;
};

function parseJsonField<T>(value: T | string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
}

function transformErrorTrace(raw: BackendErrorTrace): ErrorTrace {
  return {
    attempt: raw.attempt ?? raw.Attempt ?? 0,
    error: raw.error ?? raw.Error ?? '',
    at: raw.at ?? raw.At ?? '',
  };
}

function transformErrorTraceList(raw: BackendJob['error_trace'] | BackendJob['ErrorTrace']): ErrorTrace[] | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as BackendErrorTrace[];
      return Array.isArray(parsed) ? parsed.map(transformErrorTrace) : null;
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw)) return null;
  return (raw as BackendErrorTrace[]).map(transformErrorTrace);
}

export function transformJob(raw: BackendJob): Job {
  return {
    id: raw.id ?? raw.ID ?? 0,
    queue: raw.queue ?? raw.Queue ?? '',
    kind: raw.kind ?? raw.Kind ?? '',
    args: parseJsonField<Record<string, unknown>>(raw.args ?? raw.Args, {}),
    state: (raw.state ?? raw.State ?? 'pending') as JobState,
    priority: raw.priority ?? raw.Priority ?? 0,
    attempt: raw.attempt ?? raw.Attempt ?? 0,
    max_attempts: raw.max_attempts ?? raw.MaxAttempts ?? 0,
    attempted_by: raw.attempted_by ?? raw.AttemptedBy ?? [],
    scheduled_at: raw.scheduled_at ?? raw.ScheduledAt ?? '',
    attempted_at: raw.attempted_at ?? raw.AttemptedAt ?? null,
    finalized_at: raw.finalized_at ?? raw.FinalizedAt ?? null,
    created_at: raw.created_at ?? raw.CreatedAt ?? '',
    error_trace: transformErrorTraceList(raw.error_trace ?? raw.ErrorTrace),
    tags: raw.tags ?? raw.Tags ?? [],
    unique_key: raw.unique_key ?? raw.UniqueKey ?? null,
    metadata: parseJsonField<Record<string, unknown>>(raw.metadata ?? raw.Metadata, {}),
  };
}

export function transformJobsPage(raw: BackendJobsPage): {
  jobs: Job[];
  limit: number;
  offset: number;
  has_more: boolean;
} {
  const jobs = (raw.jobs ?? raw.Jobs ?? []).map(transformJob);
  return {
    jobs,
    limit: raw.limit ?? raw.Limit ?? jobs.length,
    offset: raw.offset ?? raw.Offset ?? 0,
    has_more: raw.has_more ?? raw.HasMore ?? false,
  };
}

export function transformQueueStats(raw: BackendQueueStats): QueueStats {
  return {
    name: raw.queue,
    pending: raw.pending,
    running: raw.running,
    scheduled: raw.scheduled,
    dead: raw.dead,
    completed: raw.completed ?? 0,
    failed: raw.failed ?? 0,
    paused: raw.paused,
  };
}

export function transformQueues(raw: BackendQueueStats[]): QueueStats[] {
  return raw.map(transformQueueStats);
}

export function transformWorker(raw: BackendWorker): WorkerInstance {
  return {
    id: raw.id ?? raw.ID ?? '',
    queues: raw.queues ?? raw.Queues ?? {},
    started_at: raw.started_at ?? raw.StartedAt ?? '',
    last_seen: raw.last_seen ?? raw.LastSeen ?? '',
  };
}

export function transformWorkers(raw: BackendWorker[]): WorkerInstance[] {
  return raw.map(transformWorker);
}

function sumQueueCounts(queues: BackendQueueStats[], field: 'completed' | 'failed'): number {
  return queues.reduce((sum, q) => sum + (q[field] ?? 0), 0);
}

export type StatsSnapshot = {
  completed: number;
  failed: number;
};

export function snapshotQueueCounts(parsed: unknown): StatsSnapshot {
  if (!Array.isArray(parsed)) {
    return { completed: 0, failed: 0 };
  }
  return {
    completed: sumQueueCounts(parsed as BackendQueueStats[], 'completed'),
    failed: sumQueueCounts(parsed as BackendQueueStats[], 'failed'),
  };
}

/**
 * Parses the SSE `stats` event payload into LiveStats.
 * Throughput and error rate are derived from count deltas between SSE ticks (~5s).
 */
export function parseStatsEvent(
  data: string,
  previous?: StatsSnapshot,
  intervalSeconds = 5,
): LiveStats {
  const parsed: unknown = JSON.parse(data);

  if (!Array.isArray(parsed)) {
    const stats = parsed as LiveStats;
    return {
      ...stats,
      queues: stats.queues.map((q) =>
        'queue' in q ? transformQueueStats(q as unknown as BackendQueueStats) : q,
      ),
    };
  }

  const queues = transformQueues(parsed as BackendQueueStats[]);
  const snapshot = snapshotQueueCounts(parsed);

  let throughput_per_min = 0;
  let error_rate_per_min = 0;

  if (previous) {
    const completedDelta = Math.max(0, snapshot.completed - previous.completed);
    const failedDelta = Math.max(0, snapshot.failed - previous.failed);
    const scale = 60 / intervalSeconds;
    throughput_per_min = Math.round(completedDelta * scale);
    error_rate_per_min = Math.round(failedDelta * scale);
  }

  return {
    queues,
    throughput_per_min,
    error_rate_per_min,
    workers_online: 0,
  };
}
