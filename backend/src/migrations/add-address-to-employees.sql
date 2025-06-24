-- backend/migrations/add-address-to-employees.sql
ALTER TABLE `employees`
    ADD COLUMN `country` VARCHAR(100) NULL AFTER `phone`,
    ADD COLUMN `city` VARCHAR(100) NULL AFTER `country`,
    ADD COLUMN `address` TEXT NULL AFTER `city`,
    ADD INDEX `idx_employees_country_city` (`country`, `city`);

-- Добавляем адреса существующим сотрудникам
UPDATE employees SET
                     country = 'Israel',
                     city = CASE
                                WHEN emp_id % 3 = 0 THEN 'Tel Aviv'
                                WHEN emp_id % 3 = 1 THEN 'Jerusalem'
                                ELSE 'Haifa'
                         END,
                     address = CONCAT(
                             CASE WHEN emp_id % 4 = 0 THEN 'Rothschild Blvd'
                                  WHEN emp_id % 4 = 1 THEN 'Dizengoff St'
                                  WHEN emp_id % 4 = 2 THEN 'Ben Yehuda St'
                                  ELSE 'King George St'
                                 END,
                             ' ',
                             FLOOR(RAND() * 200) + 1,
                             ', Apt ',
                             FLOOR(RAND() * 50) + 1
                               )
WHERE emp_id > 0;