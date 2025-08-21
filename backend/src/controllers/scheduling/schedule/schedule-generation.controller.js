// backend/src/controllers/schedule/schedule-generation.controller.js
const dayjs = require('dayjs');
const { formatComparisonResult } = require('./helpers/date-helpers');
const db = require('../../../models');
const { Schedule, WorkSite, ScheduleAssignment } = db;

const ScheduleGeneratorService = require('../../../services/schedule-generator.service');
const cpSatBridge = require('../../../services/cp-sat-bridge.service');
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
const deleteExistingSchedule = async (siteId, weekStart, transaction = null) => {
    try {
        const weekEnd = dayjs(weekStart).add(6, 'days').format('YYYY-MM-DD');


        const deletedAssignments = await ScheduleAssignment.destroy({
            where: {
                work_date: {
                    [db.Sequelize.Op.between]: [weekStart, weekEnd]
                },
                position_id: {
                    [db.Sequelize.Op.in]: db.Sequelize.literal(
                        `(SELECT pos_id FROM positions WHERE site_id = ${siteId})`
                    )
                }
            },
            transaction
        });

        if (deletedAssignments > 0) {
            console.log(`[ScheduleController] Deleted ${deletedAssignments} orphaned assignments`);
        }

        // 2. Найти и удалить существующие расписания
        const existingSchedules = await Schedule.findAll({
            where: {
                site_id: siteId,
                start_date: {
                    [db.Sequelize.Op.between]: [weekStart, weekEnd]
                }
            },
            transaction
        });

        for (const schedule of existingSchedules) {
            console.log(`[ScheduleController] Deleting schedule ${schedule.id} for week ${weekStart}`);

            // Удалить связанные assignments (если остались)
            await ScheduleAssignment.destroy({
                where: { schedule_id: schedule.id },
                transaction
            });

            // Удалить само расписание
            await schedule.destroy({ transaction });
        }

        console.log(`[ScheduleController] Cleaned up ${existingSchedules.length} schedules`);

    } catch (error) {
        console.error('[ScheduleController] Error deleting existing schedule:', error);
        throw error;
    }
};
/**
 * Generate schedule for next week
 */
const generateNextWeekSchedule = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const siteId = req.body.site_id || 1;
        const algorithm = req.body.algorithm || 'auto';

        let weekStart;
        if (req.body.weekStart) {
            const requestedDate = dayjs(req.body.weekStart);
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

        await deleteExistingSchedule(siteId, weekStart, transaction);


        console.log(`[ScheduleController] Generating schedule for site ${siteId}, week starting ${weekStart}, algorithm: ${algorithm}`);

        // Проверим существование сайта
        const workSite = await WorkSite.findByPk(siteId, { transaction });
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
                    console.log('[ScheduleController] Attempting CP-SAT generation...');
                    result = await cpSatBridge.generateOptimalSchedule(siteId, weekStart, transaction);

                    // Добавляем детальную статистику
                    if (result.success && result.schedule) {
                        const detailedStats = await cpSatBridge.calculateDetailedStats(
                            result.schedule.schedule_id,
                            siteId,
                            weekStart,
                            [], // assignments будут загружены внутри метода
                            transaction
                        );
                        result.statistics = detailedStats;
                    }

                    if (!result.success) {
                        console.warn(`[ScheduleController] CP-SAT failed, falling back to simple`);
                        result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart, transaction);
                        result.fallback = 'cp-sat-to-simple';
                    }
                } catch (error) {
                    console.warn(`[ScheduleController] CP-SAT error, falling back to simple: ${error.message}`);
                    result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart, transaction);
                    result.fallback = 'cp-sat-to-simple';
                    result.originalError = error.message;
                }
                break;

            case 'simple':
                result = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart, transaction);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Unknown algorithm: ${selectedAlgorithm}`
                });
        }

        await transaction.commit();

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
        await transaction.rollback();
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
        const weekStart = req.body.week_start || dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

        console.log(`[ScheduleController] Comparing algorithms for site ${siteId}, week ${weekStart}`);

        const comparison = {
            'simple': null,
            'cp-sat': null
        };

        // Тест Simple Algorithm (БЕЗ сохранения)
        try {
            const simpleService = new ScheduleGeneratorService(db);
            const data = await simpleService.prepareData(siteId, weekStart);
            const result = await simpleService.generateOptimalSchedule(data);

            comparison['simple'] = {
                status: 'success',
                algorithm: 'simple',
                assignments_count: result.schedule.length,
                stats: result.stats
            };
        } catch (error) {
            comparison['simple'] = {
                status: 'failed',
                error: error.message
            };
        }

        // Тест CP-SAT (БЕЗ сохранения)
        const pythonAvailable = await checkPythonAvailability();
        if (pythonAvailable) {
            try {
                const data = await cpSatBridge.prepareScheduleData(siteId, weekStart);
                const pythonResult = await cpSatBridge.callPythonOptimizer(data);

                comparison['cp-sat'] = {
                    status: 'success',
                    algorithm: 'CP-SAT-Python',
                    assignments_count: pythonResult.schedule?.length || 0,
                    coverage_rate: pythonResult.coverage_rate,
                    solve_time: pythonResult.solve_time,
                    stats: pythonResult.stats
                };
            } catch (error) {
                comparison['cp-sat'] = {
                    status: 'failed',
                    error: error.message
                };
            }
        }

        res.json({
            success: true,
            comparison,
            recommendation: selectBestResult(comparison),
            week: weekStart
        });

    } catch (error) {
        console.error('[ScheduleController] Error comparing algorithms:', error);
        res.status(500).json({
            success: false,
            message: 'Error during algorithm comparison',
            error: error.message
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