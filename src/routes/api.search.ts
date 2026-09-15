import { createFileRoute } from '@tanstack/react-router'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/index.server'
import { notes } from '../db/schema'
import { privateApi } from '../lib/api.server'
import { requireAiAccess } from '../lib/ai-access.server'
import { readJson } from '../lib/http'
import { searchNotes } from '../lib/search.server'
import { searchInput } from '../lib/validation'

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      POST: ({ request }) =>
        privateApi(request, async (userId) => {
          await requireAiAccess(userId)
          const { query } = searchInput.parse(await readJson(request))
          const result = await searchNotes(userId, query)
          if (!result.matches.length) return Response.json([])
          const rows = await getDb()
            .select()
            .from(notes)
            .where(
              and(
                eq(notes.userId, userId),
                inArray(
                  notes.id,
                  result.matches.map(({ id }) => id),
                ),
              ),
            )
          // D1 ownership is authoritative, including while Vectorize deletions propagate.
          return Response.json(
            result.matches.flatMap((match) => {
              const note = rows.find(({ id }) => id === match.id)
              return note ? [{ ...note, score: match.score }] : []
            }),
          )
        }),
    },
  },
})
