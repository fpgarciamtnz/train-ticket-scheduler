CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`pin` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_slug_unique` ON `users` (`slug`);--> statement-breakpoint
-- Create default user from existing admin_email setting (if exists)
INSERT OR IGNORE INTO users (email, pin, name, slug, created_at, updated_at)
SELECT value, '', 'Admin', 'admin', datetime('now'), datetime('now')
FROM settings WHERE key = 'admin_email' AND value IS NOT NULL AND value != '';
--> statement-breakpoint
DROP INDEX `schedules_date_unique`;--> statement-breakpoint
ALTER TABLE `schedules` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_user_date_idx` ON `schedules` (`user_id`,`date`);--> statement-breakpoint
ALTER TABLE `requests` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
-- Assign orphan schedules and requests to the default user
UPDATE schedules SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;--> statement-breakpoint
UPDATE requests SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
