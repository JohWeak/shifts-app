// backend/src/routes/position.routes.js
const express = require('express');
const positionController = require('../controllers/position.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, positionController.getAllPositions);
router.post('/', ...[verifyToken, isAdmin], positionController.createPosition);
router.put('/:id', ...[verifyToken, isAdmin], positionController.updatePosition);
router.delete('/:id', ...[verifyToken, isAdmin], positionController.deletePosition);

module.exports = router;