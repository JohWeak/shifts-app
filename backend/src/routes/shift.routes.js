// backend/src/routes/shift.routes.js
const express = require('express');
const shiftController = require('../controllers/shift.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Admin routes
router.post('/', [verifyToken, isAdmin], shiftController.create);
router.put('/:id', [verifyToken, isAdmin], shiftController.update);
router.delete('/:id', [verifyToken, isAdmin], shiftController.delete);
router.put('/:id/assign', [verifyToken, isAdmin], shiftController.assignEmployee);

// Routes accessible by all authenticated users
router.get('/', verifyToken, shiftController.findAll);
router.get('/:id', verifyToken, shiftController.findOne);

module.exports = router;