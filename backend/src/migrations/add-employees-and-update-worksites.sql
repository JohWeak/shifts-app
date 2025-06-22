-- backend/migrations/add-employees-and-update-worksites.sql

-- 1. Сначала обновим название work site
UPDATE work_sites SET site_name = 'Amot' WHERE site_id = 2;

-- 2. Добавим позицию Receptionist для Amot (site_id = 2)
INSERT INTO positions (pos_name, profession, num_of_emp, num_of_shifts, site_id, createdAt, updatedAt)
VALUES ('Receptionist', 'Administration', 1, 2, 2, NOW(), NOW());

-- Сохраним ID новой позиции
SET @amot_receptionist_id = LAST_INSERT_ID();

-- 3. Обновим всех существующих работников - добавим им work_site_id = 1 (Main Office)
UPDATE employees
SET work_site_id = 1
WHERE emp_id NOT IN (1) -- Не трогаем админа
  AND work_site_id IS NULL;

-- 4. Добавим 2 новых работников на Security Guard в Main Office
INSERT INTO employees (first_name, last_name, email, login, password, status, role, default_position_id, work_site_id, createdAt, updatedAt) VALUES
                                                                                                                                                 ('James', 'Anderson', 'james.anderson@example.com', 'james', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 1, 1, NOW(), NOW()),
                                                                                                                                                 ('Sophia', 'Martinez', 'sophia.martinez@example.com', 'sophia', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 1, 1, NOW(), NOW());

-- 5. Добавим 2 новых работников на Receptionist в Main Office
INSERT INTO employees (first_name, last_name, email, login, password, status, role, default_position_id, work_site_id, createdAt, updatedAt) VALUES
                                                                                                                                                 ('Oliver', 'Thompson', 'oliver.thompson@example.com', 'oliver', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 2, 1, NOW(), NOW()),
                                                                                                                                                 ('Isabella', 'Garcia', 'isabella.garcia@example.com', 'isabella', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 2, 1, NOW(), NOW());

-- 6. Добавим 5 работников на Receptionist в Amot
INSERT INTO employees (first_name, last_name, email, login, password, status, role, default_position_id, work_site_id, createdAt, updatedAt) VALUES
                                                                                                                                                 ('Liam', 'Robinson', 'liam.robinson@amot.com', 'liam', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', @amot_receptionist_id, 2, NOW(), NOW()),
                                                                                                                                                 ('Charlotte', 'Clark', 'charlotte.clark@amot.com', 'charlotte', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', @amot_receptionist_id, 2, NOW(), NOW()),
                                                                                                                                                 ('Noah', 'Lewis', 'noah.lewis@amot.com', 'noah', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', @amot_receptionist_id, 2, NOW(), NOW()),
                                                                                                                                                 ('Amelia', 'Walker', 'amelia.walker@amot.com', 'amelia', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', @amot_receptionist_id, 2, NOW(), NOW()),
                                                                                                                                                 ('Ethan', 'Hall', 'ethan.hall@amot.com', 'ethan', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', @amot_receptionist_id, 2, NOW(), NOW());

-- 7. Добавим 2 работников без work_site (any) и без позиции
INSERT INTO employees (first_name, last_name, email, login, password, status, role, default_position_id, work_site_id, createdAt, updatedAt) VALUES
                                                                                                                                                 ('Mason', 'Young', 'mason.young@example.com', 'mason', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', NULL, NULL, NOW(), NOW()),
                                                                                                                                                 ('Harper', 'King', 'harper.king@example.com', 'harper', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', NULL, NULL, NOW(), NOW());

-- 8. Добавим 2 работников без work_site (any) но с позицией Security Guard
INSERT INTO employees (first_name, last_name, email, login, password, status, role, default_position_id, work_site_id, createdAt, updatedAt) VALUES
                                                                                                                                                 ('William', 'Wright', 'william.wright@example.com', 'william', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 1, NULL, NOW(), NOW()),
                                                                                                                                                 ('Evelyn', 'Lopez', 'evelyn.lopez@example.com', 'evelyn', '$2b$10$f7QaFaDXDYrV2iGbr9FwgeBbOurCo3FtGVBtvbzHW17MaIwQsYkq6', 'active', 'employee', 1, NULL, NOW(), NOW());

-- Проверим результаты
SELECT
    e.emp_id,
    CONCAT(e.first_name, ' ', e.last_name) as full_name,
    e.email,
    w.site_name as work_site,
    p.pos_name as position
FROM employees e
         LEFT JOIN work_sites w ON e.work_site_id = w.site_id
         LEFT JOIN positions p ON e.default_position_id = p.pos_id
WHERE e.role = 'employee'
ORDER BY w.site_name, p.pos_name, e.emp_id;