const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

module.exports = function(db) {

const router = express.Router();
const shiftController = require('../controllers/shift.controller')(db);

// Admin routes
router.post('/', [verifyToken, isAdmin], shiftController.create);
router.put('/:id', [verifyToken, isAdmin], shiftController.update);
router.delete('/:id', [verifyToken, isAdmin], shiftController.delete);
router.put('/:id/assign', [verifyToken, isAdmin], shiftController.assignEmployee);

// Routes accessible by all authenticated users
router.get('/', verifyToken, shiftController.findAll);
router.get('/:id', verifyToken, shiftController.findOne);

    return router;
};