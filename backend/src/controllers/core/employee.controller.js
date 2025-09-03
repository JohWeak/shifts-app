// backend/src/controllers/employee.controller.js
const db = require('../../models');
const { Employee, Position, EmployeeConstraint, WorkSite, PositionShift } = db;
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');


// Create new employee
const create = async (req, res) => {
    try {
        const { password, admin_work_sites_scope, is_super_admin, ...employeeData } = req.body;

        // Only super admins can create admin users and set admin privileges
        if (employeeData.role === 'admin') {
            // Get current user info
            const currentUser = await Employee.findByPk(req.userId, {
                attributes: ['emp_id', 'is_super_admin'],
            });

            if (!currentUser || (currentUser.emp_id !== 1 && !currentUser.is_super_admin)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admins can create admin users',
                });
            }

            // Add admin-specific fields
            employeeData.admin_work_sites_scope = admin_work_sites_scope || [];
            employeeData.is_super_admin = is_super_admin || false;
        } else {
            // For non-admin users, ensure admin fields are not set
            employeeData.admin_work_sites_scope = null;
            employeeData.is_super_admin = false;
        }

        // Hash password if provided
        if (password) {
            employeeData.password = await bcrypt.hash(password, 10);
        }

        // Explicitly handle empty or non-existent optional fields
        if (!employeeData.email || employeeData.email === '') {
            employeeData.email = null;
        }

        // If default_position_id is not provided or is an empty string, set it to null.
        if (!employeeData.default_position_id || employeeData.default_position_id === '') {
            employeeData.default_position_id = null;
        }

        const employee = await Employee.create(employeeData);

        const employeeWithAssociations = await Employee.findByPk(employee.emp_id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'],
                },
            ],
        });

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employeeWithAssociations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating employee',
            error: error.message,
        });
    }
};

// Get all employees
const findAll = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 50,
            status,
            position,
            search,
            work_site,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            fields,
        } = req.query;

        const attributes = fields
            ? fields.split(',').filter(f => f !== 'password')
            : [
                'emp_id', 'first_name', 'last_name', 'email', 'phone',
                'status', 'role', 'default_position_id', 'work_site_id',
                'login', 'createdAt', 'updatedAt', 'country', 'city', 'address',
                'admin_work_sites_scope', 'is_super_admin',
            ];

        // Build where clause
        const where = {};
        const includeWhere = {};

        // Add Work Site filtering for limited admins
        if (req.userRole === 'admin' && req.accessibleSites !== 'all') {
            const accessibleSites = req.accessibleSites || [];

            if (accessibleSites.length === 0) {
                // Admin has no accessible sites - return empty result
                return res.json({
                    success: true,
                    data: [],
                    total: 0,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    totalPages: 0,
                });
            }

            // Filter employees by accessible work sites
            where[Op.or] = [
                { work_site_id: { [Op.in]: accessibleSites } },
                { work_site_id: null }, // Include employees without specific work site assignment
                // Include employees whose default position is in accessible sites
                db.Sequelize.literal(`default_position_id IN (
                    SELECT pos_id FROM positions 
                    WHERE site_id IN (${accessibleSites.join(',')})
                )`),
            ];
        }

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
            const searchLower = search.toLowerCase();
            where[Op.or] = [
                db.Sequelize.where(
                    db.Sequelize.fn('LOWER', db.Sequelize.col('first_name')),
                    { [Op.like]: `%${searchLower}%` },
                ),
                db.Sequelize.where(
                    db.Sequelize.fn('LOWER', db.Sequelize.col('last_name')),
                    { [Op.like]: `%${searchLower}%` },
                ),
                db.Sequelize.where(
                    db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
                    { [Op.like]: `%${searchLower}%` },
                ),
                { phone: { [Op.like]: `%${search}%` } },
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
        let order;
        switch (sortBy) {
            case 'name':
                order = [['first_name', sortOrder], ['last_name', sortOrder]];
                break;
            case 'workSite':
                order = [[{ model: WorkSite, as: 'workSite' }, 'site_name', sortOrder]];
                break;
            case 'position':
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

        // Optimized query with limited field set
        const { count, rows } = await Employee.findAndCountAll({
            where,
            attributes,
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'], // Only necessary fields
                    where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
                    required: position && position !== 'all' && work_site === 'all',
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'], // Only necessary fields
                    required: false,
                },
            ],
            limit: parseInt(pageSize),
            offset: offset,
            order: order,
            distinct: true,
            // Add hint for index usage
            ...((status || work_site) && {
                index: status && work_site ? 'idx_work_site_status' : 'idx_status_created',
            }),
        });

        // Format response
        const employees = rows.map(emp => ({
            ...emp.toJSON(),
            position_name: emp.defaultPosition?.pos_name || null,
            work_site_name: emp.workSite?.site_name || null,
        }));

        res.json({
            success: true,
            data: employees,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: count,
                totalPages: Math.ceil(count / pageSize),
                hasNextPage: page < Math.ceil(count / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message,
        });
    }
};


// Get employee by ID
const findOne = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                },
            ],
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.json({
            success: true,
            data: employee,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching employee',
            error: error.message,
        });
    }
};

// Update employee
const update = async (req, res) => {
    try {
        const { password, admin_work_sites_scope, is_super_admin, ...updateData } = req.body;

        // Get the employee being updated to check current role
        const existingEmployee = await Employee.findByPk(req.params.id, {
            attributes: ['emp_id', 'role', 'admin_work_sites_scope', 'is_super_admin', 'work_site'],
        });

        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if this is a flexible employee (work_site is null) and user is not super admin
        if (existingEmployee.work_site === null) {
            // Get current user info to check if super admin
            const currentUser = await Employee.findByPk(req.userId, {
                attributes: ['emp_id', 'is_super_admin'],
            });

            if (!currentUser || (currentUser.emp_id !== 1 && !currentUser.is_super_admin)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admins can edit flexible employees',
                });
            }
        }

        // If role is being changed to/from admin, or admin fields are being updated
        if (updateData.role === 'admin' || existingEmployee.role === 'admin' ||
            admin_work_sites_scope !== undefined || is_super_admin !== undefined) {

            // Get current user info
            const currentUser = await Employee.findByPk(req.userId, {
                attributes: ['emp_id', 'is_super_admin'],
            });

            if (!currentUser || (currentUser.emp_id !== 1 && !currentUser.is_super_admin)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admins can modify admin privileges',
                });
            }

            // Handle admin-specific fields
            if (updateData.role === 'admin') {
                updateData.admin_work_sites_scope = admin_work_sites_scope || existingEmployee.admin_work_sites_scope || [];
                updateData.is_super_admin = is_super_admin !== undefined ? is_super_admin : existingEmployee.is_super_admin;
            } else if (updateData.role === 'employee') {
                // When changing from admin to employee, clear admin fields
                updateData.admin_work_sites_scope = null;
                updateData.is_super_admin = false;
            } else {
                // Just updating admin fields for existing admin
                if (admin_work_sites_scope !== undefined) {
                    updateData.admin_work_sites_scope = admin_work_sites_scope;
                }
                if (is_super_admin !== undefined) {
                    updateData.is_super_admin = is_super_admin;
                }
            }
        }

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        if (req.body.email === '') {
            updateData.email = null;
        }
        // Update only the passed fields
        const [updated] = await Employee.update(updateData, {
            where: { emp_id: req.params.id },
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Return full employee data with included associations
        const employee = await Employee.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'],
                },
            ],
        });

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message,
        });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        // Get the employee being deleted to check if flexible
        const existingEmployee = await Employee.findByPk(req.params.id, {
            attributes: ['emp_id', 'work_site'],
        });

        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if this is a flexible employee (work_site is null) and user is not super admin
        if (existingEmployee.work_site === null) {
            // Get current user info to check if super admin
            const currentUser = await Employee.findByPk(req.userId, {
                attributes: ['emp_id', 'is_super_admin'],
            });

            if (!currentUser || (currentUser.emp_id !== 1 && !currentUser.is_super_admin)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admins can delete flexible employees',
                });
            }
        }

        const deleted = await Employee.destroy({
            where: { emp_id: req.params.id },
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message,
        });
    }
};

// Get employee constraints
const getConstraints = async (req, res) => {
    try {
        const constraints = await EmployeeConstraint.findAll({
            where: { emp_id: req.params.id },
            include: [{
                model: db.Shift,
                as: 'shift',
                attributes: ['shift_id', 'shift_name'],
            }],
        });

        res.json({
            success: true,
            data: constraints,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching constraints',
            error: error.message,
        });
    }
};

// Get employee qualifications (placeholder)
const getQualifications = async (req, res) => {
    try {
        // Placeholder implementation
        res.json({
            success: true,
            data: [],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching qualifications',
            error: error.message,
        });
    }
};

// Add qualification (placeholder)
const addQualification = async (req, res) => {
    try {
        // Placeholder implementation
        res.json({
            success: true,
            message: 'Qualification added successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding qualification',
            error: error.message,
        });
    }
};
const getMyShifts = async (req, res) => {
    try {
        const empId = req.userId;

        const employee = await Employee.findByPk(empId, {
            include: [{
                model: Position,
                as: 'defaultPosition',
                include: [{
                    model: PositionShift,
                    as: 'shifts',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'color'],
                }],
            }],
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (!employee.defaultPosition) {
            return res.json({
                success: true,
                data: {
                    position: null,
                    shifts: [],
                },
            });
        }

        res.json({
            success: true,
            data: {
                position: {
                    pos_id: employee.defaultPosition.pos_id,
                    position_name: employee.defaultPosition.pos_name,
                },
                shifts: employee.defaultPosition.shifts || [],
            },
        });

    } catch (error) {
        console.error('Error in getMyShifts:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const getProfile = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.userId, {
            attributes: [
                'emp_id', 'first_name', 'last_name', 'email',
                'phone', 'login', 'country', 'city', 'address',
                'receive_schedule_emails', 'status', 'role',
            ],
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'],
                },
            ],
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.json({
            success: true,
            data: employee,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            login,
            country,
            city,
            address,
            receive_schedule_emails,
            locale,
            currentPassword,
            newPassword,
        } = req.body;

        const employee = await Employee.findByPk(req.userId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Handle password change if provided
        if (currentPassword && newPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect',
                });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await employee.update({ password: hashedNewPassword });

            return res.json({
                success: true,
                message: 'Password updated successfully',
            });
        }

        const updateData = {
            first_name,
            last_name,
            email,
            phone,
            login,
            country,
            city,
            address,
            receive_schedule_emails,
        };

        // Only update locale if it's provided
        if (locale) {
            updateData.locale = locale;
        }

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        await employee.update(updateData);

        // Fetch updated profile with associations
        const updatedEmployee = await Employee.findByPk(req.userId, {
            attributes: [
                'emp_id', 'first_name', 'last_name', 'email',
                'phone', 'login', 'country', 'city', 'address',
                'receive_schedule_emails', 'status', 'role',
            ],
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name'],
                },
            ],
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedEmployee,
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
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
    addQualification,
    getMyShifts,
    getProfile,
    updateProfile,
};