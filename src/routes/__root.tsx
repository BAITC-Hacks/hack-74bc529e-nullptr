import { ClerkProvider } from '@clerk/tanstack-react-start'
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { getAppConfig } from '../lib/config'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => ({ config: await getAppConfig() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Hackalem · nullptr' },
      {
        name: 'description',
        content:
          'A little space for your next big idea. Built by team nullptr.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: Root,
  shellComponent: Document,
  notFoundComponent: () => (
    <main className="empty-page">
      <h1>Nothing here yet.</h1>
      <Link to="/">Back to your workspace</Link>
    </main>
  ),
  errorComponent: () => (
    <main className="empty-page">
      <h1>Something went wrong.</h1>
      <p>Try refreshing the page.</p>
      <a href="/">Return home</a>
    </main>
  ),
})

function Root() {
  const { config } = Route.useRouteContext()
  if (!config.authEnabled) return <Outlet />
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Outlet />
    </ClerkProvider>
  )
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
