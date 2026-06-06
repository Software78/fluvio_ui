import type { Job, JobState, QueueStats, LiveStats } from './types';

// Mock Queues In-Memory State
let mockQueues: QueueStats[] = [
  { name: 'default', pending: 142, running: 8, scheduled: 23, dead: 0, paused: false },
  { name: 'critical', pending: 4, running: 2, scheduled: 0, dead: 1, paused: false },
  { name: 'low_priority', pending: 12, running: 1, scheduled: 50, dead: 3, paused: false },
  { name: 'reports', pending: 0, running: 0, scheduled: 0, dead: 0, paused: true }
];

// Mock Jobs In-Memory State
let mockJobs: Job[] = [
  {
    id: 2041,
    queue: 'default',
    kind: 'send_email',
    args: { to: 'user@example.com', subject: 'Welcome to Fluvio!', template: 'welcome_v2' },
    state: 'running',
    priority: 1,
    attempt: 2,
    max_attempts: 3,
    attempted_by: ['worker-01a', 'worker-02b'],
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    scheduled_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(), // 9m ago
    attempted_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1m ago
    finalized_at: null,
    tags: ['email', 'onboarding'],
    unique_key: 'welcome_email_user_123',
    metadata: { ip: '192.168.1.45', triggered_by: 'signup_webhook' },
    error_trace: [
      {
        attempt: 1,
        error: 'connection timeout: dial tcp 10.0.0.5:25: i/o timeout',
        at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 2040,
    queue: 'critical',
    kind: 'render_pdf',
    args: { invoice_id: 99881, format: 'a4', compress: true },
    state: 'completed',
    priority: 5,
    attempt: 1,
    max_attempts: 3,
    attempted_by: ['worker-01a'],
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    attempted_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    finalized_at: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
    tags: ['billing', 'invoices'],
    unique_key: null,
    metadata: { job_owner: 'billing_daemon' },
    error_trace: null
  },
  {
    id: 2039,
    queue: 'default',
    kind: 'sync_stripe',
    args: { customer_id: 'cus_NlkJdh38', force_refresh: false },
    state: 'pending',
    priority: 2,
    attempt: 0,
    max_attempts: 4,
    attempted_by: [],
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: null,
    tags: ['billing', 'sync'],
    unique_key: 'stripe_sync_cus_NlkJdh38',
    metadata: {},
    error_trace: null
  },
  {
    id: 2038,
    queue: 'low_priority',
    kind: 'cleanup_sessions',
    args: { older_than_days: 30, batch_size: 500 },
    state: 'scheduled',
    priority: 0,
    attempt: 0,
    max_attempts: 1,
    attempted_by: [],
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours in future
    attempted_at: null,
    finalized_at: null,
    tags: ['maintenance'],
    unique_key: null,
    metadata: {},
    error_trace: null
  },
  {
    id: 2037,
    queue: 'critical',
    kind: 'process_payment',
    args: { transaction_id: 'tx_9928371', gateway: 'braintree' },
    state: 'failed',
    priority: 10,
    attempt: 2,
    max_attempts: 3,
    attempted_by: ['worker-02b'],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    attempted_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    finalized_at: null,
    tags: ['payment'],
    unique_key: 'tx_9928371',
    metadata: {},
    error_trace: [
      {
        attempt: 2,
        error: 'Braintree Gateway Error: 503 Service Unavailable',
        at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        attempt: 1,
        error: 'Network failure: DNS lookup failed for api.braintree.com',
        at: new Date(Date.now() - 29 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 2036,
    queue: 'critical',
    kind: 'process_payment',
    args: { transaction_id: 'tx_9928370', gateway: 'braintree' },
    state: 'dead',
    priority: 10,
    attempt: 3,
    max_attempts: 3,
    attempted_by: ['worker-02b'],
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    attempted_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    finalized_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    tags: ['payment'],
    unique_key: 'tx_9928370',
    metadata: {},
    error_trace: [
      {
        attempt: 3,
        error: 'Braintree Gateway Error: 402 Card Declined',
        at: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      },
      {
        attempt: 2,
        error: 'Braintree Gateway Error: 402 Card Declined',
        at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      },
      {
        attempt: 1,
        error: 'Network failure: DNS lookup failed for api.braintree.com',
        at: new Date(Date.now() - 44 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 2035,
    queue: 'default',
    kind: 'send_email',
    args: { to: 'spammer@example.com', subject: 'Buy watches!' },
    state: 'cancelled',
    priority: 1,
    attempt: 0,
    max_attempts: 3,
    attempted_by: [],
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: new Date(Date.now() - 49 * 60 * 1000).toISOString(),
    tags: ['email'],
    unique_key: null,
    metadata: { cancelled_by: 'admin_dashboard' },
    error_trace: null
  },
  {
    id: 2034,
    queue: 'default',
    kind: 'generate_report',
    args: { report_id: 'rep_001', format: 'csv' },
    state: 'pending',
    priority: 1,
    attempt: 0,
    max_attempts: 3,
    attempted_by: [],
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: null,
    tags: ['reports'],
    unique_key: null,
    metadata: {},
    error_trace: null
  },
  {
    id: 2033,
    queue: 'default',
    kind: 'generate_report',
    args: { report_id: 'rep_002', format: 'csv' },
    state: 'pending',
    priority: 1,
    attempt: 0,
    max_attempts: 3,
    attempted_by: [],
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: null,
    tags: ['reports'],
    unique_key: null,
    metadata: {},
    error_trace: null
  },
  {
    id: 2032,
    queue: 'default',
    kind: 'generate_report',
    args: { report_id: 'rep_003', format: 'csv' },
    state: 'pending',
    priority: 1,
    attempt: 0,
    max_attempts: 3,
    attempted_by: [],
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: null,
    tags: ['reports'],
    unique_key: null,
    metadata: {},
    error_trace: null
  },
  {
    id: 2031,
    queue: 'default',
    kind: 'generate_report',
    args: { report_id: 'rep_004', format: 'csv' },
    state: 'pending',
    priority: 1,
    attempt: 0,
    max_attempts: 3,
    attempted_by: [],
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    scheduled_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    attempted_at: null,
    finalized_at: null,
    tags: ['reports'],
    unique_key: null,
    metadata: {},
    error_trace: null
  }
];

// Helper to simulate delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Functions for API endpoints
export const mockGetJobs = async (
  queue?: string,
  state?: JobState,
  kind?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ jobs: Job[]; total: number }> => {
  await delay();
  let filtered = [...mockJobs];
  
  if (queue) {
    filtered = filtered.filter(j => j.queue === queue);
  }
  if (state) {
    filtered = filtered.filter(j => j.state === state);
  }
  if (kind) {
    const query = kind.toLowerCase();
    filtered = filtered.filter(j => j.kind.toLowerCase().includes(query));
  }
  
  // Sort by created_at descending
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);
  
  return { jobs: paginated, total };
};

export const mockGetJobById = async (id: number): Promise<Job> => {
  await delay();
  const job = mockJobs.find(j => j.id === id);
  if (!job) {
    throw { status: 404, message: `Job with ID ${id} not found` };
  }
  return job;
};

export const mockCancelJob = async (id: number): Promise<{ ok: boolean }> => {
  await delay();
  const idx = mockJobs.findIndex(j => j.id === id);
  if (idx === -1) {
    throw { status: 404, message: `Job with ID ${id} not found` };
  }
  
  const job = mockJobs[idx];
  if (job.state !== 'pending' && job.state !== 'scheduled') {
    throw { status: 400, message: `Cannot cancel job in state: ${job.state}` };
  }
  
  // Update local job state
  mockJobs[idx] = {
    ...job,
    state: 'cancelled',
    finalized_at: new Date().toISOString()
  };
  
  // Update the corresponding queue counters
  const queueIdx = mockQueues.findIndex(q => q.name === job.queue);
  if (queueIdx !== -1) {
    const queue = mockQueues[queueIdx];
    if (job.state === 'pending') {
      mockQueues[queueIdx] = { ...queue, pending: Math.max(0, queue.pending - 1) };
    } else if (job.state === 'scheduled') {
      mockQueues[queueIdx] = { ...queue, scheduled: Math.max(0, queue.scheduled - 1) };
    }
  }
  
  return { ok: true };
};

export const mockGetQueues = async (): Promise<QueueStats[]> => {
  await delay();
  return [...mockQueues];
};

export const mockPauseQueue = async (name: string): Promise<{ ok: boolean }> => {
  await delay();
  const idx = mockQueues.findIndex(q => q.name === name);
  if (idx === -1) {
    throw { status: 404, message: `Queue '${name}' not found` };
  }
  
  mockQueues[idx] = {
    ...mockQueues[idx],
    paused: true
  };
  
  return { ok: true };
};

export const mockResumeQueue = async (name: string): Promise<{ ok: boolean }> => {
  await delay();
  const idx = mockQueues.findIndex(q => q.name === name);
  if (idx === -1) {
    throw { status: 404, message: `Queue '${name}' not found` };
  }
  
  mockQueues[idx] = {
    ...mockQueues[idx],
    paused: false
  };
  
  return { ok: true };
};

// Generates simulated live stats updates matching the SSE stream
export const generateLiveStats = (): LiveStats => {
  // Add slight randomized variations to throughput and error rate to make the UI feel alive
  const throughput_per_min = Math.max(15, 30 + Math.floor(Math.sin(Date.now() / 20000) * 15) + Math.floor(Math.random() * 8));
  const error_rate_per_min = Math.random() > 0.85 ? Math.floor(Math.random() * 4) : 0;
  
  return {
    queues: mockQueues,
    throughput_per_min,
    error_rate_per_min,
    workers_online: 4 + (Math.floor(Math.sin(Date.now() / 60000) * 1)) // fluctuates between 3 and 5
  };
};
