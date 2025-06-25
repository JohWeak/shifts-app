// backend/src/controllers/legacy/shift.controller.js
/**
 * LEGACY CONTROLLER
 * This controller manages global shifts from the 'shifts' table.
 * It's being replaced by position-shift.controller.js which provides
 * more flexible shift management per position.
 *
 * TODO: Migrate existing functionality to position-based shifts
 * TODO: Update schedule generation to use position shifts
 *
 * @deprecated Use position-shift.controller.js for new features
 */
const db = require('../../models');
const { Shift } = db;

// Get all shifts
const findAll = async (req, res) => {
    try {
        const shifts = await Shift.findAll({
            order: [['start_time', 'ASC']]
        });

        res.json({
            success: true,
            data: shifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shifts',
            error: error.message
        });
    }
};

// Get shift by ID
const findOne = async (req, res) => {
    try {
        const shift = await Shift.findByPk(req.params.id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.json({
            success: true,
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shift',
            error: error.message
        });
    }
};

// Create shift
const create = async (req, res) => {
    try {
        const shift = await Shift.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Shift created successfully',
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating shift',
            error: error.message
        });
    }
};

// Update shift
const update = async (req, res) => {
    try {
        const [updated] = await Shift.update(req.body, {
            where: { shift_id: req.params.id }
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        const shift = await Shift.findByPk(req.params.id);

        res.json({
            success: true,
            message: 'Shift updated successfully',
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating shift',
            error: error.message
        });
    }
};

// Delete shift
const deleteShift = async (req, res) => {
    try {
        const deleted = await Shift.destroy({
            where: { shift_id: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.json({
            success: true,
            message: 'Shift deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting shift',
            error: error.message
        });
    }
};

// Placeholder for assign employee
const assignEmployee = async (req, res) => {
    res.json({
        success: true,
        message: 'Employee assigned to shift'
    });
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    delete: deleteShift,
    assignEmployee
};