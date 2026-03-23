-- Demo seed data for school timetable generator (PostgreSQL)
-- Safe to run multiple times: inserts only missing rows.

-- 1) Ensure a demo school exists.
INSERT INTO schools (name, address, phone, active, created_at)
SELECT 'Lycée Demo', 'Avenue de l''Éducation', '0555-000-111', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM schools WHERE id = 1
);

-- 2) Subjects are intentionally not seeded.

-- 3) Class groups (school 1)
INSERT INTO class_groups (name, level, student_count, school_id)
SELECT v.name, v.level, v.student_count, 1
FROM (VALUES
    ('1AS-A', '1AS', 28),
    ('1AS-B', '1AS', 30),
    ('2AS-A', '2AS', 26),
    ('3AS-A', '3AS', 24)
) AS v(name, level, student_count)
WHERE NOT EXISTS (
    SELECT 1 FROM class_groups c WHERE c.school_id = 1 AND c.name = v.name
);

-- 4) Rooms (school 1)
INSERT INTO rooms (name, capacity, type, school_id)
SELECT v.name, v.capacity, v.type, 1
FROM (VALUES
    ('s1', 40, 'COURS'),
    ('s2', 40, 'COURS'),
    ('s3', 40, 'COURS'),
    ('s4', 40, 'COURS'),
    ('s5', 40, 'COURS'),
    ('s6', 40, 'SPORT')
) AS v(name, capacity, type)
WHERE NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.school_id = 1 AND r.name = v.name
);

-- 4b) Normalize existing room data for compatibility with solver requirements.
UPDATE rooms
SET type = 'COURS'
WHERE school_id = 1
    AND upper(type) = 'COURS';

UPDATE rooms
SET type = 'SPORT'
WHERE school_id = 1
    AND upper(type) = 'SPORT';

UPDATE rooms
SET capacity = GREATEST(
    capacity,
    COALESCE((SELECT MAX(student_count) FROM class_groups WHERE school_id = 1), 35),
    40
)
WHERE school_id = 1
    AND upper(type) IN ('COURS', 'SPORT');

-- 5) Teachers and teacher-subject assignments are intentionally not seeded.
