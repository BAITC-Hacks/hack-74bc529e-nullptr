import { clerkClient } from '@clerk/tanstack-react-start/server'
import { env } from 'cloudflare:workers'

// Read authoritative, server-only metadata on every request. Revocations must
// not wait for a session token to refresh or a cached permission to expire.
export async function hasAiAccess(userId: string): Promise<boolean> {
  try {
    const user = await clerkClient({
      secretKey: env.CLERK_SECRET_KEY,
    }).users.getUser(userId)
    return user.privateMetadata.aiAccess === true
  } catch {
    console.error('Could not verify AI access.')
    return false
  }
}

export async function requireAiAccess(userId: string) {
  if (!(await hasAiAccess(userId))) {
    throw Response.json(
      { error: 'AI access is restricted to approved users.' },
      { status: 403 },
    )
  }
}
