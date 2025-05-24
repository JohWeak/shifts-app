const express = require('express');
const worksiteController = require('../controllers/worksite.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// All work site routes require admin privileges
router.use([verifyToken, isAdmin]);

router.post('/', worksiteController.create);
router.get('/', worksiteController.findAll);
router.get('/:id', worksiteController.findOne);
router.put('/:id', worksiteController.update);
router.delete('/:id', worksiteController.delete);

module.exports = router;