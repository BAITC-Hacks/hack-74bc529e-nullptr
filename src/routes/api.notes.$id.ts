import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { getDb } from '../db/index.server'
import { notes } from '../db/schema'
import { privateApi } from '../lib/api.server'
import { idInput } from '../lib/validation'

export const Route = createFileRoute('/api/notes/$id')({
  server: {
    handlers: {
      DELETE: ({ request, params }) =>
        privateApi(request, async (userId) => {
          const id = idInput.parse(params.id)
          const db = getDb()
          const owned = and(eq(notes.id, id), eq(notes.userId, userId))
          const note = await db
            .select({ id: notes.id })
            .from(notes)
            .where(owned)
            .get()
          if (!note)
            return Response.json({ error: 'Note not found.' }, { status: 404 })
          if (env.VECTOR_SEARCH_ENABLED === 'true' && env.VECTORIZE)
            await env.VECTORIZE.deleteByIds([id])
          await db.delete(notes).where(owned)
          return new Response(null, { status: 204 })
        }),
    },
  },
})
