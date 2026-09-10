import { describe, expect, test } from 'bun:test'
import { assertSameOrigin, readBody, readJson } from '../src/lib/http'

async function statusOf(action: () => unknown) {
  try {
    await action()
    return 200
  } catch (error) {
    if (error instanceof Response) return error.status
    throw error
  }
}

describe('HTTP request boundaries', () => {
  test('accepts a same-origin mutation', () => {
    expect(() =>
      assertSameOrigin(
        new Request('https://hackalem.abzal.dev/api/notes', {
          headers: { Origin: 'https://hackalem.abzal.dev' },
        }),
      ),
    ).not.toThrow()
  })
  test('rejects a cross-origin mutation', async () => {
    expect(
      await statusOf(() =>
        assertSameOrigin(
          new Request('https://hackalem.abzal.dev/api/notes', {
            headers: { Origin: 'https://example.com' },
          }),
        ),
      ),
    ).toBe(403)
  })
  test('rejects cross-site requests even without Origin', async () => {
    expect(
      await statusOf(() =>
        assertSameOrigin(
          new Request('https://hackalem.abzal.dev/api/notes', {
            headers: { 'Sec-Fetch-Site': 'cross-site' },
          }),
        ),
      ),
    ).toBe(403)
  })
  test('enforces actual body size without trusting Content-Length', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: new Uint8Array(101),
      headers: { 'Content-Length': '1' },
    })
    expect(await statusOf(() => readBody(request, 100))).toBe(413)
  })
  test('rejects malformed JSON and wrong content type', async () => {
    expect(
      await statusOf(() =>
        readJson(
          new Request('http://localhost', {
            method: 'POST',
            body: '{',
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    ).toBe(400)
    expect(
      await statusOf(() =>
        readJson(
          new Request('http://localhost', { method: 'POST', body: '{}' }),
        ),
      ),
    ).toBe(415)
  })
})
