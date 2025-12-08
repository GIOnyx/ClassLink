-- Remove the unused temp_password column
SET @drop_temp_password := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `student` DROP COLUMN `temp_password`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'student'
    AND column_name = 'temp_password'
);
PREPARE stmt FROM @drop_temp_password; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop the unused approval_email_login_used flag
SET @drop_approval_email_login := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `student` DROP COLUMN `approval_email_login_used`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'student'
    AND column_name = 'approval_email_login_used'
);
PREPARE stmt FROM @drop_approval_email_login; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Only rename if the old column still exists and the new one was not already created
SET @rename_flag := (
  SELECT IF(
    (
      SELECT COUNT(*)
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'student'
        AND column_name = 'temp_password_active'
    ) > 0
    AND (
      SELECT COUNT(*)
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'student'
        AND column_name = 'password_reset_required'
    ) = 0,
    'ALTER TABLE `student` CHANGE COLUMN `temp_password_active` `password_reset_required` TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
  )
);
PREPARE stmt FROM @rename_flag; EXECUTE stmt; DEALLOCATE PREPARE stmt;
