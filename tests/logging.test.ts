import { expect, spyOn, test } from 'bun:test'
import type { ChatMiddlewareContext } from '@tanstack/ai'
import {
  chatLogging,
  errorDetails,
  requestLogger,
} from '../src/lib/logging.server'

test('request logs omit query strings, credentials and resource IDs', () => {
  const output = spyOn(console, 'info').mockImplementation(() => {})
  try {
    const log = requestLogger(
      new Request(
        'https://example.com/api/notes/private-note/embed?token=secret',
        {
          headers: {
            Authorization: 'Bearer secret',
            'X-Request-ID': 'untrusted',
          },
        },
      ),
    )
    log.write('api.response', { status: 200 })
    expect(output.mock.calls[0]![0]).toMatchObject({
      path: '/api/notes/:id/embed',
      requestId: log.requestId,
    })
    expect(log.requestId).not.toBe('untrusted')
    expect(JSON.stringify(output.mock.calls)).not.toMatch(
      /secret|private-note|untrusted/,
    )
  } finally {
    output.mockRestore()
  }
})

test('error diagnostics retain locations without provider messages or payloads', () => {
  const error = new Error('secret prompt and credential')
  error.stack =
    'Error: secret prompt and credential\n    at handler (/src/api.ts:12:3)'
  expect(errorDetails(error)).toEqual({
    errorName: 'Error',
    stackFrames: ['api.ts:12:3'],
  })
  expect(JSON.stringify(errorDetails({ response: 'secret' }))).not.toContain(
    'secret',
  )
})

test('AI lifecycle logs usage and failures without completion content or abort reasons', async () => {
  const info = spyOn(console, 'info').mockImplementation(() => {})
  const warn = spyOn(console, 'warn').mockImplementation(() => {})
  const error = spyOn(console, 'error').mockImplementation(() => {})
  try {
    const log = requestLogger(new Request('https://example.com/api/chat'))
    const middleware = chatLogging(log, 'gpt-5.6-sol')
    const context = {} as ChatMiddlewareContext
    await middleware.onFinish!(context, {
      duration: 123,
      content: 'private completion',
      finishReason: 'stop',
      usage: { promptTokens: 4, completionTokens: 6, totalTokens: 10 },
    })
    await middleware.onError!(context, {
      duration: 50,
      error: new Error('private prompt'),
    })
    await middleware.onAbort!(context, {
      duration: 20,
      reason: 'private reason',
    })
    expect(info.mock.calls[0]![0]).toMatchObject({
      event: 'ai.completed',
      requestId: log.requestId,
      durationMs: 123,
      totalTokens: 10,
    })
    expect(error.mock.calls[0]![0]).toMatchObject({
      event: 'ai.failed',
      requestId: log.requestId,
    })
    expect(warn.mock.calls[0]![0]).toMatchObject({ event: 'ai.aborted' })
    expect(
      JSON.stringify([info.mock.calls, warn.mock.calls, error.mock.calls]),
    ).not.toContain('private')
  } finally {
    info.mockRestore()
    warn.mockRestore()
    error.mockRestore()
  }
})
