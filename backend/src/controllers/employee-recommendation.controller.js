// backend/src/controllers/employee-recommendation.controller.js
const EmployeeRecommendationService = require('../services/employee-recommendation.service');

class EmployeeRecommendationController {

    static async getRecommendations(req, res) {
        try {
            const { position_id, shift_id, date } = req.query;
            const { exclude_employees = [] } = req.body || {};

            // Валидация параметров
            if (!position_id || !shift_id || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: position_id, shift_id, date'
                });
            }

            console.log(`[EmployeeRecommendation] Getting recommendations for position ${position_id}, shift ${shift_id}, date ${date}`);

            // Получить рекомендации
            const recommendations = await EmployeeRecommendationService.getRecommendedEmployees(
                parseInt(position_id),
                parseInt(shift_id),
                date,
                exclude_employees
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