// backend/src/controllers/shift-requirement.controller.js
const db = require('../../models');
const { ShiftRequirement, PositionShift } = db;
const { Op } = require('sequelize');

// Get all requirements for a shift
const getShiftRequirements = async (req, res) => {
    try {
        const { shiftId } = req.params;
        const { dateRange } = req.query;

        const whereCondition = { position_shift_id: shiftId };

        if (dateRange) {
            const [startDate, endDate] = dateRange.split(',');
            whereCondition[Op.or] = [
                // Recurring requirements
                { is_recurring: true },
                // Specific dates in range
                {
                    is_recurring: false,
                    specific_date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            ];
        }

        const requirements = await ShiftRequirement.findAll({
            where: whereCondition,
            order: [
                ['is_recurring', 'DESC'],
                ['day_of_week', 'ASC'],
                ['specific_date', 'ASC']
            ]
        });

        res.json(requirements);
    } catch (error) {
        console.error('Error fetching shift requirements:', error);
        res.status(500).json({
            message: 'Error fetching shift requirements',
            error: error.message
        });
    }
};

// Create a new requirement
const createShiftRequirement = async (req, res) => {
    try {
        const { shiftId } = req.params;
        const {
            day_of_week,
            required_staff_count,
            is_recurring,
            specific_date,
            valid_from,
            valid_until,
            is_working_day,
            notes
        } = req.body;

        // Validate shift exists
        const shift = await PositionShift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Check for duplicates
        const existingWhere = {
            position_shift_id: shiftId
        };

        if (is_recurring) {
            existingWhere.is_recurring = true;
            existingWhere.day_of_week = day_of_week;
            // Check for overlapping validity periods
            if (valid_from || valid_until) {
                existingWhere[Op.or] = [
                    {
                        valid_from: { [Op.lte]: valid_until || '9999-12-31' },
                        valid_until: { [Op.gte]: valid_from || '1900-01-01' }
                    },
                    {
                        valid_from: null,
                        valid_until: null
                    }
                ];
            }
        } else {
            existingWhere.is_recurring = false;
            existingWhere.specific_date = specific_date;
        }

        const existing = await ShiftRequirement.findOne({ where: existingWhere });
        if (existing) {
            return res.status(400).json({
                message: 'Requirement already exists for this period'
            });
        }

        const requirement = await ShiftRequirement.create({
            position_shift_id: shiftId,
            day_of_week,
            required_staff_count,
            is_recurring,
            specific_date,
            valid_from,
            valid_until,
            is_working_day,
            notes
        });

        res.status(201).json(requirement);
    } catch (error) {
        console.error('Error creating shift requirement:', error);
        res.status(500).json({
            message: 'Error creating shift requirement',
            error: error.message
        });
    }
};

// Update a requirement
const updateShiftRequirement = async (req, res) => {
    try {
        const { reqId } = req.params;
        const updates = req.body;

        const requirement = await ShiftRequirement.findByPk(reqId);
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found' });
        }

        await requirement.update(updates);

        res.json(requirement);
    } catch (error) {
        console.error('Error updating shift requirement:', error);
        res.status(500).json({
            message: 'Error updating shift requirement',
            error: error.message
        });
    }
};

// Delete a requirement
const deleteShiftRequirement = async (req, res) => {
    try {
        const { reqId } = req.params;

        const requirement = await ShiftRequirement.findByPk(reqId);
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found' });
        }

        await requirement.destroy();

        res.json({
            message: 'Requirement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shift requirement:', error);
        res.status(500).json({
            message: 'Error deleting shift requirement',
            error: error.message
        });
    }
};

// Get requirements matrix for a position (all shifts, all days)
const getPositionRequirementsMatrix = async (req, res) => {
    try {
        const { positionId } = req.params;
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();

        // Get all active shifts for the position
        const shifts = await PositionShift.findAll({
            where: {
                position_id: positionId,
                is_active: true
            },
            include: [{
                model: ShiftRequirement,
                as: 'requirements',
                where: {
                    [Op.or]: [
                        { is_recurring: true },
                        {
                            is_recurring: false,
                            specific_date: targetDate
                        }
                    ]
                },
                required: false
            }],
            order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
        });

        // Build matrix
        const matrix = {
            date: targetDate,
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shifts: shifts.map(shift => ({
                id: shift.id,
                name: shift.shift_name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                duration_hours: shift.duration_hours,
                color: shift.color,
                requirements: {}
            }))
        };

        // Fill requirements for each day
        shifts.forEach((shift, shiftIndex) => {
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const requirement = shift.requirements.find(req =>
                    (req.is_recurring && (req.day_of_week === dayOfWeek || req.day_of_week === null)) ||
                    (!req.is_recurring && new Date(req.specific_date).getDay() === dayOfWeek)
                );

                matrix.shifts[shiftIndex].requirements[dayOfWeek] = {
                    required_staff: requirement ? requirement.required_staff_count : 1,
                    is_working_day: requirement ? requirement.is_working_day : true,
                    requirement_id: requirement ? requirement.id : null
                };
            }
        });

        res.json(matrix);
    } catch (error) {
        console.error('Error fetching requirements matrix:', error);
        res.status(500).json({
            message: 'Error fetching requirements matrix',
            error: error.message
        });
    }
};

module.exports = {
    getShiftRequirements,
    createShiftRequirement,
    updateShiftRequirement,
    deleteShiftRequirement,
    getPositionRequirementsMatrix
};