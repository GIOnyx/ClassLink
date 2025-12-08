-- Ensure existing rows never contain NULL values
UPDATE student
SET password_reset_required = b'0'
WHERE password_reset_required IS NULL;

-- Lock the column down to prevent future NULL assignments
ALTER TABLE student
    MODIFY COLUMN password_reset_required BIT(1) NOT NULL DEFAULT b'0';
