export const DEFAULT_CHAT_MODEL = 'gpt-5.6-terra'

export const CHAT_MODELS = [
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
] as const

// Only offer curated models that are also returned by OpenAI's models endpoint.
export function isChatModel(id: string): id is (typeof CHAT_MODELS)[number] {
  return CHAT_MODELS.some((model) => model === id)
}
