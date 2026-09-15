import assert from 'node:assert/strict'

const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:3000'
const deniedStatuses =
  process.env.SMOKE_REQUIRE_AUTH === 'true' ? [401] : [401, 503]
const home = await fetch(base)
assert.equal(home.status, 200)
assert.match(await home.text(), /Big ideas/)
const health = await fetch(`${base}/api/health`)
assert.equal(health.status, 200)
assert.deepEqual(await health.json(), { status: 'ok', app: 'hackalem' })
const id = '00000000-0000-4000-8000-000000000001'
for (const [path, method] of [
  ['/api/notes', 'GET'],
  ['/api/notes', 'POST'],
  [`/api/notes/${id}`, 'DELETE'],
  [`/api/notes/${id}/embed`, 'POST'],
  ['/api/chat', 'POST'],
  ['/api/draft', 'GET'],
  ['/api/draft', 'PUT'],
  ['/api/files', 'GET'],
  ['/api/files', 'POST'],
  [`/api/files/${id}`, 'GET'],
  [`/api/files/${id}`, 'DELETE'],
  ['/api/search', 'POST'],
] as const) {
  const response = await fetch(`${base}${path}`, { method, redirect: 'manual' })
  assert.ok(
    deniedStatuses.includes(response.status),
    `${method} ${path}: expected denied access, got ${response.status}`,
  )
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
}
const crossSite = await fetch(`${base}/api/notes`, {
  method: 'POST',
  headers: { Origin: 'https://example.com' },
})
assert.equal(crossSite.status, 403)
console.log(
  'Smoke checks passed: SSR, health, all private endpoints, and cross-origin rejection.',
)
