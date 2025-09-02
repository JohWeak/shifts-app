// backend/src/routes/worksite.routes.js
const express = require('express');
const scheduleController = require('../controllers/scheduling/schedule/schedule.controller');
const worksiteController = require('../controllers/workplace/worksite.controller');
const {verifyToken, isAdmin, getAccessibleSites} = require('../middlewares/auth.middleware');
const {getPositionsByWorksite} = require("../controllers/workplace/position.controller");

const router = express.Router();

router.get('/', verifyToken, getAccessibleSites, worksiteController.findAll);
router.post('/', verifyToken, isAdmin, getAccessibleSites, worksiteController.create);

router.get('/:worksiteId/statistics', verifyToken, isAdmin, getAccessibleSites, scheduleController.getDashboardOverview);


router.post('/:worksiteId/restore', verifyToken, isAdmin, getAccessibleSites, worksiteController.restore);
router.get('/:worksiteId/positions', verifyToken, getAccessibleSites, getPositionsByWorksite);
router.get('/:worksiteId', verifyToken, isAdmin, getAccessibleSites, worksiteController.findOne);
router.put('/:worksiteId', verifyToken, isAdmin, getAccessibleSites, worksiteController.update);
router.delete('/:worksiteId', verifyToken, isAdmin, getAccessibleSites, worksiteController.delete);

module.exports = router;