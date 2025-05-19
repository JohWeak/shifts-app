const Employee = require('../models/employee.model');
const bcrypt = require('bcryptjs');

// Get a list of all employees
exports.findAll = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get employee by ID
exports.findOne = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new employee
exports.create = async (req, res) => {
    try {
        // Checking existing email or login
        const existingEmployee = await Employee.findOne({
            where: {
                [Op.or]: [
                    { email: req.body.email },
                    { login: req.body.login }
                ]
            }
        });

        if (existingEmployee) {
            return res.status(400).json({ message: 'Email or login already in use' });
        }

        // Password hashing
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Employee creation
        const employee = await Employee.create({
            ...req.body,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Employee created successfully',
            employee: {
                id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update employee
exports.update = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // If there is a password in the request, we hash it.
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        await employee.update(req.body);

        res.json({
            message: 'Employee updated successfully',
            employee: {
                id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove employee
exports.delete = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await employee.destroy();

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};