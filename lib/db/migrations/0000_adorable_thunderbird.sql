CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`institution_id` text NOT NULL,
	`security_number` text NOT NULL,
	`qr_code_url` text,
	`issued_date` integer NOT NULL,
	`graduation_year` integer NOT NULL,
	`status` text DEFAULT 'valid' NOT NULL,
	`revoked_at` integer,
	`revoke_reason` text,
	`email_sent` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_security_number_idx` ON `certificates` (`security_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_student_course_idx` ON `certificates` (`student_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `certificates_student_id_idx` ON `certificates` (`student_id`);--> statement-breakpoint
CREATE INDEX `certificates_course_id_idx` ON `certificates` (`course_id`);--> statement-breakpoint
CREATE INDEX `certificates_status_idx` ON `certificates` (`status`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dept_code` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `forgery_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`security_number` text,
	`details` text,
	`reported_ip` text,
	`status` text DEFAULT 'pending',
	`reviewed_at` integer,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `freport_status_idx` ON `forgery_reports` (`status`);--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_unique` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_idx` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_id_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`reg_number` text,
	`email` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_reg_number_unique` ON `students` (`reg_number`);--> statement-breakpoint
CREATE INDEX `students_name_idx` ON `students` (`name`);--> statement-breakpoint
CREATE TABLE `verification_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`cert_id` text,
	`verified_at` integer NOT NULL,
	`verifier_ip` text,
	`result` text NOT NULL,
	`method` text NOT NULL,
	FOREIGN KEY (`cert_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vlog_cert_id_idx` ON `verification_logs` (`cert_id`);--> statement-breakpoint
CREATE INDEX `vlog_verified_at_idx` ON `verification_logs` (`verified_at`);--> statement-breakpoint
CREATE INDEX `vlog_result_idx` ON `verification_logs` (`result`);