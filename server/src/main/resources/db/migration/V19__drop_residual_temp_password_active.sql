-- Cleanup migration for environments where V17 could not rename the column
SET @drop_temp_password_active := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `student` DROP COLUMN `temp_password_active`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'student'
    AND column_name = 'temp_password_active'
);
PREPARE stmt FROM @drop_temp_password_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
