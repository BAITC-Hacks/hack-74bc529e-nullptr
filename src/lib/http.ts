export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('Sec-Fetch-Site') === 'cross-site'
  ) {
    throw Response.json(
      { error: 'Cross-origin requests are not allowed.' },
      { status: 403 },
    )
  }
}

export async function readBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw Response.json(
          { error: 'Request body is too large.' },
          { status: 413 },
        )
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

export async function readJson(
  request: Request,
  maxBytes = 32_768,
): Promise<unknown> {
  if (
    !request.headers
      .get('Content-Type')
      ?.toLowerCase()
      .startsWith('application/json')
  ) {
    throw Response.json(
      { error: 'Expected application/json.' },
      { status: 415 },
    )
  }
  const bytes = await readBody(request, maxBytes)
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
}
