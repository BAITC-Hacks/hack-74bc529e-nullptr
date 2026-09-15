import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { auth } from '@clerk/tanstack-react-start/server'
import { env } from 'cloudflare:workers'
import { isAuthConfigured } from './auth.server'
import { hasAiAccess } from './ai-access.server'

export const getAppConfig = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeader('Cache-Control', 'private, no-store')
    const authEnabled = isAuthConfigured()
    const userId = authEnabled ? (await auth()).userId : null
    const aiAccess = Boolean(userId && (await hasAiAccess(userId)))
    return {
      authEnabled,
      chatEnabled: aiAccess && Boolean(env.OPENAI_API_KEY),
      searchEnabled:
        aiAccess &&
        env.VECTOR_SEARCH_ENABLED === 'true' &&
        Boolean(env.VECTORIZE && env.OPENAI_API_KEY),
    }
  },
)
