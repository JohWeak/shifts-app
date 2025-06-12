-- backend/migrations/add_default_position_to_employees.sql
ALTER TABLE employees
    ADD COLUMN default_position_id INT NULL COMMENT 'Default position for automatic scheduling';

ALTER TABLE employees
    ADD CONSTRAINT fk_employees_default_position
        FOREIGN KEY (default_position_id) REFERENCES positions(pos_id) ON DELETE SET NULL;

CREATE INDEX idx_employees_default_position ON employees(default_position_id);