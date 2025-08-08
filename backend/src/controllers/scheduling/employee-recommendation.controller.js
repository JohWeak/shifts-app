// backend/src/controllers/employee-recommendations.controller.js
const EmployeeRecommendationService = require('../../services/employee-recommendation.service');
const db = require('../../models');
const recommendationService = new EmployeeRecommendationService(db);
class EmployeeRecommendationController {
    static async getRecommendations(req, res) {
        try {
            const { position_id, shift_id, date, schedule_id } = req.query;

            // Для POST запросов virtualChanges в body, для GET - в query
            let virtualChanges = [];
            if (req.method === 'POST') {
                virtualChanges = req.body?.virtualChanges || [];
            } else {
                virtualChanges = req.query.virtualChanges || [];
            }

            console.log('[EmployeeRecommendationController] Request:', {
                method: req.method,
                position_id,
                shift_id,
                date,
                schedule_id,
                virtualChanges
            });

            let parsedVirtualChanges = [];
            if (typeof virtualChanges === 'string') {
                try {
                    parsedVirtualChanges = JSON.parse(virtualChanges);
                } catch (e) {
                    console.error('Failed to parse virtualChanges:', e);
                }
            } else {
                parsedVirtualChanges = virtualChanges;
            }

            const recommendations = await recommendationService.getRecommendedEmployees(
                parseInt(position_id),
                parseInt(shift_id),
                date,
                [], // excludeEmployeeIds
                schedule_id ? parseInt(schedule_id) : null,
                parsedVirtualChanges
            );

            res.json(recommendations);
        } catch (error) {
            console.error('[EmployeeRecommendationController] Error:', error);
            res.status(500).json({
                error: 'Failed to get recommendations',
                message: error.message
            });
        }
    }
}

module.exports = EmployeeRecommendationController;