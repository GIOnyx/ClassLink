-- Backfill curriculum_version for existing programs and link existing curriculum rows

-- Insert one default curriculum_version per program_id found in the curriculum table
INSERT INTO curriculum_version (program_id, version_name, effectivity_year, duration_in_years)
SELECT DISTINCT program_id,
       CONCAT('Imported Default ', IFNULL(program_id, 'unknown')) AS version_name,
       YEAR(CURDATE()) AS effectivity_year,
       NULL
FROM curriculum
WHERE program_id IS NOT NULL
ON DUPLICATE KEY UPDATE version_name = VALUES(version_name);

-- Update curriculum rows to point to the created curriculum_version rows (pick any matching version for the program)
UPDATE curriculum c
SET c.curriculum_version_id = (
  SELECT cv.id FROM curriculum_version cv WHERE cv.program_id = c.program_id LIMIT 1
)
WHERE c.program_id IS NOT NULL;
