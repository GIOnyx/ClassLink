SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'student'
      AND COLUMN_NAME = 'temp_password_active'
);

SET @ddl := IF(
    @column_exists = 0,
    'ALTER TABLE student ADD COLUMN temp_password_active TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE student
SET temp_password_active = CASE
    WHEN temp_password IS NULL OR temp_password = '' THEN 0
    ELSE 1
END;
