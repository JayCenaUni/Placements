ALTER TABLE `review` RENAME TO `review_old`;
--> statement-breakpoint
CREATE TABLE `review` (
	`id` text PRIMARY KEY NOT NULL,
	`apprentice_id` text NOT NULL,
	`placement_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`apprentice_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`placement_id`) REFERENCES `placement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `review` (`id`, `apprentice_id`, `placement_id`, `created_at`)
SELECT `id`, `apprentice_id`, `placement_id`, `created_at`
FROM `review_old`;
--> statement-breakpoint
DROP TABLE `review_old`;
--> statement-breakpoint
CREATE TABLE `review_competency` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`competency_id` text NOT NULL,
	`achievement` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competency`(`id`) ON UPDATE no action ON DELETE cascade
);
