import { defineConfig } from 'drizzle-kit'

// Drizzle generates SQL; Wrangler applies it to local or remote D1.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
})
