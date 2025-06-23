-- backend/migrations/add-phone-to-employees.sql
ALTER TABLE `employees`
    ADD COLUMN `phone` VARCHAR(20) NULL AFTER `email`,
    ADD INDEX `idx_employees_phone` (`phone`);

-- Добавляем телефоны существующим сотрудникам
UPDATE employees SET phone = CASE
                                 WHEN emp_id = 1 THEN '+972-50-123-4567'
                                 WHEN emp_id = 2 THEN '+972-52-234-5678'
                                 WHEN emp_id = 3 THEN '+972-54-345-6789'
                                 WHEN emp_id = 4 THEN '+972-50-456-7890'
                                 WHEN emp_id = 5 THEN '+972-52-567-8901'
                                 WHEN emp_id = 6 THEN '+972-54-678-9012'
                                 WHEN emp_id = 7 THEN '+972-50-789-0123'
                                 WHEN emp_id = 8 THEN '+972-52-890-1234'
                                 WHEN emp_id = 9 THEN '+972-54-901-2345'
                                 ELSE CONCAT('+972-50-', LPAD(FLOOR(RAND() * 10000000), 7, '0'))
    END
WHERE emp_id > 0;

-- Для новых сотрудников, которых мы добавили ранее
UPDATE employees SET phone = CONCAT('+972-5', FLOOR(RAND() * 10), '-', LPAD(FLOOR(RAND() * 10000000), 7, '0'))
WHERE phone IS NULL AND emp_id > 9;