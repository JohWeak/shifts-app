// backend/src/controllers/worksite.controller.js
const db = require('../models'); // Импортируем db напрямую, как в shift.controller
const { WorkSite, Employee, Position } = db; // Деструктурируем нужную модель

// Get all work sites
const findAll = async (req, res) => {
    try {
        const { includeStats = false, active } = req.query;

        const whereCondition = {};
        if (active !== undefined) {
            whereCondition.is_active = active === 'true';
        }

        const workSites = await WorkSite.findAll({
            where: whereCondition,
            include: includeStats ? [{
                model: Position,
                as: 'positions',
                attributes: ['pos_id', 'pos_name', 'num_of_emp'],
                include: [{
                    model: Employee,
                    as: 'employees',
                    attributes: ['emp_id'],
                    through: { attributes: [] }
                }]
            }] : [],
            order: [['site_name', 'ASC']]
        });

        // Calculate stats if requested
        if (includeStats) {
            const sitesWithStats = workSites.map(site => {
                const siteData = site.toJSON();
                siteData.totalPositions = siteData.positions?.length || 0;
                siteData.totalEmployees = siteData.positions?.reduce((sum, pos) =>
                    sum + (pos.employees?.length || 0), 0) || 0;
                return siteData;
            });
            return res.json(sitesWithStats);
        }

        res.json(workSites);
    } catch (error) {
        console.error('Error fetching work sites:', error);
        res.status(500).json({
            message: 'Error fetching work sites',
            error: error.message
        });
    }
};
// Get work site by ID
const findOne = async (req, res) => {
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
const create = async (req, res) => {
    try {
        const { site_name, address, phone, timezone } = req.body;

        if (!site_name) {
            return res.status(400).json({ message: 'Site name is required' });
        }

        const newSite = await WorkSite.create({
            site_name,
            address,
            phone,
            timezone,
            is_active: true
        });

        res.status(201).json(newSite);
    } catch (error) {
        console.error('Error creating work site:', error);
        res.status(500).json({
            message: 'Error creating work site',
            error: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { site_name, address, phone, timezone, is_active } = req.body;

        const site = await WorkSite.findByPk(id);
        if (!site) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        await site.update({
            site_name,
            address,
            phone,
            timezone,
            is_active
        });

        res.json(site);
    } catch (error) {
        console.error('Error updating work site:', error);
        res.status(500).json({
            message: 'Error updating work site',
            error: error.message
        });
    }
};

const deleteWorkSite = async (req, res) => {
    try {
        const { id } = req.params;

        const site = await WorkSite.findByPk(id);
        if (!site) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        // Check if there are positions associated
        const positionsCount = await Position.count({ where: { site_id: id } });
        if (positionsCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete work site with existing positions. Please remove all positions first.'
            });
        }

        await site.destroy();
        res.json({ message: 'Work site deleted successfully' });
    } catch (error) {
        console.error('Error deleting work site:', error);
        res.status(500).json({
            message: 'Error deleting work site',
            error: error.message
        });
    }
};

// Экспортируем объект со всеми методами, как в shift.controller
module.exports = {
    findAll,
    findOne,
    create,
    update,
    delete: deleteWorkSite // Экспортируем как "delete", но ссылаемся на безопасное имя функции
};