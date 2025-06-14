// backend/src/controllers/schedule.controller.js

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const customParseFormat = require('dayjs/plugin/customParseFormat');

// Configure Day.js plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

// Внешние зависимости

const path = require('path');
const {Op} = require('sequelize'); // Добавить, если используется
let PDFGenerator = null;

module.exports = (db) => {
    // Импорт сервисов
    const ScheduleGeneratorService = require('../services/schedule-generator.service');
    const CPSATBridge = require('../services/cp-sat-bridge.service');

    // Деструктуризация моделей из db
    const {
        Schedule,
        ScheduleAssignment,
        Employee,
        Shift,
        Position,
        WorkSite,
        ScheduleSettings,
        EmployeeConstraint
    } = db;

    const controller = {};

    // Константы
    const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
    const DATE_FORMAT = 'YYYY-MM-DD';
    const WEEK_START_DAY = 0; // Sunday

    // Set locale to start week on Sunday
    dayjs.locale({
        ...dayjs.Ls.en,
        weekStart: WEEK_START_DAY
    });

    /**
     * Calculate week boundaries in Israel timezone
     * @param {string|Date} inputDate - Target date
     * @returns {Object} - { weekStart, weekEnd, weekStartStr, weekEndStr }
     */
    function calculateWeekBounds(inputDate = null) {
        try {
            // Parse input date in Israel timezone
            let targetDate;
            if (inputDate) {
                targetDate = dayjs(inputDate).tz(ISRAEL_TIMEZONE);
            } else {
                targetDate = dayjs().tz(ISRAEL_TIMEZONE);
            }

            // Use native JavaScript Date for accurate day calculation
            const jsDate = new Date(targetDate.format('YYYY-MM-DD'));
            const dayOfWeek = jsDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

            // Calculate days to subtract to get to Sunday
            const daysToSubtract = dayOfWeek;

            // Calculate week start (Sunday)
            const weekStartJs = new Date(jsDate);
            weekStartJs.setDate(jsDate.getDate() - daysToSubtract);

            // Calculate week end (Saturday)
            const weekEndJs = new Date(weekStartJs);
            weekEndJs.setDate(weekStartJs.getDate() + 6);

            // Convert back to dayjs for formatting
            const weekStart = dayjs(weekStartJs).tz(ISRAEL_TIMEZONE);
            const weekEnd = dayjs(weekEndJs).tz(ISRAEL_TIMEZONE);

            // Convert to UTC for database storage
            const weekStartUtc = weekStart.utc();
            const weekEndUtc = weekEnd.utc();

            // Format as strings for database queries
            const weekStartStr = weekStartUtc.format(DATE_FORMAT);
            const weekEndStr = weekEndUtc.format(DATE_FORMAT);

            // Debug logging with verification
            console.log(`[Week Calculation] Input: ${inputDate || 'now'}`);
            console.log(`[Week Calculation] Israel time: ${targetDate.format('YYYY-MM-DD dddd')}`);
            console.log(`[Week Calculation] JS Date: ${jsDate.toDateString()}`);
            console.log(`[Week Calculation] JS Day of week: ${dayOfWeek} (0=Sun, 1=Mon, ...)`);
            console.log(`[Week Calculation] Days to subtract: ${daysToSubtract}`);
            console.log(`[Week Calculation] Week start JS: ${weekStartJs.toDateString()}`);
            console.log(`[Week Calculation] Week end JS: ${weekEndJs.toDateString()}`);
            console.log(`[Week Calculation] Week: ${weekStartStr} (${weekStart.format('dddd')}) to ${weekEndStr} (${weekEnd.format('dddd')})`);

            // Validate that we got Sunday to Saturday
            if (weekStartJs.getDay() !== 0) {
                console.error(`[Week Calculation] ERROR: Week start is day ${weekStartJs.getDay()}, should be 0 (Sunday)!`);
            }
            if (weekEndJs.getDay() !== 6) {
                console.error(`[Week Calculation] ERROR: Week end is day ${weekEndJs.getDay()}, should be 6 (Saturday)!`);
            }

            return {
                weekStart: weekStartUtc.toDate(),
                weekEnd: weekEndUtc.toDate(),
                weekStartStr,
                weekEndStr,
                israelWeekStart: weekStart,
                israelWeekEnd: weekEnd
            };
        } catch (error) {
            console.error('[Week Calculation] Error:', error);
            throw new Error('Invalid date format');
        }
    }

    /**
     * Get day name in Hebrew
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} - Hebrew day name
     */
    function getHebrewDayName(dateStr) {
        const date = dayjs(dateStr).tz(ISRAEL_TIMEZONE);
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return dayNames[date.day()];
    }

    /**
     * Format date for display
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} - Formatted date (DD/MM)
     */
    function formatDisplayDate(dateStr) {
        return dayjs(dateStr).tz(ISRAEL_TIMEZONE).format('DD/MM');
    }

// Get weekly schedule for employee's position
    controller.getWeeklySchedule = async (req, res) => {
        try {
            const empId = req.userId;
            const {date} = req.query;

            // Validate employee exists
            const employee = await Employee.findByPk(empId);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            // Calculate week boundaries using Israel timezone
            const {weekStartStr, weekEndStr} = calculateWeekBounds(date);

            // Find published schedule for this week
            const schedule = await Schedule.findOne({
                where: {
                    start_date: {[Op.lte]: weekEndStr},
                    end_date: {[Op.gte]: weekStartStr},
                    status: 'published'
                },
                order: [['createdAt', 'DESC']]
            });

            if (!schedule) {
                return res.json({
                    success: true,
                    message: 'No published schedule found for this week',
                    week: {
                        start: weekStartStr,
                        end: weekEndStr
                    },
                    schedule: []
                });
            }

            // Get assignments for the week
            const assignments = await ScheduleAssignment.findAll({
                where: {
                    schedule_id: schedule.id,
                    work_date: {
                        [Op.between]: [weekStartStr, weekEndStr]
                    }
                },
                include: [
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['emp_id', 'first_name', 'last_name', 'status']
                    },
                    {
                        model: Shift,
                        as: 'shift',
                        attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                    },
                    {
                        model: Position,
                        as: 'position',
                        attributes: ['pos_id', 'pos_name', 'profession']
                    }
                ],
                order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']]
            });

            // Build weekly schedule data
            const weekSchedule = [];
            const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

            for (let i = 0; i < 7; i++) {
                const currentDay = weekStart.add(i, 'day');
                const dateStr = currentDay.format(DATE_FORMAT);

                // Get assignments for this day
                const dayAssignments = assignments.filter(
                    assignment => assignment.work_date === dateStr
                );

                // Group assignments by shift
                const shiftsMap = new Map();
                dayAssignments.forEach(assignment => {
                    const shiftId = assignment.shift.shift_id;
                    if (!shiftsMap.has(shiftId)) {
                        shiftsMap.set(shiftId, {
                            shift_id: shiftId,
                            shift_name: assignment.shift.shift_name,
                            start_time: assignment.shift.start_time,
                            duration: assignment.shift.duration,
                            shift_type: assignment.shift.shift_type,
                            employees: []
                        });
                    }

                    shiftsMap.get(shiftId).employees.push({
                        emp_id: assignment.employee.emp_id,
                        name: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                        position: assignment.position.pos_name,
                        is_current_user: assignment.employee.emp_id === empId
                    });
                });

                weekSchedule.push({
                    date: dateStr,
                    day_name: getHebrewDayName(dateStr),
                    display_date: formatDisplayDate(dateStr),
                    shifts: Array.from(shiftsMap.values())
                });
            }

            res.json({
                success: true,
                message: 'Weekly schedule retrieved successfully',
                week: {
                    start: weekStartStr,
                    end: weekEndStr
                },
                current_employee: {
                    emp_id: empId,
                    name: `${employee.first_name} ${employee.last_name}`
                },
                schedule: weekSchedule,
                metadata: {
                    timezone: ISRAEL_TIMEZONE,
                    generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString()
                }
            });

        } catch (error) {
            console.error('[GetWeeklySchedule] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Get schedule for admin view (all positions, all employees)
    controller.getAdminWeeklySchedule = async (req, res) => {
        try {
            const {date, site_id} = req.query;

            // Calculate week boundaries
            const {weekStartStr, weekEndStr} = calculateWeekBounds(date);

            // Build where condition for site
            const scheduleWhere = {
                start_date: {[Op.lte]: weekEndStr},
                end_date: {[Op.gte]: weekStartStr},
                status: 'published'
            };

            if (site_id) {
                scheduleWhere.site_id = site_id;
            }

            const schedule = await Schedule.findOne({
                where: scheduleWhere,
                order: [['createdAt', 'DESC']]
            });

            if (!schedule) {
                return res.json({
                    success: true,
                    message: 'No published schedule found for this week',
                    week: {
                        start: weekStartStr,
                        end: weekEndStr
                    },
                    schedule: []
                });
            }

            // Get all assignments with full details
            const assignments = await ScheduleAssignment.findAll({
                where: {
                    schedule_id: schedule.id,
                    work_date: {
                        [Op.between]: [weekStartStr, weekEndStr]
                    }
                },
                include: [
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['emp_id', 'first_name', 'last_name', 'status']
                    },
                    {
                        model: Shift,
                        as: 'shift',
                        attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                    },
                    {
                        model: Position,
                        as: 'position',
                        attributes: ['pos_id', 'pos_name', 'profession'],
                        include: [
                            {
                                model: WorkSite,
                                as: 'workSite',
                                attributes: ['site_id', 'site_name']
                            }
                        ]
                    }
                ],
                order: [['work_date', 'ASC'], ['position', 'pos_name', 'ASC'], ['shift', 'start_time', 'ASC']]
            });

            // Build admin schedule (similar logic as above but grouped by position)
            const adminSchedule = [];
            const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

            for (let i = 0; i < 7; i++) {
                const currentDay = weekStart.add(i, 'day');
                const dateStr = currentDay.format(DATE_FORMAT);

                const dayAssignments = assignments.filter(
                    assignment => assignment.work_date === dateStr
                );

                // Group by position, then by shift
                const positionsMap = new Map();
                dayAssignments.forEach(assignment => {
                    const posId = assignment.position.pos_id;
                    if (!positionsMap.has(posId)) {
                        positionsMap.set(posId, {
                            position_id: posId,
                            position_name: assignment.position.pos_name,
                            profession: assignment.position.profession,
                            work_site: assignment.position.workSite,
                            shifts: new Map()
                        });
                    }

                    const position = positionsMap.get(posId);
                    const shiftId = assignment.shift.shift_id;

                    if (!position.shifts.has(shiftId)) {
                        position.shifts.set(shiftId, {
                            shift_id: shiftId,
                            shift_name: assignment.shift.shift_name,
                            start_time: assignment.shift.start_time,
                            duration: assignment.shift.duration,
                            shift_type: assignment.shift.shift_type,
                            employees: []
                        });
                    }

                    position.shifts.get(shiftId).employees.push({
                        emp_id: assignment.employee.emp_id,
                        name: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                        status: assignment.status || 'scheduled'
                    });
                });

                // Convert maps to arrays
                const positions = Array.from(positionsMap.values()).map(pos => ({
                    ...pos,
                    shifts: Array.from(pos.shifts.values())
                }));

                adminSchedule.push({
                    date: dateStr,
                    day_name: getHebrewDayName(dateStr),
                    display_date: formatDisplayDate(dateStr),
                    positions: positions
                });
            }

            res.json({
                success: true,
                message: 'Admin weekly schedule retrieved successfully',
                week: {
                    start: weekStartStr,
                    end: weekEndStr
                },
                schedule: adminSchedule,
                metadata: {
                    timezone: ISRAEL_TIMEZONE,
                    generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString()
                }
            });

        } catch (error) {
            console.error('[GetAdminWeeklySchedule] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving admin weekly schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

    controller.generateNextWeekSchedule = async (req, res) => {
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
                const pythonAvailable = await controller.checkPythonAvailability();
                selectedAlgorithm = pythonAvailable ? 'cp-sat' : 'simple';
                console.log(`[ScheduleController] Auto-selected algorithm: ${selectedAlgorithm}`);
            }

            // Выполнение планирования
            switch (selectedAlgorithm) {
                case 'cp-sat':
                    try {
                        // Передаем db в CPSATBridge если нужно
                        result = await CPSATBridge.generateOptimalSchedule(db, siteId, weekStart);
                        if (!result.success) {
                            console.warn(`[ScheduleController] CP-SAT failed, falling back to simple`);
                            // Используем статический метод правильно
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
                    // Используем статический метод
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
                // Загружаем полную информацию о расписании
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
// Автоматический выбор лучшего алгоритма
    controller.selectBestAlgorithm = async () => {
        // Проверить доступность Python и OR-Tools
        const pythonAvailable = await this.checkPythonAvailability();

        if (pythonAvailable) {
            return 'cp-sat';
        } else {
            return 'simple';
        }
    };

    controller.checkPythonAvailability = async () => {
        return new Promise((resolve) => {
            const {spawn} = require('child_process');

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

// Сравнение всех доступных алгоритмов
    controller.compareAllAlgorithms = async (req, res) => {
        try {
            const siteId = req.body.site_id || 1;

            // ИСПРАВЛЕНИЕ: использовать переданную дату
            let weekStart;
            if (req.body.week_start) {
                weekStart = dayjs(req.body.week_start).format('YYYY-MM-DD');
            } else {
                weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');
            }

            console.log(`[ScheduleController] Comparing algorithms for site ${siteId}, week ${weekStart}`);

            // Запустить только доступные алгоритмы
            const results = await Promise.allSettled([
                CPSATBridge.generateOptimalSchedule(siteId, weekStart),
                ScheduleGeneratorService.generateWeeklySchedule(siteId, weekStart)
            ]);

            console.log('Raw results:', results.map((r, i) => ({
                index: i,
                status: r.status,
                success: r.status === 'fulfilled' ? r.value?.success : false
            })));

            const comparison = {
                'cp-sat': this.formatComparisonResult(results[0], 'CP-SAT'),
                'simple': this.formatComparisonResult(results[1], 'Simple')
            };

            console.log('Formatted comparison:', comparison);

            // Выбрать лучший результат
            const bestAlgorithm = controller.selectBestResult(comparison);
            console.log('Best algorithm selected:', bestAlgorithm);

            comparison.recommended = bestAlgorithm;

            // Сохранить лучший результат
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

    controller.formatComparisonResult = (result, algorithmName) => {
        if (result.status === 'fulfilled' && result.value.success) {
            return {
                status: 'success',
                algorithm: result.value.algorithm || algorithmName,
                stats: result.value.stats,
                solve_time: result.value.solveTime || result.value.iterations || 'N/A',
                score: result.value.score || 'N/A'
            };
        } else {
            return {
                status: 'failed',
                algorithm: algorithmName,
                error: result.status === 'rejected' ? result.reason.message : result.value.error
            };
        }
    };

    controller.selectBestResult = (comparison) => {
        // Только доступные алгоритмы
        const algorithms = ['cp-sat', 'simple'];

        const successful = algorithms.filter(alg =>
            comparison[alg] && comparison[alg].status === 'success'
        );

        if (successful.length === 0) {
            return 'simple'; // Fallback на простой алгоритм
        }

        if (successful.length === 1) {
            return successful[0];
        }

        // CP-SAT приоритетнее при равных результатах
        if (successful.includes('cp-sat')) {
            const cpSatScore = comparison['cp-sat'].stats?.total_assignments || 0;
            const simpleScore = comparison['simple'].stats?.total_assignments || 0;

            // Если CP-SAT работает и результат не хуже - выбираем его
            if (cpSatScore >= simpleScore) {
                return 'cp-sat';
            }
        }

        return 'simple';
    };

    controller.getAllSchedules = async (req, res) => {
        try {
            const {page = 1, limit = 10, site_id} = req.query;

            const whereClause = {};
            if (site_id) {
                whereClause.site_id = site_id;
            }

            const schedules = await Schedule.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: (page - 1) * limit,
                order: [['start_date', 'DESC']],
                include: [{
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_name']
                }]
            });

            res.json({
                success: true,
                data: schedules.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(schedules.count / limit),
                    total_items: schedules.count,
                    per_page: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Error getting schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving schedules',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Получить детали конкретного расписания
    controller.getScheduleDetails = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            console.log(`[ScheduleController] Getting details for schedule ${scheduleId}`);

            // Получить основную информацию о расписании
            const schedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name']
                }]
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            console.log(`[ScheduleController] Found schedule for site ${schedule.site_id}`);

            // Получить все назначения для этого расписания
            const assignments = await ScheduleAssignment.findAll({
                where: {schedule_id: scheduleId},
                include: [
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['emp_id', 'first_name', 'last_name']
                    },
                    {
                        model: Shift,
                        as: 'shift',
                        attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                    },
                    {
                        model: Position,
                        as: 'position',
                        attributes: ['pos_id', 'pos_name', 'profession']
                    }
                ],
                order: [['work_date', 'ASC'], ['shift_id', 'ASC']]
            });

            console.log(`[ScheduleController] Found ${assignments.length} assignments`);

            // Получить все позиции для данного сайта
            const positions = await Position.findAll({
                where: {site_id: schedule.site_id},
                attributes: ['pos_id', 'pos_name', 'profession', 'num_of_emp', 'num_of_shifts']
            });

            console.log(`[ScheduleController] Found ${positions.length} positions for site`);

            // Получить все смены
            const shifts = await Shift.findAll({
                attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type'],
                order: [['start_time', 'ASC']]
            });

            console.log(`[ScheduleController] Found ${shifts.length} shifts`);

            // Получить всех сотрудников для данного сайта
            const employees = await Employee.findAll({
                where: {status: 'active'},
                attributes: ['emp_id', 'first_name', 'last_name', 'status']
            });

            console.log(`[ScheduleController] Found ${employees.length} employees`);

            // Подготовить структуру данных для фронтенда
            const responseData = {
                schedule: {
                    id: schedule.id,
                    start_date: schedule.start_date,
                    end_date: schedule.end_date,
                    status: schedule.status,
                    site_id: schedule.site_id,
                    work_site: schedule.workSite,
                    createdAt: schedule.createdAt,
                    updatedAt: schedule.updatedAt
                },
                positions: positions,
                assignments: assignments,
                shifts: shifts,
                all_shifts: shifts, // Алиас для совместимости
                employees: employees
            };

            console.log(`[ScheduleController] Sending response with ${positions.length} positions`);

            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('[ScheduleController] Error getting schedule details:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting schedule details',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Обновить статус расписания (draft -> published)
    controller.updateScheduleStatus = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            const {status} = req.body;

            if (!['draft', 'published', 'archived'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be: draft, published, or archived'
                });
            }

            const schedule = await Schedule.findByPk(scheduleId);
            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            await schedule.update({status});

            res.json({
                success: true,
                message: `Schedule status updated to ${status}`,
                data: schedule
            });

        } catch (error) {
            console.error('[ScheduleController] Error updating schedule status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating schedule status',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

    controller.updateScheduleAssignments = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            const {changes} = req.body;

            console.log('[ScheduleController] Updating assignments for schedule:', scheduleId);
            console.log('[ScheduleController] Changes:', changes);

            const schedule = await Schedule.findByPk(scheduleId);
            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            // Process each change
            for (const change of changes) {
                if (change.action === 'assign') {
                    // Add new assignment
                    await ScheduleAssignment.create({
                        schedule_id: scheduleId,
                        emp_id: change.empId,
                        shift_id: change.shiftId,
                        position_id: change.positionId,
                        work_date: change.date,
                        status: 'scheduled',
                        notes: 'Manually assigned via edit interface'
                    });
                    console.log(`[ScheduleController] Added assignment: ${change.empName} to ${change.date} ${change.shiftId}`);

                } else if (change.action === 'remove') {
                    // Remove existing assignment
                    const deleted = await ScheduleAssignment.destroy({
                        where: {
                            id: change.assignmentId,
                            schedule_id: scheduleId
                        }
                    });
                    console.log(`[ScheduleController] Removed assignment ID: ${change.assignmentId}, deleted: ${deleted}`);
                }
            }

            res.json({
                success: true,
                message: `Successfully processed ${changes.length} changes`,
                data: {
                    changesProcessed: changes.length
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Error updating assignments:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating schedule assignments',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };


// Дублирование расписания
    controller.duplicateSchedule = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            const {newWeekStart} = req.body;

            if (!newWeekStart) {
                return res.status(400).json({
                    success: false,
                    message: 'New week start date is required'
                });
            }

            // Получить оригинальное расписание
            const originalSchedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: ScheduleAssignment,
                    as: 'assignments',
                    include: [
                        {model: Employee, as: 'employee'},
                        {model: Shift, as: 'shift'},
                        {model: Position, as: 'position'}
                    ]
                }]
            });

            if (!originalSchedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Original schedule not found'
                });
            }

            const dayjs = require('dayjs');
            const weekStart = dayjs(newWeekStart);
            const weekEnd = weekStart.add(6, 'day');

            // Создать новое расписание
            const newSchedule = await Schedule.create({
                start_date: weekStart.toDate(),
                end_date: weekEnd.toDate(),
                site_id: originalSchedule.site_id,
                status: 'draft',
                text_file: JSON.stringify({
                    generated_at: new Date().toISOString(),
                    algorithm: 'duplicated',
                    original_schedule_id: scheduleId,
                    timezone: 'Asia/Jerusalem'
                })
            });

            // Создать новые назначения
            const newAssignments = [];
            for (const assignment of originalSchedule.assignments) {
                const originalDate = dayjs(assignment.work_date);
                const dayOfWeek = originalDate.day();
                const newDate = weekStart.add(dayOfWeek, 'day');

                newAssignments.push({
                    schedule_id: newSchedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: assignment.shift_id,
                    position_id: assignment.position_id,
                    work_date: newDate.toDate(),
                    status: 'scheduled',
                    notes: `Duplicated from schedule #${scheduleId}`
                });
            }

            await ScheduleAssignment.bulkCreate(newAssignments);

            res.json({
                success: true,
                message: 'Schedule duplicated successfully',
                data: {
                    original_schedule_id: scheduleId,
                    new_schedule_id: newSchedule.id,
                    assignments_count: newAssignments.length,
                    week: `${weekStart.format('YYYY-MM-DD')} to ${weekEnd.format('YYYY-MM-DD')}`
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Duplicate error:', error);
            res.status(500).json({
                success: false,
                message: 'Error duplicating schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };


    controller.deleteSchedule = async (req, res) => {
        try {
            const {scheduleId} = req.params;

            const schedule = await Schedule.findByPk(scheduleId);
            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            // Проверить, можно ли удалить (например, только draft)
            if (schedule.status === 'published') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete published schedule'
                });
            }

            // Удалить связанные назначения (каскадно через FK)
            await ScheduleAssignment.destroy({
                where: {schedule_id: scheduleId}
            });

            // Удалить само расписание
            await schedule.destroy();

            res.json({
                success: true,
                message: 'Schedule deleted successfully'
            });

        } catch (error) {
            console.error('[ScheduleController] Delete error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };


// Экспорт расписания
    controller.exportSchedule = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            const {format = 'pdf', lang = 'en'} = req.query;

            const schedule = await Schedule.findByPk(scheduleId, {
                include: [
                    {
                        model: ScheduleAssignment,
                        as: 'assignments',
                        include: [
                            {
                                model: Employee,
                                as: 'employee',
                                attributes: ['emp_id', 'first_name', 'last_name']
                            },
                            {
                                model: Shift,
                                as: 'shift',
                                attributes: ['shift_id', 'shift_name', 'start_time', 'duration']
                            },
                            {
                                model: Position,
                                as: 'position',
                                attributes: ['pos_id', 'pos_name']
                            }
                        ]
                    },
                    {
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name']
                    }
                ]
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            // Prepare export data structure
            const exportData = {
                schedule: {
                    id: schedule.id,
                    week: `${schedule.start_date.toISOString().split('T')[0]} to ${schedule.end_date.toISOString().split('T')[0]}`,
                    site: schedule.workSite?.site_name || 'Unknown',
                    status: schedule.status,
                    created: schedule.createdAt
                },
                assignments: schedule.assignments.map(assignment => ({
                    date: assignment.work_date,
                    employee: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                    shift: assignment.shift.shift_name,
                    shift_time: assignment.shift.start_time,
                    position: assignment.position.pos_name,
                    status: assignment.status
                }))
            };

            if (format === 'csv') {
                // CSV export logic
                const fields = ['date', 'employee', 'shift', 'shift_time', 'position', 'status'];
                const csv = [
                    fields.join(','),
                    ...exportData.assignments.map(row =>
                        fields.map(field => `"${row[field]}"`).join(',')
                    )
                ].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.csv"`);
                return res.send(csv);
            }
            if (format === 'pdf') {
                if (!PDFGenerator) {
                    PDFGenerator = require('../utils/pdfGenerator');
                }

                const pdfGenerator = new PDFGenerator(lang);
                const pdfBuffer = await pdfGenerator.generateSchedulePDF(exportData);

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.pdf"`);
                return res.send(pdfBuffer);
            }

            // Default JSON export
            res.json({
                success: true,
                data: exportData
            });

        } catch (error) {
            console.error('[ScheduleController] Export error:', error);
            res.status(500).json({
                success: false,
                message: 'Error exporting schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Дублирование расписания
    controller.duplicateSchedule = async (req, res) => {
        try {
            const {scheduleId} = req.params;
            const {newWeekStart} = req.body;

            if (!newWeekStart) {
                return res.status(400).json({
                    success: false,
                    message: 'New week start date is required'
                });
            }

            const originalSchedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: ScheduleAssignment,
                    as: 'assignments'
                }]
            });

            if (!originalSchedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Original schedule not found'
                });
            }

            const weekStart = dayjs(newWeekStart);
            const weekEnd = weekStart.add(6, 'day');

            // Создать новое расписание
            const newSchedule = await Schedule.create({
                start_date: weekStart.toDate(),
                end_date: weekEnd.toDate(),
                site_id: originalSchedule.site_id,
                status: 'draft',
                text_file: JSON.stringify({
                    generated_at: new Date().toISOString(),
                    algorithm: 'duplicated',
                    original_schedule_id: scheduleId,
                    timezone: 'Asia/Jerusalem'
                })
            });

            // Создать новые назначения
            const newAssignments = [];
            for (const assignment of originalSchedule.assignments) {
                const originalDate = dayjs(assignment.work_date);
                const dayOfWeek = originalDate.day();
                const newDate = weekStart.add(dayOfWeek, 'day');

                newAssignments.push({
                    schedule_id: newSchedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: assignment.shift_id,
                    position_id: assignment.position_id,
                    work_date: newDate.toDate(),
                    status: 'scheduled',
                    notes: `Duplicated from schedule #${scheduleId}`
                });
            }

            await ScheduleAssignment.bulkCreate(newAssignments);

            res.json({
                success: true,
                message: 'Schedule duplicated successfully',
                data: {
                    original_schedule_id: scheduleId,
                    new_schedule_id: newSchedule.id,
                    assignments_count: newAssignments.length,
                    week: `${weekStart.format('YYYY-MM-DD')} to ${weekEnd.format('YYYY-MM-DD')}`
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Duplicate error:', error);
            res.status(500).json({
                success: false,
                message: 'Error duplicating schedule',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };


// Получение статистики
    controller.getScheduleStats = async (req, res) => {
        try {
            const {timeframe = '30'} = req.query;
            const sequelize = require('../config/db.config');

            const startDate = dayjs().subtract(parseInt(timeframe), 'day').toDate();

            // Основная статистика
            const totalSchedules = await Schedule.count();
            const recentSchedules = await Schedule.count({
                where: {
                    createdAt: {[Op.gte]: startDate}
                }
            });

            const publishedSchedules = await Schedule.count({
                where: {status: 'published'}
            });

            const draftSchedules = await Schedule.count({
                where: {status: 'draft'}
            });

            const totalAssignments = await ScheduleAssignment.count();
            const recentAssignments = await ScheduleAssignment.count({
                where: {
                    createdAt: {[Op.gte]: startDate}
                }
            });

            res.json({
                success: true,
                data: {
                    overview: {
                        total_schedules: totalSchedules,
                        recent_schedules: recentSchedules,
                        published_schedules: publishedSchedules,
                        draft_schedules: draftSchedules,
                        total_assignments: totalAssignments,
                        recent_assignments: recentAssignments
                    },
                    timeframe_days: parseInt(timeframe)
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

    controller.compareAllAlgorithms = async (req, res) => {
        try {
            const siteId = req.body.site_id || 1;
            const nextWeekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

            console.log(`[ScheduleController] Comparing all algorithms for site ${siteId}, week ${nextWeekStart}`);

            // Запустить все алгоритмы параллельно
            const results = await Promise.allSettled([
                CPSATBridge.generateOptimalSchedule(db, siteId, nextWeekStart),
                ScheduleGeneratorService.generateWeeklySchedule(db, siteId, nextWeekStart)
            ]);

            // Форматирование результатов
            const comparison = {
                'cp-sat': controller.formatComparisonResult(results[0], 'CP-SAT'),
                'simple': controller.formatComparisonResult(results[1], 'Simple')  // Ключ simple
            };

            // Выбрать лучший результат
            const bestAlgorithm = controller.selectBestResult(comparison);
            comparison.recommended = bestAlgorithm;

            // Сохранить лучший результат, если он есть
            let savedSchedule = null;
            const bestResult = results.find((result, index) => {
                const algorithmNames = ['cp_sat', 'simple'];
                return algorithmNames[index] === bestAlgorithm &&
                    result.status === 'fulfilled' &&
                    result.value.success;
            });

            if (bestResult && bestResult.value.success) {
                savedSchedule = bestResult.value.schedule;
            }

            res.json({
                success: true,
                message: 'Algorithm comparison completed',
                comparison: comparison,
                saved_schedule: savedSchedule,
                week: nextWeekStart
            });

        } catch (error) {
            console.error('[ScheduleController] Compare algorithms error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during algorithm comparison',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

    controller.formatComparisonResult = (result, algorithmName) => {
        // Нормализация названий алгоритмов
        const normalizeAlgorithmName = (name) => {
            if (name === 'CP-SAT' || name === 'cp_sat') return 'cp-sat';
            if (name === 'Simple' || name === 'simple') return 'simple';
            return name.toLowerCase();
        };

        if (result.status === 'fulfilled' && result.value.success) {
            return {
                status: 'success',
                algorithm: normalizeAlgorithmName(result.value.algorithm || algorithmName),
                stats: result.value.stats,
                solve_time: result.value.solveTime || result.value.solve_time || 'N/A',
                score: result.value.score || 'N/A',
                assignments_count: result.value.schedule?.assignments_count || 0
            };
        } else {
            return {
                status: 'failed',
                algorithm: normalizeAlgorithmName(algorithmName),
                error: result.status === 'rejected' ?
                    result.reason.message : result.value.error
            };
        }
    };

// Вспомогательные функции для сравнения алгоритмов
    function formatComparisonResult(result, algorithmName) {
        if (result.status === 'fulfilled' && result.value.success) {
            return {
                status: 'success',
                algorithm: result.value.algorithm || algorithmName,
                stats: result.value.stats,
                solve_time: result.value.solveTime || result.value.solve_time || 'N/A',
                score: result.value.score || 'N/A',
                assignments_count: result.value.schedule?.assignments_count || 0
            };
        } else {
            return {
                status: 'failed',
                algorithm: algorithmName,
                error: result.status === 'rejected' ?
                    result.reason.message :
                    result.value?.error || 'Unknown error'
            };
        }
    }

    controller.selectBestResult = (comparison) => {
        console.log('Selecting best result from:', Object.keys(comparison)); // Debug log

        // Только доступные алгоритмы
        const algorithms = ['cp-sat', 'simple'];

        const successful = algorithms.filter(alg => {
            const result = comparison[alg];
            return result && result.status === 'success'; // Добавить проверку на существование
        });

        console.log('Successful algorithms:', successful); // Debug log

        if (successful.length === 0) {
            console.log('No successful algorithms, defaulting to simple');
            return 'simple'; // Fallback на простой алгоритм
        }

        if (successful.length === 1) {
            console.log('Only one successful algorithm:', successful[0]);
            return successful[0];
        }

        // CP-SAT приоритетнее при равных результатах
        if (successful.includes('cp-sat')) {
            const cpSatResult = comparison['cp-sat'];
            const simpleResult = comparison['simple'];

            const cpSatScore = cpSatResult?.stats?.total_assignments || cpSatResult?.assignments_count || 0;
            const simpleScore = simpleResult?.stats?.total_assignments || simpleResult?.assignments_count || 0;

            console.log('Scores - CP-SAT:', cpSatScore, 'Simple:', simpleScore);

            // Если CP-SAT работает и результат не хуже - выбираем его
            if (cpSatScore >= simpleScore) {
                return 'cp-sat';
            }
        }

        return 'simple';
    };

    controller.getRecommendedEmployees = async (req, res) => {
        try {
            const {scheduleId, date, shiftId, positionId} = req.query;

            console.log('[ScheduleController] Getting recommendations for:', {scheduleId, date, shiftId, positionId});

            // Получить расписание и его параметры
            const schedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: WorkSite,
                    as: 'workSite'
                }]
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
            }

            // Получить всех активных сотрудников
            const employees = await Employee.findAll({
                where: {status: 'active'},
                attributes: ['emp_id', 'first_name', 'last_name', 'email']
            });

            // Получить существующие назначения на эту дату
            const existingAssignments = await ScheduleAssignment.findAll({
                where: {
                    schedule_id: scheduleId,
                    work_date: date
                },
                include: [{
                    model: Shift,
                    as: 'shift',
                    attributes: ['shift_id', 'start_time', 'duration']
                }]
            });

            // Простая логика рекомендаций без EmployeePreference
            const employeeRecommendations = employees.map(employee => {
                const empAssignments = existingAssignments.filter(a => a.emp_id === employee.emp_id);

                // Определить статус доступности
                let availabilityStatus = 'available';
                let reason = '';
                let priority = 1; // 0 = preferred, 1 = neutral, 2 = cannot_work

                // Проверить конфликты с существующими назначениями
                const hasConflict = empAssignments.length > 0;

                if (hasConflict) {
                    priority = 2;
                    availabilityStatus = 'cannot_work';
                    reason = 'Already assigned on this date';
                }

                return {
                    emp_id: employee.emp_id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    email: employee.email,
                    availability_status: availabilityStatus,
                    priority: priority,
                    reason: reason
                };
            });

            // Сортировать по приоритету
            const sortedEmployees = employeeRecommendations.sort((a, b) => a.priority - b.priority);

            // Группировать по статусу
            const groupedEmployees = {
                preferred: sortedEmployees.filter(e => e.availability_status === 'preferred'),
                available: sortedEmployees.filter(e => e.availability_status === 'available'),
                cannot_work: sortedEmployees.filter(e => e.availability_status === 'cannot_work'),
                violates_constraints: []
            };

            res.json({
                success: true,
                data: {
                    date: date,
                    shift_id: shiftId,
                    position_id: positionId,
                    recommendations: groupedEmployees,
                    total_employees: employees.length
                }
            });

        } catch (error) {
            console.error('[ScheduleController] Error getting recommended employees:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting employee recommendations',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };
    return controller;
};
