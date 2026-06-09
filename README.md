# Fluvio Console

A React admin dashboard for monitoring and operating [Fluvio](https://github.com/Software78/fluvio) job queues. Connects to the `fluviui` HTTP API exposed by your Fluvio backend.

## Features

- **Dashboard** — live queue telemetry via SSE, throughput and error-rate sparklines
- **Jobs** — paginated listing with queue/state/kind filters and job detail view
- **Queues** — per-queue stats with pause/resume controls
- **Workers** — live fleet registry of processing clients

## Quick start

### Prerequisites

- Node.js 22+
- A running Fluvio backend with `fluviui.Handler` mounted (see [Fluvio README](https://github.com/Software78/fluvio#4-web-api))

### Development

```bash
npm install
cp .env .env.local   # optional — edit VITE_API_BASE_URL if needed
npm run dev
```

Open http://localhost:5173. By default the UI calls `http://localhost:8080/fluvio/api`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Base URL of the Fluvio API server. Leave blank for same-origin (reverse-proxy setups). |
| `VITE_API_BASIC_AUTH_USER` | No | Username for HTTP basic auth on REST requests. |
| `VITE_API_BASIC_AUTH_PASSWORD` | No | Password for HTTP basic auth on REST requests. |

Both basic-auth variables must be set for credentials to be sent.

### Docker

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  --build-arg VITE_API_BASIC_AUTH_USER=admin \
  --build-arg VITE_API_BASIC_AUTH_PASSWORD=secret \
  -t fluvio_ui .

docker run -p 8081:80 fluvio_ui
```

Images are also published to `ghcr.io/software78/fluvio_ui`.

## API endpoints

The UI consumes these `fluviui` routes (all prefixed with `/fluvio/api`):

| Method | Path | Used by |
|---|---|---|
| `GET` | `/queues` | Dashboard, Queues, Jobs |
| `POST` | `/queues/{name}/pause` | Queues |
| `POST` | `/queues/{name}/resume` | Queues |
| `GET` | `/jobs` | Jobs (supports `queue`, `state`, `kind`, `limit`, `offset`) |
| `GET` | `/jobs/{id}` | Job detail |
| `GET` | `/workers` | Workers, header worker count |
| `GET` | `/events` | Dashboard SSE stream (`event: stats`, every 5s) |

## Secured deployment

Fluvio recommends protecting `fluviui.Handler` with middleware (e.g. basic auth):

```go
mux.Handle("/fluvio/", fluviui.Handler(client,
    fluviui.WithAllowedOrigin("https://your-ui.example.com"),
    fluviui.WithMiddleware(basicAuthMiddleware),
))
```

Set `VITE_API_BASIC_AUTH_USER` and `VITE_API_BASIC_AUTH_PASSWORD` at build time so REST calls include an `Authorization` header.

**SSE caveat:** the browser `EventSource` API cannot send custom headers. If your backend requires header-based basic auth, the Dashboard SSE stream will fail unless you:

- Serve UI and API on the same origin behind a reverse proxy that handles authentication, or
- Use cookie/session-based auth instead of header-based basic auth

REST pages (Jobs, Queues, Workers) work with basic auth env vars; the Dashboard live stream may need additional proxy configuration.

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve dist/ locally
```

## License

Apache 2.0 — see the [Fluvio](https://github.com/Software78/fluvio) project for backend licensing.
