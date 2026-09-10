import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { isAuthConfigured } from './auth.server'

export const getAppConfig = createServerFn({ method: 'GET' }).handler(() => ({
  authEnabled: isAuthConfigured(),
  chatEnabled: Boolean(env.OPENAI_API_KEY),
  searchEnabled:
    env.VECTOR_SEARCH_ENABLED === 'true' &&
    Boolean(env.VECTORIZE && env.OPENAI_API_KEY),
}))
