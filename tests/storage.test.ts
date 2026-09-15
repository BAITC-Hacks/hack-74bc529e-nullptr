import { afterAll, beforeAll, expect, mock, test } from 'bun:test'
import { Miniflare } from 'miniflare'

// Exercise the real route handlers and local Cloudflare storage with two test identities.
// Clerk's remote session exchange is intentionally outside this offline test.
let userId: string | null = 'user_alice'
let metadata: Record<string, unknown> = {}
let clerkUnavailable = false
const getUser = mock(async (_id: string) => {
  if (clerkUnavailable) throw new Error('Clerk unavailable')
  return {
    privateMetadata: metadata,
    // These must never grant access, even when supplied by the client.
    publicMetadata: { aiAccess: true },
    unsafeMetadata: { aiAccess: true },
  }
})
mock.module('@clerk/tanstack-react-start/server', () => ({
  clerkClient: () => ({ users: { getUser } }),
}))
const bindings = { VECTOR_SEARCH_ENABLED: 'false' } as Cloudflare.Env
mock.module('cloudflare:workers', () => ({ env: bindings }))
mock.module('../src/lib/auth.server', () => ({
  requireUserId: async () => {
    if (!userId)
      throw Response.json({ error: 'Sign in to continue.' }, { status: 401 })
    return userId
  },
}))

const { Route: notes } = await import('../src/routes/api.notes')
const { Route: note } = await import('../src/routes/api.notes.$id')
const { Route: draft } = await import('../src/routes/api.draft')
const { Route: files } = await import('../src/routes/api.files')
const { Route: file } = await import('../src/routes/api.files.$id')
const { Route: chat } = await import('../src/routes/api.chat')
const { Route: search } = await import('../src/routes/api.search')
const { Route: indexNote } = await import('../src/routes/api.notes.$id.embed')
let mf: Miniflare

beforeAll(async () => {
  mf = new Miniflare({
    workers: [
      {
        config: {
          type: 'worker',
          name: 'storage-test',
          compatibilityDate: '2026-09-10',
          manifest: {
            mainModule: 'index.mjs',
            modules: {
              'index.mjs': {
                type: 'esm',
                contents:
                  'export default { fetch() { return new Response("test") } }',
              },
            },
          },
          env: {
            DB: { type: 'd1', id: 'DB' },
            KV: { type: 'kv', id: 'KV' },
            BUCKET: { type: 'r2', name: 'BUCKET' },
          },
        },
      },
    ],
  })
  bindings.DB = (await mf.getD1Database('DB')) as unknown as D1Database
  bindings.KV = (await mf.getKVNamespace('KV')) as unknown as KVNamespace
  const bucket = (await mf.getR2Bucket('BUCKET')) as unknown as R2Bucket
  // Miniflare's host proxy cannot transfer R2's stream into Bun's Response.
  // Materialize only that boundary; data still comes from the real R2 emulator.
  bindings.BUCKET = new Proxy(bucket, {
    get(target, property) {
      if (property === 'get')
        return async (key: string) => {
          const object = await target.get(key)
          if (!object) return null
          return {
            size: object.size,
            customMetadata: object.customMetadata,
            body: new Response(await object.arrayBuffer()).body,
          }
        }
      const value = Reflect.get(target, property)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as unknown as R2Bucket
  const sql = await Bun.file('drizzle/0000_initial.sql').text()
  await bindings.DB.batch(
    sql
      .split(';')
      .map((statement) =>
        statement.replace('--> statement-breakpoint', '').trim(),
      )
      .filter(Boolean)
      .map((statement) => bindings.DB.prepare(statement)),
  )
})

afterAll(async () => {
  await mf?.dispose()
})

type Handler = (args: {
  request: Request
  params: { id: string }
}) => Promise<Response>
async function call(route: unknown, method: string, body?: unknown, id = '') {
  const handlers = (
    route as { options: { server: { handlers: Record<string, Handler> } } }
  ).options.server.handlers
  return handlers[method]!({
    request: new Request('http://localhost:3000/api/test', {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    params: { id },
  })
}

test('D1 notes persist and ownership prevents another user from reading or deleting them', async () => {
  userId = 'user_alice'
  const created = await call(notes, 'POST', { content: 'A private idea' })
  expect(created.status).toBe(201)
  const saved = (await created.json()) as { id: string }
  expect(await (await call(notes, 'GET')).json()).toHaveLength(1)
  userId = 'user_bob'
  expect(await (await call(notes, 'GET')).json()).toHaveLength(0)
  expect((await call(note, 'DELETE', undefined, saved.id)).status).toBe(404)
  userId = 'user_alice'
  expect((await call(note, 'DELETE', undefined, saved.id)).status).toBe(204)
  expect(await (await call(notes, 'GET')).json()).toHaveLength(0)
})

test('KV draft saves and reads are isolated by user', async () => {
  userId = 'user_alice'
  expect((await call(draft, 'PUT', { content: 'My rough draft' })).status).toBe(
    204,
  )
  expect(await (await call(draft, 'GET')).text()).toBe(
    JSON.stringify({ content: 'My rough draft' }),
  )
  userId = 'user_bob'
  expect(await (await call(draft, 'GET')).text()).toBe(
    JSON.stringify({ content: '' }),
  )
})

test('R2 upload, list, download and delete preserve ownership and download headers', async () => {
  userId = 'user_alice'
  const handlers = files.options.server!.handlers as unknown as {
    POST: Handler
  }
  const uploaded = await handlers.POST({
    request: new Request('http://localhost:3000/api/files', {
      method: 'POST',
      headers: { 'X-File-Name': encodeURIComponent('idea α.txt') },
      body: 'hello from R2',
    }),
    params: { id: '' },
  })
  expect(uploaded.status).toBe(201)
  const { id } = (await uploaded.json()) as { id: string }
  expect(await (await call(files, 'GET')).json()).toHaveLength(1)
  userId = 'user_bob'
  expect(await (await call(files, 'GET')).json()).toHaveLength(0)
  expect((await call(file, 'GET', undefined, id)).status).toBe(404)
  await call(file, 'DELETE', undefined, id)
  userId = 'user_alice'
  const download = await call(file, 'GET', undefined, id)
  expect(await download.text()).toBe('hello from R2')
  expect(download.headers.get('Content-Disposition')).toContain(
    "filename*=UTF-8''idea%20%CE%B1.txt",
  )
  expect(download.headers.get('Cache-Control')).toBe('private, no-store')
  await call(file, 'DELETE', undefined, id)
  expect((await call(file, 'GET', undefined, id)).status).toBe(404)
})

test('private handlers reject unauthenticated access before storage operations', async () => {
  userId = null
  expect((await call(notes, 'GET')).status).toBe(401)
  expect((await call(files, 'POST')).status).toBe(401)
  expect((await call(draft, 'GET')).status).toBe(401)
})

test('all paid AI routes deny unapproved users before validation or provider calls', async () => {
  userId = 'user_bob'
  const originalFetch = globalThis.fetch
  const paidFetch = mock(() => {
    throw new Error('No provider request should occur')
  })
  globalThis.fetch = paidFetch as unknown as typeof fetch
  try {
    for (const permission of [undefined, false, 'true', 1]) {
      metadata = { aiAccess: permission }
      for (const route of [chat, search, indexNote]) {
        const response = await call(route, 'POST', { aiAccess: true })
        expect(response.status).toBe(403)
        expect(response.headers.get('Cache-Control')).toBe('private, no-store')
      }
    }
    expect(paidFetch).not.toHaveBeenCalled()
    expect(getUser).toHaveBeenLastCalledWith('user_bob')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('approval allows handlers to proceed; revocation and Clerk failures immediately deny access', async () => {
  userId = 'user_alice'
  metadata = { aiAccess: true }
  for (const route of [chat, search, indexNote]) {
    // Invalid input reaches validation only after the real permission check.
    expect((await call(route, 'POST', {})).status).toBe(400)
  }
  metadata = {}
  expect((await call(chat, 'POST', {})).status).toBe(403)
  metadata = { aiAccess: true }
  clerkUnavailable = true
  try {
    for (const route of [chat, search, indexNote])
      expect((await call(route, 'POST', {})).status).toBe(403)
    // Non-AI features remain available during an authorization service failure.
    expect((await call(notes, 'GET')).status).toBe(200)
  } finally {
    clerkUnavailable = false
    metadata = {}
  }
})

test('anonymous AI requests are rejected before looking up a permission', async () => {
  userId = null
  getUser.mockClear()
  for (const route of [chat, search, indexNote])
    expect((await call(route, 'POST', {})).status).toBe(401)
  expect(getUser).not.toHaveBeenCalled()
})
