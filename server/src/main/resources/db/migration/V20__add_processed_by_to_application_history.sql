-- Add processed_by column if it does not exist yet
SET @add_processed_by := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `application_history` ADD COLUMN `processed_by` VARCHAR(255) NULL AFTER `remarks`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'application_history'
    AND column_name = 'processed_by'
);
PREPARE stmt FROM @add_processed_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
