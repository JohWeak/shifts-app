// backend/src/controllers/schedule/schedule-generation.controller.js
const dayjs = require('dayjs');
const { formatComparisonResult } = require('./helpers/date-helpers');
const db = require('models');
const { Schedule, WorkSite } = db;

// Импортируем сервисы
const ScheduleGeneratorService = require('services/schedule-generator.service');
const CPSATBridge = require('services/cp-sat-bridge.service');
/**
 * Check Python availability
 */
const checkPythonAvailability = async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve) => {
        const pythonProcess = spawn('python', ['--version']);

        pythonProcess.on('close', (code) => {
            resolve(code === 0);
        });

        pythonProcess.on('error', () => {
            resolve(false);
        });

        // Timeout after 2 seconds
        setTimeout(() => {
            pythonProcess.kill();
            resolve(false);
        }, 2000);
    });
};
/**
 * Generate schedule for next week
 */
const generateNextWeekSchedule = async (req, res) => {
    try {
        const siteId = req.body.site_id || 1;
        const algorithm = req.body.algorithm || 'auto';

        let weekStart;
        if (req.body.week_start) {
            const requestedDate = dayjs(req.body.week_start);
            const dayOfWeek = requestedDate.day();

            if (dayOfWeek !== 0) {
                weekStart = requestedDate.subtract(dayOfWeek, 'day').format('YYYY-MM-DD');
                console.log(`[ScheduleController] Adjusted to Sunday: ${weekStart}`);
            } else {
                weekStart = requestedDate.format('YYYY-MM-DD');
            }
        } else {
            weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');
        }

        console.log(`[ScheduleController] Generating schedule for site ${siteId}, week starting ${weekStart}, algorithm: ${algorithm}`);

        // Проверим существование сайта
        const workSite = await WorkSite.findByPk(siteId);
        if (!workSite) {
            return res.status(400).json({
                success: false,
                message: `Work site with ID ${siteId} not found`
            });
        }

        let result;
        let selectedAlgorithm = algorithm;

        if (algorithm === 'auto') {
            const pythonAvailable = await checkPythonAvailability();
            selectedAlgorithm = pythonAvailable ? 'cp-sat' : 'simple';
            console.log(`[ScheduleController] Auto-selected algorithm: ${selectedAlgorithm}`);
        }

        // Выполнение планирования
        switch (selectedAlgorithm) {
            case 'cp-sat':
                try {
                    result = await CPSATBridge.generateOptimalSchedule(db, siteId, weekStart);
                    if (!result.success) {
                        console.warn(`[ScheduleController] CP-SAT failed, falling back to simple`);
                        result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart);
                        result.fallback = 'cp-sat-to-simple';
                    }
                } catch (error) {
                    console.warn(`[ScheduleController] CP-SAT error, falling back to simple: ${error.message}`);
                    result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart);
                    result.fallback = 'cp-sat-to-simple';
                    result.originalError = error.message;
                }
                break;

            case 'simple':
                result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Unknown algorithm: ${selectedAlgorithm}`
                });
        }

        // Формирование ответа
        if (result && result.success) {
            let fullSchedule = null;
            if (result.schedule && (result.schedule.schedule_id || result.schedule.id)) {
                fullSchedule = await Schedule.findByPk(
                    result.schedule.schedule_id || result.schedule.id,
                    {
                        include: [{
                            model: WorkSite,
                            as: 'workSite'
                        }]
                    }
                );
            }

            const responseData = {
                success: true,
                message: `Schedule generated successfully using ${result.algorithm || selectedAlgorithm}`,
                data: {
                    ...(result.schedule || {}),
                    workSite: fullSchedule?.workSite || workSite
                },
                stats: result.stats || {},
                algorithm: result.algorithm || selectedAlgorithm,
                requested_algorithm: algorithm
            };

            if (result.fallback) {
                responseData.warning = `Fallback used: ${result.fallback}`;
                if (result.originalError) {
                    responseData.original_error = result.originalError;
                }
            }

            res.json(responseData);
        } else {
            res.status(500).json({
                success: false,
                message: result?.error || 'Failed to generate schedule',
                error: result?.error || 'Unknown error',
                algorithm: selectedAlgorithm
            });
        }

    } catch (error) {
        console.error('[ScheduleController] Error generating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Compare all available algorithms
 */
const compareAllAlgorithms = async (req, res) => {
    try {
        const siteId = req.body.site_id || 1;

        let weekStart;
        if (req.body.week_start) {
            weekStart = dayjs(req.body.week_start).format('YYYY-MM-DD');
        } else {
            weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');
        }

        console.log(`[ScheduleController] Comparing algorithms for site ${siteId}, week ${weekStart}`);

        const results = await Promise.allSettled([
            CPSATBridge.generateOptimalSchedule(db, siteId, weekStart),
            ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart)
        ]);

        const comparison = {
            'cp-sat': formatComparisonResult(results[0], 'CP-SAT'),
            'simple': formatComparisonResult(results[1], 'Simple')
        };

        const bestAlgorithm = selectBestResult(comparison);
        comparison.recommended = bestAlgorithm;

        const algorithmNames = ['cp-sat', 'simple'];
        const bestResult = results.find((result, index) => {
            return algorithmNames[index] === bestAlgorithm &&
                result.status === 'fulfilled' &&
                result.value?.success;
        });

        res.json({
            success: true,
            message: 'Algorithm comparison completed',
            comparison: comparison,
            best_algorithm: bestAlgorithm,
            recommendation: `Use ${bestAlgorithm} algorithm for best results`,
            saved_schedule: bestResult ? bestResult.value.schedule : null,
            week: weekStart
        });

    } catch (error) {
        console.error('[ScheduleController] Error comparing algorithms:', error);
        res.status(500).json({
            success: false,
            message: 'Error during algorithm comparison',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};



/**
 * Select best algorithm based on results
 */
const selectBestResult = (comparison) => {
    const algorithms = ['cp-sat', 'simple'];

    const successful = algorithms.filter(alg => {
        const result = comparison[alg];
        return result && result.status === 'success';
    });

    if (successful.length === 0) {
        return 'simple';
    }

    if (successful.length === 1) {
        return successful[0];
    }

    if (successful.includes('cp-sat')) {
        const cpSatResult = comparison['cp-sat'];
        const simpleResult = comparison['simple'];

        const cpSatScore = cpSatResult?.stats?.total_assignments || cpSatResult?.assignments_count || 0;
        const simpleScore = simpleResult?.stats?.total_assignments || simpleResult?.assignments_count || 0;

        if (cpSatScore >= simpleScore) {
            return 'cp-sat';
        }
    }

    return 'simple';
};

module.exports = {
    generateNextWeekSchedule,
    compareAllAlgorithms,
    checkPythonAvailability,
    selectBestResult
};