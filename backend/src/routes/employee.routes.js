const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Routes protected by JWT and requiring admin role
router.post('/', [verifyToken, isAdmin], employeeController.create);
router.get('/', [verifyToken, isAdmin], employeeController.findAll);
router.get('/:id', verifyToken, employeeController.findOne);
router.put('/:id', [verifyToken, isAdmin], employeeController.update);
router.delete('/:id', [verifyToken, isAdmin], employeeController.delete);

// Employee constraints
router.get('/:id/constraints', verifyToken, employeeController.getConstraints);

module.exports = router;