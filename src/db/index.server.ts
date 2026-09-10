import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Create per request; never cache request-scoped binding operations globally.
export function getDb() {
  return drizzle(env.DB, { schema })
}
