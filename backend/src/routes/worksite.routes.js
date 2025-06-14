// backend/src/routes/worksite.routes.js
const express = require('express');
const worksiteController = require('../controllers/worksite.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, worksiteController.getAllWorkSites);
router.post('/', [verifyToken, isAdmin], worksiteController.createWorkSite);
router.put('/:id', [verifyToken, isAdmin], worksiteController.updateWorkSite);
router.delete('/:id', [verifyToken, isAdmin], worksiteController.deleteWorkSite);

module.exports = router;