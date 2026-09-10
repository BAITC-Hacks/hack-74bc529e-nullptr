import { createFileRoute } from '@tanstack/react-router'
import { privateApi } from '../lib/api.server'
import { readJson } from '../lib/http'
import { getDraft, saveDraft } from '../lib/storage.server'
import { draftInput } from '../lib/validation'

export const Route = createFileRoute('/api/draft')({
  server: {
    handlers: {
      GET: ({ request }) =>
        privateApi(request, async (userId) =>
          Response.json({ content: (await getDraft(userId)) ?? '' }),
        ),
      PUT: ({ request }) =>
        privateApi(request, async (userId) => {
          const { content } = draftInput.parse(await readJson(request))
          await saveDraft(userId, content)
          return new Response(null, { status: 204 })
        }),
    },
  },
})
