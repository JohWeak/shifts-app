// backend/src/controllers/constraint.controller.js
const db = require('../../models');
const {
    EmployeeConstraint,
    Employee,
    PositionShift,
    ScheduleSettings,
    Position,
    ShiftRequirement,
    WorkSite,
    PermanentConstraintRequest,
    PermanentConstraint,
    Workday,
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


// Get all pending permanent constraint requests (Admin)
const getPendingRequests = async (req, res) => {
    try {
        const requests = await PermanentConstraintRequest.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'email']
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


// Get all permanent constraint requests with filters
const getAllPermanentRequests = async (req, res) => {

    try {
        const { status } = req.query;
        const whereClause = status ? { status } : {};

        const requests = await PermanentConstraintRequest.findAll({
            where: whereClause,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'email'],
                    include: [{
                        model: Position,
                        as: 'defaultPosition',
                        attributes: ['pos_id', 'pos_name']
                    }, {
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name']
                    }]
                },
                {
                    model: Employee,
                    as: 'reviewer',
                    attributes: ['emp_id', 'first_name', 'last_name']
                }
            ],
            order: [
                ['status', 'ASC'],
                ['requested_at', status === 'pending' ? 'ASC' : 'DESC']
            ]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error in getAllPermanentRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit batch permanent constraint request
const submitPermanentConstraintRequest = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const empId = req.userId;
        const { constraints, message } = req.body;

        if (!constraints || !Array.isArray(constraints) || constraints.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No constraints provided'
            });
        }

        // Check existing pending request
        const existingPending = await PermanentConstraintRequest.findOne({
            where: {
                emp_id: empId,
                status: 'pending'
            }
        });

        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request. Please wait for it to be processed.'
            });
        }

        // Create request
        const request = await PermanentConstraintRequest.create({
            emp_id: empId,
            constraints,
            message: message || null,
            requested_at: new Date()
        }, { transaction });

        await transaction.commit();

        // Загружаем созданный запрос с ассоциациями для возврата
        const createdRequest = await PermanentConstraintRequest.findByPk(request.id, {
            include: [{
                model: Employee,
                as: 'reviewer',
                attributes: ['emp_id', 'first_name', 'last_name']
            }]
        });

        res.json({
            success: true,
            message: 'Request submitted successfully',
            data: createdRequest
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error in submitPermanentConstraintRequest:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get unprocessed requests count (for admin badge)
const getUnprocessedRequestsCount = async (req, res) => {
    try {
        const count = await PermanentConstraintRequest.count({
            where: { status: 'pending' }
        });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Error in getUnprocessedRequestsCount:', error);
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
        const request = await PermanentConstraintRequest.findByPk(id, {
            include: [{
                model: Employee,
                as: 'employee'
            }]
        });

        if (!request || request.status !== 'pending') {
            await transaction.rollback();
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

        // If approved, create permanent constraints
        if (status === 'approved' && request.constraints && Array.isArray(request.constraints)) {
            // Проверяем, что модель PermanentConstraint существует
            if (!PermanentConstraint) {
                console.error('PermanentConstraint model not found in db object');
                await transaction.rollback();
                return res.status(500).json({
                    success: false,
                    message: 'PermanentConstraint model not found'
                });
            }

            for (const constraint of request.constraints) {
                try {
                    await PermanentConstraint.create({
                        emp_id: request.emp_id,
                        day_of_week: constraint.day_of_week,
                        shift_id: constraint.shift_id || null,
                        constraint_type: constraint.constraint_type,
                        approved_by: adminId,
                        approved_at: new Date(),
                        is_active: true
                    }, { transaction });
                } catch (createError) {
                    console.error('Error creating permanent constraint:', createError);
                    await transaction.rollback();
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating permanent constraint: ' + createError.message
                    });
                }
            }
        }

        await transaction.commit();

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


const getMyPermanentConstraintRequests = async (req, res) => {
    try {
        const empId = req.userId;

        const requests = await PermanentConstraintRequest.findAll({
            where: { emp_id: empId },
            include: [{
                model: Employee,
                as: 'reviewer',
                attributes: ['emp_id', 'first_name', 'last_name']
            }],
            order: [['requested_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error in getMyPermanentConstraintRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Метод для получения смен сотрудника
const getEmployeeShifts = async (req, res) => {
    try {
        const empId = req.userId;

        const employee = await Employee.findByPk(empId, {
            include: [{
                model: Position,
                include: [{
                    model: PositionShift,
                    as: 'shifts'
                }]
            }]
        });

        if (!employee || !employee.Position) {
            return res.json({
                success: true,
                data: { shifts: [] }
            });
        }

        res.json({
            success: true,
            data: {
                position: employee.Position,
                shifts: employee.Position.shifts || []
            }
        });

    } catch (error) {
        console.error('Error in getEmployeeShifts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deletePermanentRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const empId = req.userId;

        // Находим запрос
        const request = await PermanentConstraintRequest.findOne({
            where: {
                id,
                emp_id: empId,
                status: 'pending' // Можно удалять только pending запросы
            }
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or cannot be deleted'
            });
        }

        await request.destroy();

        res.json({
            success: true,
            message: 'Request deleted successfully'
        });

    } catch (error) {
        console.error('Error in deletePermanentRequest:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getEmployeeConstraints,
    getUnprocessedRequestsCount,
    getAllPermanentRequests,
    getWeeklyConstraintsGrid,
    getPendingRequests,
    getMyPermanentConstraintRequests,
    getEmployeeShifts,
    submitWeeklyConstraints,
    submitPermanentConstraintRequest,
    reviewPermanentConstraintRequest,
    deletePermanentRequest,
    createConstraint,
    updateConstraint,
    deleteConstraint,

};