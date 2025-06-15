// backend/src/routes/worksite.routes.js
const express = require('express');
const worksiteController = require('../controllers/worksite.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, worksiteController.findAll);
router.post('/', ...[verifyToken, isAdmin], worksiteController.create);
router.put('/:id', ...[verifyToken, isAdmin], worksiteController.update);
router.delete('/:id', ...[verifyToken, isAdmin], worksiteController.delete);

module.exports = router;