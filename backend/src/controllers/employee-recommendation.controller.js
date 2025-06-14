// backend/src/controllers/employee-recommendation.controller.js
const EmployeeRecommendationService = require('../services/employee-recommendation.service');

class EmployeeRecommendationController {
    static async getRecommendations(req, res) {
        try {
            const { position_id, shift_id, date, schedule_id } = req.query;

            if (!position_id || !shift_id || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: position_id, shift_id, date'
                });
            }

            const recommendations = await EmployeeRecommendationService.getRecommendedEmployees(
                parseInt(position_id),
                parseInt(shift_id),
                date,
                [],
                schedule_id ? parseInt(schedule_id) : null
            );

            res.json({
                success: true,
                data: recommendations,
                meta: {
                    position_id: parseInt(position_id),
                    shift_id: parseInt(shift_id),
                    date: date,
                    total_employees: Object.values(recommendations).reduce((sum, arr) => sum + arr.length, 0)
                }
            });

        } catch (error) {
            console.error('[EmployeeRecommendationController] Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = EmployeeRecommendationController;