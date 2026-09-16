import { z } from 'zod'
import { isChatModel } from './chat-models'

const chatOptions = z
  .object({
    model: z
      .string()
      .min(1)
      .max(200)
      .refine(isChatModel, 'Unsupported chat model.')
      .optional(),
  })
  .strict()

export const noteInput = z
  .object({
    content: z
      .string()
      .min(1)
      .max(8_000)
      .refine((value) => value.trim().length > 0),
  })
  .strict()
export const idInput = z.uuid()
export const draftInput = z.object({ content: z.string().max(8_000) }).strict()
export const searchInput = z
  .object({
    query: z
      .string()
      .min(1)
      .max(2_000)
      .refine((value) => value.trim().length > 0),
  })
  .strict()

// This starter accepts text chat only. Client-supplied system prompts and tools are rejected.
export const chatInput = z
  .object({
    messages: z
      .array(
        z
          .object({
            id: z.string().min(1).max(256),
            role: z.enum(['user', 'assistant']),
            content: z.string().max(16_000),
            metadata: z.record(z.string(), z.unknown()).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    threadId: z.string().min(1).max(256),
    runId: z.string().min(1).max(256),
    tools: z.array(z.never()).optional(),
    context: z.array(z.never()).optional(),
    state: z.unknown().optional(),
    forwardedProps: chatOptions.optional(),
    data: chatOptions.optional(),
  })
  .strict()
