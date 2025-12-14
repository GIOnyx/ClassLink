SET @processed_by_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'application_history'
    AND column_name = 'processed_by'
);

SET @processed_by_is_bigint := (
  SELECT IF(@processed_by_column_exists = 0, 1,
    (SELECT CASE WHEN DATA_TYPE = 'bigint' THEN 1 ELSE 0 END
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'application_history'
       AND column_name = 'processed_by'))
);

-- If the column is missing entirely, add it as BIGINT so fresh environments stay aligned
SET @add_missing_column := IF(@processed_by_column_exists = 0,
  'ALTER TABLE `application_history` ADD COLUMN `processed_by` BIGINT NULL AFTER `student_id`',
  'SELECT 1'
);
PREPARE stmt FROM @add_missing_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Only legacy environments with VARCHAR columns need conversion
SET @add_temp_column := IF(@processed_by_column_exists = 1 AND @processed_by_is_bigint = 0,
  'ALTER TABLE `application_history` ADD COLUMN `processed_by_admin_id` BIGINT NULL AFTER `processed_by`',
  'SELECT 1'
);
PREPARE stmt FROM @add_temp_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Attempt to map any numeric values already storing admin ids
SET @numeric_backfill := IF(@processed_by_column_exists = 1 AND @processed_by_is_bigint = 0,
  'UPDATE `application_history` ah JOIN `admin` a ON a.`admin_id` = CAST(ah.`processed_by` AS UNSIGNED)
     SET ah.`processed_by_admin_id` = a.`admin_id`
   WHERE ah.`processed_by_admin_id` IS NULL AND ah.`processed_by` REGEXP ''^[0-9]+$''',
  'SELECT 1'
);
PREPARE stmt FROM @numeric_backfill;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Try to match by exact admin name
SET @name_backfill := IF(@processed_by_column_exists = 1 AND @processed_by_is_bigint = 0,
  'UPDATE `application_history` ah JOIN `admin` a ON TRIM(a.`name`) = TRIM(ah.`processed_by`)
     SET ah.`processed_by_admin_id` = a.`admin_id`
   WHERE ah.`processed_by_admin_id` IS NULL AND ah.`processed_by` IS NOT NULL AND a.`name` IS NOT NULL AND a.`name` <> ''''',
  'SELECT 1'
);
PREPARE stmt FROM @name_backfill;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Fallback to matching by admin email
SET @email_backfill := IF(@processed_by_column_exists = 1 AND @processed_by_is_bigint = 0,
  'UPDATE `application_history` ah JOIN `admin` a ON LOWER(a.`email`) = LOWER(TRIM(ah.`processed_by`))
     SET ah.`processed_by_admin_id` = a.`admin_id`
   WHERE ah.`processed_by_admin_id` IS NULL AND ah.`processed_by` IS NOT NULL AND a.`email` IS NOT NULL AND a.`email` <> ''''',
  'SELECT 1'
);
PREPARE stmt FROM @email_backfill;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the legacy VARCHAR column and promote the bigint column
SET @swap_columns := IF(@processed_by_column_exists = 1 AND @processed_by_is_bigint = 0,
  'ALTER TABLE `application_history` DROP COLUMN `processed_by`, CHANGE `processed_by_admin_id` `processed_by` BIGINT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @swap_columns;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure the foreign key to admin exists after conversion
SET @processed_by_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'application_history'
    AND constraint_name = 'fk_application_history_processed_by'
);

SET @add_processed_by_fk := IF(@processed_by_fk_exists = 0,
  'ALTER TABLE `application_history` ADD CONSTRAINT `fk_application_history_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `admin`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_processed_by_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
