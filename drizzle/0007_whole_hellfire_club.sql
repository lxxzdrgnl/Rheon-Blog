CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`title_en` text,
	`organization` text NOT NULL,
	`organization_en` text,
	`date` text NOT NULL,
	`description` text,
	`description_en` text,
	`link` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `thumbnail_text_length_en` integer;