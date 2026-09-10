import { embed } from '@tanstack/ai'
import { createOpenaiEmbedding } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'

export const EMBEDDING_DIMENSIONS = 1536

function getIndex() {
  if (env.VECTOR_SEARCH_ENABLED !== 'true' || !env.VECTORIZE) {
    throw Response.json(
      { error: 'Semantic search is not configured.' },
      { status: 503 },
    )
  }
  return env.VECTORIZE
}

async function embedText(text: string) {
  if (env.VECTOR_SEARCH_ENABLED !== 'true' || !env.OPENAI_API_KEY) {
    throw Response.json(
      { error: 'Semantic search is not configured.' },
      { status: 503 },
    )
  }
  const result = await embed({
    adapter: createOpenaiEmbedding(
      'text-embedding-3-small',
      env.OPENAI_API_KEY,
    ),
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return result.embeddings[0]!.vector
}

// Namespaces isolate users; IDs are global UUIDs and ownership is checked in D1 by callers.
export async function indexNote(userId: string, id: string, content: string) {
  const index = getIndex()
  return index.upsert([
    { id, namespace: userId, values: await embedText(content) },
  ])
}

export async function searchNotes(userId: string, query: string) {
  const index = getIndex()
  return index.query(await embedText(query), {
    namespace: userId,
    topK: 10,
    returnValues: false,
    returnMetadata: 'none',
  })
}
