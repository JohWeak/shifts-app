const jwt = require('jsonwebtoken');
const db = require('../models');
const { Employee } = db;

const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({message: 'No token provided!'});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({message: 'Unauthorized!'});
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isAdmin = (req, res, next) => {
    console.log('Checking admin role. User role:', req.userRole);
    if (req.userRole !== 'admin') {
        return res.status(403).json({message: 'Require Admin Role!'});
    }
    next();
};

const isSuperAdmin = async (req, res, next) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({message: 'Require Admin Role!'});
        }

        // Check if user is super admin (id=1 or is_super_admin=true)
        const user = await Employee.findByPk(req.userId, {
            attributes: ['emp_id', 'is_super_admin']
        });

        if (!user || (user.emp_id !== 1 && !user.is_super_admin)) {
            return res.status(403).json({message: 'Require Super Admin privileges!'});
        }

        req.isSuperAdmin = true;
        next();
    } catch (error) {
        console.error('Error checking super admin status:', error);
        return res.status(500).json({message: 'Error verifying permissions'});
    }
};

const hasAccessToWorkSite = (siteId) => {
    return async (req, res, next) => {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({message: 'Require Admin Role!'});
            }

            // Get admin details
            const admin = await Employee.findByPk(req.userId, {
                attributes: ['emp_id', 'is_super_admin', 'admin_work_sites_scope']
            });

            if (!admin) {
                return res.status(404).json({message: 'Admin not found'});
            }

            // Super admin (id=1 or is_super_admin=true) has access to all sites
            if (admin.emp_id === 1 || admin.is_super_admin) {
                req.isSuperAdmin = true;
                return next();
            }

            // Check if admin has access to the specific work site
            const allowedSites = admin.admin_work_sites_scope || [];
            if (!allowedSites.includes(parseInt(siteId))) {
                return res.status(403).json({
                    message: 'Access denied to this work site',
                    allowedSites: allowedSites
                });
            }

            req.accessibleSites = allowedSites;
            next();
        } catch (error) {
            console.error('Error checking work site access:', error);
            return res.status(500).json({message: 'Error verifying work site access'});
        }
    };
};

// Middleware to get accessible work sites for the current admin
const getAccessibleSites = async (req, res, next) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({message: 'Require Admin Role!'});
        }

        const admin = await Employee.findByPk(req.userId, {
            attributes: ['emp_id', 'is_super_admin', 'admin_work_sites_scope']
        });

        if (!admin) {
            return res.status(404).json({message: 'Admin not found'});
        }

        // Super admin has access to all sites
        if (admin.emp_id === 1 || admin.is_super_admin) {
            req.isSuperAdmin = true;
            req.accessibleSites = 'all';
        } else {
            req.accessibleSites = admin.admin_work_sites_scope || [];
        }

        next();
    } catch (error) {
        console.error('Error getting accessible sites:', error);
        return res.status(500).json({message: 'Error getting accessible sites'});
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isSuperAdmin,
    hasAccessToWorkSite,
    getAccessibleSites
};