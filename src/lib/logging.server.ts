import type { ChatMiddleware } from '@tanstack/ai'

// Never serialize arbitrary errors: provider messages can contain input or secrets.
export function errorDetails(error: unknown) {
  const names = [
    'Error',
    'TypeError',
    'RangeError',
    'SyntaxError',
    'AbortError',
  ]
  return {
    errorName:
      error instanceof Error && names.includes(error.name)
        ? error.name
        : 'UnknownError',
    stackFrames:
      error instanceof Error
        ? error.stack
            ?.split('\n')
            .filter((line) => /^\s+at /.test(line))
            .slice(0, 8)
            // Retain source locations only, never error text or URL queries.
            .map((line) => line.match(/([^\s/()?]+:\d+:\d+)\)?$/)?.[1])
            .filter(Boolean)
        : undefined,
  }
}

export function requestLogger(request: Request) {
  const requestId = crypto.randomUUID()
  const pathname = new URL(request.url).pathname
  const path = pathname.replace(
    /^(\/api\/(?:files|notes))\/[^/]+(?=\/|$)/,
    '$1/:id',
  )
  const context = { requestId, method: request.method, path }
  return {
    requestId,
    write(
      event: string,
      fields: Record<string, unknown> = {},
      level: 'info' | 'warn' | 'error' = 'info',
    ) {
      console[level]({ ...fields, ...context, event })
    },
  }
}

export type RequestLogger = ReturnType<typeof requestLogger>

export function chatLogging(log: RequestLogger, model: string): ChatMiddleware {
  const started = performance.now()
  let firstTokenMs: number | undefined
  return {
    name: 'request-logging',
    onConfig() {
      log.write('ai.started', { model })
    },
    onChunk(_context, chunk) {
      if (chunk.type === 'TEXT_MESSAGE_CONTENT' && firstTokenMs === undefined) {
        firstTokenMs = Math.round(performance.now() - started)
      }
    },
    onFinish(_context, info) {
      log.write('ai.completed', {
        model,
        durationMs: info.duration,
        firstTokenMs,
        inputTokens: info.usage?.promptTokens,
        outputTokens: info.usage?.completionTokens,
        totalTokens: info.usage?.totalTokens,
      })
    },
    onAbort(_context, info) {
      log.write('ai.aborted', { model, durationMs: info.duration }, 'warn')
    },
    onError(_context, info) {
      log.write(
        'ai.failed',
        {
          model,
          durationMs: info.duration,
          ...errorDetails(info.error),
        },
        'error',
      )
    },
  }
}
