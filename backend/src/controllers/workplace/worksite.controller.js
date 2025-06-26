// backend/src/controllers/worksite.controller.js
const db = require('../../models'); // Импортируем db напрямую, как в shift.controller
const { WorkSite, Employee, Position } = db; // Деструктурируем нужную модель

// Get all work sites
const getWorkSites = async (req, res) => {
    try {
        const { includeStats } = req.query;

        const workSites = await WorkSite.findAll({
            where: { is_active: true },
            include: [
                {
                    model: Position,
                    as: 'positions',
                    where: { is_active: true },
                    required: false,
                    attributes: ['pos_id'],
                    include: includeStats === 'true' ? [{
                        model: Employee,
                        as: 'employees',
                        where: { status: 'active' },
                        required: false,
                        attributes: ['emp_id'],
                        through: { attributes: [] }
                    }] : []
                },
                {
                    model: Employee,
                    as: 'employees',
                    where: {
                        status: 'active',
                        work_site_id: db.Sequelize.col('WorkSite.site_id')
                    },
                    required: false,
                    attributes: ['emp_id']
                }
            ],
            order: [['site_name', 'ASC']]
        });

        const sitesWithStats = workSites.map(site => {
            const siteData = site.toJSON();

            // Подсчет позиций
            const positionCount = siteData.positions?.length || 0;

            // Подсчет сотрудников (из всех позиций + напрямую назначенные на site)
            const employeeIds = new Set();

            // Сотрудники через позиции
            siteData.positions?.forEach(pos => {
                pos.employees?.forEach(emp => employeeIds.add(emp.emp_id));
            });

            // Сотрудники назначенные напрямую на site
            siteData.employees?.forEach(emp => employeeIds.add(emp.emp_id));

            return {
                ...siteData,
                positionCount,
                employeeCount: employeeIds.size,
                positions: undefined,
                employees: undefined
            };
        });

        res.json(sitesWithStats);
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

        // Soft delete - просто деактивируем
        await site.update({ is_active: false });

        res.json({
            message: 'Work site deactivated successfully',
            site_id: id
        });
    } catch (error) {
        console.error('Error deactivating work site:', error);
        res.status(500).json({
            message: 'Error deactivating work site',
            error: error.message
        });
    }
};

const restoreWorkSite = async (req, res) => {
    try {
        const { id } = req.params;

        const site = await WorkSite.findByPk(id);
        if (!site) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        await site.update({ is_active: true });

        res.json({
            message: 'Work site restored successfully',
            site
        });
    } catch (error) {
        console.error('Error restoring work site:', error);
        res.status(500).json({
            message: 'Error restoring work site',
            error: error.message
        });
    }
};

// Экспортируем объект со всеми методами, как в shift.controller
module.exports = {
    findAll: getWorkSites,
    findOne,
    create,
    update,
    delete: deleteWorkSite,
    restore: restoreWorkSite
};