const { Shift, Employee, Constraint } = require('../models/associations');

// Get all shifts
exports.findAll = async (req, res) => {
    try {
        const shifts = await Shift.findAll({
            include: [{
                association: 'employee',
                attributes: ['emp_id', 'first_name', 'last_name']
            }],
            order: [['start_time', 'ASC']]
        });
        res.json(shifts);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving shifts',
            error: error.message
        });
    }
};

// Get shift by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const shift = await Shift.findByPk(id, {
            include: [
                { association: 'employee' },
                {
                    association: 'constraints',
                    include: [{ association: 'employee' }]
                }
            ]
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        res.json(shift);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving shift',
            error: error.message
        });
    }
};

// Create new shift
exports.create = async (req, res) => {
    try {
        // If an employee is assigned, verify the employee exists
        if (req.body.emp_id) {
            const employee = await Employee.findByPk(req.body.emp_id);
            if (!employee) {
                return res.status(400).json({ message: 'Employee not found' });
            }
        }

        const shift = await Shift.create(req.body);

        // Fetch the created shift with employee data
        const shiftWithEmployee = await Shift.findByPk(shift.shift_id, {
            include: [{ association: 'employee' }]
        });

        res.status(201).json({
            message: 'Shift created successfully',
            shift: shiftWithEmployee
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating shift',
            error: error.message
        });
    }
};

// Update shift
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const shift = await Shift.findByPk(id);

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // If an employee is being assigned, verify the employee exists
        if (req.body.emp_id && req.body.emp_id !== shift.emp_id) {
            const employee = await Employee.findByPk(req.body.emp_id);
            if (!employee) {
                return res.status(400).json({ message: 'Employee not found' });
            }
        }

        await shift.update(req.body);

        // Fetch updated shift with employee data
        const updatedShift = await Shift.findByPk(id, {
            include: [{ association: 'employee' }]
        });

        res.json({
            message: 'Shift updated successfully',
            shift: updatedShift
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating shift',
            error: error.message
        });
    }
};

// Delete shift
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const shift = await Shift.findByPk(id);

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        await shift.destroy();

        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting shift',
            error: error.message
        });
    }
};

// Assign an employee to shift
exports.assignEmployee = async (req, res) => {
    try {
        const shiftId = req.params.id;
        const { emp_id } = req.body;

        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        if (emp_id) {
            const employee = await Employee.findByPk(emp_id);
            if (!employee) {
                return res.status(400).json({ message: 'Employee not found' });
            }
        }

        await shift.update({ emp_id });

        const updatedShift = await Shift.findByPk(shiftId, {
            include: [{ association: 'employee' }]
        });

        res.json({
            message: 'Employee assigned to shift successfully',
            shift: updatedShift
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error assigning employee to shift',
            error: error.message
        });
    }
};