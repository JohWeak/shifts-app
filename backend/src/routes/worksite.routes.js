// backend/src/routes/worksite.routes.js
const express = require('express');
const worksiteController = require('../controllers/worksite.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// All worksite routes require admin privileges
router.use([verifyToken, isAdmin]);

router.get('/', worksiteController.findAll);
router.get('/:id', worksiteController.findOne);
router.post('/', worksiteController.create);
router.put('/:id', worksiteController.update);
router.delete('/:id', worksiteController.delete);

module.exports = router;