ALTER TABLE `posts` ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `published_at` text;