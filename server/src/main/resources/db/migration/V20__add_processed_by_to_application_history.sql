SET @processed_by_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'application_history'
    AND column_name = 'processed_by'
);

-- If the column already exists but is not BIGINT, wipe non-numeric values so we can convert
SET @needs_processed_by_conversion := (
  SELECT IF(@processed_by_column_exists = 0, 0,
    (SELECT CASE WHEN DATA_TYPE <> 'bigint' THEN 1 ELSE 0 END
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'application_history'
       AND column_name = 'processed_by'))
);

SET @cleanup_processed_by := IF(@needs_processed_by_conversion = 1,
  'UPDATE `application_history` SET `processed_by` = NULL',
  'SELECT 1'
);
PREPARE stmt FROM @cleanup_processed_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @upsert_processed_by := IF(@processed_by_column_exists = 0,
  'ALTER TABLE `application_history` ADD COLUMN `processed_by` BIGINT NULL AFTER `remarks`',
  'ALTER TABLE `application_history` MODIFY COLUMN `processed_by` BIGINT NULL'
);
PREPARE stmt FROM @upsert_processed_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure the foreign key to admin table exists
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
