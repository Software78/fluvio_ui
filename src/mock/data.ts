import type {
  BackendConcurrencySlot,
  BackendJob,
  BackendPeriodicJob,
  BackendWorker,
  BackendWorkflow,
} from './types';

const now = new Date();
const ago = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();
const ahead = (mins: number) => new Date(now.getTime() + mins * 60_000).toISOString();

export const INITIAL_PAUSED_QUEUES = new Set(['reports']);

export const INITIAL_JOBS: BackendJob[] = [
  {
    id: 1, queue: 'default', kind: 'process_order', args: { order_id: 'ORD-1001', amount: 149.99 },
    state: 'running', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-1'],
    scheduled_at: ago(5), attempted_at: ago(2), finalized_at: null, died_at: null, created_at: ago(10),
    error_trace: null, logs: [{ at: ago(2), level: 'info', message: 'Processing order ORD-1001' }],
    tags: ['orders'], unique_key: null, metadata: {},
  },
  {
    id: 2, queue: 'default', kind: 'process_order', args: { order_id: 'ORD-1002', amount: 89.50 },
    state: 'running', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-2'],
    scheduled_at: ago(8), attempted_at: ago(3), finalized_at: null, died_at: null, created_at: ago(12),
    error_trace: null, logs: [{ at: ago(3), level: 'info', message: 'Processing order ORD-1002' }],
    tags: ['orders'], unique_key: null, metadata: {},
  },
  {
    id: 3, queue: 'default', kind: 'send_notification', args: { user_id: 42, channel: 'push' },
    state: 'pending', priority: 1, attempt: 0, max_attempts: 5, attempted_by: [],
    scheduled_at: ago(1), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(1),
    error_trace: null, logs: null, tags: ['notifications'], unique_key: null, metadata: {},
  },
  {
    id: 4, queue: 'default', kind: 'send_notification', args: { user_id: 87, channel: 'email' },
    state: 'pending', priority: 0, attempt: 0, max_attempts: 5, attempted_by: [],
    scheduled_at: ago(2), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(2),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 5, queue: 'default', kind: 'generate_invoice', args: { invoice_id: 'INV-550' },
    state: 'scheduled', priority: 0, attempt: 0, max_attempts: 3, attempted_by: [],
    scheduled_at: ahead(30), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(5),
    error_trace: null, logs: null, tags: ['billing'], unique_key: null, metadata: {},
  },
  {
    id: 6, queue: 'default', kind: 'sync_inventory', args: { warehouse: 'east' },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-1'],
    scheduled_at: ago(60), attempted_at: ago(55), finalized_at: ago(54), died_at: null, created_at: ago(65),
    error_trace: null, logs: [{ at: ago(54), level: 'info', message: 'Inventory sync complete' }],
    tags: [], unique_key: null, metadata: {},
  },
  {
    id: 7, queue: 'default', kind: 'sync_inventory', args: { warehouse: 'west' },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-3'],
    scheduled_at: ago(45), attempted_at: ago(40), finalized_at: ago(39), died_at: null, created_at: ago(50),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 8, queue: 'default', kind: 'process_refund', args: { refund_id: 'REF-22' },
    state: 'failed', priority: 2, attempt: 2, max_attempts: 3, attempted_by: ['worker-2'],
    scheduled_at: ago(20), attempted_at: ago(15), finalized_at: null, died_at: null, created_at: ago(25),
    error_trace: [
      { attempt: 1, error: 'payment gateway timeout', at: ago(18) },
      { attempt: 2, error: 'invalid refund amount: negative value', at: ago(15) },
    ],
    logs: [
      { at: ago(18), level: 'warn', message: 'Retry scheduled after gateway timeout' },
      { at: ago(15), level: 'error', message: 'Refund validation failed' },
    ],
    tags: ['billing'], unique_key: null, metadata: {},
  },
  {
    id: 9, queue: 'default', kind: 'cleanup_temp_files', args: { older_than_days: 7 },
    state: 'cancelled', priority: 0, attempt: 0, max_attempts: 1, attempted_by: [],
    scheduled_at: ago(30), attempted_at: null, finalized_at: ago(28), died_at: null, created_at: ago(35),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 10, queue: 'emails', kind: 'send_welcome_email', args: { email: 'alice@example.com', name: 'Alice' },
    state: 'running', priority: 0, attempt: 1, max_attempts: 5, attempted_by: ['worker-1'],
    scheduled_at: ago(3), attempted_at: ago(1), finalized_at: null, died_at: null, created_at: ago(6),
    error_trace: null, logs: [{ at: ago(1), level: 'info', message: 'Sending welcome email' }],
    tags: ['onboarding'], unique_key: null, metadata: {},
  },
  {
    id: 11, queue: 'emails', kind: 'send_digest', args: { user_id: 101, period: 'weekly' },
    state: 'pending', priority: 0, attempt: 0, max_attempts: 3, attempted_by: [],
    scheduled_at: ago(4), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(4),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 12, queue: 'emails', kind: 'send_digest', args: { user_id: 102, period: 'weekly' },
    state: 'pending', priority: 0, attempt: 0, max_attempts: 3, attempted_by: [],
    scheduled_at: ago(4), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(4),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 13, queue: 'emails', kind: 'send_password_reset', args: { email: 'bob@example.com' },
    state: 'completed', priority: 1, attempt: 1, max_attempts: 3, attempted_by: ['worker-2'],
    scheduled_at: ago(90), attempted_at: ago(88), finalized_at: ago(87), died_at: null, created_at: ago(95),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 14, queue: 'emails', kind: 'send_campaign', args: { campaign_id: 'CAMP-9', recipients: 1200 },
    state: 'failed', priority: 0, attempt: 1, max_attempts: 2, attempted_by: ['worker-3'],
    scheduled_at: ago(40), attempted_at: ago(38), finalized_at: null, died_at: null, created_at: ago(45),
    error_trace: [{ attempt: 1, error: 'SMTP connection refused: mail.internal:587', at: ago(38) }],
    logs: [{ at: ago(38), level: 'error', message: 'SMTP connection failed' }],
    tags: ['marketing'], unique_key: null, metadata: {},
  },
  {
    id: 15, queue: 'reports', kind: 'generate_daily_report', args: { date: '2026-06-08' },
    state: 'scheduled', priority: 0, attempt: 0, max_attempts: 2, attempted_by: [],
    scheduled_at: ahead(120), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(10),
    error_trace: null, logs: null, tags: ['reports'], unique_key: null, metadata: {},
  },
  {
    id: 16, queue: 'reports', kind: 'generate_weekly_report', args: { week: 23 },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 2, attempted_by: ['worker-1'],
    scheduled_at: ago(200), attempted_at: ago(195), finalized_at: ago(190), died_at: null, created_at: ago(210),
    error_trace: null, logs: null, tags: ['reports'], unique_key: null, metadata: {},
  },
  {
    id: 17, queue: 'default', kind: 'import_csv', args: { file: 'users_2026.csv', rows: 4500 },
    state: 'dead', priority: 0, attempt: 3, max_attempts: 3, attempted_by: ['worker-2', 'worker-3'],
    scheduled_at: ago(300), attempted_at: ago(280), finalized_at: null, died_at: ago(275), created_at: ago(310),
    error_trace: [
      { attempt: 1, error: 'CSV parse error at line 42', at: ago(295) },
      { attempt: 2, error: 'duplicate key violation', at: ago(285) },
      { attempt: 3, error: 'disk full on import volume', at: ago(275) },
    ],
    logs: [{ at: ago(275), level: 'error', message: 'Job moved to dead letter queue' }],
    tags: [], unique_key: null, metadata: {},
  },
  {
    id: 18, queue: 'emails', kind: 'send_bounce_handler', args: { message_id: 'msg-8821' },
    state: 'dead', priority: 0, attempt: 5, max_attempts: 5, attempted_by: ['worker-1'],
    scheduled_at: ago(400), attempted_at: ago(350), finalized_at: null, died_at: ago(340), created_at: ago(420),
    error_trace: [{ attempt: 5, error: 'permanent bounce: mailbox does not exist', at: ago(340) }],
    logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 19, queue: 'default', kind: 'webhook_delivery', args: { url: 'https://partner.example/hook', payload: { event: 'order.created' } },
    state: 'dead', priority: 1, attempt: 3, max_attempts: 3, attempted_by: ['worker-3'],
    scheduled_at: ago(500), attempted_at: ago(480), finalized_at: null, died_at: ago(470), created_at: ago(510),
    error_trace: [{ attempt: 3, error: 'HTTP 503 from partner endpoint', at: ago(470) }],
    logs: null, tags: ['webhooks'], unique_key: null, metadata: {},
  },
  {
    id: 20, queue: 'reports', kind: 'export_analytics', args: { format: 'parquet', range: '30d' },
    state: 'dead', priority: 0, attempt: 2, max_attempts: 2, attempted_by: ['worker-1'],
    scheduled_at: ago(600), attempted_at: ago(580), finalized_at: null, died_at: ago(570), created_at: ago(620),
    error_trace: [{ attempt: 2, error: 'S3 upload failed: access denied', at: ago(570) }],
    logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 21, queue: 'default', kind: 'resize_image', args: { image_id: 'img-441', width: 800 },
    state: 'dead', priority: 0, attempt: 3, max_attempts: 3, attempted_by: ['worker-2'],
    scheduled_at: ago(700), attempted_at: ago(690), finalized_at: null, died_at: ago(685), created_at: ago(710),
    error_trace: [{ attempt: 3, error: 'unsupported image format: HEIC', at: ago(685) }],
    logs: null, tags: ['media'], unique_key: null, metadata: {},
  },
  {
    id: 22, queue: 'default', kind: 'process_order', args: { order_id: 'ORD-1003', amount: 299.00 },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-1'],
    scheduled_at: ago(15), attempted_at: ago(12), finalized_at: ago(11), died_at: null, created_at: ago(18),
    error_trace: null, logs: null, tags: ['orders'], unique_key: null, metadata: {},
  },
  {
    id: 23, queue: 'default', kind: 'process_order', args: { order_id: 'ORD-1004', amount: 45.00 },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-2'],
    scheduled_at: ago(25), attempted_at: ago(22), finalized_at: ago(21), died_at: null, created_at: ago(28),
    error_trace: null, logs: null, tags: ['orders'], unique_key: null, metadata: {},
  },
  {
    id: 24, queue: 'emails', kind: 'send_receipt', args: { order_id: 'ORD-1003' },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-1'],
    scheduled_at: ago(10), attempted_at: ago(9), finalized_at: ago(8), died_at: null, created_at: ago(12),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 25, queue: 'default', kind: 'validate_address', args: { address: '123 Main St' },
    state: 'failed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-3'],
    scheduled_at: ago(35), attempted_at: ago(33), finalized_at: null, died_at: null, created_at: ago(40),
    error_trace: [{ attempt: 1, error: 'geocoding API rate limit exceeded', at: ago(33) }],
    logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 26, queue: 'reports', kind: 'aggregate_metrics', args: { metric: 'revenue', window: '1h' },
    state: 'running', priority: 0, attempt: 1, max_attempts: 2, attempted_by: ['worker-1'],
    scheduled_at: ago(7), attempted_at: ago(4), finalized_at: null, died_at: null, created_at: ago(8),
    error_trace: null, logs: [{ at: ago(4), level: 'info', message: 'Aggregating revenue metrics' }],
    tags: ['reports'], unique_key: null, metadata: {},
  },
  {
    id: 27, queue: 'default', kind: 'cache_warmup', args: { keys: ['products', 'categories'] },
    state: 'scheduled', priority: -1, attempt: 0, max_attempts: 1, attempted_by: [],
    scheduled_at: ahead(60), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(3),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 28, queue: 'emails', kind: 'send_verification', args: { email: 'carol@example.com' },
    state: 'cancelled', priority: 0, attempt: 0, max_attempts: 3, attempted_by: [],
    scheduled_at: ago(50), attempted_at: null, finalized_at: ago(48), died_at: null, created_at: ago(55),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
  {
    id: 29, queue: 'default', kind: 'fraud_check', args: { transaction_id: 'TXN-9912' },
    state: 'pending', priority: 5, attempt: 0, max_attempts: 2, attempted_by: [],
    scheduled_at: ago(0.5), attempted_at: null, finalized_at: null, died_at: null, created_at: ago(0.5),
    error_trace: null, logs: null, tags: ['security'], unique_key: 'fraud-TXN-9912', metadata: {},
  },
  {
    id: 30, queue: 'default', kind: 'update_search_index', args: { entity: 'product', id: 5521 },
    state: 'completed', priority: 0, attempt: 1, max_attempts: 3, attempted_by: ['worker-3'],
    scheduled_at: ago(8), attempted_at: ago(7), finalized_at: ago(6), died_at: null, created_at: ago(9),
    error_trace: null, logs: null, tags: [], unique_key: null, metadata: {},
  },
];

export const INITIAL_WORKERS: BackendWorker[] = [
  {
    id: 'worker-1',
    queues: { default: 4, emails: 2, reports: 2 },
    started_at: ago(1440),
    last_seen: ago(0.1),
  },
  {
    id: 'worker-2',
    queues: { default: 3, emails: 2, reports: 0 },
    started_at: ago(720),
    last_seen: ago(0.2),
  },
  {
    id: 'worker-3',
    queues: { default: 2, emails: 1, reports: 1 },
    started_at: ago(360),
    last_seen: ago(0.3),
  },
];

export const INITIAL_PERIODIC: BackendPeriodicJob[] = [
  {
    kind: 'cleanup_temp_files', cron: '0 3 * * *', queue: 'default', max_attempts: 1,
    args: { older_than_days: 7 }, next_run_at: ahead(480), last_run_at: ago(960), paused: false,
  },
  {
    kind: 'send_daily_digest', cron: '0 8 * * *', queue: 'emails', max_attempts: 3,
    args: { template: 'daily_digest' }, next_run_at: ahead(300), last_run_at: ago(1140), paused: false,
  },
  {
    kind: 'generate_daily_report', cron: '0 1 * * *', queue: 'reports', max_attempts: 2,
    args: { format: 'pdf' }, next_run_at: ahead(600), last_run_at: ago(1380), paused: true,
  },
  {
    kind: 'sync_inventory', cron: '*/15 * * * *', queue: 'default', max_attempts: 3,
    args: { warehouses: ['east', 'west'] }, next_run_at: ahead(10), last_run_at: ago(5), paused: false,
  },
];

export const INITIAL_WORKFLOWS: BackendWorkflow[] = [
  {
    id: 'wf-order-1001',
    state: 'running',
    created_at: ago(15),
    tasks: [
      { task_id: 'validate', state: 'completed', depends_on: [], job_id: 22 },
      { task_id: 'charge', state: 'completed', depends_on: ['validate'], job_id: 23 },
      { task_id: 'notify', state: 'running', depends_on: ['charge'], job_id: 10 },
      { task_id: 'fulfill', state: 'pending', depends_on: ['charge'], job_id: null },
    ],
  },
  {
    id: 'wf-onboard-alice',
    state: 'completed',
    created_at: ago(200),
    tasks: [
      { task_id: 'create_account', state: 'completed', depends_on: [], job_id: 13 },
      { task_id: 'send_welcome', state: 'completed', depends_on: ['create_account'], job_id: 13 },
      { task_id: 'setup_defaults', state: 'completed', depends_on: ['create_account'], job_id: 6 },
    ],
  },
  {
    id: 'wf-report-export',
    state: 'failed',
    created_at: ago(600),
    tasks: [
      { task_id: 'aggregate', state: 'completed', depends_on: [], job_id: 16 },
      { task_id: 'export', state: 'failed', depends_on: ['aggregate'], job_id: 20 },
      { task_id: 'notify_team', state: 'cancelled', depends_on: ['export'], job_id: null },
    ],
  },
];

export const INITIAL_CONCURRENCY: BackendConcurrencySlot[] = [
  { kind: 'process_order', partition_key: 'default', running: 2, max_concurrent: 5 },
  { kind: 'send_campaign', partition_key: 'emails', running: 0, max_concurrent: 1 },
  { kind: 'generate_daily_report', partition_key: 'reports', running: 0, max_concurrent: 2 },
  { kind: 'fraud_check', partition_key: 'global', running: 0, max_concurrent: 10 },
];

export const QUEUE_NAMES = ['default', 'emails', 'reports'] as const;
