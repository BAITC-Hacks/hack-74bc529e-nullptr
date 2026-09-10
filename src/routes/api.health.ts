import { createFileRoute } from '@tanstack/react-router'

// Liveness only; does not expose configuration or query paid services.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: { GET: () => Response.json({ status: 'ok', app: 'hackalem' }) },
  },
})
