import { ZodError } from 'zod'
import { requireUserId } from './auth.server'
import { assertSameOrigin } from './http'

export async function privateApi(
  request: Request,
  handler: (userId: string) => Promise<Response>,
) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) assertSameOrigin(request)
    const response = await handler(await requireUserId())
    response.headers.set('Cache-Control', 'private, no-store')
    return response
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
      console.error('API request failed', {
        path: new URL(request.url).pathname,
        name: error instanceof Error ? error.name : 'UnknownError',
      })
    }
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }
}
