// backend/src/controllers/position.controller.js
const db = require('../../models');
const { Position, WorkSite, Employee, PositionShift } = db;

// Get all positions with statistics
const getAllPositions = async (req, res) => {
    try {
        const { site_id, includeStats } = req.query;
        const where = {};
        if (site_id) where.site_id = site_id;

        const positions = await Position.findAll({
            where,
            include: [
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name']
                },
                {
                    model: PositionShift,
                    as: 'shifts',
                    where: { is_active: true },
                    required: false,
                    attributes: ['id']
                },
                {
                    model: Employee,
                    as: 'defaultEmployees',
                    where: {
                        status: ['active', 'admin'],
                        default_position_id: db.Sequelize.col('Position.pos_id') // Явно указываем связь
                    },
                    required: false,
                    attributes: ['emp_id', 'first_name', 'last_name']
                }
            ],
            order: [['pos_name', 'ASC']]
        });

        // Подсчитываем статистику
        const positionsWithStats = positions.map(position => {
            const posData = position.toJSON();

            // Подсчитываем количество сотрудников с этой позицией по умолчанию
            return {
                ...posData,
                totalShifts: posData.shifts?.length || 0,
                totalEmployees: posData.defaultEmployees?.length || 0,
                shifts: undefined,
                defaultEmployees: undefined
            };
        });

        res.json(positionsWithStats);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching positions',
            error: error.message
        });
    }
};

// Create position with support for required_roles
const createPosition = async (req, res) => {
    try {
        const { pos_name, site_id, profession, num_of_emp } = req.body;

        if (!pos_name) {
            return res.status(400).json({ message: 'Position name is required' });
        }

        const position = await Position.create({
            pos_name,
            site_id,
            profession,
            num_of_emp,
            is_active: true
        });

        // Fetch created position with workSite info
        const createdPosition = await Position.findByPk(position.pos_id, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        res.status(201).json(createdPosition);
    } catch (error) {
        console.error('Error creating position:', error);
        res.status(500).json({
            message: 'Error creating position',
            error: error.message
        });
    }
};

// Update position
const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { pos_name, site_id, profession, num_of_emp } = req.body;

        const position = await Position.findByPk(id);
        if (!position) {
            return res.status(404).json({
                message: 'Position not found'
            });
        }

        await position.update({
            pos_name,
            site_id,
            profession,
            num_of_emp
        });

        // Fetch updated position with workSite info
        const updatedPosition = await Position.findByPk(id, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        res.json(updatedPosition);
    } catch (error) {
        console.error('Error updating position:', error);
        res.status(500).json({
            message: 'Error updating position',
            error: error.message
        });
    }
};

// Delete position with cascade deactivation
const deletePosition = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const position = await Position.findByPk(id, {
            include: [{
                model: Employee,
                as: 'defaultEmployees',
                where: { status: ['active', 'admin'] },
                required: false,
                attributes: ['emp_id', 'first_name', 'last_name', 'status']
            }]
        });

        if (!position) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Position not found'
            });
        }

        const activeEmployees = position.defaultEmployees || [];
        const employeeCount = activeEmployees.length;

        // Деактивируем позицию
        await position.update({ is_active: false }, { transaction });

        // Деактивируем всех работников с этой позицией по умолчанию
        if (employeeCount > 0) {
            await Employee.update(
                {
                    status: 'inactive',
                    // Добавляем метаданные для отслеживания автоматической деактивации
                    deactivated_by_position: position.pos_id,
                    deactivated_at: new Date()
                },
                {
                    where: {
                        default_position_id: id,
                        status: ['active', 'admin']
                    },
                    transaction
                }
            );
        }

        await transaction.commit();

        res.json({
            message: 'Position deactivated successfully',
            deactivatedEmployees: employeeCount
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deactivating position:', error);
        res.status(500).json({
            message: 'Error deactivating position',
            error: error.message
        });
    }
};

// Restore position with cascade restoration
const restorePosition = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const position = await Position.findByPk(id);
        if (!position) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Position not found'
            });
        }

        // Восстанавливаем позицию
        await position.update({ is_active: true }, { transaction });

        // Восстанавливаем работников, которые были автоматически деактивированы этой позицией
        const restoredEmployees = await Employee.update(
            {
                status: 'active',
                deactivated_by_position: null,
                deactivated_at: null
            },
            {
                where: {
                    default_position_id: id,
                    status: 'inactive',
                    deactivated_by_position: id
                },
                transaction,
                returning: true
            }
        );

        await transaction.commit();

        // Возвращаем с информацией о workSite
        const restoredPosition = await Position.findByPk(id, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        res.json({
            message: 'Position restored successfully',
            position: restoredPosition,
            restoredEmployees: restoredEmployees[0]
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error restoring position:', error);
        res.status(500).json({
            message: 'Error restoring position',
            error: error.message
        });
    }
};

module.exports = {
    getAllPositions,
    createPosition,
    updatePosition,
    deletePosition,
    restorePosition
};