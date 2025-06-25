// backend/src/routes/position.routes.js
const express = require('express');
const positionController = require('../controllers/position.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();
// Position shifts routes
router.get('/:id/shifts', verifyToken, positionController.getPositionShifts);
router.post('/:id/shifts', ...[verifyToken, isAdmin], positionController.createPositionShift);
router.put('/shifts/:shiftId', ...[verifyToken, isAdmin], positionController.updatePositionShift);
router.delete('/shifts/:shiftId', ...[verifyToken, isAdmin], positionController.deletePositionShift);

// Shift requirements routes
router.get('/shifts/:shiftId/requirements', verifyToken, positionController.getShiftRequirements);
router.post('/shifts/:shiftId/requirements', ...[verifyToken, isAdmin], positionController.createShiftRequirement);
router.put('/requirements/:reqId', ...[verifyToken, isAdmin], positionController.updateShiftRequirement);
router.delete('/requirements/:reqId', ...[verifyToken, isAdmin], positionController.deleteShiftRequirement);

router.get('/', verifyToken, positionController.getAllPositions);
router.post('/', ...[verifyToken, isAdmin], positionController.createPosition);
router.put('/:id', ...[verifyToken, isAdmin], positionController.updatePosition);
router.delete('/:id', ...[verifyToken, isAdmin], positionController.deletePosition);

module.exports = router;