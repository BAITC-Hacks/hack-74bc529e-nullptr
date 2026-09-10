import { auth } from '@clerk/tanstack-react-start/server'
import { env } from 'cloudflare:workers'

export function isAuthConfigured() {
  return Boolean(
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY,
  )
}

export async function requireUserId() {
  if (!isAuthConfigured()) {
    throw Response.json(
      { error: 'Authentication is not configured.' },
      { status: 503 },
    )
  }
  const { userId } = await auth()
  if (!userId) {
    throw Response.json({ error: 'Sign in to continue.' }, { status: 401 })
  }
  return userId
}
