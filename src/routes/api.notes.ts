import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/index.server'
import { notes } from '../db/schema'
import { privateApi } from '../lib/api.server'
import { readJson } from '../lib/http'
import { noteInput } from '../lib/validation'

export const Route = createFileRoute('/api/notes')({
  server: {
    handlers: {
      GET: ({ request }) =>
        privateApi(request, async (userId) => {
          return Response.json(
            await getDb()
              .select()
              .from(notes)
              .where(eq(notes.userId, userId))
              .orderBy(desc(notes.createdAt))
              .limit(100),
          )
        }),
      POST: ({ request }) =>
        privateApi(request, async (userId) => {
          const { content } = noteInput.parse(await readJson(request))
          const note = {
            id: crypto.randomUUID(),
            userId,
            content,
            createdAt: new Date(),
          }
          await getDb().insert(notes).values(note)
          return Response.json(note, { status: 201 })
        }),
    },
  },
})
