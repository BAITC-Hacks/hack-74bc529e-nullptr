export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'The request could not be completed.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
