// backend/src/controllers/schedule/schedule.controller.js
const {Op} = require('sequelize');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    Position,
    WorkSite,
    PositionShift,
    Shift  // Оставляем для обратной совместимости
} = db;

// Теперь не нужна функция-обертка module.exports = (db) => {}
// Просто экспортируем объект с методами

const getAllSchedules = async (req, res) => {
    try {
        const {page = 1, limit = 10, site_id} = req.query;

        const whereClause = {};
        if (site_id) {
            whereClause.site_id = site_id;
        }

        const schedules = await Schedule.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            order: [['start_date', 'DESC']],
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_name']
            }]
        });

        res.json({
            success: true,
            data: schedules.rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(schedules.count / limit),
                total_items: schedules.count,
                per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving schedules',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Get schedule details by ID
 */
const getScheduleDetails = async (req, res) => {
    try {
        const {scheduleId} = req.params;
        console.log(`[ScheduleController] Getting details for schedule ${scheduleId}`);

        // Получить основную информацию о расписании
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: WorkSite,
                    as: 'workSite'
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        console.log(`[ScheduleController] Found schedule for site ${schedule.site_id}`);

        // Получить все назначения для этого расписания
        const assignments = await ScheduleAssignment.findAll({
            where: {schedule_id: scheduleId},
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: PositionShift,  // Изменено с Shift на PositionShift
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift', 'color']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession']
                }
            ],
            order: [['work_date', 'ASC'], ['shift_id', 'ASC']]
        });

        console.log(`[ScheduleController] Found ${assignments.length} assignments`);

        // Получить все смены через позиции
        const positions = await Position.findAll({
            where: {site_id: schedule.site_id},
            attributes: ['pos_id', 'pos_name', 'profession']
        });


        // Получить все смены через позиции - ОСТАВЛЯЕМ КАК БЫЛО
        const positionsWithShifts = await Position.findAll({
            where: { site_id: schedule.site_id },
            include: [{
                model: PositionShift,
                as: 'shifts',
                where: { is_active: true },
                required: false
            }]
        });

        // Собираем все уникальные смены - НЕМНОГО ИЗМЕНЕНО для совместимости
        const shiftsMap = new Map();
        positionsWithShifts.forEach(position => {
            position.shifts?.forEach(shift => {
                if (!shiftsMap.has(shift.id)) {
                    shiftsMap.set(shift.id, {
                        shift_id: shift.id,  // Используем id как shift_id для совместимости
                        shift_name: shift.shift_name,
                        start_time: shift.start_time,
                        end_time: shift.end_time,
                        duration: shift.duration_hours,
                        shift_type: shift.is_night_shift ? 'night' : (shift.start_time < '12:00:00' ? 'morning' : 'day'),
                        color: shift.color
                    });
                }
            });
        });

        const shifts = Array.from(shiftsMap.values());


        // Получить всех сотрудников для данного сайта
        const employees = await Employee.findAll({
            where: {status: 'active'},
            attributes: ['emp_id', 'first_name', 'last_name', 'status']
        });

        console.log(`[ScheduleController] Found ${employees.length} employees`);

        // Подготовить структуру данных для фронтенда
        const responseData = {
            schedule: {
                id: schedule.id,
                start_date: schedule.start_date,
                end_date: schedule.end_date,
                status: schedule.status,
                site_id: schedule.site_id,
                work_site: schedule.workSite,
                createdAt: schedule.createdAt,
                updatedAt: schedule.updatedAt
            },
            positions: positions,
            assignments: assignments,
            shifts: shifts,
            all_shifts: shifts, // Алиас для совместимости
            employees: employees
        };

        console.log(`[ScheduleController] Sending response with ${positions.length} positions`);

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedule details:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting schedule details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Update schedule status
 */
const updateScheduleStatus = async (req, res) => {
    try {
        const {scheduleId} = req.params;
        const {status} = req.body;

        if (!['draft', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: draft, published, or archived'
            });
        }

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        await Schedule.update(
            { status },
            { where: { id: scheduleId } }
        );
        // Возвращаем обновленное расписание с связями
        const updatedSchedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name']
                }
            ]
        });

        res.json({
            success: true,
            message: `Schedule status updated to ${status}`,
            data: schedule
        });

    } catch (error) {
        console.error('[ScheduleController] Error updating schedule status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating schedule status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Update schedule assignments
 */
const updateScheduleAssignments = async (req, res) => {
    try {
        const {scheduleId} = req.params;
        const {changes} = req.body;

        console.log('[ScheduleController] Updating assignments for schedule:', scheduleId);
        console.log('[ScheduleController] Changes:', changes);

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Process each change
        for (const change of changes) {
            if (change.action === 'assign') {
                // Add new assignment
                await ScheduleAssignment.create({
                    schedule_id: scheduleId,
                    emp_id: change.empId,
                    shift_id: change.shiftId,
                    position_id: change.positionId,
                    work_date: change.date,
                    status: 'scheduled',
                    notes: 'Manually assigned via edit interface'
                });
                console.log(`[ScheduleController] Added assignment: ${change.empName} to ${change.date} ${change.shiftId}`);

            } else if (change.action === 'remove') {
                // Remove existing assignment
                const deleted = await ScheduleAssignment.destroy({
                    where: {
                        id: change.assignmentId,
                        schedule_id: scheduleId
                    }
                });
                console.log(`[ScheduleController] Removed assignment ID: ${change.assignmentId}, deleted: ${deleted}`);
            }
        }

        res.json({
            success: true,
            message: `Successfully processed ${changes.length} changes`,
            data: {
                changesProcessed: changes.length
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Error updating assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating schedule assignments',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Delete schedule
 */
const deleteSchedule = async (req, res) => {
    try {
        const {scheduleId} = req.params;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Проверить, можно ли удалить (например, только draft)
        if (schedule.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete published schedule'
            });
        }

        // Удалить связанные назначения (каскадно через FK)
        await ScheduleAssignment.destroy({
            where: {schedule_id: scheduleId}
        });

        // Удалить само расписание
        await schedule.destroy();

        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });

    } catch (error) {
        console.error('[ScheduleController] Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Get employee recommendations
 */
const getRecommendedEmployees = async (req, res) => {
    try {
        const {scheduleId, date, shiftId, positionId} = req.query;

        console.log('[ScheduleController] Getting recommendations for:', {scheduleId, date, shiftId, positionId});

        // Получить расписание и его параметры
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [{
                model: WorkSite,
                as: 'workSite'
            }]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Получить всех активных сотрудников
        const employees = await Employee.findAll({
            where: {status: 'active'},
            attributes: ['emp_id', 'first_name', 'last_name', 'email', 'default_position_id']
        });

        // Получить существующие назначения на эту дату
        const existingAssignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: scheduleId,
                work_date: date
            },
            include: [{
                model: PositionShift,
                as: 'shift',
                attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift', 'color']
            }]
        });

        // Простая логика рекомендаций
        const employeeRecommendations = employees.map(employee => {
            const empAssignments = existingAssignments.filter(a => a.emp_id === employee.emp_id);

            // Определить статус доступности
            let availabilityStatus = 'available';
            let reason = '';
            let priority = 1; // 0 = preferred, 1 = neutral, 2 = cannot_work

            // Проверить конфликты с существующими назначениями
            const hasConflict = empAssignments.length > 0;

            if (hasConflict) {
                priority = 2;
                availabilityStatus = 'cannot_work';
                reason = 'Already assigned on this date';
            } else if (employee.default_position_id === parseInt(positionId)) {
                priority = 0;
                availabilityStatus = 'preferred';
                reason = 'Matches position';
            }

            return {
                emp_id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email,
                availability_status: availabilityStatus,
                priority: priority,
                reason: reason
            };
        });

        // Сортировать по приоритету
        const sortedEmployees = employeeRecommendations.sort((a, b) => a.priority - b.priority);

        // Группировать по статусу
        const groupedEmployees = {
            preferred: sortedEmployees.filter(e => e.availability_status === 'preferred'),
            available: sortedEmployees.filter(e => e.availability_status === 'available'),
            cannot_work: sortedEmployees.filter(e => e.availability_status === 'cannot_work'),
            violates_constraints: []
        };

        res.json({
            success: true,
            data: {
                date: date,
                shift_id: shiftId,
                position_id: positionId,
                recommendations: groupedEmployees,
                total_employees: employees.length
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting recommended employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting employee recommendations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getAllSchedules,
    getScheduleDetails,
    updateScheduleStatus,
    updateScheduleAssignments,
    deleteSchedule,
    getRecommendedEmployees
};