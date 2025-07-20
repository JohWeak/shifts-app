// backend/src/controllers/constraint.controller.js
const db = require('../../models');
const {
    EmployeeConstraint,
    Employee,
    PositionShift,
    ScheduleSettings,
    Position,
    ShiftRequirement,
    Workday,
    PermanentConstraintRequest,
    PermanentConstraint
} = db;

const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Get employee constraints
const getEmployeeConstraints = async (req, res) => {
    try {
        const { empId } = req.params;
        const constraints = await EmployeeConstraint.findAll({
            where: { emp_id: empId, status: 'active' },
            include: [{ model: PositionShift, as: 'shift' }],
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: constraints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create constraint
const createConstraint = async (req, res) => {
    try {
        const constraint = await EmployeeConstraint.create(req.body);
        res.status(201).json({ success: true, data: constraint });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update constraint
const updateConstraint = async (req, res) => {
    try {
        const [updated] = await EmployeeConstraint.update(req.body, {
            where: { id: req.params.id }
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Constraint not found' });
        }

        const constraint = await EmployeeConstraint.findByPk(req.params.id);
        res.json({ success: true, data: constraint });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete constraint
const deleteConstraint = async (req, res) => {
    try {
        const deleted = await EmployeeConstraint.destroy({
            where: { id: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Constraint not found' });
        }

        res.json({ success: true, message: 'Constraint deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a weekly constraints grid
const getWeeklyConstraintsGrid = async (req, res) => {
    try {
        const empId = req.userId; // From auth middleware
        const { weekStart } = req.query;

        // Calculate week start (default to next Sunday/Monday based on locale, simple startOf('week') is used here)
        const startDate = weekStart ?
            dayjs(weekStart).startOf('week') :
            dayjs().add(1, 'week').startOf('week');

        const endDate = startDate.add(6, 'days');

        // Get employee with their position shifts
        const employee = await Employee.findByPk(empId, {
            include: [{
                model: Position,
                as: 'defaultPosition',
                include: [{
                    model: PositionShift,
                    as: 'shifts',
                    where: { is_active: true },
                    // Явно указываем, какие атрибуты нам нужны
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'color']                }]
            }]
        });

        if (!employee || !employee.defaultPosition) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found or has no default position assigned'
            });
        }

        // Get existing constraints for the week
        const existingConstraints = await EmployeeConstraint.findAll({
            where: {
                emp_id: empId,
                target_date: {
                    [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                },
                status: 'active'
            }
        });

        const settings = await ScheduleSettings.findOne();
        const template = [];

        for (let i = 0; i < 7; i++) {
            const currentDate = startDate.add(i, 'day');
            const dayConstraints = existingConstraints.filter(c =>
                dayjs(c.target_date).isSame(currentDate, 'day')
            );

            // ИЗМЕНЕНИЕ 1: Обновляем логику маппинга
            const dayShifts = employee.defaultPosition.shifts.map(shift => {
                const constraint = dayConstraints.find(c => c.shift_id === shift.id);
                return {
                    shift_id: shift.id,
                    shift_name: shift.shift_name, // Добавлено имя смены
                    color: shift.color,           // Добавлен цвет (даже если фронт его переопределит, лучше его иметь)
                    start_time: shift.start_time,
                    duration: shift.duration_hours,
                    status: constraint ? constraint.constraint_type : 'neutral'
                };
            });

            const wholeDayConstraint = dayConstraints.find(c => !c.shift_id);

            template.push({
                date: currentDate.format('YYYY-MM-DD'),
                weekday: currentDate.format('dddd').toLowerCase(),
                day_status: wholeDayConstraint ? wholeDayConstraint.constraint_type : 'neutral',
                shifts: dayShifts
            });
        }

        const alreadySubmitted = existingConstraints.length > 0;
        const canEdit = !alreadySubmitted; // Simple logic for now

        // ИЗМЕНЕНИЕ 2: Убираем устаревшие поля из ответа
        res.json({
            success: true,
            weekStart: startDate.format('YYYY-MM-DD'),
            employee: {
                id: employee.emp_id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                position: employee.defaultPosition.pos_name
            },
            constraints: {
                template,
                limits: {
                    cannot_work_days: settings?.max_cannot_work_days || 2,
                    prefer_work_days: settings?.max_prefer_work_days || 6
                },
                already_submitted: alreadySubmitted,
                can_edit: canEdit
            }
            // Поля shiftTypes и colors удалены
        });

    } catch (error) {
        console.error('Error in getWeeklyConstraintsGrid:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit weekly constraints
const submitWeeklyConstraints = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const empId = req.userId;
        const { constraints, week_start } = req.body;

        if (!constraints || !Array.isArray(constraints)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid constraints data'
            });
        }

        // Calculate week date range
        const startDate = dayjs(week_start);
        const endDate = startDate.add(6, 'days');

        // Delete existing constraints for this week
        await EmployeeConstraint.destroy({
            where: {
                emp_id: empId,
                target_date: {
                    [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            transaction
        });

        // Create new constraints
        const newConstraints = constraints.map(constraint => ({
            ...constraint,
            emp_id: empId,
            status: 'active',
            applies_to: 'specific_date',
            is_permanent: false
        }));

        if (newConstraints.length > 0) {
            await EmployeeConstraint.bulkCreate(newConstraints, { transaction });
        }

        await transaction.commit();

        res.json({
            success: true,
            message: 'Constraints submitted successfully',
            count: newConstraints.length
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error in submitWeeklyConstraints:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get employee's permanent constraint requests
const getPermanentConstraintRequests = async (req, res) => {
    try {
        const { empId } = req.params;

        // Verify employee access
        if (req.role !== 'admin' && req.userId !== parseInt(empId)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const requests = await PermanentConstraintRequest.findAll({
            where: { emp_id: empId },
            include: [{
                model: PositionShift,
                as: 'shift'
            }],
            order: [['requested_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error in getPermanentConstraintRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit permanent constraint request
const submitPermanentConstraintRequest = async (req, res) => {
    try {
        const empId = req.userId;
        const { day_of_week, shift_id, constraint_type, reason } = req.body;

        // Validate input
        if (!day_of_week || !constraint_type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if similar request already pending
        const existingRequest = await PermanentConstraintRequest.findOne({
            where: {
                emp_id: empId,
                day_of_week,
                shift_id: shift_id || null,
                status: 'pending'
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Similar request already pending'
            });
        }

        // Create request
        const request = await PermanentConstraintRequest.create({
            emp_id: empId,
            day_of_week,
            shift_id,
            constraint_type,
            reason,
            status: 'pending',
            requested_at: new Date()
        });

        res.json({
            success: true,
            message: 'Request submitted successfully',
            data: request
        });

    } catch (error) {
        console.error('Error in submitPermanentConstraintRequest:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all pending permanent constraint requests (Admin)
const getPendingRequests = async (req, res) => {
    try {
        const requests = await PermanentConstraintRequest.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'full_name', 'email']
                },
                {
                    model: PositionShift,
                    as: 'shift'
                }
            ],
            order: [['requested_at', 'ASC']]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error in getPendingRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Review permanent constraint request (Admin)
const reviewPermanentConstraintRequest = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { status, admin_response } = req.body;
        const adminId = req.userId;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Get request
        const request = await PermanentConstraintRequest.findByPk(id);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        // Update request
        await request.update({
            status,
            admin_response,
            reviewed_at: new Date(),
            reviewed_by: adminId
        }, { transaction });

        // If approved, create permanent constraint
        if (status === 'approved') {
            await PermanentConstraint.create({
                emp_id: request.emp_id,
                day_of_week: request.day_of_week,
                shift_id: request.shift_id,
                constraint_type: request.constraint_type,
                approved_by: adminId,
                approved_at: new Date(),
                is_active: true
            }, { transaction });
        }

        await transaction.commit();

        // TODO: Send notification to employee

        res.json({
            success: true,
            message: `Request ${status} successfully`
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error in reviewPermanentConstraintRequest:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getEmployeeConstraints,
    createConstraint,
    updateConstraint,
    deleteConstraint,
    getWeeklyConstraintsGrid,
    submitWeeklyConstraints,
    getPermanentConstraintRequests,
    submitPermanentConstraintRequest,
    getPendingRequests,
    reviewPermanentConstraintRequest
};