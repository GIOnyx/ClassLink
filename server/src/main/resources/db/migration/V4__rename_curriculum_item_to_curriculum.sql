-- Flyway migration V4: rename curriculum_item -> curriculum and backup legacy curriculum
-- IMPORTANT: Run on staging first and ensure DB is backed up before applying to production.

-- 1) Create a backup copy of the existing "curriculum" table (if it exists)
CREATE TABLE IF NOT EXISTS curriculum_legacy_backup AS SELECT * FROM curriculum;

-- 2) Rename the legacy "curriculum" table out of the way (if it exists)
-- NOTE: MySQL supports RENAME TABLE; if your RDBMS differs adjust accordingly.
SET @old_exists := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'curriculum');
-- Only attempt rename if table exists
-- The following conditional uses a prepared statement because MySQL does not allow IF ... THEN for DDL in plain SQL migration files on some versions.

-- Rename only when the table exists
DO
  BEGIN
    IF @old_exists > 0 THEN
      SET @s = CONCAT('RENAME TABLE `curriculum` TO `curriculum_legacy`;');
      PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
  END;

-- 3) Rename curriculum_item to curriculum
-- If curriculum_item doesn't exist, this will fail; ensure migrations run on correct schema.
SET @ci_exists := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'curriculum_item');
DO
  BEGIN
    IF @ci_exists > 0 THEN
      SET @r = CONCAT('RENAME TABLE `curriculum_item` TO `curriculum`;');
      PREPARE stmtr FROM @r; EXECUTE stmtr; DEALLOCATE PREPARE stmtr;
    END IF;
  END;

-- 4) Notes for the operator:
-- - After applying this migration, verify that the new `curriculum` table has expected columns (program_id, year, semester, subject_code, etc.).
-- - The old data from the original `curriculum` table is now in `curriculum_legacy` (if it existed), and a lightweight snapshot may be in `curriculum_legacy_backup`.
-- - Do NOT drop the backups until you have verified application behavior and data correctness.

-- End of migration
