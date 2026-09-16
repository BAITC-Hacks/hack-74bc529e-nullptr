import { createFileRoute } from '@tanstack/react-router'
import {
  chat,
  chatParamsFromRequestBody,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { createOpenaiChat, type OpenAIChatModel } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'
import { privateApi } from '../lib/api.server'
import { requireAiAccess } from '../lib/ai-access.server'
import { readJson } from '../lib/http'
import { chatInput } from '../lib/validation'
import { DEFAULT_CHAT_MODEL } from '../lib/chat-models'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: ({ request }) =>
        privateApi(request, async (userId) => {
          await requireAiAccess(userId)
          const body = chatInput.parse(await readJson(request, 128_000))
          if (!env.OPENAI_API_KEY) {
            return Response.json(
              { error: 'AI chat is not configured.' },
              { status: 503 },
            )
          }
          const { messages, threadId, runId } =
            await chatParamsFromRequestBody(body)
          const abortController = new AbortController()
          if (request.signal.aborted) abortController.abort()
          request.signal.addEventListener(
            'abort',
            () => abortController.abort(),
            { once: true },
          )
          const stream = chat({
            // Model IDs come from OpenAI, which may add models ahead of the SDK types.
            adapter: createOpenaiChat(
              (body.forwardedProps?.model ??
                body.data?.model ??
                DEFAULT_CHAT_MODEL) as OpenAIChatModel,
              env.OPENAI_API_KEY,
            ),
            messages,
            threadId,
            runId,
            systemPrompts: [
              'You are the Hackalem hackathon assistant. Help the user turn ideas into practical, concise next steps.',
            ],
            abortController,
            modelOptions: { max_output_tokens: 4096 },
          })
          return toServerSentEventsResponse(stream)
        }),
    },
  },
})
