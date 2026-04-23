ALTER TABLE `students` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `students` ADD `year_started` integer;--> statement-breakpoint
CREATE INDEX `students_gender_idx` ON `students` (`gender`);--> statement-breakpoint
CREATE INDEX `students_year_started_idx` ON `students` (`year_started`);