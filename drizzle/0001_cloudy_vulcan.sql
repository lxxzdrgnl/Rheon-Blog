CREATE TABLE `portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`title_en` text,
	`description` text NOT NULL,
	`description_en` text,
	`tech_stack` text NOT NULL,
	`link` text,
	`thumbnail` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
