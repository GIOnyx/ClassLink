-- Create a new `course` table and migrate existing course-like rows from `curriculum` into it.

CREATE TABLE IF NOT EXISTS course (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(255),
  description VARCHAR(1000),
  equiv_subject_code VARCHAR(255),
  prerequisite VARCHAR(255),
  semester VARCHAR(255),
  term_title VARCHAR(255),
  units INT,
  year INT,
  program_id BIGINT,
  department_id BIGINT,
  program_code VARCHAR(255),
  program_name VARCHAR(255),
  curriculum_version_id BIGINT,
  CONSTRAINT fk_course_program FOREIGN KEY (program_id) REFERENCES program(id)
);

-- Copy existing rows from curriculum into the new course table
INSERT INTO course (subject_code, description, equiv_subject_code, prerequisite, semester, term_title, units, year, program_id, department_id, program_code, program_name, curriculum_version_id)
SELECT subject_code, description, equiv_subject_code, prerequisite, semester, term_title, units, year, program_id, department_id, program_code, program_name, curriculum_version_id
FROM curriculum;

-- Remove course-specific columns from curriculum (we'll treat curriculum as curriculum versions table)
ALTER TABLE curriculum
  DROP COLUMN IF EXISTS subject_code,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS equiv_subject_code,
  DROP COLUMN IF EXISTS prerequisite,
  DROP COLUMN IF EXISTS semester,
  DROP COLUMN IF EXISTS term_title,
  DROP COLUMN IF EXISTS units,
  DROP COLUMN IF EXISTS year,
  DROP COLUMN IF EXISTS program_code,
  DROP COLUMN IF EXISTS program_name,
  DROP COLUMN IF EXISTS department_id;

-- Add columns for curriculum version metadata (if not present)
ALTER TABLE curriculum
  ADD COLUMN IF NOT EXISTS version_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS effectivity_year INT,
  ADD COLUMN IF NOT EXISTS duration_in_years INT;

-- Add FK from course to curriculum (curriculum_id is the PK of curriculum table)
ALTER TABLE course
  ADD CONSTRAINT IF NOT EXISTS fk_course_curriculum_version FOREIGN KEY (curriculum_version_id) REFERENCES curriculum(curriculum_id);
