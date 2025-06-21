// backend/src/controllers/schedule/schedule-generation.controller.js
const dayjs = require('dayjs');
const { formatComparisonResult } = require('./helpers/date-helpers');
const db = require('../../models');
const { Schedule, WorkSite } = db;

// Импортируем сервисы
const ScheduleGeneratorService = require('../../services/schedule-generator.service');
const CPSATBridge = require('../../services/cp-sat-bridge.service');

/**
 * Generate schedule for specified week
 */
const generateNextWeekSchedule = async (req, res) => {
    try {
        const siteId = req.body.site_id || 1;
        const algorithm = req.body.algorithm || 'auto';

        let weekStart;
        if (req.body.week_start) {
            // Use the exact date provided by frontend
            // Frontend should ensure it's a valid week start day
            weekStart = dayjs(req.body.week_start).format('YYYY-MM-DD');
        } else {
            // Fallback to next week if no date provided
            weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');
        }

        console.log(`[ScheduleController] Generating schedule for site ${siteId}, week starting ${weekStart}, algorithm: ${algorithm}`);

        // Check if worksite exists
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

        // Execute scheduling
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
                    message: `Unknown algorithm: ${algorithm}`
                });
        }

        // Handle result
        if (result.success) {
            res.json({
                success: true,
                message: `Schedule generated successfully using ${selectedAlgorithm} algorithm`,
                algorithm_used: selectedAlgorithm,
                schedule: result.schedule,
                stats: result.stats || {},
                week: weekStart,
                fallback: result.fallback || null,
                originalError: result.originalError || null
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to generate schedule',
                error: process.env.NODE_ENV === 'development' ? result.error : 'Internal server error'
            });
        }

    } catch (error) {
        console.error('[ScheduleController] Error generating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Error during schedule generation',
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
            // Use the exact date provided by frontend
            weekStart = dayjs(req.body.week_start).format('YYYY-MM-DD');
        } else {
            // Fallback to next week
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
 * Check Python availability
 */
const checkPythonAvailability = async () => {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');

        const pythonCheck = spawn('python', ['--version']);

        pythonCheck.on('close', (code) => {
            if (code === 0) {
                const ortoolsCheck = spawn('python', ['-c', 'import ortools; print("OK")']);

                ortoolsCheck.on('close', (ortoolsCode) => {
                    resolve(ortoolsCode === 0);
                });

                ortoolsCheck.on('error', () => {
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        });

        pythonCheck.on('error', () => {
            resolve(false);
        });
    });
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