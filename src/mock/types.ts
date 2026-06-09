import type { JobState } from '../api/types';

export type BackendJob = {
  id: number;
  queue: string;
  kind: string;
  args: Record<string, unknown>;
  state: JobState;
  priority: number;
  attempt: number;
  max_attempts: number;
  attempted_by: string[];
  scheduled_at: string;
  attempted_at: string | null;
  finalized_at: string | null;
  died_at: string | null;
  created_at: string;
  error_trace: { attempt: number; error: string; at: string }[] | null;
  logs: { at: string; level: string; message: string; data?: Record<string, unknown> }[] | null;
  tags: string[];
  unique_key: string | null;
  metadata: Record<string, unknown>;
};

export type BackendQueueStats = {
  queue: string;
  pending: number;
  running: number;
  scheduled: number;
  dead: number;
  completed: number;
  failed: number;
  cancelled: number;
  paused: boolean;
};

export type BackendWorker = {
  id: string;
  queues: Record<string, number>;
  started_at: string;
  last_seen: string;
};

export type BackendPeriodicJob = {
  kind: string;
  cron: string;
  queue: string;
  max_attempts: number;
  args: Record<string, unknown>;
  next_run_at: string;
  last_run_at: string | null;
  paused: boolean;
};

export type BackendWorkflowTask = {
  task_id: string;
  state: string;
  depends_on: string[];
  job_id: number | null;
};

export type BackendWorkflow = {
  id: string;
  state: string;
  tasks: BackendWorkflowTask[];
  created_at: string;
};

export type BackendConcurrencySlot = {
  kind: string;
  partition_key: string;
  running: number;
  max_concurrent: number;
};
