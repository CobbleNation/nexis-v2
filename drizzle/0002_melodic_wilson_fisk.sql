PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text,
	`mood` integer,
	`date` integer DEFAULT '"2026-02-27T21:15:17.475Z"',
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
	`date` integer DEFAULT '"2026-02-27T21:15:17.475Z"',
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
ALTER TABLE `actions` ADD `linked_goal_id` text REFERENCES goals(id);--> statement-breakpoint
ALTER TABLE `actions` ADD `from_routine_id` text;--> statement-breakpoint
ALTER TABLE `actions` ADD `energy_level` text;--> statement-breakpoint
ALTER TABLE `actions` ADD `impact` text;--> statement-breakpoint
ALTER TABLE `actions` ADD `reminder_at` text;--> statement-breakpoint
ALTER TABLE `actions` ADD `reminder_sent` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `goals` ADD `metric_direction` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `additional_metric_ids` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `horizon` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `expected_impact` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `start_date` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `metric_ids` text;