-- Ограничения для John Doe (emp_id = 2)
INSERT INTO constraint_types (type, applies_to, start_date, shift_id, emp_id, is_permanent, status, priority, createdAt, updatedAt) VALUES
-- Не может работать в понедельник утром
('cannot_work', 'specific_date', '2025-06-09', 31, 2, false, 'approved', 1, NOW(), NOW()),
-- Предпочитает работать во вторник ночью
('prefer_work', 'specific_date', '2025-06-10', 33, 2, false, 'approved', 1, NOW(), NOW()),
-- Не может работать в четверг день
('cannot_work', 'specific_date', '2025-06-12', 32, 2, false, 'approved', 1, NOW(), NOW());

-- Ограничения для Alice Smith (предполагаем emp_id = 4)
INSERT INTO constraint_types (type, applies_to, start_date, shift_id, emp_id, is_permanent, status, priority, createdAt, updatedAt) VALUES
-- Не может работать в воскресенье (весь день)
('cannot_work', 'specific_date', '2025-06-08', 31, 4, false, 'approved', 1, NOW(), NOW()),
('cannot_work', 'specific_date', '2025-06-08', 32, 4, false, 'approved', 1, NOW(), NOW()),
('cannot_work', 'specific_date', '2025-06-08', 33, 4, false, 'approved', 1, NOW(), NOW()),
-- Предпочитает работать в среду
('prefer_work', 'specific_date', '2025-06-11', 31, 4, false, 'approved', 1, NOW(), NOW()),
('prefer_work', 'specific_date', '2025-06-11', 32, 4, false, 'approved', 1, NOW(), NOW()),
-- Не может работать в пятницу ночью
('cannot_work', 'specific_date', '2025-06-13', 33, 4, false, 'approved', 1, NOW(), NOW());

-- Ограничения для Bob Johnson (предполагаем emp_id = 5)
INSERT INTO constraint_types (type, applies_to, start_date, shift_id, emp_id, is_permanent, status, priority, createdAt, updatedAt) VALUES
-- Предпочитает работать в понедельник
('prefer_work', 'specific_date', '2025-06-09', 32, 5, false, 'approved', 1, NOW(), NOW()),
('prefer_work', 'specific_date', '2025-06-09', 33, 5, false, 'approved', 1, NOW(), NOW()),
-- Не может работать во вторник утром
('cannot_work', 'specific_date', '2025-06-10', 31, 5, false, 'approved', 1, NOW(), NOW()),
-- Предпочитает работать в субботу день
('prefer_work', 'specific_date', '2025-06-14', 32, 5, false, 'approved', 1, NOW(), NOW()),
-- Не может работать в четверг
('cannot_work', 'specific_date', '2025-06-12', 31, 5, false, 'approved', 1, NOW(), NOW()),
('cannot_work', 'specific_date', '2025-06-12', 33, 5, false, 'approved', 1, NOW(), NOW());