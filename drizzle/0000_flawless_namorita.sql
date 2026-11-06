CREATE TABLE `source_checks` (
	`opportunity_id` text PRIMARY KEY NOT NULL,
	`code` integer NOT NULL,
	`checked_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mentors` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`data` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `task_id`)
);
--> statement-breakpoint
CREATE TABLE `mentor_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mentor_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`is_demo` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved` (
	`user_id` text NOT NULL,
	`opportunity_id` text NOT NULL,
	`stage` text DEFAULT 'guardada' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `opportunity_id`)
);
