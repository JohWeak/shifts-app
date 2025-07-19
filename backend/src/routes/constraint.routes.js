// backend/src/routes/constraint.routes.js
const express = require('express');
const router = express.Router();
const constraintController = require('../controllers/scheduling/constraint.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Employee routes
router.get('/weekly-grid',
    authenticateToken,
    constraintController.getWeeklyConstraintsGrid
);

router.post('/submit-weekly',
    authenticateToken,
    constraintController.submitWeeklyConstraints
);

router.get('/permanent-requests/:empId',
    authenticateToken,
    constraintController.getPermanentConstraintRequests
);

router.post('/permanent-request',
    authenticateToken,
    constraintController.submitPermanentConstraintRequest
);

// Admin routes
router.get('/pending-requests',
    authenticateToken,
    authorizeRoles(['admin']),
    constraintController.getPendingRequests
);

router.put('/review-request/:id',
    authenticateToken,
    authorizeRoles(['admin']),
    constraintController.reviewPermanentConstraintRequest
);

module.exports = router;