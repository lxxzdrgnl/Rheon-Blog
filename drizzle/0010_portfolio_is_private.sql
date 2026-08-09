CREATE TABLE `site_views` (
	`date` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `portfolios` ADD `in_progress` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `is_team` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `members` text;--> statement-breakpoint
ALTER TABLE `series` ADD `thumbnail` text;--> statement-breakpoint
ALTER TABLE `series` ADD `show_title_on_thumbnail` integer DEFAULT false NOT NULL;