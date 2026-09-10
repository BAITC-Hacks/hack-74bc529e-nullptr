import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createIsomorphicFn, createStart } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { isAuthConfigured } from './lib/auth.server'

const getRequestMiddleware = createIsomorphicFn()
  .client(() => [])
  .server(() =>
    isAuthConfigured()
      ? [
          clerkMiddleware({
            publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
            secretKey: env.CLERK_SECRET_KEY,
            authorizedParties: [env.APP_URL],
          }),
        ]
      : [],
  )

export const startInstance = createStart(() => ({
  requestMiddleware: getRequestMiddleware(),
}))
