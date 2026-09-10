import { loadEnv } from 'vite'

const config = Bun.JSONC.parse(await Bun.file('wrangler.jsonc').text()) as {
  env: {
    production: {
      kv_namespaces: { id: string }[]
      d1_databases: { database_id: string }[]
    }
  }
}
const production = config.env.production
const errors: string[] = []
if (!/^[a-f0-9]{32}$/i.test(production.kv_namespaces[0]!.id))
  errors.push('Set the production KV namespace ID in wrangler.jsonc.')
if (
  !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    production.d1_databases[0]!.database_id,
  )
)
  errors.push('Set the production D1 database ID in wrangler.jsonc.')
const publicEnv = loadEnv('production', process.cwd(), 'VITE_')
if (!publicEnv.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_'))
  errors.push(
    'Set a live VITE_CLERK_PUBLISHABLE_KEY in .env.production or the build environment.',
  )
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
const result = Bun.spawn(
  [
    'bun',
    '--bun',
    'wrangler',
    'secret',
    'list',
    '--env',
    'production',
    '--format',
    'json',
  ],
  { stdout: 'pipe', stderr: 'inherit' },
)
const output = await new Response(result.stdout).text()
if ((await result.exited) !== 0) process.exit(1)
const secrets = JSON.parse(output) as { name: string }[]
for (const name of ['CLERK_SECRET_KEY', 'OPENAI_API_KEY']) {
  if (!secrets.some((secret) => secret.name === name))
    errors.push(
      `Set the production ${name} with bun run cf secret put ${name} --env production.`,
    )
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(
  'Production resource IDs, public key, and required secret names are configured.',
)
