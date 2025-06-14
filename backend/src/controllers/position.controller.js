// backend/src/controllers/position.controller.js
const db = require('../models');
const { Position, WorkSite } = db;

// Get all positions
const getAllPositions = async (req, res) => {
    try {
        const { site_id } = req.query;
        const where = site_id ? { site_id } : {};

        const positions = await Position.findAll({
            where,
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }],
            order: [['pos_name', 'ASC']]
        });

        res.json({
            success: true,
            data: positions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching positions',
            error: error.message
        });
    }
};

// Create position
const createPosition = async (req, res) => {
    try {
        const position = await Position.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Position created successfully',
            data: position
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating position',
            error: error.message
        });
    }
};

// Update position
const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const [updated] = await Position.update(req.body, {
            where: { pos_id: id }
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        const position = await Position.findByPk(id);

        res.json({
            success: true,
            message: 'Position updated successfully',
            data: position
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating position',
            error: error.message
        });
    }
};

// Delete position
const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Position.destroy({
            where: { pos_id: id }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        res.json({
            success: true,
            message: 'Position deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting position',
            error: error.message
        });
    }
};

module.exports = {
    getAllPositions,
    createPosition,
    updatePosition,
    deletePosition
};