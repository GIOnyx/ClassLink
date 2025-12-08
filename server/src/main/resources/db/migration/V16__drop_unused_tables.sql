-- Remove leftover references to the deprecated curriculum_version table
SET @drop_curriculum_fk := (
  SELECT CONCAT('ALTER TABLE `curriculum` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'curriculum'
    AND referenced_table_name = 'curriculum_version'
  LIMIT 1
);
SET @drop_curriculum_fk := IF(@drop_curriculum_fk IS NULL, 'SELECT 1', @drop_curriculum_fk);
PREPARE stmt FROM @drop_curriculum_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_curriculum_version_column := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `curriculum` DROP COLUMN `curriculum_version_id`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'curriculum'
    AND column_name = 'curriculum_version_id'
);
PREPARE stmt FROM @drop_curriculum_version_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop unused tables that are no longer referenced by the application
DROP TABLE IF EXISTS curriculum_version;
DROP TABLE IF EXISTS enrollment_form;
DROP TABLE IF EXISTS enrollment;
DROP TABLE IF EXISTS message;
