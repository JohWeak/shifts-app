// backend/src/controllers/schedule/schedule-export.controller.js
const dayjs = require('dayjs');
const {Op} = require('sequelize');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    PositionShift,
    Position,
    WorkSite
} = db;


const exportSchedule = async (req, res) => {
    try {
        const {scheduleId} = req.params;
        const {format = 'csv', lang = 'en'} = req.query;

        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: ScheduleAssignment,
                    as: 'assignments',
                    include: [
                        {model: Employee, as: 'employee', attributes: ['first_name', 'last_name']},
                        {model: PositionShift, as: 'shift', attributes: ['id', 'shift_name', 'start_time', 'end_time']},
                        {model: Position, as: 'position', attributes: ['pos_id', 'pos_name']},
                    ],
                    order: [
                        [{model: Position, as: 'position'}, 'pos_name', 'ASC'],
                        [{model: PositionShift, as: 'shift'}, 'start_time', 'ASC'],
                        ['work_date', 'ASC'],
                    ],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_name'],
                },
            ],
        });

        if (!schedule) {
            return res.status(404).json({success: false, message: 'Schedule not found'});
        }

        if (format === 'csv') {

            // Headlines of the days of the week
            const startDate = dayjs(schedule.start_date);
            const endDate = dayjs(schedule.end_date);
            const dateHeaders = [];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let currentDate = startDate;
            while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
                dateHeaders.push(`${dayNames[currentDate.day()]} ${currentDate.format('DD/MM')}`);
                currentDate = currentDate.add(1, 'day');
            }

            // Group assignments by Position -> Shift -> Date
            const groupedData = {};
            schedule.assignments.forEach(a => {
                const posName = a.position.pos_name;
                const shiftName = `${a.shift.shift_name} (${dayjs(`1970-01-01 ${a.shift.start_time}`).format('HH:mm')}-${dayjs(`1970-01-01 ${a.shift.end_time}`).format('HH:mm')})`;
                const date = dayjs(a.work_date).format('YYYY-MM-DD');
                const employeeName = `${a.employee.first_name} ${a.employee.last_name}`;

                if (!groupedData[posName]) groupedData[posName] = {};
                if (!groupedData[posName][shiftName]) groupedData[posName][shiftName] = {};
                if (!groupedData[posName][shiftName][date]) groupedData[posName][shiftName][date] = [];

                groupedData[posName][shiftName][date].push(employeeName);
            });

            // Collecting CSV strings
            const csvRows = [];

            // File header
            csvRows.push(`"Work Site: ${schedule.workSite.site_name}"`);
            csvRows.push(`"Week: ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}"`);
            csvRows.push('');

            // Main table
            const headerRow = ['"Position"', '"Shift"', ...dateHeaders.map(h => `"${h}"`)];

            Object.keys(groupedData).forEach(positionName => {
                csvRows.push('');
                csvRows.push(`"${positionName}"`);

                csvRows.push(headerRow.slice(1).join(','));

                Object.keys(groupedData[positionName]).forEach(shiftName => {
                    const row = [`"${shiftName}"`];
                    let currentDay = startDate;
                    while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, 'day')) {
                        const dateKey = currentDay.format('YYYY-MM-DD');
                        const employees = groupedData[positionName][shiftName][dateKey];

                        row.push(employees ? `"${employees.join('\n')}"` : '""');
                        currentDay = currentDay.add(1, 'day');
                    }
                    csvRows.push(row.join(','));
                });
            });

            const csvContent = csvRows.join('\n');


            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="schedule-${schedule.id}.csv"`);
            // Adding a BOM to correctly display non-English characters in Excel
            return res.send('\uFEFF' + csvContent);
        }

        // If the format is not CSV, revert to the default JSON
        return res.json({success: true, message: "Only CSV export is currently supported."});

    } catch (error) {
        console.error('[ScheduleController] Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getScheduleStats = async (req, res) => {
    try {
        const {timeframe = '30'} = req.query;
        const startDate = dayjs().subtract(parseInt(timeframe), 'day').toDate();

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

module.exports = {
    exportSchedule,
    getScheduleStats
};