const { Employee, EmployeeConstraint, EmployeeQualification } = require('../models/associations');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Get all employees
exports.findAll = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving employees',
            error: error.message
        });
    }
};

// Get employee by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await Employee.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [
                { association: 'constraints' },
                { association: 'shifts' }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving employee',
            error: error.message
        });
    }
};

// Create new employee
exports.create = async (req, res) => {
    try {
        // Check if email or login already exists
        const existingEmployee = await Employee.findOne({
            where: {
                [Op.or]: [
                    { email: req.body.email },
                    { login: req.body.login }
                ]
            }
        });

        if (existingEmployee) {
            return res.status(400).json({
                message: 'Email or login already in use'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create employee
        const employee = await Employee.create({
            ...req.body,
            password: hashedPassword
        });

        // Return employee data without a password
        const { password, ...employeeData } = employee.toJSON();

        res.status(201).json({
            message: 'Employee created successfully',
            employee: employeeData
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating employee',
            error: error.message
        });
    }
};

// Update employee
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // If the password is being updated, hash it
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        await employee.update(req.body);

        // Return an updated employee without a password
        const { password, ...employeeData } = employee.toJSON();

        res.json({
            message: 'Employee updated successfully',
            employee: employeeData
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating employee',
            error: error.message
        });
    }
};

// Delete employee
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await employee.destroy();

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting employee',
            error: error.message
        });
    }
};

// Get employee's constraints (UPDATED)
exports.getConstraints = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await Employee.findByPk(id, {
            include: [
                {
                    model: EmployeeConstraint,  // UPDATED: используем новую модель
                    as: 'constraints',
                    include: [{
                        model: Shift,
                        as: 'shift',
                        attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                    }]
                }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee.constraints);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving employee constraints',
            error: error.message
        });
    }
};

// NEW: Get employee's qualifications
exports.getQualifications = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await Employee.findByPk(id, {
            include: [
                {
                    model: EmployeeQualification,
                    as: 'qualifications'
                }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee.qualifications);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving employee qualifications',
            error: error.message
        });
    }
};

// NEW: Add qualification to employee
exports.addQualification = async (req, res) => {
    try {
        const empId = req.params.id;
        const { qualification_name, level, certified_date, expires_date } = req.body;

        // Validate employee exists
        const employee = await Employee.findByPk(empId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const qualification = await EmployeeQualification.create({
            emp_id: empId,
            qualification_name,
            level,
            certified_date,
            expires_date
        });

        res.status(201).json({
            message: 'Qualification added successfully',
            qualification
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error adding qualification',
            error: error.message
        });
    }
};