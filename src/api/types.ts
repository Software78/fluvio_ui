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

export type JobLogLevel = "debug" | "info" | "warn" | "error";

export type JobLogEntry = {
  at: string; // ISO 8601
  level: JobLogLevel | string;
  message: string;
  data?: Record<string, unknown>;
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
  died_at: string | null;
  created_at: string;
  error_trace: ErrorTrace[] | null;
  logs: JobLogEntry[] | null;
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
  cancelled: number;
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

export type DeadJob = Job;

export type PeriodicJob = {
  kind: string;
  cron: string;
  queue: string;
  max_attempts: number;
  args: Record<string, unknown>;
  next_run_at: string;
  last_run_at: string | null;
  paused: boolean;
};

export type WorkflowTask = {
  task_id: string;
  state: string;
  depends_on: string[];
  job_id: number | null;
};

export type Workflow = {
  id: string;
  state: string;
  tasks: WorkflowTask[];
  created_at: string;
};

export type WorkflowsPage = {
  workflows: Workflow[];
  limit: number;
  offset: number;
  has_more: boolean;
};

export type QueueDetail = QueueStats & {
  worker_instances: number;
  worker_capacity: number;
};

export type ConcurrencySlot = {
  kind: string;
  partition_key: string;
  running: number;
  max_concurrent: number;
};

export type EnqueueRequest = {
  kind: string;
  queue?: string;
  args: Record<string, unknown>;
  priority?: number;
  max_attempts?: number;
  scheduled_at?: string;
  tags?: string[];
  unique_key?: string;
};

export type BulkReplayResponse = {
  replayed: number;
  errors?: { id: number; error: string }[];
};

export type PurgeDeadResponse = { purged: number };
export type OkResponse = { ok: boolean };
