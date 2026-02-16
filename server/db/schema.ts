import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  pin: text('pin').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD
  ownerStatus: text('owner_status', { enum: ['using'] }).notNull().default('using'),
  slots: text('slots').notNull().default('morning,midday,evening'),
  startTime: text('start_time').notNull().default('06:00'),
  endTime: text('end_time').notNull().default('24:00'),
  source: text('source', { enum: ['manual', 'planday'] }).notNull().default('manual'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex('schedules_user_date_idx').on(table.userId, table.date),
])

export const requests = sqliteTable('requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD
  requesterName: text('requester_name').notNull(),
  requesterContact: text('requester_contact').notNull(),
  requesterEmail: text('requester_email'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  note: text('note'),
  duration: text('duration').notNull().default('8h'),
  startTime: text('start_time'),
  slots: text('slots'), // nullable CSV: 'morning,midday', etc.
  reminderSent: integer('reminder_sent').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
