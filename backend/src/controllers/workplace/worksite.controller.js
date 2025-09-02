// backend/src/controllers/worksite.controller.js
const db = require('../../models'); // Import db directly, as in shift.controller
const {WorkSite, Employee, Position} = db; // Destructure the needed model

// Get all work sites
const getWorkSites = async (req, res) => {
    try {
        const {includeStats} = req.query;

        const whereClause = {};
        // Filter by accessible Work Sites for limited admins
        if (req.accessibleSites && req.accessibleSites !== 'all' && req.accessibleSites.length > 0) {
            whereClause.site_id = req.accessibleSites;
        }

        const workSites = await WorkSite.findAll({
            where: whereClause,
            include: [
                {
                    model: Position,
                    as: 'positions',
                    where: {is_active: true},
                    required: false,
                    attributes: ['pos_id'],
                    include: includeStats === 'true' ? [{
                        model: Employee,
                        as: 'employees',
                        where: {status: 'active'},
                        required: false,
                        attributes: ['emp_id'],
                        through: {attributes: []}
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

            // Position counting
            const positionCount = siteData.positions?.length || 0;

            // Counting employees (from all positions + directly assigned to site)
            const employeeIds = new Set();

            // Employees by positions
            siteData.positions?.forEach(pos => {
                pos.employees?.forEach(emp => employeeIds.add(emp.emp_id));
            });

            // Employees directly assigned to site
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
        const {worksiteId: id} = req.params.id;
        
        // Check Work Site access for limited admins
        if (req.accessibleSites && req.accessibleSites !== 'all' && req.accessibleSites.length > 0) {
            if (!req.accessibleSites.includes(parseInt(id))) {
                return res.status(403).json({
                    message: 'Access denied to this work site'
                });
            }
        }

        const workSite = await WorkSite.findByPk(id, {
            include: [
                {association: 'positions'},
                {association: 'schedules'}
            ]
        });

        if (!workSite) {
            return res.status(404).json({message: 'Work site not found'});
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
        const {site_name, address, phone, timezone} = req.body.site || req.body;

        if (!site_name) {
            return res.status(400).json({message: 'Site name is required'});
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
        const {worksiteId: id} = req.params;
        const {site_name, address, phone, timezone, is_active} = req.body.site || req.body;

        // Check Work Site access for limited admins
        if (req.accessibleSites && req.accessibleSites !== 'all' && req.accessibleSites.length > 0) {
            if (!req.accessibleSites.includes(parseInt(id))) {
                return res.status(403).json({
                    message: 'Access denied to this work site'
                });
            }
        }

        const site = await WorkSite.findByPk(id);
        if (!site) {
            return res.status(404).json({message: 'Work site not found'});
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

// Delete work site with cascade deactivation
const deleteWorkSite = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const {worksiteId: id} = req.params;

        // Check Work Site access for limited admins
        if (req.accessibleSites && req.accessibleSites !== 'all' && req.accessibleSites.length > 0) {
            if (!req.accessibleSites.includes(parseInt(id))) {
                await transaction.rollback();
                return res.status(403).json({
                    message: 'Access denied to this work site'
                });
            }
        }

        const site = await WorkSite.findByPk(id, {
            include: [
                {
                    model: Position,
                    as: 'positions',
                    where: {is_active: true},
                    required: false,
                    attributes: ['pos_id', 'pos_name']
                },
                {
                    model: Employee,
                    as: 'employees',
                    where: {
                        status: 'active',
                        [db.Sequelize.Op.or]: [
                            {work_site_id: id},
                            {
                                default_position_id: {
                                    [db.Sequelize.Op.in]: db.sequelize.literal(
                                        `(SELECT pos_id FROM positions WHERE site_id = ${id} AND is_active = true)`
                                    )
                                }
                            }
                        ]
                    },
                    required: false,
                    attributes: ['emp_id', 'first_name', 'last_name', 'work_site_id', 'default_position_id']
                }
            ]
        });

        if (!site) {
            await transaction.rollback();
            return res.status(404).json({message: 'Work site not found'});
        }

        const activePositions = site.positions || [];
        const affectedEmployees = site.employees || [];

        // Count statistics
        const stats = {
            positionCount: activePositions.length,
            directEmployeeCount: affectedEmployees.filter(emp => emp.work_site_id === parseInt(id)).length,
            positionEmployeeCount: affectedEmployees.filter(emp => emp.work_site_id !== parseInt(id)).length,
            totalEmployeeCount: affectedEmployees.length
        };

        // 1. Deactivate the work site itself
        await site.update({is_active: false}, {transaction});

        // 2. Deactivate all positions of this worksite
        if (stats.positionCount > 0) {
            await Position.update(
                {
                    is_active: false,
                    deactivated_by_worksite: id,
                    deactivated_at: new Date()
                },
                {
                    where: {
                        site_id: id,
                        is_active: true
                    },
                    transaction
                }
            );
        }

        // 3. Deactivate all employees
        if (stats.totalEmployeeCount > 0) {
            // Employees directly tied to the site
            await Employee.update(
                {
                    status: 'inactive',
                    deactivated_by_worksite: id,
                    deactivated_at: new Date()
                },
                {
                    where: {
                        work_site_id: id,
                        status: 'active'
                    },
                    transaction
                }
            );

            // Employees by positions
            const positionIds = activePositions.map(p => p.pos_id);
            if (positionIds.length > 0) {
                await Employee.update(
                    {
                        status: 'inactive',
                        deactivated_by_position: db.sequelize.literal('default_position_id'),
                        deactivated_at: new Date()
                    },
                    {
                        where: {
                            default_position_id: positionIds,
                            status: 'active'
                        },
                        transaction
                    }
                );
            }
        }

        await transaction.commit();

        res.json({
            message: 'Work site deactivated successfully',
            site_id: id,
            deactivatedPositions: stats.positionCount,
            deactivatedEmployees: stats.totalEmployeeCount,
            details: {
                directEmployees: stats.directEmployeeCount,
                positionEmployees: stats.positionEmployeeCount
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deactivating work site:', error);
        res.status(500).json({
            message: 'Error deactivating work site',
            error: error.message
        });
    }
};

// Restore work site with cascade restoration
const restoreWorkSite = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const {worksiteId: id} = req.params;

        // Check Work Site access for limited admins
        if (req.accessibleSites && req.accessibleSites !== 'all' && req.accessibleSites.length > 0) {
            if (!req.accessibleSites.includes(parseInt(id))) {
                await transaction.rollback();
                return res.status(403).json({
                    message: 'Access denied to this work site'
                });
            }
        }

        const site = await WorkSite.findByPk(id);
        if (!site) {
            await transaction.rollback();
            return res.status(404).json({message: 'Work site not found'});
        }

        // 1. Restore the work site
        await site.update({is_active: true}, {transaction});

        // 2. Restore positions deactivated by this worksite
        const restoredPositions = await Position.update(
            {
                is_active: true,
                deactivated_by_worksite: null,
                deactivated_at: null
            },
            {
                where: {
                    site_id: id,
                    is_active: false,
                    deactivated_by_worksite: id
                },
                transaction,
                returning: true
            }
        );

        // 3. Restore employees deactivated directly by the site
        const restoredDirectEmployees = await Employee.update(
            {
                status: 'active',
                deactivated_by_worksite: null,
                deactivated_at: null
            },
            {
                where: {
                    work_site_id: id,
                    status: 'inactive',
                    deactivated_by_worksite: id
                },
                transaction,
                returning: true
            }
        );

        // 4. Restore employees deactivated via positions
        // Get IDs of restored positions
        const restoredPositionIds = await Position.findAll({
            where: {
                site_id: id,
                is_active: true
            },
            attributes: ['pos_id'],
            transaction
        });

        let restoredPositionEmployees = [0];
        if (restoredPositionIds.length > 0) {
            const positionIds = restoredPositionIds.map(p => p.pos_id);
            restoredPositionEmployees = await Employee.update(
                {
                    status: 'active',
                    deactivated_by_position: null,
                    deactivated_at: null
                },
                {
                    where: {
                        default_position_id: positionIds,
                        status: 'inactive',
                        deactivated_by_position: positionIds
                    },
                    transaction,
                    returning: true
                }
            );
        }

        await transaction.commit();

        res.json({
            message: 'Work site restored successfully',
            site,
            restoredPositions: restoredPositions[0],
            restoredEmployees: restoredDirectEmployees[0] + restoredPositionEmployees[0],
            details: {
                directEmployees: restoredDirectEmployees[0],
                positionEmployees: restoredPositionEmployees[0]
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error restoring work site:', error);
        res.status(500).json({
            message: 'Error restoring work site',
            error: error.message
        });
    }
};

module.exports = {
    findAll: getWorkSites,
    findOne,
    create,
    update,
    delete: deleteWorkSite,
    restore: restoreWorkSite
};