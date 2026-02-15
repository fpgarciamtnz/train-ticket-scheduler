import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  ownerStatus: text('owner_status', { enum: ['using'] }).notNull().default('using'),
  slots: text('slots').notNull().default('morning,midday,evening'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const requests = sqliteTable('requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  requesterName: text('requester_name').notNull(),
  requesterContact: text('requester_contact').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  note: text('note'),
  duration: text('duration').notNull().default('8h'),
  startTime: text('start_time'),
  slots: text('slots'), // nullable CSV: 'morning,midday', etc.
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
