import { ZodError } from 'zod'
import { requireUserId } from './auth.server'
import { assertSameOrigin } from './http'
import {
  errorDetails,
  requestLogger,
  type RequestLogger,
} from './logging.server'

export async function privateApi(
  request: Request,
  handler: (userId: string, log: RequestLogger) => Promise<Response>,
) {
  const log = requestLogger(request)
  const started = performance.now()
  const finish = (response: Response) => {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Request-ID', log.requestId)
    log.write(
      'api.response',
      {
        status: response.status,
        durationMs: Math.round(performance.now() - started),
      },
      response.status >= 500
        ? 'error'
        : response.status >= 400
          ? 'warn'
          : 'info',
    )
    return response
  }
  try {
    if (!['GET', 'HEAD'].includes(request.method)) assertSameOrigin(request)
    const response = await handler(await requireUserId(), log)
    return finish(response)
  } catch (error) {
    const response =
      error instanceof Response
        ? error
        : error instanceof ZodError
          ? Response.json(
              {
                error: 'Invalid input.',
                issues: error.issues.map(({ path, message }) => ({
                  path,
                  message,
                })),
              },
              { status: 400 },
            )
          : Response.json(
              { error: 'The request could not be completed.' },
              { status: 500 },
            )
    if (!(error instanceof Response) && !(error instanceof ZodError)) {
      log.write('api.failed', errorDetails(error), 'error')
    }
    return finish(response)
  }
}
