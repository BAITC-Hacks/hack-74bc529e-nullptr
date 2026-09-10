import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('notes_user_created_idx').on(table.userId, table.createdAt),
  ],
)
