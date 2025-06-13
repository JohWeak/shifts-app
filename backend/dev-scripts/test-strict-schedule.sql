-- backend/src/scripts/test-strict-schedule.sql

-- 1. Обновим настройки расписания для строгой проверки отдыха
UPDATE schedule_settings
SET
    min_rest_base_hours = 8,        -- Israeli law minimum
    night_shift_rest_bonus = 4,     -- Extra rest after night shift (total 12h)
    rest_calculation_method = 'shift_based',
    max_shifts_per_day = 1
WHERE site_id = 1;

-- 2. Проверим текущие смены и их типы
SELECT
    shift_id,
    shift_name,
    start_time,
    duration,
    shift_type,
    is_night_shift,
    CASE
        WHEN is_night_shift = 1 THEN 'Night shift - requires 12h rest after'
        ELSE 'Regular shift - requires 8h rest after'
        END as rest_requirement
FROM shifts;

-- 3. Назначим разные позиции сотрудникам для тестирования
-- Security Guards (position_id = 1)
UPDATE employees SET default_position_id = 1 WHERE emp_id IN (2, 4, 6, 8);
-- Receptionists (position_id = 2)
UPDATE employees SET default_position_id = 2 WHERE emp_id IN (3, 5, 7, 9);

-- 4. Проверим распределение по позициям
SELECT
    p.pos_name,
    COUNT(e.emp_id) as employee_count,
    GROUP_CONCAT(CONCAT(e.first_name, ' ', e.last_name) SEPARATOR ', ') as employees
FROM positions p
         LEFT JOIN employees e ON e.default_position_id = p.pos_id AND e.role = 'employee'
GROUP BY p.pos_id, p.pos_name;

-- 5. Создадим тестовые ограничения
-- Сначала очистим старые тестовые ограничения
DELETE FROM employee_constraints WHERE reason LIKE 'Test%';

-- Теперь вставим новые
INSERT INTO employee_constraints (
    emp_id,
    constraint_type,
    applies_to,
    target_date,
    day_of_week,
    shift_id,
    reason,
    created_at,
    updated_at
)
VALUES
    -- John Doe не может работать по средам (day_of_week constraint)
    (2, 'cannot_work', 'day_of_week', NULL, 'wednesday', NULL, 'Test: Personal commitment on Wednesdays', NOW(), NOW()),

    -- Emma Taylor предпочитает утренние смены (shift constraint)
    (9, 'prefer_work', 'day_of_week', NULL, NULL, 31, 'Test: Morning person - prefers morning shifts', NOW(), NOW()),

    -- Sarah Wilson не может работать ночные смены (shift constraint)
    (7, 'cannot_work', 'day_of_week', NULL, NULL, 33, 'Test: Health reasons - cannot work nights', NOW(), NOW()),

    -- Bob Johnson не может работать в конкретную дату
    (5, 'cannot_work', 'specific_date', '2025-06-17', NULL, NULL, 'Test: Doctor appointment', NOW(), NOW());

-- 6. Проверим ограничения
SELECT
    e.first_name,
    e.last_name,
    ec.constraint_type,
    ec.applies_to,
    ec.target_date,
    ec.day_of_week,
    s.shift_name,
    ec.reason
FROM employee_constraints ec
         JOIN employees e ON e.emp_id = ec.emp_id
         LEFT JOIN shifts s ON s.shift_id = ec.shift_id
WHERE ec.reason LIKE 'Test%'
ORDER BY e.emp_id;