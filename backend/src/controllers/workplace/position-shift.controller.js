// backend/src/controllers/position-shift.controller.js
const db = require('../../models');
const {Position, PositionShift, ShiftRequirement, ScheduleAssignment} = db;
const {Op} = require('sequelize');

// Get all shifts for a position
const getPositionShifts = async (req, res) => {
    try {
        const {positionId} = req.params;
        const {includeRequirements = false} = req.query;

        const includeOptions = [];
        if (includeRequirements) {
            includeOptions.push({
                model: ShiftRequirement,
                as: 'requirements',
                required: false
            });
        }

        const shifts = await PositionShift.findAll({
            where: {
                position_id: positionId,
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
        const {positionId: position_id} = req.params;
        const {shift_name, start_time, end_time, color, sort_order} = req.body.shift || req.body;

        // Format times to ensure they are valid
        const formatTime = (time) => {
            if (!time) return null;
            // Ensure time is in HH:MM:SS format
            const parts = time.split(':');
            const hours = parts[0] ? parts[0].padStart(2, '0') : '00';
            const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
            const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
            return `${hours}:${minutes}:${seconds}`;
        };

        const formattedStartTime = formatTime(start_time);
        const formattedEndTime = formatTime(end_time);

        // Validate position exists
        const position = await Position.findByPk(position_id);
        if (!position) {
            return res.status(404).json({message: 'Position not found'});
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
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            color: color || getDefaultShiftColor(shift_name),
            sort_order: sort_order || existingShifts.length
        });

        // Create default requirements (1 person for all days)
        await ShiftRequirement.create({
            position_shift_id: newShift.id,
            day_of_week: null, // All days
            required_staff_count: position.num_of_emp || 1,
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
        const {shiftId} = req.params;
        const {shift_name, start_time, end_time, color, sort_order, is_active} = req.body.shift || req.body;

        const shift = await PositionShift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({message: 'Shift not found'});
        }

        // If updating times, check for conflicts
        if (start_time || end_time) {
            const newStartTime = start_time || shift.start_time;
            const newEndTime = end_time || shift.end_time;

            const conflictingShifts = await PositionShift.findAll({
                where: {
                    position_id: shift.position_id,
                    id: {[Op.ne]: shiftId},
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
        const {shiftId} = req.params;

        const shift = await PositionShift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({message: 'Shift not found'});
        }

        // Soft delete
        await shift.update({is_active: false});

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

// Helper function to check time overlap (updated to match model)
function checkTimeOverlap(start1, end1, start2, end2) {
    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    let flex_start = toMinutes(start1);
    let flex_end = toMinutes(end1);
    let shift_start = toMinutes(start2);
    let shift_end = toMinutes(end2);
    
    // Handle overnight shifts by expanding to handle both same-day and cross-day scenarios
    const checkOverlap = (fs, fe, ss, se) => {
        return Math.max(fs, ss) < Math.min(fe, se);
    };
    
    // Case 1: Both are regular shifts (no overnight)
    if (flex_end >= flex_start && shift_end >= shift_start) {
        return checkOverlap(flex_start, flex_end, shift_start, shift_end);
    }
    
    // Case 2: Flexible shift is overnight, regular shift is not
    if (flex_end < flex_start && shift_end >= shift_start) {
        return checkOverlap(flex_start, flex_start + 24 * 60, shift_start, shift_end) ||
               checkOverlap(0, flex_end, shift_start, shift_end);
    }
    
    // Case 3: Regular shift is overnight, flexible shift is not
    if (flex_end >= flex_start && shift_end < shift_start) {
        return checkOverlap(flex_start, flex_end, shift_start, shift_start + 24 * 60) ||
               checkOverlap(flex_start, flex_end, 0, shift_end);
    }
    
    // Case 4: Both are overnight shifts
    if (flex_end < flex_start && shift_end < shift_start) {
        return checkOverlap(flex_start, flex_start + 24 * 60, shift_start, shift_start + 24 * 60) ||
               checkOverlap(0, flex_end, 0, shift_end) ||
               checkOverlap(flex_start, flex_start + 24 * 60, 0, shift_end) ||
               checkOverlap(0, flex_end, shift_start, shift_start + 24 * 60);
    }
    
    return false;
}

// Get default color based on shift name
function getDefaultShiftColor(shiftName) {
    const name = shiftName.toLowerCase();
    if (name.includes('morning') || name.includes('day')) return '#fddb77'; // Yellow
    if (name.includes('evening') || name.includes('afternoon')) return '#fdb271'; // Orange
    if (name.includes('night')) return '#b080ff'; // Purple
    return '#6c757d'; // Default gray
}

// Get flexible shifts for a position
const getPositionFlexibleShifts = async (req, res) => {
    try {
        const { positionId } = req.params;
        const { includeSpans = false } = req.query;

        const whereClause = {
            position_id: positionId,
            is_active: true,
            is_flexible: true
        };

        const includeOptions = [];
        if (includeSpans) {
            includeOptions.push({
                model: ShiftRequirement,
                as: 'requirements',
                required: false
            });
        }

        const flexibleShifts = await PositionShift.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['start_time', 'ASC'], ['sort_order', 'ASC']]
        });

        // If includeSpans is true, also return the shifts that are spanned
        if (includeSpans && flexibleShifts.length > 0) {
            const allShifts = await PositionShift.findAll({
                where: {
                    position_id: positionId,
                    is_active: true
                }
            });

            // Add spanned shift details to each flexible shift
            flexibleShifts.forEach(flexShift => {
                if (flexShift.spans_shifts && flexShift.spans_shifts.length > 0) {
                    flexShift.dataValues.spannedShiftDetails = allShifts.filter(
                        shift => flexShift.spans_shifts.includes(shift.id)
                    );
                }
            });
        }

        res.json(flexibleShifts);
    } catch (error) {
        console.error('Error fetching flexible shifts:', error);
        res.status(500).json({
            message: 'Error fetching flexible shifts',
            error: error.message
        });
    }
};

// Create a flexible shift
const createFlexibleShift = async (req, res) => {
    try {
        const { positionId: position_id } = req.params;
        const {
            shift_name,
            start_time,
            end_time,
            color = '#6c757d',
            sort_order
        } = req.body.shift || req.body;

        // Validate position exists
        const position = await Position.findByPk(position_id);
        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }

        // Validate flexible shift constraints
        const validation = PositionShift.validateFlexibleShift(start_time, end_time, position_id);
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Invalid flexible shift',
                errors: validation.errors
            });
        }

        // Format times
        const formatTime = (time) => {
            if (!time) return null;
            const parts = time.split(':');
            const hours = parts[0] ? parts[0].padStart(2, '0') : '00';
            const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
            const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
            return `${hours}:${minutes}:${seconds}`;
        };

        const formattedStartTime = formatTime(start_time);
        const formattedEndTime = formatTime(end_time);

        // Get all regular shifts for the position to calculate spans_shifts
        const regularShifts = await PositionShift.findAll({
            where: {
                position_id,
                is_active: true,
                is_flexible: false
            }
        });

        // Calculate spans_shifts
        const spans = PositionShift.calculateSpanningShifts(
            formattedStartTime,
            formattedEndTime,
            regularShifts
        );

        if (spans.length === 0) {
            return res.status(400).json({
                message: 'Flexible shift must overlap with at least one regular shift'
            });
        }

        // Get existing flexible shifts count for sort_order
        const existingFlexibleShifts = await PositionShift.findAll({
            where: {
                position_id,
                is_flexible: true,
                is_active: true
            }
        });

        const newFlexibleShift = await PositionShift.create({
            position_id,
            shift_name,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            color,
            is_flexible: true,
            spans_shifts: spans,
            calculated_duration_hours: validation.durationHours,
            sort_order: sort_order || existingFlexibleShifts.length,
            is_active: true
        });

        // Get the created shift with spanned shift details
        const flexibleShiftWithDetails = await PositionShift.findByPk(newFlexibleShift.id);
        
        // Add spanned shift details
        flexibleShiftWithDetails.dataValues.spannedShiftDetails = regularShifts.filter(
            shift => spans.includes(shift.id)
        );

        res.status(201).json({
            message: 'Flexible shift created successfully',
            shift: flexibleShiftWithDetails
        });

    } catch (error) {
        console.error('Error creating flexible shift:', error);
        res.status(500).json({
            message: 'Error creating flexible shift',
            error: error.message
        });
    }
};

// Update a flexible shift
const updateFlexibleShift = async (req, res) => {
    try {
        const { positionId, shiftId } = req.params;
        const updateData = req.body.shift || req.body;

        const flexibleShift = await PositionShift.findOne({
            where: {
                id: shiftId,
                position_id: positionId,
                is_flexible: true
            }
        });

        if (!flexibleShift) {
            return res.status(404).json({ 
                message: 'Flexible shift not found' 
            });
        }

        // If updating times, recalculate spans_shifts
        if (updateData.start_time || updateData.end_time) {
            const newStartTime = updateData.start_time || flexibleShift.start_time;
            const newEndTime = updateData.end_time || flexibleShift.end_time;

            // Validate new times
            const validation = PositionShift.validateFlexibleShift(
                newStartTime, 
                newEndTime, 
                positionId, 
                shiftId
            );
            
            if (!validation.isValid) {
                return res.status(400).json({
                    message: 'Invalid flexible shift times',
                    errors: validation.errors
                });
            }

            // Recalculate spans_shifts
            const regularShifts = await PositionShift.findAll({
                where: {
                    position_id: positionId,
                    is_active: true,
                    is_flexible: false
                }
            });

            const newSpans = PositionShift.calculateSpanningShifts(
                newStartTime,
                newEndTime,
                regularShifts
            );

            updateData.spans_shifts = newSpans;
            updateData.calculated_duration_hours = validation.durationHours;
        }

        await flexibleShift.update(updateData);

        const updatedShift = await PositionShift.findByPk(shiftId);

        res.json({
            message: 'Flexible shift updated successfully',
            shift: updatedShift
        });

    } catch (error) {
        console.error('Error updating flexible shift:', error);
        res.status(500).json({
            message: 'Error updating flexible shift',
            error: error.message
        });
    }
};

// Delete (deactivate) a flexible shift
const deleteFlexibleShift = async (req, res) => {
    try {
        const { positionId, shiftId } = req.params;

        const flexibleShift = await PositionShift.findOne({
            where: {
                id: shiftId,
                position_id: positionId,
                is_flexible: true
            }
        });

        if (!flexibleShift) {
            return res.status(404).json({ 
                message: 'Flexible shift not found' 
            });
        }

        // Check if there are any assignments using this flexible shift
        const assignmentsCount = await ScheduleAssignment.count({
            where: {
                shift_id: shiftId,
                assignment_type: 'flexible'
            }
        });

        if (assignmentsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete flexible shift - it has ${assignmentsCount} active assignments`
            });
        }

        // Soft delete
        await flexibleShift.update({ is_active: false });

        res.json({
            message: 'Flexible shift deleted successfully',
            shift_id: shiftId
        });

    } catch (error) {
        console.error('Error deleting flexible shift:', error);
        res.status(500).json({
            message: 'Error deleting flexible shift',
            error: error.message
        });
    }
};

// Create flexible assignment (used when dragging employee to flexible shift)
const createFlexibleAssignment = async (req, res) => {
    try {
        const { positionId, shiftId } = req.params;
        const {
            emp_id,
            work_date,
            schedule_id,
            custom_start_time,
            custom_end_time,
            covering_for_emp_id
        } = req.body;

        const flexibleShift = await PositionShift.findOne({
            where: {
                id: shiftId,
                position_id: positionId,
                is_flexible: true,
                is_active: true
            }
        });

        if (!flexibleShift) {
            return res.status(404).json({ 
                message: 'Flexible shift not found' 
            });
        }

        // Check if employee is already assigned for this date/shift
        const existingAssignment = await ScheduleAssignment.findOne({
            where: {
                emp_id,
                work_date,
                shift_id: shiftId
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                message: 'Employee is already assigned to this shift on this date'
            });
        }

        const assignment = await ScheduleAssignment.create({
            schedule_id,
            emp_id,
            shift_id: shiftId,
            position_id: positionId,
            work_date,
            assignment_type: 'flexible',
            custom_start_time,
            custom_end_time,
            covering_for_emp_id,
            status: 'scheduled'
        });

        const assignmentWithDetails = await ScheduleAssignment.findByPk(assignment.id, {
            include: [
                {
                    model: db.Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time']
                }
            ]
        });

        res.status(201).json({
            message: 'Flexible assignment created successfully',
            assignment: assignmentWithDetails
        });

    } catch (error) {
        console.error('Error creating flexible assignment:', error);
        res.status(500).json({
            message: 'Error creating flexible assignment',
            error: error.message
        });
    }
};

module.exports = {
    getPositionShifts,
    createPositionShift,
    updatePositionShift,
    deletePositionShift,
    getPositionFlexibleShifts,
    createFlexibleShift,
    updateFlexibleShift,
    deleteFlexibleShift,
    createFlexibleAssignment
};