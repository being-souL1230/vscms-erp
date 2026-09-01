namespace VscmsErp.Api.Data;

/// <summary>
/// Idempotent MySQL schema statements (mirror of src/db/schema.ts).
/// Used by EnsureDatabase() so the API can create its tables on a fresh
/// MySQL / TiDB Cloud database.
/// </summary>
public static class Schema
{
    public static readonly string[] DDL =
    [
        """
        CREATE TABLE IF NOT EXISTS `students` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `name` TEXT NOT NULL,
          `email` VARCHAR(255) NOT NULL UNIQUE,
          `roll_no` VARCHAR(100) NOT NULL UNIQUE,
          `department` VARCHAR(100) NOT NULL,
          `semester` BIGINT DEFAULT 1,
          `phone` VARCHAR(100),
          `avatar_url` TEXT,
          `gpa` VARCHAR(50) DEFAULT '0.00',
          `status` VARCHAR(50) NOT NULL DEFAULT 'active',
          `password_hash` TEXT NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `faculty` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `name` TEXT NOT NULL,
          `email` VARCHAR(255) NOT NULL UNIQUE,
          `emp_id` VARCHAR(100) NOT NULL UNIQUE,
          `department` VARCHAR(100) NOT NULL,
          `sub_role` VARCHAR(100) NOT NULL DEFAULT 'teacher',
          `designation` VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
          `phone` VARCHAR(100),
          `avatar_url` TEXT,
          `status` VARCHAR(50) NOT NULL DEFAULT 'active',
          `password_hash` TEXT NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `admins` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `name` TEXT NOT NULL,
          `email` VARCHAR(255) NOT NULL UNIQUE,
          `emp_id` VARCHAR(100) NOT NULL UNIQUE,
          `department` VARCHAR(100) NOT NULL DEFAULT 'Administration',
          `designation` VARCHAR(100) NOT NULL DEFAULT 'System Administrator',
          `phone` VARCHAR(100),
          `avatar_url` TEXT,
          `status` VARCHAR(50) NOT NULL DEFAULT 'active',
          `password_hash` TEXT NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `sessions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `token` VARCHAR(255) NOT NULL UNIQUE,
          `user_id` BIGINT NOT NULL,
          `user_role` VARCHAR(50) NOT NULL DEFAULT 'student',
          `expires_at` BIGINT NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `departments` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `code` VARCHAR(100) NOT NULL UNIQUE,
          `name` VARCHAR(255) NOT NULL,
          `head_of_department` VARCHAR(255) NOT NULL,
          `location` VARCHAR(255),
          `student_count` BIGINT DEFAULT 0,
          `faculty_count` BIGINT DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `courses` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `code` VARCHAR(100) NOT NULL UNIQUE,
          `name` VARCHAR(255) NOT NULL,
          `department` VARCHAR(255) NOT NULL,
          `credits` BIGINT NOT NULL DEFAULT 3,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `faculty_id` BIGINT,
          `faculty_name` VARCHAR(255),
          `room` VARCHAR(100),
          `schedule` VARCHAR(255),
          `description` TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `attendance` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `course_id` BIGINT NOT NULL,
          `course_code` VARCHAR(100) NOT NULL,
          `date` VARCHAR(100) NOT NULL,
          `status` VARCHAR(50) NOT NULL,
          `period` VARCHAR(100) DEFAULT 'Lecture 1',
          `marked_by` VARCHAR(255),
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `grades` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `course_id` BIGINT NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `exam_type` VARCHAR(100) NOT NULL,
          `marks_obtained` VARCHAR(50) NOT NULL,
          `max_marks` VARCHAR(50) NOT NULL DEFAULT '100',
          `grade_letter` VARCHAR(10) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `remarks` TEXT,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `fee_records` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `roll_no` VARCHAR(100) NOT NULL,
          `fee_type` VARCHAR(100) NOT NULL,
          `amount` VARCHAR(50) NOT NULL,
          `due_date` VARCHAR(100) NOT NULL,
          `paid_date` VARCHAR(100),
          `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
          `receipt_number` VARCHAR(100),
          `payment_method` VARCHAR(100),
          `course_code` VARCHAR(100),
          `course_name` VARCHAR(255),
          `semester` BIGINT,
          `paid_amount` VARCHAR(50) NOT NULL DEFAULT '0',
          `collected_by` VARCHAR(255),
          `collected_at` VARCHAR(100),
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `fee_structures` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `semester` BIGINT NOT NULL,
          `fee_type` VARCHAR(100) NOT NULL,
          `amount` VARCHAR(50) NOT NULL,
          `due_date` VARCHAR(100) NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `fee_payments` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `fee_record_id` BIGINT NOT NULL,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `amount` VARCHAR(50) NOT NULL,
          `payment_method` VARCHAR(100) NOT NULL,
          `receipt_number` VARCHAR(100) NOT NULL,
          `paid_at` VARCHAR(100) NOT NULL,
          `collected_by` VARCHAR(255),
          `collected_by_id` BIGINT,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `assignments` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `course_id` BIGINT NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `description` TEXT NOT NULL,
          `due_date` VARCHAR(100) NOT NULL,
          `max_marks` BIGINT NOT NULL DEFAULT 100,
          `faculty_name` VARCHAR(255) NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `assignment_submissions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `assignment_id` BIGINT NOT NULL,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `submission_text` TEXT,
          `file_url` TEXT,
          `status` VARCHAR(50) NOT NULL DEFAULT 'submitted',
          `marks` VARCHAR(50),
          `feedback` TEXT,
          `submitted_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `notices` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `title` VARCHAR(255) NOT NULL,
          `content` TEXT NOT NULL,
          `category` VARCHAR(100) NOT NULL DEFAULT 'Academic',
          `priority` VARCHAR(50) NOT NULL DEFAULT 'normal',
          `author_name` VARCHAR(255) NOT NULL DEFAULT 'Administration Office',
          `published_date` VARCHAR(100) NOT NULL,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `leave_requests` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `roll_no` VARCHAR(100) NOT NULL,
          `department` VARCHAR(100) NOT NULL,
          `from_date` VARCHAR(100) NOT NULL,
          `to_date` VARCHAR(100) NOT NULL,
          `reason` TEXT NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
          `reviewed_by` VARCHAR(255),
          `reviewed_at` VARCHAR(100),
          `remarks` TEXT,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `timetable` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `department` VARCHAR(100) NOT NULL,
          `semester` BIGINT NOT NULL,
          `day_of_week` VARCHAR(50) NOT NULL,
          `start_time` VARCHAR(50) NOT NULL,
          `end_time` VARCHAR(50) NOT NULL,
          `room` VARCHAR(100) NOT NULL,
          `faculty_name` VARCHAR(255) NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `admissions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL UNIQUE,
          `admission_number` VARCHAR(100) NOT NULL,
          `admission_date` VARCHAR(100) NOT NULL,
          `category` VARCHAR(100) NOT NULL DEFAULT 'General',
          `previous_institution` TEXT,
          `father_name` VARCHAR(255),
          `mother_name` VARCHAR(255),
          `guardian_phone` VARCHAR(100),
          `blood_group` VARCHAR(20),
          `address` TEXT,
          `is_hosteler` BIGINT NOT NULL DEFAULT 0,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `documents` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `category` VARCHAR(100) NOT NULL DEFAULT 'Other',
          `file_name` VARCHAR(255) NOT NULL,
          `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
          `file_size` BIGINT NOT NULL DEFAULT 0,
          `data` LONGTEXT NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
          `uploaded_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `enrollments` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `course_id` BIGINT NOT NULL,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `status` VARCHAR(50) NOT NULL DEFAULT 'active'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `sections` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `code` VARCHAR(100) NOT NULL,
          `name` VARCHAR(255) NOT NULL,
          `department` VARCHAR(100) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `room` VARCHAR(100)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `semesters` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `number` BIGINT NOT NULL,
          `name` VARCHAR(255) NOT NULL,
          `department` VARCHAR(100) NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'inactive',
          `starts_on` VARCHAR(100),
          `ends_on` VARCHAR(100)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `academic_sessions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `name` VARCHAR(255) NOT NULL UNIQUE,
          `start_date` VARCHAR(100) NOT NULL,
          `end_date` VARCHAR(100) NOT NULL,
          `is_current` BIGINT NOT NULL DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `exam_schedules` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `exam_type` VARCHAR(100) NOT NULL,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `department` VARCHAR(100) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `exam_date` VARCHAR(100) NOT NULL,
          `start_time` VARCHAR(50) NOT NULL,
          `end_time` VARCHAR(50) NOT NULL,
          `room` VARCHAR(100) NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `exams` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `name` VARCHAR(255) NOT NULL,
          `exam_type` VARCHAR(100) NOT NULL DEFAULT 'Mid-Term',
          `department` VARCHAR(100) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `session` VARCHAR(100) NOT NULL DEFAULT '2025-26',
          `start_date` VARCHAR(100) NOT NULL,
          `end_date` VARCHAR(100) NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'scheduled',
          `passing_percent` BIGINT NOT NULL DEFAULT 40,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `internal_marks` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `student_id` BIGINT NOT NULL,
          `student_name` VARCHAR(255) NOT NULL,
          `course_id` BIGINT NOT NULL,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `exam_type` VARCHAR(100) NOT NULL,
          `semester` BIGINT NOT NULL DEFAULT 1,
          `theory_marks` VARCHAR(50) NOT NULL DEFAULT '0',
          `practical_marks` VARCHAR(50) NOT NULL DEFAULT '0',
          `max_theory` VARCHAR(50) NOT NULL DEFAULT '30',
          `max_practical` VARCHAR(50) NOT NULL DEFAULT '20',
          `total_marks` VARCHAR(50) NOT NULL,
          `max_total` VARCHAR(50) NOT NULL,
          `pass_marks` VARCHAR(50) NOT NULL,
          `grade_letter` VARCHAR(10) NOT NULL,
          `result` VARCHAR(50) NOT NULL DEFAULT 'pass',
          `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
          `remarks` TEXT,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `permissions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `role` VARCHAR(100) NOT NULL,
          `module` VARCHAR(100) NOT NULL,
          `can_view` BIGINT NOT NULL DEFAULT 1,
          `can_create` BIGINT NOT NULL DEFAULT 0,
          `can_edit` BIGINT NOT NULL DEFAULT 0,
          `can_delete` BIGINT NOT NULL DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `faculty_attendance` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `faculty_id` BIGINT NOT NULL,
          `faculty_name` VARCHAR(255) NOT NULL,
          `date` VARCHAR(100) NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'present',
          `marked_by` VARCHAR(255),
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `course_materials` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `course_id` BIGINT NOT NULL,
          `course_code` VARCHAR(100) NOT NULL,
          `course_name` VARCHAR(255) NOT NULL,
          `module_name` VARCHAR(255) NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `description` TEXT,
          `type` VARCHAR(50) NOT NULL DEFAULT 'PDF',
          `file_url` TEXT NOT NULL,
          `file_size` VARCHAR(50) NOT NULL DEFAULT '1.5 MB',
          `faculty_id` BIGINT,
          `faculty_name` VARCHAR(255) NOT NULL,
          `download_count` BIGINT NOT NULL DEFAULT 0,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competitions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `title` VARCHAR(255) NOT NULL,
          `description` TEXT NOT NULL,
          `type` VARCHAR(100) NOT NULL DEFAULT 'Hackathon',
          `reg_start` VARCHAR(100) NOT NULL,
          `reg_end` VARCHAR(100) NOT NULL,
          `comp_date` VARCHAR(100) NOT NULL,
          `team_size_min` BIGINT NOT NULL DEFAULT 1,
          `team_size_max` BIGINT NOT NULL DEFAULT 4,
          `eligibility_dept` VARCHAR(255) NOT NULL DEFAULT 'All Departments',
          `rules` TEXT,
          `problem_statements` TEXT,
          `submission_deadline` VARCHAR(100) NOT NULL,
          `evaluation_criteria` TEXT,
          `prizes` TEXT,
          `is_leaderboard_published` BIGINT NOT NULL DEFAULT 0,
          `status` VARCHAR(50) NOT NULL DEFAULT 'open',
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_teams` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `competition_id` BIGINT NOT NULL,
          `team_name` VARCHAR(255) NOT NULL,
          `captain_id` BIGINT NOT NULL,
          `captain_name` VARCHAR(255) NOT NULL,
          `is_locked` BIGINT NOT NULL DEFAULT 0,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_team_members` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `team_id` BIGINT NOT NULL,
          `user_id` BIGINT NOT NULL,
          `user_name` VARCHAR(255) NOT NULL,
          `email` VARCHAR(255) NOT NULL,
          `role_in_team` VARCHAR(100) NOT NULL DEFAULT 'member',
          `status` VARCHAR(50) NOT NULL DEFAULT 'accepted',
          `joined_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_submissions` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `competition_id` BIGINT NOT NULL,
          `team_id` BIGINT NOT NULL,
          `team_name` VARCHAR(255) NOT NULL,
          `project_title` VARCHAR(255) NOT NULL,
          `description` TEXT NOT NULL,
          `github_url` TEXT,
          `demo_url` TEXT,
          `ppt_url` TEXT,
          `screenshots_url` TEXT,
          `video_url` TEXT,
          `is_locked` BIGINT NOT NULL DEFAULT 0,
          `submitted_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_evaluations` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `competition_id` BIGINT NOT NULL,
          `team_id` BIGINT NOT NULL,
          `judge_id` BIGINT NOT NULL,
          `judge_name` VARCHAR(255) NOT NULL,
          `score_innovation` BIGINT NOT NULL DEFAULT 0,
          `score_tech` BIGINT NOT NULL DEFAULT 0,
          `score_uiux` BIGINT NOT NULL DEFAULT 0,
          `score_impact` BIGINT NOT NULL DEFAULT 0,
          `score_presentation` BIGINT NOT NULL DEFAULT 0,
          `total_score` DOUBLE NOT NULL DEFAULT 0,
          `remarks` TEXT,
          `evaluated_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_attendance` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `competition_id` BIGINT NOT NULL,
          `user_id` BIGINT NOT NULL,
          `user_name` VARCHAR(255) NOT NULL,
          `check_in_time` VARCHAR(100) NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'checked_in',
          `verified_by` VARCHAR(255) NOT NULL DEFAULT 'System QR Gate'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `competition_certificates` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `competition_id` BIGINT NOT NULL,
          `competition_title` VARCHAR(255) NOT NULL,
          `user_id` BIGINT NOT NULL,
          `user_name` VARCHAR(255) NOT NULL,
          `team_name` VARCHAR(255),
          `cert_type` VARCHAR(100) NOT NULL DEFAULT 'participant',
          `cert_code` VARCHAR(255) NOT NULL UNIQUE,
          `qr_payload` TEXT NOT NULL,
          `issued_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS `feedback_ratings` (
          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
          `user_id` BIGINT NOT NULL,
          `user_name` VARCHAR(255) NOT NULL,
          `user_role` VARCHAR(50) NOT NULL DEFAULT 'guest',
          `rating` INT NOT NULL,
          `comment` TEXT,
          `created_at` VARCHAR(100) NOT NULL DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
        );
        """,
    ];
}
