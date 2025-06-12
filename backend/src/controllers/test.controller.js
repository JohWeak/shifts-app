// backend/src/controllers/test.controller.js
const CPSATBridge = require('../services/cp-sat-bridge.service');
const EmployeeRecommendationService = require('../services/employee-recommendation.service');
const { Employee, Position, EmployeeConstraint } = require('../models');

class TestController {

    static async testCPSAT(req, res) {
        try {
            const siteId = 1;
            const weekStart = '2025-06-15'; // Следующий вск

            console.log(`[Test] Testing CP-SAT with site ${siteId}, week ${weekStart}`);

            // Проверим данные сотрудников
            const employees = await Employee.findAll({
                where: { status: 'active', role: 'employee' },
                include: [{
                    model: Position,
                    as: 'defaultPosition',
                    required: false
                }]
            });

            console.log('[Test] Employees with default positions:',
                employees.map(e => ({
                    id: e.emp_id,
                    name: `${e.first_name} ${e.last_name}`,
                    default_position: e.defaultPosition?.pos_name || 'None'
                }))
            );

            // Запустить CP-SAT
            const result = await CPSATBridge.generateOptimalSchedule(siteId, weekStart);

            res.json({
                success: true,
                result: result,
                test_data: {
                    employees_count: employees.length,
                    employees_with_default_position: employees.filter(e => e.default_position_id).length
                }
            });

        } catch (error) {
            console.error('[Test] Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    static async testRecommendations(req, res) {
        try {
            const { position_id = 1, shift_id = 31, date = '2025-06-16' } = req.query;

            console.log(`[Test] Testing recommendations for position ${position_id}, shift ${shift_id}, date ${date}`);

            const recommendations = await EmployeeRecommendationService.getRecommendedEmployees(
                parseInt(position_id),
                parseInt(shift_id),
                date,
                []
            );

            res.json({
                success: true,
                recommendations: recommendations,
                summary: {
                    perfect: recommendations.perfect.length,
                    good: recommendations.good.length,
                    acceptable: recommendations.acceptable.length,
                    alternative: recommendations.alternative.length,
                    busy: recommendations.busy.length
                }
            });

        } catch (error) {
            console.error('[Test] Recommendations error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    static async checkConstraints(req, res) {
        try {
            const constraints = await EmployeeConstraint.findAll({
                where: { status: 'active' },
                include: [{
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                }]
            });

            res.json({
                success: true,
                constraints: constraints.map(c => ({
                    employee: `${c.employee.first_name} ${c.employee.last_name}`,
                    type: c.constraint_type,
                    applies_to: c.applies_to,
                    day_of_week: c.day_of_week,
                    shift_id: c.shift_id,
                    reason: c.reason
                })),
                count: constraints.length
            });

        } catch (error) {
            console.error('[Test] Constraints check error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = TestController;