SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'student'
      AND COLUMN_NAME = 'temp_password'
);

SET @ddl := IF(@column_exists = 0,
    'ALTER TABLE student ADD COLUMN temp_password VARCHAR(128) NULL',
    'SELECT 1');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE student
SET temp_password = password
WHERE temp_password IS NULL;
