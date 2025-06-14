const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

module.exports = function(db) {
    const router = express.Router();
    const positionController = require('../controllers/position.controller')(db);

// All position routes require admin privileges
router.use([verifyToken, isAdmin]);

router.post('/', positionController.create);
router.get('/', positionController.findAll);
router.get('/:id', positionController.findOne);
router.put('/:id', positionController.update);
router.delete('/:id', positionController.delete);

// Get positions by work site
router.get('/worksite/:siteId', positionController.findByWorkSite);

    return router;
};