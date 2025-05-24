const express = require('express');
const positionController = require('../controllers/position.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// All position routes require admin privileges
router.use([verifyToken, isAdmin]);

router.post('/', positionController.create);
router.get('/', positionController.findAll);
router.get('/:id', positionController.findOne);
router.put('/:id', positionController.update);
router.delete('/:id', positionController.delete);

// Get positions by work site
router.get('/worksite/:siteId', positionController.findByWorkSite);

module.exports = router;