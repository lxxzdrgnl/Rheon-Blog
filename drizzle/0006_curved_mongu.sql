CREATE TABLE `education` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school` text NOT NULL,
	`school_en` text,
	`degree` text,
	`degree_en` text,
	`field` text,
	`field_en` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`description` text,
	`description_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `experiences` ADD `links` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `icon` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `thumbnail_text_length` integer;