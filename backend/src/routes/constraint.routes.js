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

// Permanent constraint requests - Employee
router.get('/permanent-requests/my',
    verifyToken,
    constraintController.getMyPermanentRequests
);

router.post('/permanent-request',
    verifyToken,
    constraintController.submitPermanentRequest
);

router.delete('/permanent-request/:id',
    verifyToken,
    constraintController.deletePermanentRequest
);

router.get('/permanent-constraints/my',
    verifyToken,
    constraintController.getMyPermanentConstraints
);

// Admin routes
router.get('/permanent-requests',
    verifyToken,
    isAdmin,
    constraintController.getAllPermanentRequests
);

router.get('/permanent-requests/count',
    verifyToken,
    isAdmin,
    constraintController.getUnprocessedRequestsCount
);

router.put('/permanent-request/:id/review',
    verifyToken,
    isAdmin,
    constraintController.reviewPermanentRequest
);

module.exports = router;