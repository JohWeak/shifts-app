const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/core/employee.model');

// Register a new employee
exports.register = async (req, res) => {
    try {
        // Check if user already exists
        const existingEmployee = await Employee.findOne({
            where: { email: req.body.email }
        });

        if (existingEmployee) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create new employee
        const employee = await Employee.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            login: req.body.login,
            password: hashedPassword,
            // Other fields from request
        });

        res.status(201).json({
            message: 'Employee registered successfully',
            employee: {
                id: employee.emp_id,
                email: employee.email,
                name: `${employee.first_name} ${employee.last_name}`
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error registering employee',
            error: error.message
        });
    }
};

// Login employee
exports.login = async (req, res) => {
    try {
        // Find employee by login
        const employee = await Employee.findOne({
            where: { login: req.body.login }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(req.body.password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Create token
        const token = jwt.sign(
            { id: employee.emp_id, role: employee.status === 'admin' ? 'admin' : 'employee' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            id: employee.emp_id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            role: employee.status === 'admin' ? 'admin' : 'employee',
            token: token
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error during login',
            error: error.message
        });
    }
};