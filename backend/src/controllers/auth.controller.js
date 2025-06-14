const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Экспортируем функцию, которая принимает db
module.exports = (db) => {
    const {Employee} = db; // Получаем модель из переданного объекта
    const authController = {};

// Register a new employee
    authController.register = async (req, res) => {
        try {
            // Check if a user already exists
            const existingEmployee = await Employee.findOne({
                where: {email: req.body.email}
            });

            if (existingEmployee) {
                return res.status(400).json({message: 'User already exists'});
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
                // Other fields from the request
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
    authController.login = async (req, res) => {
        console.log('--- LOGIN ATTEMPT ---');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Request Body:', req.body);
        try {
            if (!req.body || !req.body.login) {
                console.error('Login failed: req.body is empty or missing login field.');
                return res.status(400).json({message: 'Invalid request body. Login is required.'});
            }

            // Find employee by login
            const employee = await Employee.findOne({
                where: {login: req.body.login}
            });

            if (!employee) {
                return res.status(404).json({message: 'Employee not found'});
            }

            // Validate password
            const isPasswordValid = await bcrypt.compare(req.body.password, employee.password);

            if (!isPasswordValid) {
                return res.status(401).json({message: 'Invalid password'});
            }

            const role = employee.role;
            console.log(`User ${employee.login} logging in with role: ${role}`);

            // Token creation
            const token = jwt.sign(
                {id: employee.emp_id, role},
                process.env.JWT_SECRET,
                {expiresIn: '24h'}
            );

            res.status(200).json({
                id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email,
                role,
                token
            });
        } catch (error) {
            console.error('!!! LOGIN CONTROLLER CRASHED !!!');
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                message: 'Error during login',
                error: error.message
            });
        }
    };

    return authController;
};