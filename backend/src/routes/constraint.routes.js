// backend/src/routes/constraint.routes.js
const express = require('express');
const router = express.Router();
const constraintController = require('../controllers/scheduling/constraint.controller');
const { verifyToken,  isAdmin } = require('../middlewares/auth.middleware');

// Employee routes
router.get('/weekly-grid',
    verifyToken,
    constraintController.getWeeklyConstraintsGrid
);

router.post('/submit-weekly',
    verifyToken,
    constraintController.submitWeeklyConstraints
);

router.get('/permanent-requests/:empId',
    verifyToken,
    constraintController.getPermanentConstraintRequests
);

router.post('/permanent-request',
    verifyToken,
    constraintController.submitPermanentConstraintRequest
);

// Admin routes
router.get('/pending-requests',
    ...[verifyToken,
    isAdmin],
    constraintController.getPendingRequests
);

router.put('/review-request/:id',
    ...[verifyToken,
        isAdmin],
    constraintController.reviewPermanentConstraintRequest
);

module.exports = router;