DROP INDEX "admin_email_accounts_address_unique";--> statement-breakpoint
DROP INDEX "analytics_daily_agg_pk";--> statement-breakpoint
DROP INDEX "analytics_user_event_idx";--> statement-breakpoint
DROP INDEX "analytics_created_at_idx";--> statement-breakpoint
DROP INDEX "user_limits_user_id_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `journal_entries` ALTER COLUMN "date" TO "date" integer DEFAULT '"2026-03-16T07:36:21.575Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `admin_email_accounts_address_unique` ON `admin_email_accounts` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_daily_agg_pk` ON `analytics_daily_agg` (`date`,`event_name`,`plan`);--> statement-breakpoint
CREATE INDEX `analytics_user_event_idx` ON `analytics_events` (`user_id`,`event_name`);--> statement-breakpoint
CREATE INDEX `analytics_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_limits_user_id_unique` ON `user_limits` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `notes` ALTER COLUMN "date" TO "date" integer DEFAULT '"2026-03-16T07:36:21.574Z"';--> statement-breakpoint
ALTER TABLE `notifications` ADD `content` text;