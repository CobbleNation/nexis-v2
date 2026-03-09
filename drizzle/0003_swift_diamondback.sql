CREATE TABLE `user_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`max_goals` integer,
	`max_tasks` integer,
	`max_journal_entries` integer,
	`max_notes` integer,
	`max_ai_hints` integer,
	`has_subgoals` integer,
	`has_ai_goal_breakdown` integer,
	`has_goal_analytics` integer,
	`has_task_priority` integer,
	`has_recurring_tasks` integer,
	`has_smart_filters` integer,
	`has_auto_planning` integer,
	`has_weekly_view` integer,
	`has_monthly_view` integer,
	`has_tags` integer,
	`has_search` integer,
	`has_ai_summaries` integer,
	`has_history_analytics` integer,
	`has_full_ai` integer,
	`has_voice` integer,
	`admin_note` text,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_limits_user_id_unique` ON `user_limits` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text,
	`mood` integer,
	`date` integer DEFAULT '"2026-03-09T17:23:46.427Z"',
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
	`date` integer DEFAULT '"2026-03-09T17:23:46.427Z"',
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
ALTER TABLE `actions` ADD `description` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_started_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_expires_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `auto_renew` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token_expiry` integer;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `onboarding_completed`;