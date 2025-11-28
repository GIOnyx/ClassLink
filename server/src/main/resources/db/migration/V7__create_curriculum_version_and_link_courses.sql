-- Create a new curriculum_version table to store curriculum metadata/versions
CREATE TABLE IF NOT EXISTS curriculum_version (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  program_id BIGINT,
  version_name VARCHAR(255),
  effectivity_year INT,
  duration_in_years INT,
  CONSTRAINT fk_curriculum_version_program FOREIGN KEY (program_id) REFERENCES program(id)
);

-- Add a nullable FK column to existing curriculum (course) rows to link them to a curriculum_version
ALTER TABLE curriculum
  ADD COLUMN IF NOT EXISTS curriculum_version_id BIGINT;

ALTER TABLE curriculum
  ADD CONSTRAINT IF NOT EXISTS fk_curriculum_to_version FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_version(id);
