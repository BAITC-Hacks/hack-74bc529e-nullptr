import { clerkClient } from '@clerk/tanstack-react-start/server'
import { env } from 'cloudflare:workers'
import { errorDetails, type RequestLogger } from './logging.server'

// Read authoritative, server-only metadata on every request. Revocations must
// not wait for a session token to refresh or a cached permission to expire.
export async function hasAiAccess(
  userId: string,
  log?: RequestLogger,
): Promise<boolean> {
  try {
    const user = await clerkClient({
      secretKey: env.CLERK_SECRET_KEY,
    }).users.getUser(userId)
    return user.privateMetadata.aiAccess === true
  } catch (error) {
    if (log) log.write('auth.ai_access_failed', errorDetails(error), 'error')
    else
      console.error({ event: 'auth.ai_access_failed', ...errorDetails(error) })
    return false
  }
}

export async function requireAiAccess(userId: string, log?: RequestLogger) {
  if (!(await hasAiAccess(userId, log))) {
    throw Response.json(
      { error: 'AI access is restricted to approved users.' },
      { status: 403 },
    )
  }
}
