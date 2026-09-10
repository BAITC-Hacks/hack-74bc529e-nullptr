import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { privateApi } from '../lib/api.server'
import { readBody } from '../lib/http'
import { fileKey, listFiles } from '../lib/storage.server'

export const Route = createFileRoute('/api/files')({
  server: {
    handlers: {
      GET: ({ request }) =>
        privateApi(request, async (userId) =>
          Response.json(await listFiles(userId)),
        ),
      POST: ({ request }) =>
        privateApi(request, async (userId) => {
          const encodedName = request.headers.get('X-File-Name')
          let name: string
          try {
            name = decodeURIComponent(encodedName ?? '')
          } catch {
            name = ''
          }
          if (!name || name.length > 255 || /[\x00-\x1f\x7f/\\]/.test(name)) {
            return Response.json(
              { error: 'Provide a valid X-File-Name header.' },
              { status: 400 },
            )
          }
          const body = await readBody(request, 5 * 1024 * 1024)
          const id = crypto.randomUUID()
          await env.BUCKET.put(fileKey(userId, id), body, {
            httpMetadata: { contentType: 'application/octet-stream' },
            customMetadata: { name },
          })
          return Response.json(
            { id, name, size: body.byteLength },
            { status: 201 },
          )
        }),
    },
  },
})
