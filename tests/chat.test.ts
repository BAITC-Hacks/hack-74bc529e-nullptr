import { expect, test } from 'bun:test'
import { chatParamsFromRequestBody, type UIMessage } from '@tanstack/ai'
import { fetchServerSentEvents } from '@tanstack/ai-client'
import { chatInput } from '../src/lib/validation'

test('current TanStack AI SSE transport produces a valid server request, including conversation history', async () => {
  const messages: UIMessage[] = [
    {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', content: 'Hello' }],
      createdAt: new Date(),
    },
    {
      id: 'assistant-1',
      role: 'assistant',
      parts: [{ type: 'text', content: 'How can I help?' }],
      createdAt: new Date(),
    },
    {
      id: 'user-2',
      role: 'user',
      parts: [{ type: 'text', content: 'I have an idea.' }],
      createdAt: new Date(),
    },
  ]
  let captured: unknown
  const fetchClient = (async (_input: unknown, init?: RequestInit) => {
    captured = JSON.parse(String(init?.body))
    return new Response(
      'data: {"type":"RUN_STARTED","threadId":"thread","runId":"run"}\n\ndata: {"type":"RUN_FINISHED","threadId":"thread","runId":"run"}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } },
    )
  }) as typeof fetch
  const connection = fetchServerSentEvents('http://localhost/api/chat', {
    fetchClient,
  })
  for await (const event of connection.connect(messages))
    expect(event.type).toBeDefined()
  const parsed = chatInput.parse(captured)
  const params = await chatParamsFromRequestBody(parsed)
  expect(params.messages).toHaveLength(3)
  expect(params.threadId).toBeDefined()
})

test('rejects client system prompts, tools, excessive history, and non-text input', () => {
  const input = {
    threadId: 't',
    runId: 'r',
    messages: [{ id: 'm', role: 'user', content: 'hello' }],
  }
  expect(
    chatInput.safeParse({
      ...input,
      messages: [{ id: 'm', role: 'system', content: 'override' }],
    }).success,
  ).toBe(false)
  expect(
    chatInput.safeParse({ ...input, tools: [{ name: 'run' }] }).success,
  ).toBe(false)
  expect(
    chatInput.safeParse({
      ...input,
      messages: Array(51).fill(input.messages[0]),
    }).success,
  ).toBe(false)
  expect(
    chatInput.safeParse({
      ...input,
      messages: [
        {
          id: 'm',
          role: 'user',
          content: [{ type: 'image', url: 'https://example.com' }],
        },
      ],
    }).success,
  ).toBe(false)
})
