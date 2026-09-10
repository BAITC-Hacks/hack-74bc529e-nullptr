import { createRequire } from 'node:module'

// Bun 1.4's built-in undici shim lacks Pool.dispatch/close, which Miniflare uses.
// Use the installed implementation without modifying dependencies or using Node.
// https://github.com/oven-sh/bun/issues/39247
const require = createRequire(import.meta.url)
const undici = require('undici') as typeof import('undici')
if (typeof undici.Pool.prototype.close !== 'function') {
  Object.assign(undici, require(import.meta.resolveSync('undici/index.js')))
}
