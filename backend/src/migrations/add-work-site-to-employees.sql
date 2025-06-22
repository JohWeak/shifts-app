-- backend/migrations/add-work-site-to-employees.sql
ALTER TABLE `employees`
    ADD COLUMN `work_site_id` INT NULL AFTER `default_position_id`,
    ADD CONSTRAINT `fk_employees_work_site`
        FOREIGN KEY (`work_site_id`)
            REFERENCES `work_sites` (`site_id`)
            ON DELETE SET NULL
            ON UPDATE CASCADE,
    ADD INDEX `idx_employees_work_site` (`work_site_id`);

-- Добавим комментарий
ALTER TABLE `employees`
    MODIFY COLUMN `work_site_id` INT NULL COMMENT 'Assigned work site for the employee, NULL means can work at any site';