// backend/src/controllers/employee.controller.js
const db = require('../models');
const {Employee, Position, EmployeeConstraint, WorkSite} = db;
const bcrypt = require('bcryptjs');
const {Op} = require("sequelize");

// Create new employee
const create = async (req, res) => {
    try {
        const {password, ...employeeData} = req.body;

        // Hash password if provided
        if (password) {
            employeeData.password = await bcrypt.hash(password, 10);
        }

        const employee = await Employee.create(employeeData);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating employee',
            error: error.message
        });
    }
};

// Get all employees
const findAll = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            status,
            position,
            search,
            work_site,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        // Build where clause
        const where = {};
        const includeWhere = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (work_site && work_site !== 'all') {
            if (work_site === 'any') {
                where.work_site_id = null;
            } else {
                where.work_site_id = work_site;
            }
        }

        if (search) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        // Handle position filter
        if (position && position !== 'all') {
            if (work_site === 'all') {
                includeWhere.pos_name = position;
            } else {
                where.default_position_id = position;
            }
        }

        // Build order clause
        let order = [];
        switch (sortBy) {
            case 'name':
                order = [['first_name', sortOrder], ['last_name', sortOrder]];
                break;
            case 'workSite':
                // Use the association alias 'workSite'
                order = [[{ model: WorkSite, as: 'workSite' }, 'site_name', sortOrder]];
                break;
            case 'position':
                // Use the association alias 'defaultPosition'
                order = [[{ model: Position, as: 'defaultPosition' }, 'pos_name', sortOrder]];
                break;
            case 'status':
                order = [['status', sortOrder]];
                break;
            default:
                order = [[sortBy, sortOrder]];
        }

        // Calculate offset
        const offset = (page - 1) * pageSize;

        // Fetch employees with pagination
        const { count, rows } = await Employee.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                    where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
                    required: position && position !== 'all' && work_site === 'all'
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'],
                    required: false // Make it optional to include employees without work site
                }
            ],
            limit: parseInt(pageSize),
            offset: offset,
            order: order,
            distinct: true // Add this to get correct count with includes
        });

        // Format response
        const employees = rows.map(emp => ({
            ...emp.toJSON(),
            default_position_name: emp.defaultPosition?.pos_name || null,
            work_site_name: emp.workSite?.site_name || null
        }));

        res.json({
            success: true,
            data: employees,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: count,
                totalPages: Math.ceil(count / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message
        });
    }
};

// Get employee by ID
const findOne = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            attributes: {exclude: ['password']},
            include: [
                {
                    model: Position,
                    as: 'defaultPosition'
                },
                {
                    model: WorkSite,
                    as: 'workSite'
                }
            ]
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching employee',
            error: error.message
        });
    }
};

// Update employee
const update = async (req, res) => {
    try {
        const {password, ...updateData} = req.body;

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const [updated] = await Employee.update(updateData, {
            where: {emp_id: req.params.id}
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const employee = await Employee.findByPk(req.params.id, {
            attributes: {exclude: ['password']}
        });

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        const deleted = await Employee.destroy({
            where: {emp_id: req.params.id}
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message
        });
    }
};

// Get employee constraints
const getConstraints = async (req, res) => {
    try {
        const constraints = await EmployeeConstraint.findAll({
            where: {emp_id: req.params.id},
            include: [{
                model: db.Shift,
                as: 'shift',
                attributes: ['shift_id', 'shift_name']
            }]
        });

        res.json({
            success: true,
            data: constraints
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching constraints',
            error: error.message
        });
    }
};

// Get employee qualifications (placeholder)
const getQualifications = async (req, res) => {
    try {
        // Placeholder implementation
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching qualifications',
            error: error.message
        });
    }
};

// Add qualification (placeholder)
const addQualification = async (req, res) => {
    try {
        // Placeholder implementation
        res.json({
            success: true,
            message: 'Qualification added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding qualification',
            error: error.message
        });
    }
};

module.exports = {
    create,
    findAll,
    findOne,
    update,
    delete: deleteEmployee,
    getConstraints,
    getQualifications,
    addQualification
};