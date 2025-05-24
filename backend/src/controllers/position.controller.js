const { Position, WorkSite, WorkDay } = require('../models/associations');

// Get all positions
exports.findAll = async (req, res) => {
    try {
        const positions = await Position.findAll({
            include: [{
                association: 'workSite',
                attributes: ['site_id', 'site_name']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(positions);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving positions',
            error: error.message
        });
    }
};

// Get position by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const position = await Position.findByPk(id, {
            include: [
                { association: 'workSite' },
                { association: 'workDays' }
            ]
        });

        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }

        res.json(position);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving position',
            error: error.message
        });
    }
};

// Create a new position
exports.create = async (req, res) => {
    try {
        // Verify that a work site exists
        const workSite = await WorkSite.findByPk(req.body.site_id);
        if (!workSite) {
            return res.status(400).json({ message: 'Work site not found' });
        }

        const position = await Position.create(req.body);

        // Fetch the created position with work site data
        const positionWithSite = await Position.findByPk(position.pos_id, {
            include: [{ association: 'workSite' }]
        });

        res.status(201).json({
            message: 'Position created successfully',
            position: positionWithSite
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating position',
            error: error.message
        });
    }
};

// Update position
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const position = await Position.findByPk(id);

        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }

        // If site_id is being updated, verify a new work site exists
        if (req.body.site_id && req.body.site_id !== position.site_id) {
            const workSite = await WorkSite.findByPk(req.body.site_id);
            if (!workSite) {
                return res.status(400).json({ message: 'Work site not found' });
            }
        }

        await position.update(req.body);

        // Fetch updated position with work site data
        const updatedPosition = await Position.findByPk(id, {
            include: [{ association: 'workSite' }]
        });

        res.json({
            message: 'Position updated successfully',
            position: updatedPosition
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating position',
            error: error.message
        });
    }
};

// Delete position
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const position = await Position.findByPk(id);

        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }

        await position.destroy();

        res.json({ message: 'Position deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting position',
            error: error.message
        });
    }
};

// Get positions by work site
exports.findByWorkSite = async (req, res) => {
    try {
        const siteId = req.params.siteId;
        const positions = await Position.findAll({
            where: { site_id: siteId },
            include: [{ association: 'workDays' }]
        });

        res.json(positions);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving positions for work site',
            error: error.message
        });
    }
};