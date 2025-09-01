// backend/src/routes/position.routes.js
const express = require('express');
const positionController = require('../controllers/workplace/position.controller');
const positionShiftController = require('../controllers/workplace/position-shift.controller');
const shiftRequirementController = require('../controllers/workplace/shift-requirement.controller');
const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');

const positionRouter = express.Router();
const shiftRouter = express.Router();
const requirementRouter = express.Router();

positionRouter.get('/', verifyToken, positionController.getAllPositions);
positionRouter.post('/', verifyToken, isAdmin, positionController.createPosition);

positionRouter.get('/:positionId/requirements-matrix', verifyToken, shiftRequirementController.getPositionRequirementsMatrix);

positionRouter.get('/:positionId', verifyToken, positionController.getPositionDetails);
positionRouter.put('/:positionId', verifyToken, isAdmin, positionController.updatePosition);
positionRouter.delete('/:positionId', verifyToken, isAdmin, positionController.deletePosition);
positionRouter.post('/:positionId/restore', verifyToken, isAdmin, positionController.restorePosition);

positionRouter.get('/:positionId/shifts', verifyToken, positionShiftController.getPositionShifts);
positionRouter.post('/:positionId/shifts', verifyToken, isAdmin, positionShiftController.createPositionShift);

// Flexible shifts routes
positionRouter.get('/:positionId/flexible-shifts', verifyToken, positionShiftController.getPositionFlexibleShifts);
positionRouter.post('/:positionId/flexible-shifts', verifyToken, isAdmin, positionShiftController.createFlexibleShift);
positionRouter.put('/:positionId/flexible-shifts/:shiftId', verifyToken, isAdmin, positionShiftController.updateFlexibleShift);
positionRouter.delete('/:positionId/flexible-shifts/:shiftId', verifyToken, isAdmin, positionShiftController.deleteFlexibleShift);

// Flexible assignment routes
positionRouter.post('/:positionId/flexible-shifts/:shiftId/assignments', verifyToken, isAdmin, positionShiftController.createFlexibleAssignment);


shiftRouter.put('/:shiftId', verifyToken, isAdmin, positionShiftController.updatePositionShift);
shiftRouter.delete('/:shiftId', verifyToken, isAdmin, positionShiftController.deletePositionShift);


shiftRouter.get('/:shiftId/requirements', verifyToken, shiftRequirementController.getShiftRequirements);
shiftRouter.post('/:shiftId/requirements', verifyToken, isAdmin, shiftRequirementController.createShiftRequirement);


requirementRouter.put('/:requirementId', verifyToken, isAdmin, shiftRequirementController.updateShiftRequirement);
requirementRouter.delete('/:requirementId', verifyToken, isAdmin, shiftRequirementController.deleteShiftRequirement);


module.exports = {
    positionRouter,
    shiftRouter,
    requirementRouter
};