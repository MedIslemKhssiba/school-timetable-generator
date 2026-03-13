-- Demo seed data for school timetable generator (PostgreSQL)
-- Safe to run multiple times: inserts only missing rows.

-- 1) Ensure a demo school exists.
INSERT INTO schools (name, address, phone, active, created_at)
SELECT 'Lycée Demo', 'Avenue de l''Éducation', '0555-000-111', true, now()
WHERE NOT EXISTS (
    SELECT 1 FROM schools WHERE id = 1
);

-- 2) Subjects (school 1)
INSERT INTO subjects (name, color, hours_per_week, session_duration, school_id)
SELECT v.name, v.color, v.hours_per_week, 1, 1
FROM (VALUES
    ('Mathematics', '#2563eb', 5),
    ('Physics', '#0ea5e9', 3),
    ('Chemistry', '#10b981', 2),
    ('English', '#f59e0b', 3),
    ('French', '#ef4444', 3),
    ('History', '#8b5cf6', 2)
) AS v(name, color, hours_per_week)
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.school_id = 1 AND s.name = v.name
);

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
    ('A101', 35, 'CLASSROOM'),
    ('A102', 35, 'CLASSROOM'),
    ('B201', 30, 'CLASSROOM'),
    ('B202', 30, 'CLASSROOM'),
    ('LAB-PHY', 25, 'LAB'),
    ('LAB-CHM', 25, 'LAB'),
    ('LANG-1', 28, 'LANGUAGE'),
    ('HIST-1', 30, 'CLASSROOM')
) AS v(name, capacity, type)
WHERE NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.school_id = 1 AND r.name = v.name
);

-- 5) Teachers (school 1)
INSERT INTO teachers (first_name, last_name, email, max_hours_per_week, school_id, user_id)
SELECT v.first_name, v.last_name, v.email, v.max_hours_per_week, 1, NULL
FROM (VALUES
    ('Amine', 'Belaid', 'amine.belaid@teacher.demo', 20),
    ('Salma', 'Cherif', 'salma.cherif@teacher.demo', 20),
    ('Karim', 'Messaoud', 'karim.messaoud@teacher.demo', 18),
    ('Nour', 'Benkhaled', 'nour.benkhaled@teacher.demo', 18),
    ('Imane', 'Saadi', 'imane.saadi@teacher.demo', 20),
    ('Yacine', 'Guerfi', 'yacine.guerfi@teacher.demo', 18),
    ('Sofiane', 'Rahal', 'sofiane.rahal@teacher.demo', 16),
    ('Lina', 'Djebar', 'lina.djabar@teacher.demo', 16)
) AS v(first_name, last_name, email, max_hours_per_week)
WHERE NOT EXISTS (
    SELECT 1 FROM teachers t WHERE t.email = v.email
);

-- 6) Teacher -> Subject assignments
INSERT INTO teacher_subjects (teacher_id, subject_id)
SELECT t.id, s.id
FROM teachers t
JOIN subjects s ON s.school_id = 1
JOIN (
    VALUES
      ('amine.belaid@teacher.demo', 'Mathematics'),
      ('salma.cherif@teacher.demo', 'Mathematics'),
      ('karim.messaoud@teacher.demo', 'Physics'),
      ('nour.benkhaled@teacher.demo', 'Chemistry'),
      ('imane.saadi@teacher.demo', 'English'),
      ('yacine.guerfi@teacher.demo', 'French'),
      ('sofiane.rahal@teacher.demo', 'History'),
      ('lina.djabar@teacher.demo', 'English'),
      ('lina.djabar@teacher.demo', 'French')
) AS map(teacher_email, subject_name)
  ON map.teacher_email = t.email AND map.subject_name = s.name
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts
    WHERE ts.teacher_id = t.id AND ts.subject_id = s.id
);
