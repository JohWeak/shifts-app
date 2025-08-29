// backend/src/controllers/schedule/schedule.controller.js
const { Op } = require('sequelize');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    Position,
    WorkSite,
    PositionShift,
    ShiftRequirement,
} = db;
const cpSatBridge = require('../../../services/cp-sat-bridge.service');
const emailService = require('../../../services/email.service');

const getAllSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, site_id } = req.query;

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
                attributes: ['site_name'],
            }],
        });

        res.json({
            success: true,
            data: schedules.rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(schedules.count / limit),
                total_items: schedules.count,
                per_page: parseInt(limit),
            },
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving schedules',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get schedule details by ID
 */
const getScheduleDetails = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        console.log(`[ScheduleController] Getting details for schedule ${scheduleId}`);

        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: WorkSite,
                    as: 'workSite',
                },
            ],
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        // Получить все назначения для этого расписания
        const assignments = await ScheduleAssignment.findAll({
            where: { schedule_id: scheduleId },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name'],
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'position_id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift', 'color'],
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession', 'site_id', 'num_of_emp'],
                },
            ],
            order: [['work_date', 'ASC'], ['shift_id', 'ASC']],
        });

        const positions = await db.Position.findAll({
            where: {
                site_id: schedule.site_id,
                is_active: true,
            },
            include: [{
                model: PositionShift,
                as: 'shifts',
                where: { is_active: true },
                required: false,
                include: [{
                    model: ShiftRequirement,
                    as: 'requirements',
                    required: false,
                }],
            }],
            order: [['pos_name', 'ASC']],
        });


        // Calculate requirements for each position
        const enrichedPositions = positions.map(position => {
            let totalRequiredAssignments = 0;
            const shiftRequirements = {};
            const positionShifts = [];

            if (position.shifts && position.shifts.length > 0) {
                position.shifts.forEach(shift => {

                    // Get requirements for this shift
                    if (shift.requirements && shift.requirements.length > 0) {
                        // For each day of the week, sum up requirements
                        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                            // Find requirement for this day
                            const dayRequirement = shift.requirements.find(r =>
                                (r.is_recurring && r.day_of_week === dayOfWeek) ||
                                (r.is_recurring && r.day_of_week === null), // All days
                            );

                            const dayStaff = dayRequirement ? dayRequirement.required_staff_count : 1;
                            totalRequiredAssignments += dayStaff;

                            // Store for frontend
                            if (!shiftRequirements[shift.id]) {
                                shiftRequirements[shift.id] = {};
                            }
                            shiftRequirements[shift.id][dayOfWeek] = dayStaff;
                        }
                    } else {
                        // No requirements set, assume 1 person per day for 7 days
                        totalRequiredAssignments += 7;
                        shiftRequirements[shift.id] = 1; // Default for all days
                    }

                    // Add shift info
                    positionShifts.push({
                        shift_id: shift.id,
                        shift_name: shift.shift_name,
                        start_time: shift.start_time,
                        end_time: shift.end_time,
                        duration_hours: shift.duration_hours,
                        color: shift.color,
                        position_id: position.pos_id,
                        requirements: shift.requirements || [],
                    });
                });
            }

            // Count actual assignments for this position
            const actualAssignments = assignments.filter(a =>
                a.position_id === position.pos_id,
            ).length;

            return {
                pos_id: position.pos_id,
                pos_name: position.pos_name,
                profession: position.profession,
                num_of_emp: position.num_of_emp || 1, // Legacy field - employees on position
                total_required_assignments: totalRequiredAssignments, //  total assignments needed
                current_assignments: actualAssignments, // current assignments count
                shift_requirements: shiftRequirements, // Per shift requirements
                shifts: positionShifts, // Shifts that belong to THIS position only
            };
        });

        // Create a global shifts array but mark position ownership
        const allShifts = [];
        const shiftsMap = new Map();

        enrichedPositions.forEach(position => {
            position.shifts.forEach(shift => {
                const key = `${shift.position_id}-${shift.shift_id}`;
                if (!shiftsMap.has(key)) {
                    shiftsMap.set(key, shift);
                    allShifts.push(shift);
                }
            });
        });

        // Get employees for this site
        const siteEmployees = await Employee.findAll({
            where: {
                work_site_id: schedule.site_id,
                status: 'active',
            },
            attributes: ['emp_id', 'first_name', 'last_name', 'status', 'work_site_id', 'default_position_id'],
        });

        // Get employees from other sites who are assigned to this schedule
        const assignedEmployeeIds = assignments
            .map(a => a.emp_id)
            .filter((id, index, self) => self.indexOf(id) === index); // unique

        const crossSiteEmployeeIds = assignedEmployeeIds.filter(
            id => !siteEmployees.find(e => e.emp_id === id),
        );

        let crossSiteEmployees = [];
        if (crossSiteEmployeeIds.length > 0) {
            crossSiteEmployees = await Employee.findAll({
                where: {
                    emp_id: crossSiteEmployeeIds,
                    status: 'active',
                },
                attributes: ['emp_id', 'first_name', 'last_name', 'status', 'work_site_id', 'default_position_id'],
            });
        }

        // Combine all employees
        const allEmployees = [
            ...siteEmployees.map(e => e.toJSON()),
            ...crossSiteEmployees.map(e => ({
                ...e.toJSON(),
                isCrossSite: true,
            })),
        ];

        // Add cross-assignment flags to assignments
        const enhancedAssignments = assignments.map(a => {
            const assignment = a.toJSON();
            const employee = allEmployees.find(e => e.emp_id === assignment.emp_id);

            if (employee) {
                assignment.isCrossPosition = employee.default_position_id &&
                    employee.default_position_id !== assignment.position_id;
                assignment.isCrossSite = employee.work_site_id !== schedule.site_id;
                assignment.isFlexible = !employee.work_site_id || !employee.default_position_id || false;
            }

            return assignment;
        });

        // Prepare response
        const responseData = {
            schedule: {
                id: schedule.id,
                start_date: schedule.start_date,
                end_date: schedule.end_date,
                status: schedule.status,
                site_id: schedule.site_id,
                work_site: schedule.workSite,
                createdAt: schedule.createdAt,
                updatedAt: schedule.updatedAt,
            },
            positions: enrichedPositions,
            assignments: enhancedAssignments,
            shifts: allShifts,
            employees: allEmployees,
        };

        console.log(`[ScheduleController] Response: 
        ${enrichedPositions.length} positions, 
        ${allEmployees.length} employees 
        (${crossSiteEmployees.length} cross-site)`);

        res.json({
            success: true,
            data: responseData,
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedule details:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting schedule details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

// Helper function for email masking
function maskEmail(email) {
    if (!email || email.indexOf('@') === -1) {
        return 'invalid-email';
    }
    const [localPart, domain] = email.split('@');
    const [domainName, topLevelDomain] = domain.split('.');

    const maskedLocal = localPart.length > 2
        ? `${localPart.substring(0, 2)}***`
        : `${localPart.substring(0, 1)}***`;

    return `${maskedLocal}@***.${topLevelDomain}`;
}

/**
 * Send schedule notifications to employees
 */
const sendScheduleNotifications = async (scheduleId) => {
    try {
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name', 'address'],
            }],
        });

        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Get all assigned employees with their shifts
        const assignments = await ScheduleAssignment.findAll({
            where: { schedule_id: schedule.id },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    where: {
                        receive_schedule_emails: true,
                        email: { [Op.not]: null },
                    },
                    required: true,
                },
                {
                    model: PositionShift,
                    as: 'shift',
                },
                {
                    model: Position,
                    as: 'position',
                },
            ],
        });

        // Group by employee
        const employeeSchedules = {};
        assignments.forEach(assignment => {
            const empId = assignment.employee.emp_id;
            if (!employeeSchedules[empId]) {
                employeeSchedules[empId] = {
                    employee: assignment.employee,
                    shifts: [],
                };
            }
            employeeSchedules[empId].shifts.push({
                date: assignment.work_date,
                shift_name: assignment.shift.shift_name,
                start_time: assignment.shift.start_time,
                end_time: assignment.shift.end_time,
                duration: assignment.shift.duration_hours,
                position_name: assignment.position?.pos_name,
                site_name: schedule.workSite?.site_name,
                site_address: schedule.workSite?.address,
            });
        });

        // Send emails asynchronously
        const emailPromises = Object.values(employeeSchedules).map(({ employee, shifts }) =>
            emailService.sendScheduleNotification(employee, {
                week: { start: schedule.start_date, end: schedule.end_date },
                shifts,
            }),
        );
        const results = await Promise.all(emailPromises);
        const report = {
            total_processed: results.length,
            sent_count: 0,
            skipped_count: 0,
            failed_count: 0,
            details: {
                sent: [],
                skipped: [],
                failed: [],
            },
        };
        results.forEach(res => {
            const maskedTo = maskEmail(res.to);
            switch (res.status) {
                case 'sent':
                    report.sent_count++;
                    report.details.sent.push(maskedTo);
                    break;
                case 'skipped':
                    report.skipped_count++;
                    report.details.skipped.push({ to: maskedTo, reason: res.reason });
                    break;
                case 'failed':
                    report.failed_count++;
                    report.details.failed.push({ to: maskedTo, error: res.error });
                    break;
            }
        });

        console.log('Email Notification Report:', JSON.stringify(report, null, 2));

        return report;

    } catch (error) {
        console.error('Critical error in sendScheduleNotifications:', error);
        throw error;
    }
};

/**
 * Update schedule status
 */
const updateScheduleStatus = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { status } = req.body;

        if (!['draft', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: draft, published, or archived',
            });
        }

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        const previousStatus = schedule.status;

        // Update status
        await schedule.update({ status });

        // Reload with associations
        await schedule.reload({
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name'],
            }],
        });

        // Send notifications if status changed to published
        let emailResult = null;
        if (status === 'published' && previousStatus !== 'published') {
            try {
                emailResult = await sendScheduleNotifications(scheduleId);
            } catch (error) {
                console.error('Failed to send notifications:', error);
                // Don't fail the whole request if emails fail
            }
        }

        res.json({
            success: true,
            message: `Schedule status updated to ${status}`,
            data: schedule,
            emailNotifications: emailResult,
        });

    } catch (error) {
        console.error('[ScheduleController] Error updating schedule status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating schedule status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Manually send schedule notifications (admin action)
 */
const resendScheduleNotifications = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        if (schedule.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Can only send notifications for published schedules',
            });
        }

        const result = await sendScheduleNotifications(scheduleId);

        res.json({
            success: true,
            message: `Notifications sent to ${result.emailsSent} employees`,
            ...result,
        });

    } catch (error) {
        console.error('[ScheduleController] Error sending notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Update schedule assignments
 */
const updateScheduleAssignments = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { changes } = req.body;

        console.log('[ScheduleController] Updating assignments for schedule:', scheduleId);
        console.log('[ScheduleController] Changes:', changes);

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        // Track new cross-site employees
        const newCrossSiteEmployeeIds = new Set();
        const processedChanges = [];
        const errors = [];

        // Process each change
        for (const change of changes) {
            try {
                if (change.action === 'assign') {
                    // Сначала проверяем, нет ли уже такого назначения
                    const existingAssignment = await ScheduleAssignment.findOne({
                        where: {
                            schedule_id: scheduleId,
                            emp_id: change.empId,
                            shift_id: change.shiftId,
                            position_id: change.positionId,
                            work_date: change.date,
                        },
                    });

                    if (existingAssignment) {
                        console.log(`[ScheduleController] Assignment already exists for ${change.empName} on ${change.date}`);
                        continue;
                    }

                    // Check if employee is from another site
                    const employee = await Employee.findByPk(change.empId, {
                        attributes: ['emp_id', 'work_site_id', 'default_position_id'],
                    });

                    if (employee && employee.work_site_id !== schedule.site_id) {
                        newCrossSiteEmployeeIds.add(change.empId);
                    }

                    // Add new assignment
                    await ScheduleAssignment.create({
                        schedule_id: scheduleId,
                        emp_id: change.empId,
                        shift_id: change.shiftId,
                        position_id: change.positionId,
                        work_date: change.date,
                        status: 'scheduled',
                        notes: 'Manually assigned via edit interface',
                    });

                    processedChanges.push({ ...change, status: 'created' });
                    console.log(`[ScheduleController] Added assignment: ${change.empName} to ${change.date} shift ${change.shiftId}`);

                } else if (change.action === 'remove') {
                    const whereClause = {
                        schedule_id: scheduleId,
                        emp_id: change.empId,
                        shift_id: change.shiftId,
                        position_id: change.positionId,
                        work_date: change.date,
                    };

                    // Если есть assignmentId, используем его
                    if (change.assignmentId) {
                        whereClause.id = change.assignmentId;
                    }

                    const deleted = await ScheduleAssignment.destroy({
                        where: whereClause,
                    });

                    processedChanges.push({ ...change, status: 'deleted', count: deleted });
                    console.log(`[ScheduleController] Removed ${deleted} assignment(s) for employee ${change.empId} on ${change.date}`);
                }
            } catch (changeError) {
                console.error(`[ScheduleController] Error processing change:`, changeError.message);
                errors.push({
                    change,
                    error: changeError.message,
                });
            }
        }

        // Get new cross-site employees to add to the frontend
        let newEmployees = [];
        if (newCrossSiteEmployeeIds.size > 0) {
            newEmployees = await Employee.findAll({
                where: {
                    emp_id: Array.from(newCrossSiteEmployeeIds),
                },
                attributes: ['emp_id', 'first_name', 'last_name', 'work_site_id', 'default_position_id'],
            });
        }

        res.json({
            success: true,
            message: `Successfully processed ${processedChanges.length} of ${changes.length} changes`,
            data: {
                changesProcessed: processedChanges.length,
                errors: errors.length > 0 ? errors : undefined,
                newEmployees: newEmployees.map(e => ({
                    ...e.toJSON(),
                    isCrossSite: true,
                })),
            },
        });

    } catch (error) {
        console.error('[ScheduleController] Error updating assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating schedule assignments',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Delete schedule
 */
const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        // Проверить, можно ли удалить (например, только draft)
        if (schedule.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete published schedule',
            });
        }

        // Удалить связанные назначения (каскадно через FK)
        await ScheduleAssignment.destroy({
            where: { schedule_id: scheduleId },
        });

        // Удалить само расписание
        await schedule.destroy();

        res.json({
            success: true,
            message: 'Schedule deleted successfully',
        });

    } catch (error) {
        console.error('[ScheduleController] Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get employee recommendations
 */
const getRecommendedEmployees = async (req, res) => {
    try {
        const { scheduleId, date, shiftId, positionId } = req.query;

        console.log('[ScheduleController] Getting recommendations for:', { scheduleId, date, shiftId, positionId });

        // Получить расписание и его параметры
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [{
                model: WorkSite,
                as: 'workSite',
            }],
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found',
            });
        }

        // Получить всех активных сотрудников
        const employees = await Employee.findAll({
            where: { status: 'active' },
            attributes: ['emp_id', 'first_name', 'last_name', 'email', 'default_position_id'],
        });

        // Получить существующие назначения на эту дату
        const existingAssignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: scheduleId,
                work_date: date,
            },
            include: [{
                model: PositionShift,
                as: 'shift',
                attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift', 'color'],
            }],
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
                reason: reason,
            };
        });

        // Сортировать по приоритету
        const sortedEmployees = employeeRecommendations.sort((a, b) => a.priority - b.priority);

        // Группировать по статусу
        const groupedEmployees = {
            preferred: sortedEmployees.filter(e => e.availability_status === 'preferred'),
            available: sortedEmployees.filter(e => e.availability_status === 'available'),
            cannot_work: sortedEmployees.filter(e => e.availability_status === 'cannot_work'),
            violates_constraints: [],
        };

        res.json({
            success: true,
            data: {
                date: date,
                shift_id: shiftId,
                position_id: positionId,
                recommendations: groupedEmployees,
                total_employees: employees.length,
            },
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting recommended employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting employee recommendations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};
/**
 * Get schedule statistics for dashboard
 */
const handleGetScheduleStatistics = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const stats = await cpSatBridge.getScheduleStatistics(scheduleId);

        res.json({
            success: true,
            data: stats,
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting schedule statistics',
        });
    }
};

/**
 * @description Handles HTTP request to get dashboard overview (multiple schedules)
 * @route GET /api/worksites/:worksiteId/statistics
 */
const getDashboardOverview = async (req, res) => {
    try {
        const { worksiteId: siteId } = req.params;
        const { startDate, endDate } = req.query;

        // Проверка наличия обязательных параметров
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
        }

        const schedules = await Schedule.findAll({
            where: {
                site_id: siteId,
                start_date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
            order: [['start_date', 'DESC']],
        });

        if (schedules.length === 0) {
            return res.json({
                success: true,
                data: {
                    schedules_count: 0,
                    avg_coverage: 0,
                    total_issues: 0,
                    schedules: [],
                },
            });
        }

        const statsPromises = schedules.map(schedule =>
            cpSatBridge.getScheduleStatistics(schedule.id),
        );

        const allStats = await Promise.all(statsPromises);

        const validStats = allStats.filter(s => s && s.summary);
        const avgCoverage = validStats.length > 0 ?
            Math.round(validStats.reduce((sum, s) => sum + s.summary.overall_coverage, 0) / validStats.length) : 0;
        const totalIssues = validStats.reduce((sum, s) => sum + s.summary.issues_count, 0);

        const overview = {
            schedules_count: schedules.length,
            avg_coverage: avgCoverage,
            total_issues: totalIssues,
            schedules: schedules.map((schedule, index) => ({
                id: schedule.id,
                start_date: schedule.start_date,
                status: schedule.status,
                statistics: allStats[index] ? allStats[index].summary : null,
            })),
        };

        res.json({
            success: true,
            data: overview,
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting dashboard overview',
        });
    }
};

module.exports = {
    getAllSchedules,
    getScheduleDetails,
    updateScheduleStatus,
    updateScheduleAssignments,
    deleteSchedule,
    getRecommendedEmployees,
    handleGetScheduleStatistics,
    getDashboardOverview,
    sendScheduleNotifications,
    resendScheduleNotifications,
};