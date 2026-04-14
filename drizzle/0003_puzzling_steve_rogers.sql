CREATE TABLE `portfolio_posts` (
	`portfolio_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `portfolios` ADD `slug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `content` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `content_en` text;--> statement-breakpoint
CREATE UNIQUE INDEX `portfolios_slug_unique` ON `portfolios` (`slug`);