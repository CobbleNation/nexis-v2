CREATE TABLE `analytics_daily_agg` (
	`date` text NOT NULL,
	`event_name` text NOT NULL,
	`plan` text NOT NULL,
	`count` integer NOT NULL,
	`unique_users` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_daily_agg_pk` ON `analytics_daily_agg` (`date`,`event_name`,`plan`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text,
	`event_name` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`plan` text,
	`source` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'UAH' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invoice_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text,
	`mood` integer,
	`date` integer DEFAULT '"2026-02-16T15:57:58.612Z"',
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "user_id", "content", "mood", "date", "tags", "created_at", "updated_at") SELECT "id", "user_id", "content", "mood", "date", "tags", "created_at", "updated_at" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`type` text DEFAULT 'note',
	`area_id` text,
	`related_area_ids` text,
	`date` integer DEFAULT '"2026-02-16T15:57:58.612Z"',
	`tags` text,
	`audio_url` text,
	`is_system_default` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "user_id", "title", "content", "type", "area_id", "related_area_ids", "date", "tags", "audio_url", "is_system_default", "created_at", "updated_at") SELECT "id", "user_id", "title", "content", "type", "area_id", "related_area_ids", "date", "tags", "audio_url", "is_system_default", "created_at", "updated_at" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token_expiry` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `card_last4` text;--> statement-breakpoint
ALTER TABLE `users` ADD `card_exp` text;--> statement-breakpoint
ALTER TABLE `users` ADD `card_token` text;