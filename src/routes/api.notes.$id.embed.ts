import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db/index.server'
import { notes } from '../db/schema'
import { privateApi } from '../lib/api.server'
import { requireAiAccess } from '../lib/ai-access.server'
import { indexNote } from '../lib/search.server'
import { idInput } from '../lib/validation'

export const Route = createFileRoute('/api/notes/$id/embed')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        privateApi(request, async (userId, log) => {
          await requireAiAccess(userId, log)
          const id = idInput.parse(params.id)
          const note = await getDb()
            .select()
            .from(notes)
            .where(and(eq(notes.id, id), eq(notes.userId, userId)))
            .get()
          if (!note)
            return Response.json({ error: 'Note not found.' }, { status: 404 })
          return Response.json(await indexNote(userId, id, note.content), {
            status: 202,
          })
        }),
    },
  },
})
