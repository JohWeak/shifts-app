// backend/src/services/cp-sat-bridge.service.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const dayjs = require('dayjs');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');


class CPSATBridge {
    constructor(database) {
        this.db = database || db;
    }

    static async generateOptimalSchedule(database, siteId, weekStart) {
        const bridge = new CPSATBridge(database || db);

        try {
            console.log(`[CP-SAT Bridge] Starting optimization for site ${siteId}, week ${weekStart}`);

            // 1. Подготовка данных
            const data = await bridge.prepareScheduleData(siteId, weekStart);

            // 2. Вызов Python оптимизатора
            const pythonResult = await bridge.callPythonOptimizer(data);

            if (!pythonResult.success) {
                return {
                    success: false,
                    error: pythonResult.error,
                    algorithm: 'CP-SAT-Python'
                };
            }

            // 3. Сохранение результатов
            const savedSchedule = await bridge.saveSchedule(siteId, weekStart, pythonResult.schedule);

            return {
                success: true,
                schedule: savedSchedule,
                stats: bridge.calculateScheduleStats(pythonResult.schedule),
                algorithm: 'CP-SAT-Python',
                solve_time: pythonResult.solve_time,
                status: pythonResult.status,
                coverage_rate: pythonResult.coverage_rate || 100,
                shortage_count: pythonResult.shortage_count || 0
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error:', error);
            return {
                success: false,
                error: error.message,
                algorithm: 'CP-SAT-Python'
            };
        }
    }

    /**
     * Подготовка данных для Python оптимизатора с поддержкой новых возможностей
     */
    async prepareScheduleData(siteId, weekStart) {
        console.log(`[CP-SAT Bridge] Preparing data for site ${siteId}, week ${weekStart}`);
        const { Employee, Position, Shift, EmployeeConstraint } = this.db;
        try {
            // Получить сотрудников с дефолтными позициями и ограничениями
            const employees = await Employee.findAll({
                where: {
                    status: 'active',
                    role: 'employee'
                },
                include: [
                    {
                        model: Position,
                        as: 'defaultPosition',
                        required: false,
                        attributes: ['pos_id', 'pos_name', 'profession']
                    },
                    {
                        model: EmployeeConstraint,
                        as: 'constraints',
                        where: { status: 'active' },
                        required: false
                    }
                ]
            });

            // Получить смены и позиции
            const shifts = await Shift.findAll({
                order: [['start_time', 'ASC']]
            });

            const positions = await Position.findAll({
                where: { site_id: siteId },
                order: [['pos_name', 'ASC']]
            });

            // Проверка наличия данных
            if (employees.length === 0) {
                throw new Error('No active employees found');
            }
            if (shifts.length === 0) {
                throw new Error('No shifts configured');
            }
            if (positions.length === 0) {
                throw new Error('No positions found for this site');
            }

            // Формирование данных о сотрудниках
            const employeesData = employees.map(emp => ({
                emp_id: emp.emp_id,
                name: `${emp.first_name} ${emp.last_name}`,
                default_position_id: emp.default_position_id, // Новое поле для привязки к позиции
                status: emp.status
            }));

            console.log('[CP-SAT Bridge] Employees with default positions:',
                employeesData.map(emp => ({
                    id: emp.emp_id,
                    name: emp.name,
                    default_position_id: emp.default_position_id
                }))
            );

            console.log('[CP-SAT Bridge] Will save data to temp file with employees:', employeesData.length);

            // Формирование данных о сменах
            const shiftsData = shifts.map(shift => ({
                shift_id: shift.shift_id,
                shift_name: shift.shift_name,
                start_time: shift.start_time,
                duration: shift.duration,
                shift_type: shift.shift_type,
                is_night_shift: shift.is_night_shift || false
            }));

            // Формирование данных о позициях
            const positionsData = positions.map(position => ({
                pos_id: position.pos_id,
                pos_name: position.pos_name,
                profession: position.profession,
                num_of_emp: position.num_of_emp
            }));

            // Формирование дней недели
            const days = [];
            const startDate = new Date(weekStart);

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                days.push({
                    date: currentDate.toISOString().split('T')[0],
                    day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    day_index: i,
                    weekday: currentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
                });
            }

            // Формирование ограничений с улучшенной обработкой
            const constraintsData = await this.processConstraints(employees, days, shifts);

            // Получение существующих назначений для анализа
            const existingAssignments = await this.getExistingAssignments(employees.map(e => e.emp_id), weekStart);

            // Настройки для алгоритма
            const settings = {
                week_start: weekStart,
                site_id: siteId,
                max_shifts_per_day: 1,
                max_weekly_hours: 42,
                min_rest_hours: 11,
                prefer_default_positions: true, // Новая настройка
                flexible_coverage: true, // Разрешить гибкое покрытие позиций
                balance_workload: true // Балансировка нагрузки
            };

            const preparedData = {
                employees: employeesData,
                shifts: shiftsData,
                positions: positionsData,
                days: days,
                constraints: constraintsData,
                existing_assignments: existingAssignments,
                settings: settings
            };

            console.log('[CP-SAT Bridge] Sample employee data:', employeesData.slice(0, 2));
            console.log('[CP-SAT Bridge] Constraints data:', {
                cannot_work: constraintsData.cannot_work.length,
                prefer_work: constraintsData.prefer_work.length
            });

            console.log(`[CP-SAT Bridge] Data prepared:`, {
                employees: employeesData.length,
                shifts: shiftsData.length,
                positions: positionsData.length,
                days: days.length,
                cannot_work_constraints: constraintsData.cannot_work.length,
                prefer_work_constraints: constraintsData.prefer_work.length
            });

            return preparedData;

        } catch (error) {
            console.error('[CP-SAT Bridge] Error preparing data:', error);
            throw error;
        }
    }

    /**
     * Обработка ограничений сотрудников
     */
    async processConstraints(employees, days, shifts) {
        const constraintsData = {
            cannot_work: [],
            prefer_work: []
        };

        const dayNameToIndex = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        };

        employees.forEach(emp => {
            if (emp.constraints && emp.constraints.length > 0) {
                emp.constraints.forEach(constraint => {
                    const baseConstraint = {
                        emp_id: emp.emp_id,
                        applies_to: constraint.applies_to,
                        target_date: constraint.target_date,
                        day_of_week: constraint.day_of_week,
                        shift_id: constraint.shift_id,
                        reason: constraint.reason
                    };

                    // Для ограничений по дням недели, найти соответствующие дни
                    if (constraint.applies_to === 'day_of_week' && constraint.day_of_week) {
                        const targetDayIndex = dayNameToIndex[constraint.day_of_week.toLowerCase()];

                        days.forEach((day, dayIndex) => {
                            if (day.weekday === targetDayIndex) {
                                const processedConstraint = {
                                    ...baseConstraint,
                                    day_index: dayIndex,
                                    date: day.date
                                };

                                if (constraint.constraint_type === 'cannot_work') {
                                    constraintsData.cannot_work.push(processedConstraint);
                                } else if (constraint.constraint_type === 'prefer_work') {
                                    constraintsData.prefer_work.push(processedConstraint);
                                }
                            }
                        });
                    }
                    // Для ограничений по конкретным датам
                    else if (constraint.applies_to === 'specific_date' && constraint.target_date) {
                        const targetDate = new Date(constraint.target_date).toISOString().split('T')[0];                        const dayIndex = days.findIndex(day => day.date === targetDate);

                        if (dayIndex !== -1) {
                            const processedConstraint = {
                                ...baseConstraint,
                                day_index: dayIndex,
                                date: targetDate
                            };

                            if (constraint.constraint_type === 'cannot_work') {
                                constraintsData.cannot_work.push(processedConstraint);
                            } else if (constraint.constraint_type === 'prefer_work') {
                                constraintsData.prefer_work.push(processedConstraint);
                            }
                        }
                    }
                });
            }
        });

        return constraintsData;
    }

    /**
     * Получение существующих назначений для анализа
     */
    async getExistingAssignments(employeeIds, weekStart) {
        const { ScheduleAssignment, Shift, Position } = this.db;
        const { Op } = this.db.Sequelize;
        try {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const assignments = await ScheduleAssignment.findAll({
                where: {
                    emp_id: { [Op.in]: employeeIds },
                    work_date: {
                        [Op.between]: [weekStart, weekEnd.toISOString().split('T')[0]]
                    }
                },
                include: [
                    { model: Shift, as: 'shift' },
                    { model: Position, as: 'position' }
                ]
            });

            return assignments.map(assignment => ({
                emp_id: assignment.emp_id,
                date: assignment.work_date,
                shift_id: assignment.shift_id,
                position_id: assignment.position_id
            }));

        } catch (error) {
            console.warn('[CP-SAT Bridge] Could not get existing assignments:', error.message);
            return [];
        }
    }

    /**
     * Вызов Python оптимизатора
     */
    async callPythonOptimizer(data) {
        const tempId = uuidv4();
        const inputFile = path.join(__dirname, `temp_input_${tempId}.json`);
        const outputFile = path.join(__dirname, `temp_output_${tempId}.json`);
        const pythonScript = path.join(__dirname, 'cp_sat_optimizer.py');

        try {
            // Записать входные данные
            await fs.writeFile(inputFile, JSON.stringify(data, null, 2));

            // Вызвать Python скрипт
            const pythonResult = await this.executePythonScript(pythonScript, inputFile, outputFile);

            // Прочитать результат
            const resultData = await fs.readFile(outputFile, 'utf8');
            const result = JSON.parse(resultData);

            return result;

        } catch (error) {
            console.error('[CP-SAT Bridge] Python execution error:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            // Очистка временных файлов
            try {
                await fs.unlink(inputFile);
                await fs.unlink(outputFile);
            } catch (cleanupError) {
                console.warn('[CP-SAT Bridge] Cleanup warning:', cleanupError.message);
            }
        }
    }

    /**
     * Выполнение Python скрипта
     */
    executePythonScript(scriptPath, inputFile, outputFile) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                scriptPath,
                '--input', inputFile,
                '--output', outputFile
            ]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log(`[CP-SAT Python] ${data.toString().trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(`[CP-SAT Python Error] ${data.toString().trim()}`);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Python process exited with code ${code}. Stderr: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });

            // Таймаут для долгих вычислений
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Python process timeout (exceeded 5 minutes)'));
            }, 300000); // 5 минут
        });
    }

    /**
     * Сохранение результатов в базу данных
     */
    async saveSchedule(siteId, weekStart, schedule) {
        const { Schedule, ScheduleAssignment } = this.db;
        const { Op } = this.db.Sequelize;
        try {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Удалить существующие расписания для этой недели
            const existingSchedules = await Schedule.findAll({
                where: {
                    site_id: siteId,
                    start_date: {
                        [Op.between]: [weekStart, weekEnd.toISOString().split('T')[0]]
                    }
                }
            });

            for (const existingSchedule of existingSchedules) {
                await ScheduleAssignment.destroy({
                    where: { schedule_id: existingSchedule.id }
                });
                await existingSchedule.destroy();
            }

            // Создать новое расписание
            const newSchedule = await Schedule.create({
                start_date: new Date(weekStart),
                end_date: new Date(weekEnd),
                site_id: siteId,
                status: 'draft',
                text_file: JSON.stringify({
                    generated_at: new Date().toISOString(),
                    algorithm: 'CP-SAT-Python',
                    timezone: 'Asia/Jerusalem'
                })
            });

            // Создать назначения
            const assignments = schedule.map((assignment, index) => ({
                schedule_id: newSchedule.id,
                emp_id: assignment.emp_id,
                shift_id: assignment.shift_id,
                position_id: assignment.position_id,
                work_date: new Date(assignment.date),
                status: 'scheduled',
                notes: `Generated by CP-SAT optimizer - ${index + 1}`
            }));

            await ScheduleAssignment.bulkCreate(assignments);

            console.log(`[CP-SAT Bridge] Saved schedule with ${assignments.length} assignments`);

            return {
                schedule_id: newSchedule.id,
                assignments_count: assignments.length,
                week_start: weekStart,
                week_end: weekEnd.toISOString().split('T')[0]
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error saving schedule:', error);
            throw error;
        }
    }

    /**
     * Расчет статистики расписания
     */
    calculateScheduleStats(schedule) {
        const stats = {
            total_assignments: schedule.length,
            employees_used: new Set(schedule.map(s => s.emp_id)).size,
            positions_covered: new Set(schedule.map(s => s.position_id)).size,
            shifts_covered: new Set(schedule.map(s => s.shift_id)).size,
            daily_distribution: {}
        };

        // Распределение по дням
        schedule.forEach(assignment => {
            if (!stats.daily_distribution[assignment.date]) {
                stats.daily_distribution[assignment.date] = 0;
            }
            stats.daily_distribution[assignment.date]++;
        });

        return stats;
    }
}

module.exports = CPSATBridge;