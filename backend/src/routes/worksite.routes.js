// backend/src/routes/worksite.routes.js
const express = require('express');
const scheduleController = require('../controllers/scheduling/schedule/schedule.controller');
const worksiteController = require('../controllers/workplace/worksite.controller');
const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');
const {getPositionsByWorksite} = require("../controllers/workplace/position.controller");

const router = express.Router();

router.get('/', verifyToken, worksiteController.findAll);
router.post('/', verifyToken, isAdmin, worksiteController.create);

router.get('/:worksiteId/statistics', verifyToken, isAdmin, scheduleController.getDashboardOverview);


router.post('/:worksiteId/restore', verifyToken, isAdmin, worksiteController.restore);
router.get('/:worksiteId/positions', verifyToken, getPositionsByWorksite);
router.get('/:worksiteId', verifyToken, isAdmin, worksiteController.findOne);
router.put('/:worksiteId', verifyToken, isAdmin, worksiteController.update);
router.delete('/:worksiteId', verifyToken, isAdmin, worksiteController.delete);

module.exports = router;