// backend/src/controllers/constraint.controller.js
const db = require('../../models');
const { EmployeeConstraint, Employee, Shift } = db;
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Get employee constraints
const getEmployeeConstraints = async (req, res) => {
    try {
        const { empId } = req.params;
        const constraints = await EmployeeConstraint.findAll({
            where: { emp_id: empId, status: 'active' },
            include: [{ model: Shift, as: 'shift' }],
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

// Get weekly constraints grid
const getWeeklyConstraintsGrid = async (req, res) => {
    try {
        const { week_start, emp_id } = req.query;
        const userId = emp_id || req.userId;

        const weekStart = dayjs(week_start);
        const weekEnd = weekStart.add(6, 'day');

        const constraints = await EmployeeConstraint.findAll({
            where: {
                emp_id: userId,
                [Op.or]: [
                    {
                        applies_to: 'specific_date',
                        target_date: {
                            [Op.between]: [weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD')]
                        }
                    },
                    { applies_to: 'day_of_week' }
                ]
            },
            include: [{ model: Shift, as: 'shift' }]
        });

        res.json({ success: true, data: constraints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit weekly constraints
const submitWeeklyConstraints = async (req, res) => {
    try {
        const { constraints } = req.body;
        const results = [];

        for (const constraint of constraints) {
            if (constraint.id) {
                await EmployeeConstraint.update(constraint, {
                    where: { id: constraint.id }
                });
                results.push(await EmployeeConstraint.findByPk(constraint.id));
            } else {
                results.push(await EmployeeConstraint.create(constraint));
            }
        }

        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get constraints for period
const getConstraintsForPeriod = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const constraints = await EmployeeConstraint.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    {
                        applies_to: 'specific_date',
                        target_date: { [Op.between]: [start_date, end_date] }
                    },
                    { applies_to: 'day_of_week' }
                ]
            },
            include: [
                { model: Employee, as: 'employee' },
                { model: Shift, as: 'shift' }
            ]
        });

        res.json({ success: true, data: constraints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEmployeeConstraints,
    createConstraint,
    updateConstraint,
    deleteConstraint,
    getWeeklyConstraintsGrid,
    submitWeeklyConstraints,
    getConstraintsForPeriod
};