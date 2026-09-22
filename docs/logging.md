# Logging

Production logs: Cloudflare dashboard → Workers & Pages → `hackalem` → Observability.
Live tail: `bun run cf tail --env production`.

Private API responses include a server-generated `X-Request-ID`. Filter structured
logs by `requestId` to correlate `api.response`, `api.failed`,
`auth.ai_access_failed`, and chat lifecycle events.

- `api.response`: method, route, status, and time until the response is ready.
  For SSE this is **not** the complete stream duration.
- `api.failed`: error category and bounded stack source locations.
- `ai.started`, `ai.completed`, `ai.failed`, `ai.aborted`: model and lifecycle;
  completion includes duration, time to first text chunk, and provider-reported
  token totals when available. Missing usage is unknown, not zero.

No prompts, completions, user IDs, credentials, request bodies, arbitrary error
messages, or abort reasons are logged. Resource IDs are replaced with `:id` in
application logs. Cloudflare invocation logs retain their own URL paths; query
strings are redacted by the Wrangler observability configuration.

This does not add browser analytics, tracing, cost estimation, or alerting.
Configuration changes take effect on deployment.
