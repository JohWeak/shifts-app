// backend/src/controllers/position-shift.controller.js
const db = require('../models');
const { Position, PositionShift, ShiftRequirement } = db;
const { Op } = require('sequelize');

// Get all shifts for a position
const getPositionShifts = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeRequirements = false } = req.query;

        const includeOptions = [];
        if (includeRequirements === 'true') {
            includeOptions.push({
                model: ShiftRequirement,
                as: 'requirements',
                required: false
            });
        }

        const shifts = await PositionShift.findAll({
            where: {
                position_id: id,
                is_active: true
            },
            include: includeOptions,
            order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
        });

        res.json(shifts);
    } catch (error) {
        console.error('Error fetching position shifts:', error);
        res.status(500).json({
            message: 'Error fetching position shifts',
            error: error.message
        });
    }
};

// Create a new shift for a position
const createPositionShift = async (req, res) => {
    try {
        const { id: position_id } = req.params;
        const { shift_name, start_time, end_time, color, sort_order } = req.body;

        // Validate position exists
        const position = await Position.findByPk(position_id);
        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }

        // Check for time conflicts with existing shifts
        const existingShifts = await PositionShift.findAll({
            where: {
                position_id,
                is_active: true
            }
        });

        // Simple overlap check (can be enhanced)
        for (const shift of existingShifts) {
            if (checkTimeOverlap(start_time, end_time, shift.start_time, shift.end_time)) {
                return res.status(400).json({
                    message: 'Shift time overlaps with existing shift',
                    conflictingShift: shift.shift_name
                });
            }
        }

        const newShift = await PositionShift.create({
            position_id,
            shift_name,
            start_time,
            end_time,
            color: color || getDefaultShiftColor(shift_name),
            sort_order: sort_order || existingShifts.length
        });

        // Create default requirements (1 person for all days)
        await ShiftRequirement.create({
            position_shift_id: newShift.id,
            day_of_week: null, // All days
            required_staff_count: 1,
            is_recurring: true,
            is_working_day: true
        });

        const shiftWithRequirements = await PositionShift.findByPk(newShift.id, {
            include: [{
                model: ShiftRequirement,
                as: 'requirements'
            }]
        });

        res.status(201).json(shiftWithRequirements);
    } catch (error) {
        console.error('Error creating position shift:', error);
        res.status(500).json({
            message: 'Error creating position shift',
            error: error.message
        });
    }
};

// Update a shift
const updatePositionShift = async (req, res) => {
    try {
        const { shiftId } = req.params;
        const { shift_name, start_time, end_time, color, sort_order, is_active } = req.body;

        const shift = await PositionShift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // If updating times, check for conflicts
        if (start_time || end_time) {
            const newStartTime = start_time || shift.start_time;
            const newEndTime = end_time || shift.end_time;

            const conflictingShifts = await PositionShift.findAll({
                where: {
                    position_id: shift.position_id,
                    id: { [Op.ne]: shiftId },
                    is_active: true
                }
            });

            for (const otherShift of conflictingShifts) {
                if (checkTimeOverlap(newStartTime, newEndTime, otherShift.start_time, otherShift.end_time)) {
                    return res.status(400).json({
                        message: 'Updated time would overlap with existing shift',
                        conflictingShift: otherShift.shift_name
                    });
                }
            }
        }

        await shift.update({
            shift_name,
            start_time,
            end_time,
            color,
            sort_order,
            is_active
        });

        const updatedShift = await PositionShift.findByPk(shiftId, {
            include: [{
                model: ShiftRequirement,
                as: 'requirements'
            }]
        });

        res.json(updatedShift);
    } catch (error) {
        console.error('Error updating position shift:', error);
        res.status(500).json({
            message: 'Error updating position shift',
            error: error.message
        });
    }
};

// Soft delete a shift
const deletePositionShift = async (req, res) => {
    try {
        const { shiftId } = req.params;

        const shift = await PositionShift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Check if shift has active assignments in current/future schedules
        // TODO: Add this check when schedule system is integrated

        // Soft delete
        await shift.update({ is_active: false });

        res.json({
            message: 'Shift deactivated successfully',
            shift_id: shiftId
        });
    } catch (error) {
        console.error('Error deactivating shift:', error);
        res.status(500).json({
            message: 'Error deactivating shift',
            error: error.message
        });
    }
};

// Helper function to check time overlap
function checkTimeOverlap(start1, end1, start2, end2) {
    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    // Handle overnight shifts
    if (end1Min < start1Min) {
        // Shift 1 is overnight
        if (end2Min < start2Min) {
            // Both overnight
            return true; // Simplified - in reality need more complex logic
        }
        return start2Min >= start1Min || end2Min > 0;
    }

    if (end2Min < start2Min) {
        // Shift 2 is overnight
        return start1Min >= start2Min || end1Min > 0;
    }

    // Both are same-day shifts
    return !(end1Min <= start2Min || start1Min >= end2Min);
}

// Get default color based on shift name
function getDefaultShiftColor(shiftName) {
    const name = shiftName.toLowerCase();
    if (name.includes('morning') || name.includes('day')) return '#ffc107'; // Yellow
    if (name.includes('evening') || name.includes('afternoon')) return '#fd7e14'; // Orange
    if (name.includes('night')) return '#6610f2'; // Purple
    return '#6c757d'; // Default gray
}

module.exports = {
    getPositionShifts,
    createPositionShift,
    updatePositionShift,
    deletePositionShift
};