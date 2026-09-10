import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { privateApi } from '../lib/api.server'
import { fileKey } from '../lib/storage.server'
import { idInput } from '../lib/validation'

export const Route = createFileRoute('/api/files/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        privateApi(request, async (userId) => {
          const object = await env.BUCKET.get(
            fileKey(userId, idInput.parse(params.id)),
          )
          if (!object)
            return Response.json({ error: 'File not found.' }, { status: 404 })
          const name = encodeURIComponent(
            object.customMetadata?.name ?? 'file',
          ).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)
          return new Response(object.body, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename="download"; filename*=UTF-8''${name}`,
              'Content-Length': String(object.size),
              'X-Content-Type-Options': 'nosniff',
            },
          })
        }),
      DELETE: ({ request, params }) =>
        privateApi(request, async (userId) => {
          await env.BUCKET.delete(fileKey(userId, idInput.parse(params.id)))
          return new Response(null, { status: 204 })
        }),
    },
  },
})
