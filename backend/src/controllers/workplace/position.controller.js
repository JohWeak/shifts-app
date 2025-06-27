// backend/src/controllers/position.controller.js
const db = require('../../models');
const { Position, WorkSite, Employee, PositionShift } = db;

// Get all positions with statistics
const getAllPositions = async (req, res) => {
    try {
        const { site_id, includeStats } = req.query;
        const where = { is_active: true };
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
                    as: 'defaultEmployees', // Используем новую связь
                    where: { status: ['active', 'admin'] }, // Учитываем и админов
                    required: false,
                    attributes: ['emp_id']
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
                shifts: undefined, // Убираем массив смен
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

// Delete position
const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const position = await Position.findByPk(id, {
            include: [{
                model: Employee,
                as: 'employees',
                attributes: ['emp_id']
            }]
        });

        if (!position) {
            return res.status(404).json({
                message: 'Position not found'
            });
        }

        if (position.employees && position.employees.length > 0) {
            return res.status(400).json({
                message: 'Cannot deactivate position with assigned employees'
            });
        }

        // Soft delete - просто деактивируем
        await position.update({ is_active: false });

        res.json({
            message: 'Position deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating position:', error);
        res.status(500).json({
            message: 'Error deactivating position',
            error: error.message
        });
    }
};

// Добавить новый метод restore:
const restorePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const position = await Position.findByPk(id);
        if (!position) {
            return res.status(404).json({
                message: 'Position not found'
            });
        }

        await position.update({ is_active: true });

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
            position: restoredPosition
        });
    } catch (error) {
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