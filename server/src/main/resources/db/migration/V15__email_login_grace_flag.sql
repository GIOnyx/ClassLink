SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'student'
      AND COLUMN_NAME = 'email_login_grace_active'
);

SET @ddl := IF(
    @column_exists = 0,
    'ALTER TABLE student ADD COLUMN email_login_grace_active TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE student
SET email_login_grace_active = CASE
    WHEN status = 'APPROVED' THEN 1
    ELSE 0
END;
