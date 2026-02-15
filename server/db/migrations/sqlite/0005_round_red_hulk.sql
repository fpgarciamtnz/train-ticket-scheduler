CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `requests` ADD `requester_email` text;--> statement-breakpoint
ALTER TABLE `requests` ADD `reminder_sent` integer DEFAULT 0 NOT NULL;