ALTER TABLE `requests` ADD `duration` text DEFAULT '8h' NOT NULL;--> statement-breakpoint
ALTER TABLE `requests` ADD `slots` text;--> statement-breakpoint
ALTER TABLE `schedules` ADD `slots` text DEFAULT 'morning,midday,evening' NOT NULL;