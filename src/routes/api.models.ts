import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { privateApi } from '../lib/api.server'
import { requireAiAccess } from '../lib/ai-access.server'
import { DEFAULT_CHAT_MODEL, isChatModel } from '../lib/chat-models'

const modelList = z.object({ data: z.array(z.object({ id: z.string() })) })

export const Route = createFileRoute('/api/models')({
  server: {
    handlers: {
      GET: ({ request }) =>
        privateApi(request, async (userId) => {
          await requireAiAccess(userId)
          if (!env.OPENAI_API_KEY) {
            return Response.json(
              { error: 'AI chat is not configured.' },
              { status: 503 },
            )
          }
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
            signal: AbortSignal.any([
              request.signal,
              AbortSignal.timeout(10_000),
            ]),
          })
          if (!response.ok) {
            return Response.json(
              { error: 'Could not load models. Try again.' },
              { status: 502 },
            )
          }
          const { data } = modelList.parse(await response.json())
          const models = [
            ...new Set(data.map(({ id }) => id).filter(isChatModel)),
          ].sort()
          return Response.json({ models, defaultModel: DEFAULT_CHAT_MODEL })
        }),
    },
  },
})
