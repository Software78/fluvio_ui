export type JobState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "dead"
  | "scheduled"
  | "cancelled";

export type ErrorTrace = {
  attempt: number;
  error: string;
  at: string; // ISO 8601
};

export type Job = {
  id: number;
  queue: string;
  kind: string;
  args: Record<string, unknown>; // parsed JSON
  state: JobState;
  priority: number;
  attempt: number;
  max_attempts: number;
  attempted_by: string[];
  scheduled_at: string; // ISO 8601
  attempted_at: string | null;
  finalized_at: string | null;
  created_at: string;
  error_trace: ErrorTrace[] | null;
  tags: string[];
  unique_key: string | null;
  metadata: Record<string, unknown>;
};

export type QueueStats = {
  name: string;
  pending: number;
  running: number;
  scheduled: number;
  dead: number;
  completed: number;
  failed: number;
  paused: boolean;
};

export type JobsPage = {
  jobs: Job[];
  limit: number;
  offset: number;
  has_more: boolean;
};

export type WorkerInstance = {
  id: string;
  queues: Record<string, number>;
  started_at: string;
  last_seen: string;
};

export type LiveStats = {
  queues: QueueStats[];
  throughput_per_min: number;
  error_rate_per_min: number;
  workers_online: number;
};
