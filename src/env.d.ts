interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

declare namespace Cloudflare {
  interface Env {
    CLERK_SECRET_KEY?: string
    OPENAI_API_KEY?: string
  }
}
