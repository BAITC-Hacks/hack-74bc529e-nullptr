import { env } from 'cloudflare:workers'

export function getDraft(userId: string) {
  return env.KV.get(`users:${userId}:draft`)
}

export function saveDraft(userId: string, content: string) {
  return env.KV.put(`users:${userId}:draft`, content, {
    expirationTtl: 60 * 60 * 24 * 7,
  })
}

export function fileKey(userId: string, id: string) {
  return `users/${userId}/files/${id}`
}

export async function listFiles(userId: string) {
  const result = await env.BUCKET.list({
    prefix: `users/${userId}/files/`,
    limit: 100,
    include: ['customMetadata'],
  })
  return result.objects.map((object) => ({
    id: object.key.split('/').at(-1)!,
    name: object.customMetadata?.name ?? 'file',
    size: object.size,
    uploadedAt: object.uploaded.toISOString(),
  }))
}
