-- Recreate the course table with the new schema expected by the refactored backend.

SET @drop_fk_sql := (
  SELECT CONCAT('ALTER TABLE `enrollment` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'enrollment'
    AND referenced_table_name IN ('course', 'course_legacy')
  LIMIT 1
);
SET @drop_fk_sql := IF(@drop_fk_sql IS NULL, 'SELECT 1', @drop_fk_sql);
PREPARE stmt FROM @drop_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_fk_sql := (
  SELECT CONCAT('ALTER TABLE `enrollment` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'enrollment'
    AND referenced_table_name IN ('course', 'course_legacy')
  LIMIT 1
);
SET @drop_fk_sql := IF(@drop_fk_sql IS NULL, 'SELECT 1', @drop_fk_sql);
PREPARE stmt FROM @drop_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Clean up any partially-created course table from a previous failed run
SET @drop_course_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'DROP TABLE `course`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'id'
);
PREPARE stmt FROM @drop_course_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Ensure the legacy table is available for copy operations
SET @rename_sql := (
  SELECT IF(
    legacy_count = 0 AND course_count > 0,
    'RENAME TABLE `course` TO `course_legacy`',
    'SELECT 1'
  )
  FROM (
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'course_legacy') AS legacy_count,
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'course') AS course_count
  ) AS counts
);
PREPARE stmt FROM @rename_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Create the new course table structure
CREATE TABLE course (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(255),
  description VARCHAR(1000),
  equiv_subject_code VARCHAR(255),
  prerequisite VARCHAR(255),
  semester VARCHAR(255),
  term_title VARCHAR(255),
  units INT,
  year INT,
  program_id BIGINT,
  curriculum_version_id BIGINT,
  CONSTRAINT fk_course_program FOREIGN KEY (program_id) REFERENCES program(id),
  CONSTRAINT fk_course_curriculum_version FOREIGN KEY (curriculum_version_id) REFERENCES curriculum(curriculum_id)
);

-- 5) Copy over any existing rows, keeping their original identifiers
INSERT INTO course (
  id,
  subject_code,
  description,
  equiv_subject_code,
  prerequisite,
  semester,
  term_title,
  units,
  year,
  program_id,
  curriculum_version_id
)
SELECT
  courseid,
  subject_code,
  description,
  equiv_subject_code,
  prerequisite,
  semester,
  term_title,
  units,
  year,
  program_id,
  curriculum_version_id
FROM course_legacy;

-- 6) Advance the auto-increment value so future inserts continue smoothly
SET @max_course_id := (SELECT COALESCE(MAX(id), 0) FROM course);
SET @auto_increment_sql := CONCAT('ALTER TABLE `course` AUTO_INCREMENT = ', @max_course_id + 1, ';');
PREPARE stmt FROM @auto_increment_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7) Backfill enrollment to point to the new course ids and drop obsolete columns
SET @backfill_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'UPDATE `enrollment` SET `course_id` = `curriculum_id` WHERE `course_id` IS NULL AND `curriculum_id` IS NOT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'enrollment'
    AND column_name = 'curriculum_id'
);
PREPARE stmt FROM @backfill_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure course_id column type matches the newly created course primary key
ALTER TABLE enrollment MODIFY COLUMN course_id BIGINT;

SET @drop_fk_curriculum_sql := (
  SELECT CONCAT('ALTER TABLE `enrollment` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'enrollment'
    AND referenced_table_name = 'curriculum'
  LIMIT 1
);
SET @drop_fk_curriculum_sql := IF(@drop_fk_curriculum_sql IS NULL, 'SELECT 1', @drop_fk_curriculum_sql);
PREPARE stmt FROM @drop_fk_curriculum_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_column_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `enrollment` DROP COLUMN `curriculum_id`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'enrollment'
    AND column_name = 'curriculum_id'
);
PREPARE stmt FROM @drop_column_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8) Recreate the foreign key from enrollment to course where missing
SET @add_fk_sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `enrollment` ADD CONSTRAINT `fk_enrollment_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`id`)',
    'SELECT 1'
  )
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'enrollment'
    AND referenced_table_name = 'course'
);
PREPARE stmt FROM @add_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9) Drop the legacy table now that relationships have been migrated
DROP TABLE IF EXISTS course_legacy;
