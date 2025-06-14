// backend/src/routes/worksite.routes.js
const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');


module.exports = function(db) {

const router = express.Router();
const worksiteController = require('../controllers/worksite.controller')(db);

// All worksite routes require admin privileges
router.use([verifyToken, isAdmin]);

router.get('/', worksiteController.findAll);
router.get('/:id', worksiteController.findOne);
router.post('/', worksiteController.create);
router.put('/:id', worksiteController.update);
router.delete('/:id', worksiteController.delete);

    return router;
};