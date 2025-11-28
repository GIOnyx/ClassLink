-- Drop legacy curriculum columns: term_title, year_label, curriculum_id
-- WARNING: This will permanently remove these columns and their data.
ALTER TABLE curriculum DROP COLUMN IF EXISTS term_title;
ALTER TABLE curriculum DROP COLUMN IF EXISTS year_label;
ALTER TABLE curriculum DROP COLUMN IF EXISTS curriculum_id;
