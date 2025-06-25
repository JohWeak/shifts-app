// backend/src/routes/position.routes.js
const express = require('express');
const positionController = require('../controllers/workplace/position.controller');
const positionShiftController = require('../controllers/workplace/position-shift.controller');
const shiftRequirementController = require('../controllers/workplace/shift-requirement.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Existing position routes
router.get('/', verifyToken, positionController.getAllPositions);
router.post('/', ...[verifyToken, isAdmin], positionController.createPosition);
router.put('/:id', ...[verifyToken, isAdmin], positionController.updatePosition);
router.delete('/:id', ...[verifyToken, isAdmin], positionController.deletePosition);
router.post('/:id/restore', ...[verifyToken, isAdmin], positionController.restorePosition);

// Position shifts routes
router.get('/:id/shifts', verifyToken, positionShiftController.getPositionShifts);
router.post('/:id/shifts', ...[verifyToken, isAdmin], positionShiftController.createPositionShift);
router.put('/shifts/:shiftId', ...[verifyToken, isAdmin], positionShiftController.updatePositionShift);
router.delete('/shifts/:shiftId', ...[verifyToken, isAdmin], positionShiftController.deletePositionShift);

// Shift requirements routes
router.get('/shifts/:shiftId/requirements', verifyToken, shiftRequirementController.getShiftRequirements);
router.post('/shifts/:shiftId/requirements', ...[verifyToken, isAdmin], shiftRequirementController.createShiftRequirement);
router.put('/requirements/:reqId', ...[verifyToken, isAdmin], shiftRequirementController.updateShiftRequirement);
router.delete('/requirements/:reqId', ...[verifyToken, isAdmin], shiftRequirementController.deleteShiftRequirement);

// Special route for requirements matrix
router.get('/:positionId/requirements-matrix', verifyToken, shiftRequirementController.getPositionRequirementsMatrix);

module.exports = router;