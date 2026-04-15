CREATE TABLE `apprentice_competency` (
	`id` text PRIMARY KEY NOT NULL,
	`apprentice_id` text NOT NULL,
	`competency_id` text NOT NULL,
	`achieved_at` integer NOT NULL,
	FOREIGN KEY (`apprentice_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competency`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `competency` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `placement_competency` (
	`id` text PRIMARY KEY NOT NULL,
	`placement_id` text NOT NULL,
	`competency_id` text NOT NULL,
	FOREIGN KEY (`placement_id`) REFERENCES `placement`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competency`(`id`) ON UPDATE no action ON DELETE cascade
);
