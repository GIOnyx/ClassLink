-- Clean up legacy columns and tables after curriculum refactor.

-- Drop obsolete columns from course table left from legacy schema.
SET @drop_capacity_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `capacity`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'capacity'
);
PREPARE stmt FROM @drop_capacity_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_course_code_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `course_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'course_code'
);
PREPARE stmt FROM @drop_course_code_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_title_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `title`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'title'
);
PREPARE stmt FROM @drop_title_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop any foreign key that still references schedule_id before removing the column.
SET @drop_schedule_fk_sql := (
  SELECT CONCAT('ALTER TABLE `course` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.key_column_usage
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'schedule_id'
  LIMIT 1
);
SET @drop_schedule_fk_sql := IF(@drop_schedule_fk_sql IS NULL, 'SELECT 1', @drop_schedule_fk_sql);
PREPARE stmt FROM @drop_schedule_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_schedule_id_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `schedule_id`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'schedule_id'
);
PREPARE stmt FROM @drop_schedule_id_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop any FK referencing department_id before removing the column.
SET @drop_department_fk_sql := (
  SELECT CONCAT('ALTER TABLE `course` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.key_column_usage
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'department_id'
  LIMIT 1
);
SET @drop_department_fk_sql := IF(@drop_department_fk_sql IS NULL, 'SELECT 1', @drop_department_fk_sql);
PREPARE stmt FROM @drop_department_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_department_id_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `department_id`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'department_id'
);
PREPARE stmt FROM @drop_department_id_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_program_code_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `program_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'program_code'
);
PREPARE stmt FROM @drop_program_code_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_program_name_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `course` DROP COLUMN `program_name`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'program_name'
);
PREPARE stmt FROM @drop_program_name_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure course table keeps the foreign key pointing to curriculum.
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'course'
    AND constraint_name = 'fk_course_curriculum_version'
);
SET @add_fk_sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `course` ADD CONSTRAINT `fk_course_curriculum_version` FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum`(`curriculum_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Additional safeguard: repeat FK drop in case multiple references exist.
SET @drop_schedule_fk_sql := (
  SELECT CONCAT('ALTER TABLE `course` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.key_column_usage
  WHERE table_schema = DATABASE()
    AND table_name = 'course'
    AND column_name = 'schedule_id'
  LIMIT 1
);
SET @drop_schedule_fk_sql := IF(@drop_schedule_fk_sql IS NULL, 'SELECT 1', @drop_schedule_fk_sql);
PREPARE stmt FROM @drop_schedule_fk_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Remove curriculum columns that stored course data.
SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `program_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'program_code'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `program_name`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'program_name'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `description`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'description'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `equiv_subject_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'equiv_subject_code'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `prerequisite`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'prerequisite'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `semester`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'semester'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `subject_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'subject_code'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `term_title`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'term_title'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `units`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'units'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `year`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'year'
);
PREPARE stmt FROM @drop_curriculum_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Remove legacy curriculum_item table now that courses hold subject rows.
DROP TABLE IF EXISTS curriculum_item;
