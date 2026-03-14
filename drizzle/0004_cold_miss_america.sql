CREATE TABLE `admin_email_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`display_name` text NOT NULL,
	`smtp_host` text NOT NULL,
	`smtp_port` integer DEFAULT 465 NOT NULL,
	`smtp_secure` integer DEFAULT true,
	`imap_host` text,
	`imap_port` integer DEFAULT 993,
	`imap_secure` integer DEFAULT true,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_email_accounts_address_unique` ON `admin_email_accounts` (`address`);--> statement-breakpoint
CREATE TABLE `admin_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`folder` text DEFAULT 'inbox' NOT NULL,
	`from_address` text NOT NULL,
	`from_name` text,
	`to_address` text NOT NULL,
	`to_name` text,
	`subject` text NOT NULL,
	`body_html` text,
	`body_text` text,
	`is_read` integer DEFAULT false,
	`is_starred` integer DEFAULT false,
	`in_reply_to` text,
	`message_id` text,
	`received_at` integer,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `admin_email_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`link` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX "admin_email_accounts_address_unique";--> statement-breakpoint
DROP INDEX "analytics_daily_agg_pk";--> statement-breakpoint
DROP INDEX "analytics_user_event_idx";--> statement-breakpoint
DROP INDEX "analytics_created_at_idx";--> statement-breakpoint
DROP INDEX "user_limits_user_id_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `journal_entries` ALTER COLUMN "date" TO "date" integer DEFAULT '"2026-03-14T15:02:26.747Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_daily_agg_pk` ON `analytics_daily_agg` (`date`,`event_name`,`plan`);--> statement-breakpoint
CREATE INDEX `analytics_user_event_idx` ON `analytics_events` (`user_id`,`event_name`);--> statement-breakpoint
CREATE INDEX `analytics_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_limits_user_id_unique` ON `user_limits` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `notes` ALTER COLUMN "date" TO "date" integer DEFAULT '"2026-03-14T15:02:26.747Z"';--> statement-breakpoint
ALTER TABLE `users` ADD `current_price_override` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `recurring_price_override` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_period` text DEFAULT 'month';--> statement-breakpoint
ALTER TABLE `users` ADD `email_digest` integer DEFAULT false;