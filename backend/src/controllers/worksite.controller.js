const { WorkSite, Position } = require('../models/associations');

// Get all work sites
exports.findAll = async (req, res) => {
    try {
        const workSites = await WorkSite.findAll({
            include: [{
                association: 'positions',
                attributes: ['pos_id', 'pos_name', 'profession', 'num_of_emp']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(workSites);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving work sites',
            error: error.message
        });
    }
};

// Get work site by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const workSite = await WorkSite.findByPk(id, {
            include: [
                { association: 'positions' },
                { association: 'schedules' }
            ]
        });

        if (!workSite) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        res.json(workSite);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving work site',
            error: error.message
        });
    }
};

// Create a new work site
exports.create = async (req, res) => {
    try {
        const workSite = await WorkSite.create(req.body);
        res.status(201).json({
            message: 'Work site created successfully',
            workSite
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating work site',
            error: error.message
        });
    }
};

// Update work site
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const workSite = await WorkSite.findByPk(id);

        if (!workSite) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        await workSite.update(req.body);

        res.json({
            message: 'Work site updated successfully',
            workSite
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating work site',
            error: error.message
        });
    }
};

// Delete work site
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const workSite = await WorkSite.findByPk(id);

        if (!workSite) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        await workSite.destroy();

        res.json({ message: 'Work site deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting work site',
            error: error.message
        });
    }
};